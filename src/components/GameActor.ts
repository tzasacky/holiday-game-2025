import * as ex from 'excalibur';
import { GameEntity } from '../core/GameEntity';
import { ActorComponent } from './ActorComponent';
import { EventBus } from '../core/EventBus';
import { GameEventNames, ActorSpendTimeEvent, ActorTurnEvent } from '../core/GameEvents';
import { GraphicsManager } from '../data/graphics';
import { ComponentType } from '../constants/RegistryKeys';
import { Logger } from '../core/Logger';

/**
 * GameActor - Minimal actor container with component-based architecture
 * 
 * CRITICAL: Uses 'gameComponents' instead of 'components' to avoid collision
 * with Excalibur's native Actor component system which uses Map<Function, Component>
 */
export class GameActor extends GameEntity {
    public entityId: string;
    public gameComponents: Map<string, ActorComponent> = new Map();
    public time: number = 0; // Turn system
    public actPriority: number = 0; // For PriorityQueue tie-breaking (required by HeapItem)
    public isPlayer: boolean = false;
    
    // Path following state
    protected currentPath: ex.Vector[] = [];
    protected currentPathIndex: number = 0;
    protected moving: boolean = false;
    
    constructor(gridPos: ex.Vector, defName: string) {
        super(gridPos);
        this.entityId = `${defName}_${Date.now()}_${Math.random()}`;
        this.name = defName;
    }
    
    // Component management (renamed to avoid Excalibur collision)
    addGameComponent(name: string, component: ActorComponent): void {
        if (this.gameComponents.has(name)) {
            this.gameComponents.get(name)!.onDetach();
        }
        this.gameComponents.set(name, component);
        component.onAttach();
    }
    
    removeGameComponent(name: string): void {
        const component = this.gameComponents.get(name);
        if (component) {
            component.onDetach();
            this.gameComponents.delete(name);
        }
    }
    
    getGameComponent<T extends ActorComponent>(name: string): T | null {
        return (this.gameComponents.get(name) as T) || null;
    }
    
    // ONLY compatibility getters - NO logic here
    get hp(): number { 
        const statsComponent = this.getGameComponent('stats') as any;
        return statsComponent?.getStat('hp') ?? 0;
    }
    
    get maxHp(): number {
        const statsComponent = this.getGameComponent('stats') as any;
        return statsComponent?.getStat('maxHp') ?? 0;
    }
    
    get totalDamage(): number {
        const combatComponent = this.getGameComponent('combat') as any;
        return combatComponent?.getTotalDamage() ?? 0;
    }
    
    get totalDefense(): number {
        const combatComponent = this.getGameComponent('combat') as any;
        return combatComponent?.getTotalDefense() ?? 0;
    }
    
    get warmth(): number {
        const statsComponent = this.getGameComponent('stats') as any;
        return statsComponent?.getStat('warmth') ?? 0;
    }
    
    set warmth(value: number) {
        const statsComponent = this.getGameComponent('stats') as any;
        if (statsComponent) {
            statsComponent.setStat('warmth', value);
        }
    }
    
    // Queue action for PlayerInputComponent
    queueAction(actionType: any): void {
        const playerInputComp = this.getGameComponent(ComponentType.PLAYER_INPUT);
        if (playerInputComp) {
            (playerInputComp as any).queueAction(actionType);
        }
    }
    
    // Equipment helpers
    equip(item: any): boolean {
        const equipmentComponent = this.getGameComponent('equipment') as any;
        if (equipmentComponent) {
            return equipmentComponent.equip(item);
        }
        return false;
    }

    get weapon(): any {
        const equipmentComponent = this.getGameComponent('equipment') as any;
        return equipmentComponent ? equipmentComponent.getEquipment('weapon') : null;
    }

    get armor(): any {
        const equipmentComponent = this.getGameComponent('equipment') as any;
        return equipmentComponent ? equipmentComponent.getEquipment('armor') : null;
    }

    get accessories(): any[] {
        const equipmentComponent = this.getGameComponent('equipment') as any;
        const accessory = equipmentComponent ? equipmentComponent.getEquipment('accessory') : null;
        return accessory ? [accessory] : [];
    }

    // Turn system - ONLY method
    async act(): Promise<boolean> {
        // If this is a player, check if we have input ready
        if (this.isPlayer) {
            const playerInput = this.getGameComponent(ComponentType.PLAYER_INPUT) as any;
            if (playerInput && typeof playerInput.hasPendingAction === 'function') {
                if (!playerInput.hasPendingAction()) {
                    // Player needs to wait for input
                    // We still emit ActorTurn to let listeners know it's their turn (e.g. to update UI)
                    // But we return false to tell TurnManager to pause
                    Logger.debug('[GameActor] Player waiting for input, returning false from act()');
                    EventBus.instance.emit(GameEventNames.ActorTurn, new ActorTurnEvent(this));
                    return false;
                }
            }
        }

        Logger.debug('[GameActor] Emitting ActorTurn event for:', this.name);
        EventBus.instance.emit(GameEventNames.ActorTurn, new ActorTurnEvent(this));
        return true;
    }
    
    // Update components
    onPreUpdate(engine: ex.Engine, delta: number): void {
        super.onPreUpdate(engine, delta);
        const components = Array.from(this.gameComponents.values());
        for (const component of components) {
            component.onTick?.(delta);
        }
    }
    
    onInitialize(engine: ex.Engine): void {
        super.onInitialize(engine);
        // Use unified graphics system
        GraphicsManager.instance.configureActor(this);
        
        // Listen for time spending events from components - use a more direct approach
        this.setupTimeEventListener();
    }

    
    // ===== PATH MANAGEMENT =====
    
    /**
     * Set a new path for this actor to follow
     */
    public setPath(path: ex.Vector[]): void {
        this.currentPath = path;
        this.currentPathIndex = 0;
        Logger.debug(`[GameActor] ${this.name} set path with ${path.length} steps`);
    }
    
    /**
     * Clear the current path
     */
    public clearPath(): void {
        this.currentPath = [];
        this.currentPathIndex = 0;
    }
    
    /**
     * Check if actor has a path to follow
     */
    public hasPath(): boolean {
        return this.currentPath.length > 0 && this.currentPathIndex < this.currentPath.length;
    }
    
    /**
     * Get the next step in the current path
     */
    public getNextPathStep(): ex.Vector | null {
        if (!this.hasPath()) return null;
        return this.currentPath[this.currentPathIndex];
    }
    
    /**
     * Advance to the next step in the path
     */
    public advancePath(): void {
        if (this.hasPath()) {
            this.currentPathIndex++;
            Logger.debug(`[GameActor] ${this.name} advanced path, index now: ${this.currentPathIndex}/${this.currentPath.length}`);
        }
    }
    
    // ===== TIME MANAGEMENT =====
    
    /**
     * Spend time (emits event for TurnManager)
     */
    public spend(time: number): void {
        this.time += time;
        EventBus.instance.emit(GameEventNames.ActorSpendTime, 
            new ActorSpendTimeEvent(this.entityId, time));
    }
    
    // ===== MOVEMENT =====
    
    /**
     * Animate movement to target grid position
     * This is purely visual - gridPos should already be updated
     */
    public animateMovement(targetGridPos: ex.Vector): void {
        // Calculate pixel position for this grid position
        const targetPixelPos = new ex.Vector(
            targetGridPos.x * 32 + 16, // Center of tile
            targetGridPos.y * 32 + 16
        );

        // Move directly to position (no tween - movement should be instant for turn-based)
        // The gridPos is already updated, just sync the visual position
        this.pos = targetPixelPos;
        
        // TODO: Play walk animation based on direction if sprite animations are set up
        // const direction = targetGridPos.sub(this.gridPos);
        // this.playAnimation(direction);
    }

    private setupTimeEventListener(): void {
        EventBus.instance.on(GameEventNames.ActorSpendTime, (event: ActorSpendTimeEvent) => {
            // Check if this event is for us (by entityId or name)
            if (event.actorId === this.entityId || event.actorId === this.name) {
                this.time += event.time;
                Logger.debug(`[GameActor] ${this.name} spent ${event.time} time. Total: ${this.time}`);
            }
        });
    }
}