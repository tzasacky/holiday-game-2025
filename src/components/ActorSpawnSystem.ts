import * as ex from 'excalibur';
import { GameActor } from './GameActor';
import { ActorDefinitions } from '../data/actors';
import { ComponentRegistry } from './ComponentFactory';
import { EventBus } from '../core/EventBus';
import { GameEventNames, FactoryCreateEvent, ActorSpawnedEvent, InventoryAddStartingItemsEvent } from '../core/GameEvents';
import { Logger } from '../core/Logger';

export class ActorSpawnSystem {
    private static _instance: ActorSpawnSystem;
    
    public static get instance(): ActorSpawnSystem {
        if (!this._instance) {
            this._instance = new ActorSpawnSystem();
        }
        return this._instance;
    }
    
    constructor() {
        this.setupEventListeners();
    }
    
    private setupEventListeners(): void {
        // Listen for actor creation events from ActorFactory
        EventBus.instance.on(GameEventNames.ActorCreate, (event: FactoryCreateEvent) =>{
            this.spawnActor(event.instance.defName, event.instance.gridPos, event.instance.options);
        });
    }
    
    public spawnActor(defName: string, gridPos: ex.Vector, options: any = {}): GameActor {
        // Validate position parameter
        if (!gridPos || gridPos.x === undefined || gridPos.y === undefined) {
            Logger.error(`[ActorSpawnSystem] Invalid position for ${defName}:`, gridPos);
            throw new Error(`Cannot spawn ${defName}: invalid position (${gridPos})`);
        }
        
        Logger.debug(`[ActorSpawnSystem] Spawning ${defName} at ${gridPos.x}, ${gridPos.y}`);
        
        // Get definition
        const def = ActorDefinitions[defName];
        if (!def) {
            throw new Error(`Unknown actor definition: ${defName}`);
        }
        
        // Create minimal actor
        const actor = new GameActor(gridPos, defName);
        actor.name = defName; // For ActorRegistry and debugging
        
        // Set player flag for Hero
        if (def.tags?.includes('player')) {
            actor.isPlayer = true;
        }
        
        // Create and attach components
        def.components.forEach(componentDef => {
            try {
                let config = { ...componentDef.config, ...options };
                
                // Pass base stats to stats component
                if (componentDef.type === 'stats') {
                    config = { ...def.baseStats, ...config };
                }
                
                const component = ComponentRegistry.create(componentDef.type, actor, config);
                actor.addGameComponent(componentDef.type, component);
                
                Logger.debug(`[ActorSpawnSystem] Added ${componentDef.type} component to ${defName}`);
            } catch (error) {
                Logger.error(`[ActorSpawnSystem] Failed to create ${componentDef.type} component for ${defName}:`, error);
            }
        });
        
        // Handle starting items if defined
        if (def.inventory?.startingItems) {
            this.giveStartingItems(actor, def.inventory.startingItems);
        }

        // Emit spawn event
        EventBus.instance.emit(GameEventNames.ActorSpawned, new ActorSpawnedEvent(actor));
        
        Logger.debug(`[ActorSpawnSystem] Successfully spawned ${defName}`);
        return actor;
    }
    
    // Convenience methods
    public spawnHero(gridPos: ex.Vector): GameActor {
        return this.spawnActor('Hero', gridPos);
    }
    
    public spawnSnowman(gridPos: ex.Vector): GameActor {
        return this.spawnActor('Snowman', gridPos);
    }
    
    public spawnSnowSprite(gridPos: ex.Vector): GameActor {
        return this.spawnActor('Snow Sprite', gridPos);
    }
    
    public spawnKrampus(gridPos: ex.Vector): GameActor {
        return this.spawnActor('Krampus', gridPos);
    }

    private giveStartingItems(actor: GameActor, itemIds: string[]): void {
        Logger.debug(`[ActorSpawnSystem] Giving starting items to ${actor.name}:`, itemIds);
        
        // Emit event for InventoryComponent to handle
        EventBus.instance.emit(GameEventNames.InventoryAddStartingItems, new InventoryAddStartingItemsEvent(actor, itemIds));
    }
}