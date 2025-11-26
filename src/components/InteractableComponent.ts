import * as ex from 'excalibur';
import { InteractableDefinition, InteractableType } from '../data/interactables';
import { Logger } from '../core/Logger';
import { EventBus } from '../core/EventBus';
import { GameEventNames, LevelTransitionRequestEvent } from '../core/GameEvents';
import { TileGraphicsManager } from '../graphics/TileGraphicsManager';
import { TerrainType } from '../data/terrain';
import { getBiomesForFloor } from '../data/biomes';
import { InteractableStatePersistence } from '../core/InteractableStatePersistence';

// Simple entity interface for interaction
interface InteractingEntity {
    name: string;
    pos?: ex.Vector;
}

export type InteractableState = 'closed' | 'open' | 'locked' | 'broken' | 'used' | 'hidden';

export interface InteractionResult {
    success: boolean;
    message?: string;
    newState?: InteractableState;
    consumeAction?: boolean;
}

export class InteractableComponent {
    public readonly type = 'interactable';
    private owner: any; // The entity that owns this component
    
    private definition: InteractableDefinition;
    private state: InteractableState = 'closed';
    private config: any;
    private useCount: number = 0;
    private lastUseTurn: number = -1;
    private currentHealth?: number;
    private levelId: string = 'unknown';

    constructor(owner: any, definition: InteractableDefinition, config: any = {}) {
        this.owner = owner;
        this.definition = definition;
        this.config = config;
        this.levelId = config.levelId || 'unknown';
        
        // Initialize state based on type (will be overridden by persistence if available)
        this.initializeState();
        
        // Set health if destructible
        if (definition.destructible && definition.health) {
            this.currentHealth = definition.health;
        }
    }

    public onAttach(): void {
        // Now that we have an owner, try to load saved state
        const hasLoadedState = this.loadPersistedState();
        
        if (hasLoadedState) {
            // Update visuals to match loaded state
            this.updateVisuals();
            this.updateCollisionState();
        }
        
        // Listen for movement events to auto-close doors
        if (this.definition.type === InteractableType.DOOR) {
            EventBus.instance.on(GameEventNames.Movement, (event: any) => {
                this.handlePlayerMovement(event);
            });
        }
    }

    public onDetach(): void {
        // Clean up event listeners
        EventBus.instance.off(GameEventNames.Movement);
    }

    private handlePlayerMovement(event: any): void {
        if (!this.owner || this.state !== 'open' || this.definition.type !== InteractableType.DOOR) {
            return;
        }

        const doorPos = this.getPosition();
        const playerNewPos = { x: Math.floor(event.to.x), y: Math.floor(event.to.y) };
        const playerOldPos = { x: Math.floor(event.from.x), y: Math.floor(event.from.y) };

        // Only auto-close if player was previously ON the door and is now moving OFF it
        const wasOnDoor = (doorPos.x === playerOldPos.x && doorPos.y === playerOldPos.y);
        const isLeavingDoor = (doorPos.x !== playerNewPos.x || doorPos.y !== playerNewPos.y);

        if (wasOnDoor && isLeavingDoor) {
            this.setState('closed');
            Logger.debug(`[InteractableComponent] Auto-closed door at ${doorPos.x},${doorPos.y} - player moved from door to ${playerNewPos.x},${playerNewPos.y}`);
        }
    }

    private initializeState(): void {
        switch (this.definition.type) {
            case InteractableType.DOOR:
                this.state = this.definition.requiresKey ? 'locked' : 'closed';
                break;
            case InteractableType.CONTAINER:
                this.state = 'closed';
                break;
            default:
                this.state = 'closed';
        }
    }

    public canInteract(entity: InteractingEntity): boolean {
        // Check if broken
        if (this.state === 'broken') {
            return false;
        }

        // Check use limit
        if (this.definition.useLimit && this.useCount >= this.definition.useLimit) {
            return false;
        }

        // Check cooldown
        if (this.definition.cooldownTurns && this.lastUseTurn >= 0) {
            const currentTurn = this.getCurrentTurn(); // Will need to implement
            if (currentTurn - this.lastUseTurn < this.definition.cooldownTurns) {
                return false;
            }
        }

        // Check key requirement
        if (this.definition.requiresKey && !this.hasRequiredKey(entity)) {
            return false;
        }

        // Check if already consumed
        if (this.definition.consumeOnUse && this.state === 'used') {
            return false;
        }

        return true;
    }

    public interact(entity: InteractingEntity): InteractionResult {
        if (!this.canInteract(entity)) {
            return { 
                success: false, 
                message: this.getCannotInteractMessage(),
                consumeAction: false
            };
        }

        Logger.debug(`[InteractableComponent] ${entity.name} interacting with ${this.definition.name}`);

        // Get appropriate handler
        const handler = InteractionHandlers[this.definition.type];
        if (!handler) {
            Logger.warn(`[InteractableComponent] No handler for type: ${this.definition.type}`);
            return { 
                success: false, 
                message: "This interaction is not implemented yet",
                consumeAction: false
            };
        }

        // Execute interaction
        const result = handler.handle(entity, this);
        
        // Update state and tracking
        if (result.success) {
            this.useCount++;
            this.lastUseTurn = this.getCurrentTurn();
            
            if (result.newState) {
                this.setState(result.newState);
            }
            
            if (this.definition.consumeOnUse) {
                this.setState('used');
            }
            
            // Save persistent state after successful interaction
            this.savePersistedState();
        }

        return result;
    }

    public takeDamage(amount: number, entity: InteractingEntity): boolean {
        if (!this.definition.destructible || !this.currentHealth) {
            return false;
        }

        this.currentHealth = Math.max(0, this.currentHealth - amount);
        
        if (this.currentHealth <= 0) {
            this.setState('broken');
            this.onDestroyed(entity);
            return true;
        }

        return false;
    }

    private onDestroyed(entity: InteractingEntity): void {
        Logger.info(`[InteractableComponent] ${this.definition.name} was destroyed by ${entity.name}`);
        
        // Drop loot if any
        if (this.definition.loot && this.definition.loot.length > 0) {
            this.generateLoot(entity);
        }
        
        // Remove blocking if applicable
        if (this.definition.blocking && this.owner) {
            this.updateCollisionState();
        }
        
        // Fire destruction event
        EventBus.instance.emit(GameEventNames.InteractableDestroyed, {
            interactable: this,
            destroyer: entity
        });
    }

    private setState(newState: InteractableState): void {
        if (this.state !== newState) {
            const oldState = this.state;
            this.state = newState;
            
            Logger.info(`[InteractableComponent] ${this.definition.name} at position ${this.getPosition().x},${this.getPosition().y} state changed: ${oldState} -> ${newState}, blocking: ${this.shouldBlockMovement()}`);
            
            // Save persistent state
            this.savePersistedState();
            
            // Update visuals and collision
            this.updateVisuals();
            this.updateCollisionState();
            
            // Fire state change event
            EventBus.instance.emit(GameEventNames.InteractableStateChanged, {
                interactable: this,
                oldState,
                newState
            });
        }
    }

    private updateVisuals(): void {
        if (!this.owner) return;
        
        // Get graphics for current state
        const graphic = this.getGraphicsForState();
        this.owner.graphics.use(graphic);
        
        // Force immediate visual update - no setTimeout delay
        if (this.owner && !this.owner.isKilled()) {
            const updatedGraphic = this.getGraphicsForState();
            this.owner.graphics.use(updatedGraphic);
        }
    }

    private updateCollisionState(): void {
        if (!this.owner || !this.definition.blocking) return;
        
        // Update collision based on state
        const shouldBlock = this.shouldBlockMovement();
        // Note: Collision will be handled by CollisionSystem
        this.owner.blocking = shouldBlock;
    }

    public shouldBlockMovement(): boolean {
        if (!this.definition.blocking) return false;
        
        switch (this.state) {
            case 'open':
            case 'broken':
            case 'used':
                return false;
            default:
                return true;
        }
    }

    private getGraphicsForState(): ex.Graphic {
        // Try to get sprite from TileGraphicsManager for common interactables
        try {
            // Map interactable types to terrain types for sprite lookup
            const terrainTypeMap: Record<string, TerrainType> = {
                'door': TerrainType.Door,
                'locked_door': TerrainType.LockedDoor,
                'secret_door': TerrainType.SecretDoor,
                'stairs_down': TerrainType.StairsDown,
                'chasm': TerrainType.Chasm,
                'fireplace': TerrainType.Fireplace
                // Other interactables will use fallback colors
            };
            
            const terrainType = terrainTypeMap[this.definition.id];
            if (terrainType && TileGraphicsManager.instance.isInitialized()) {
                // Get appropriate biome (use first available biome for now)
                const biome = getBiomesForFloor(1)[0];
                
                if (biome) {
                    // For open doors, show floor instead of door
                    if (this.state === 'open' && this.definition.type === InteractableType.DOOR) {
                        return TileGraphicsManager.instance.getTileGraphic(TerrainType.Floor, biome);
                    } else {
                        return TileGraphicsManager.instance.getTileGraphic(terrainType, biome);
                    }
                }
            }
        } catch (error) {
            // Fall back to colored rectangles if graphics system not available
        }
        
        // Fallback: colored rectangle based on state
        const colors = this.getStateColors();
        const color = colors[this.state] || this.definition.graphics.fallbackColor || ex.Color.Purple;
        
        return new ex.Rectangle({
            width: 32,
            height: 32,
            color: color
        });
    }

    private getStateColors(): Record<InteractableState, ex.Color> {
        const baseColor = this.definition.graphics.fallbackColor || ex.Color.Purple;
        
        return {
            closed: baseColor,
            open: baseColor.lighten(0.3),
            locked: ex.Color.fromHex('#FFD700'), // Gold color
            broken: ex.Color.Gray,
            used: baseColor.darken(0.3),
            hidden: ex.Color.Transparent
        };
    }

    private hasRequiredKey(entity: InteractingEntity): boolean {
        if (!this.definition.requiresKey) return true;
        
        // Check if the entity has the game component system (i.e., is a GameActor)
        if ((entity as any).gameComponents) {
            const gameEntity = entity as any;
            const inventoryComponent = gameEntity.gameComponents.get('inventory') as any;
            if (inventoryComponent && inventoryComponent.hasItem) {
                return inventoryComponent.hasItem(this.definition.requiresKey);
            }
        }
        
        return false;
    }

    private getCannotInteractMessage(): string {
        if (this.state === 'broken') return "This is broken and cannot be used.";
        if (this.state === 'used' && this.definition.consumeOnUse) return "This has already been used.";
        if (this.definition.requiresKey && this.state === 'locked') return "This is locked. You need a key.";
        if (this.definition.useLimit && this.useCount >= this.definition.useLimit) return "This can no longer be used.";
        
        return "You cannot interact with this right now.";
    }

    private generateLoot(entity: InteractingEntity): void {
        if (!this.definition.loot) return;
        
        // This will be handled by LootSystem
        EventBus.instance.emit(GameEventNames.LootGenerated, {
            items: [], // LootSystem will generate based on definition
            position: this.owner?.pos || ex.vec(0, 0),
            sourceId: this.definition.id,
            actor: entity
        });
    }

    private getCurrentTurn(): number {
        // This should integrate with TurnManager
        // For now, return a placeholder
        return 0;
    }

    // Public getters
    public get interactableDefinition(): InteractableDefinition { return this.definition; }
    public get currentState(): InteractableState { return this.state; }
    public get usageCount(): number { return this.useCount; }
    public get health(): number | undefined { return this.currentHealth; }
    public get ownerEntity(): any { return this.owner; }

    // State persistence methods
    public getPosition(): { x: number; y: number } {
        if (this.owner && this.owner.pos) {
            return { 
                x: Math.floor(this.owner.pos.x / 32), 
                y: Math.floor(this.owner.pos.y / 32) 
            };
        }
        return { x: 0, y: 0 };
    }

    private loadPersistedState(): boolean {
        if (!this.owner) return false;

        const position = this.getPosition();
        const savedState = InteractableStatePersistence.instance.loadState(
            this.levelId,
            position,
            this.definition.id
        );

        if (savedState) {
            this.state = savedState.state;
            this.useCount = savedState.useCount;
            this.lastUseTurn = savedState.lastUseTurn;
            if (savedState.health !== undefined) {
                this.currentHealth = savedState.health;
            }
            
            Logger.debug(`[InteractableComponent] Loaded persistent state for ${this.definition.name}: ${this.state}`);
            return true;
        }

        return false;
    }

    private savePersistedState(): void {
        if (!this.owner) return;

        const position = this.getPosition();
        InteractableStatePersistence.instance.saveState(
            this.levelId,
            position,
            this.definition.id,
            this.state,
            this.useCount,
            this.lastUseTurn,
            this.currentHealth
        );
    }

    public setLevelId(levelId: string): void {
        this.levelId = levelId;
    }

    public getGraphicsForCurrentState(): ex.Graphic {
        return this.getGraphicsForState();
    }
}

// Interaction Handlers
interface InteractionHandler {
    handle(entity: InteractingEntity, component: InteractableComponent): InteractionResult;
}

const InteractionHandlers: Record<InteractableType, InteractionHandler> = {
    [InteractableType.CONTAINER]: {
        handle(entity: InteractingEntity, component: InteractableComponent): InteractionResult {
            const def = component.interactableDefinition;
            
            // Generate loot
            if (def.loot || def.lootTableId) {
                EventBus.instance.emit(GameEventNames.LootGenerated, {
                    items: [], // LootSystem will handle generation
                    position: component.ownerEntity?.pos || ex.vec(0, 0),
                    sourceId: def.id,
                    actor: entity
                });
            }
            
            return {
                success: true,
                message: `You opened the ${def.name}.`,
                newState: 'open',
                consumeAction: true
            };
        }
    },
    
    [InteractableType.DOOR]: {
        handle(entity: InteractingEntity, component: InteractableComponent): InteractionResult {
            const def = component.interactableDefinition;
            const currentState = component.currentState;
            
            if (currentState === 'locked') {
                // Unlock, open, and move player through
                const doorPos = component.getPosition();
                const actor = entity as any;
                if (actor.gridPos && actor.animateMovement) {
                    const oldPos = actor.gridPos.clone();
                    actor.gridPos = ex.vec(doorPos.x, doorPos.y);
                    actor.animateMovement(ex.vec(doorPos.x, doorPos.y));
                    
                    // Emit movement event for systems
                    EventBus.instance.emit(GameEventNames.Movement, {
                        actorId: actor.entityId,
                        actor: actor,
                        from: oldPos,
                        to: ex.vec(doorPos.x, doorPos.y)
                    });
                }
                
                return {
                    success: true,
                    message: `You unlocked and opened the ${def.name}.`,
                    newState: 'open',
                    consumeAction: true
                };
            } else if (currentState === 'closed') {
                // Open and move player through
                const doorPos = component.getPosition();
                const actor = entity as any;
                if (actor.gridPos && actor.animateMovement) {
                    const oldPos = actor.gridPos.clone();
                    actor.gridPos = ex.vec(doorPos.x, doorPos.y);
                    actor.animateMovement(ex.vec(doorPos.x, doorPos.y));
                    
                    // Emit movement event for systems
                    EventBus.instance.emit(GameEventNames.Movement, {
                        actorId: actor.entityId,
                        actor: actor,
                        from: oldPos,
                        to: ex.vec(doorPos.x, doorPos.y)
                    });
                }
                
                return {
                    success: true,
                    message: `You opened the ${def.name}.`,
                    newState: 'open',
                    consumeAction: true
                };
            } else {
                // Close
                return {
                    success: true,
                    message: `You closed the ${def.name}.`,
                    newState: 'closed',
                    consumeAction: true
                };
            }
        }
    },
    
    [InteractableType.FUNCTIONAL]: {
        handle(entity: InteractingEntity, component: InteractableComponent): InteractionResult {
            const def = component.interactableDefinition;
            
            // Apply effects
            if (def.effects) {
                def.effects.forEach(effect => {
                    // Apply effect to actor
                    Logger.info(`Applied effect: ${effect.type} to ${entity.name}`);
                });
            }
            
            return {
                success: true,
                message: `You used the ${def.name}.`,
                consumeAction: true
            };
        }
    },
    
    [InteractableType.CRAFTING]: {
        handle(entity: InteractingEntity, component: InteractableComponent): InteractionResult {
            const def = component.interactableDefinition;
            
            // Open crafting interface
            Logger.info(`[InteractableComponent] Would open crafting interface for ${def.id}`);
            
            return {
                success: true,
                message: `You begin using the ${def.name}.`,
                consumeAction: false // Don't consume action for opening UI
            };
        }
    },
    
    [InteractableType.DECORATIVE]: {
        handle(entity: InteractingEntity, component: InteractableComponent): InteractionResult {
            const def = component.interactableDefinition;
            
            // Apply decorative effects
            if (def.effects) {
                def.effects.forEach(effect => {
                    Logger.info(`Applied decorative effect: ${effect.type} to ${entity.name}`);
                });
            }
            
            return {
                success: true,
                message: `You admire the ${def.name}.`,
                consumeAction: true
            };
        }
    },
    
    [InteractableType.PORTAL]: {
        handle(entity: InteractingEntity, component: InteractableComponent): InteractionResult {
            const def = component.interactableDefinition;
            
            // First move player to stairs position
            const stairPos = component.getPosition();
            const actor = entity as any;
            if (actor.gridPos && actor.animateMovement) {
                const oldPos = actor.gridPos.clone();
                actor.gridPos = ex.vec(stairPos.x, stairPos.y);
                actor.animateMovement(ex.vec(stairPos.x, stairPos.y));
                
                // Emit movement event for systems
                EventBus.instance.emit(GameEventNames.Movement, {
                    actorId: actor.entityId,
                    actor: actor,
                    from: oldPos,
                    to: ex.vec(stairPos.x, stairPos.y)
                });
            }
            
            // Then trigger level transition
            Logger.info(`[InteractableComponent] *** STAIRS ACTIVATED *** Portal ${def.id} by ${entity.name}`);
            const direction = def.id === 'stairs_down' ? 'down' : 'up';
            Logger.info(`[InteractableComponent] Emitting LevelTransitionRequest - Direction: ${direction}`);
            
            EventBus.instance.emit(GameEventNames.LevelTransitionRequest, new LevelTransitionRequestEvent(
                (entity as any).entityId || entity.name,
                direction,
                'stairs',
                { portal: component }
            ));
            
            return {
                success: true,
                message: `You activated the ${def.name}.`,
                consumeAction: true
            };
        }
    },
    
    [InteractableType.TRAP]: {
        handle(entity: InteractingEntity, component: InteractableComponent): InteractionResult {
            const def = component.interactableDefinition;
            
            // This is for destructible walls and similar
            if (def.destructible) {
                const damaged = component.takeDamage(10, entity); // Default attack damage
                
                if (damaged) {
                    return {
                        success: true,
                        message: `You broke through the ${def.name}!`,
                        consumeAction: true
                    };
                } else {
                    return {
                        success: true,
                        message: `You damaged the ${def.name}.`,
                        consumeAction: true
                    };
                }
            }
            
            return {
                success: false,
                message: `You cannot interact with the ${def.name}.`,
                consumeAction: false
            };
        }
    }
};