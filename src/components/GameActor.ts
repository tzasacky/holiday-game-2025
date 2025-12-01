import * as ex from 'excalibur';
import { GameEntity } from '../core/GameEntity';
import { ActorComponent } from './ActorComponent';
import { EventBus } from '../core/EventBus';
import { GameEventNames, ActorSpendTimeEvent, ActorTurnEvent } from '../core/GameEvents';
import { GraphicsManager } from '../data/graphics';
import { ComponentType } from '../constants/RegistryKeys';
import { Logger } from '../core/Logger';
import { StatsComponent } from './StatsComponent';
import { CombatComponent } from './CombatComponent';
import { PlayerInputComponent } from './PlayerInputComponent';
import { EquipmentComponent } from './EquipmentComponent';

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
    
    // Damage display
    public currentDamageLabel: ex.Label | null = null;
    
    // Death state (for preventing interaction while visual persists)
    public isDead: boolean = false;
    
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
        const statsComponent = this.getGameComponent<StatsComponent>('stats');
        return statsComponent?.getStat('hp') ?? 0;
    }
    
    get maxHp(): number {
        const statsComponent = this.getGameComponent<StatsComponent>('stats');
        return statsComponent?.getStat('maxHp') ?? 0;
    }
    
    get totalDamage(): number {
        const combatComponent = this.getGameComponent<CombatComponent>('combat');
        return combatComponent?.getTotalDamage() ?? 0;
    }
    
    get totalDefense(): number {
        const combatComponent = this.getGameComponent<CombatComponent>('combat');
        return combatComponent?.getTotalDefense() ?? 0;
    }
    
    get warmth(): number {
        const statsComponent = this.getGameComponent<StatsComponent>('stats');
        return statsComponent?.getStat('warmth') ?? 0;
    }
    
    set warmth(value: number) {
        const statsComponent = this.getGameComponent<StatsComponent>('stats');
        if (statsComponent) {
            statsComponent.setStat('warmth', value);
        }
    }
    
    // Queue action for PlayerInputComponent
    queueAction(actionType: any): void {
        const playerInputComp = this.getGameComponent<PlayerInputComponent>(ComponentType.PLAYER_INPUT);
        if (playerInputComp) {
            playerInputComp.queueAction(actionType);
        }
    }
    
    // Equipment helpers
    equip(item: any): boolean {
        const equipmentComponent = this.getGameComponent<EquipmentComponent>('equipment');
        if (equipmentComponent) {
            return equipmentComponent.equip(item);
        }
        return false;
    }

    get weapon(): any {
        const equipmentComponent = this.getGameComponent<EquipmentComponent>('equipment');
        return equipmentComponent ? equipmentComponent.getEquipment('weapon') : null;
    }

    get armor(): any {
        const equipmentComponent = this.getGameComponent<EquipmentComponent>('equipment');
        return equipmentComponent ? equipmentComponent.getEquipment('armor') : null;
    }

    get accessories(): any[] {
        const equipmentComponent = this.getGameComponent<EquipmentComponent>('equipment');
        const accessory = equipmentComponent ? equipmentComponent.getEquipment('accessory') : null;
        return accessory ? [accessory] : [];
    }

    // Turn system - ONLY method
    async act(): Promise<boolean> {
        // If this is a player, check if we have input ready
        if (this.isPlayer) {
            const playerInput = this.getGameComponent<PlayerInputComponent>(ComponentType.PLAYER_INPUT);
            if (playerInput) {
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

    onAdd(engine: ex.Engine): void {
        super.onAdd(engine);
        // Ensure graphics are configured when added to a scene (important for reused actors)
        GraphicsManager.instance.configureActor(this);
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
public animateMovement(targetGridPos: ex.Vector, fromPos?: ex.Vector): void {
    // Clear any damage label when moving (new action)
    if (this.currentDamageLabel) {
        this.currentDamageLabel.kill();
        this.currentDamageLabel = null;
    }
    
    // Calculate pixel position for this grid position
    const targetPixelPos = new ex.Vector(
        targetGridPos.x * 32 + 16, // Center of tile
        targetGridPos.y * 32 + 16
    );

    // Calculate direction from provided fromPos or current gridPos
    const startPos = fromPos || this.gridPos;
    const direction = targetGridPos.sub(startPos);
    
    // Move directly to position (no tween - movement should be instant for turn-based)
    this.pos = targetPixelPos;
    
    // Play walk animation based on direction
    const animName = this.getWalkAnimationName(direction);
    if (animName && this.graphics.getGraphic(animName)) {
        this.graphics.use(animName);
        Logger.debug(`[GameActor] Playing walk animation: ${animName} for direction ${direction}`);
        
        // Return to idle after walk animation completes (400ms)
        setTimeout(() => {
            const idleAnim = this.getIdleAnimationName(direction);
            if (this.graphics.getGraphic(idleAnim)) {
                this.graphics.use(idleAnim);
            }
        }, 400);
    } else {
        Logger.warn(`[GameActor] Could not find walk animation: ${animName}`);
    }
}

/**
 * Get the walk animation name for a direction vector
 */
private getWalkAnimationName(direction: ex.Vector): string | null {
    // Normalize to get primary direction
    const absX = Math.abs(direction.x);
    const absY = Math.abs(direction.y);
    
    if (absX === 0 && absY === 0) {
        return null; // No movement
    }
    
    // Determine primary direction (prefer horizontal over vertical if equal)
    if (absX > absY) {
        return direction.x > 0 ? 'right-walk' : 'left-walk';
    } else {
        return direction.y > 0 ? 'down-walk' : 'up-walk';
    }
}

/**
 * Get the idle animation name for a direction vector
 */
public getIdleAnimationName(direction: ex.Vector): string {
    const absX = Math.abs(direction.x);
    const absY = Math.abs(direction.y);
    
    // Determine primary direction (prefer horizontal over vertical if equal)
    if (absX > absY) {
        return direction.x > 0 ? 'idle-right' : 'idle-left';
    } else {
        return direction.y > 0 ? 'idle-down' : 'idle-up';
    }
}

/**
 * Get the attack animation name for a direction to target
 */
public getAttackAnimationName(targetPos: ex.Vector): string {
    const direction = targetPos.sub(this.gridPos);
    const absX = Math.abs(direction.x);
    const absY = Math.abs(direction.y);
    
    if (absX > absY) {
        return direction.x > 0 ? 'attack-right' : 'attack-left';
    } else {
        return direction.y > 0 ? 'attack-down' : 'attack-up';
    }
}

/**
 * Get the hurt animation name for a direction from attacker
 */
public getHurtAnimationName(attackerPos: ex.Vector): string {
    const direction = this.gridPos.sub(attackerPos);
    const absX = Math.abs(direction.x);
    const absY = Math.abs(direction.y);
    
    if (absX > absY) {
        return direction.x > 0 ? 'hurt-right' : 'hurt-left';
    } else {
        return direction.y > 0 ? 'hurt-down' : 'hurt-up';
    }
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

    public kill(): void {
        Logger.debug(`[GameActor] ${this.name} killed`);
        super.kill();
    }
}