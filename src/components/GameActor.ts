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
        return equipmentComponent?.getEquipment('weapon') ?? null;
    }

    get armor(): any {
        const equipmentComponent = this.getGameComponent('equipment') as any;
        return equipmentComponent?.getEquipment('armor') ?? null;
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
        for (const component of this.gameComponents.values()) {
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