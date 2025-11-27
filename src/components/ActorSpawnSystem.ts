import * as ex from 'excalibur';
import { GameActor } from './GameActor';
import { ActorDefinitions } from '../data/actors';
import { ComponentRegistry } from './ComponentFactory';
import { EventBus } from '../core/EventBus';
import { GameEventNames } from '../core/GameEvents';

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
        EventBus.instance.on('spawn:actor' as any, (event: any) => {
            this.spawnActor(event.defName, event.gridPos, event.options);
        });
        
        EventBus.instance.on(GameEventNames.ActorCreate, (event: any) => {
            this.spawnActor(event.defName, event.gridPos, event.options);
        });
    }
    
    public spawnActor(defName: string, gridPos: ex.Vector, options: any = {}): GameActor {
        console.log(`[ActorSpawnSystem] Spawning ${defName} at ${gridPos.x}, ${gridPos.y}`);
        
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
                
                console.log(`[ActorSpawnSystem] Added ${componentDef.type} component to ${defName}`);
            } catch (error) {
                console.error(`[ActorSpawnSystem] Failed to create ${componentDef.type} component for ${defName}:`, error);
            }
        });
        
        // Handle starting items if defined
        if (def.inventory?.startingItems) {
            this.giveStartingItems(actor, def.inventory.startingItems);
        }

        // Emit spawn event
        EventBus.instance.emit('actor:spawned' as any, {
            actor: actor,
            definition: def,
            defName: defName,
            gridPos: gridPos
        });
        
        console.log(`[ActorSpawnSystem] Successfully spawned ${defName}`);
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
        console.log(`[ActorSpawnSystem] Giving starting items to ${actor.name}:`, itemIds);
        
        // Emit event for inventory system to handle
        EventBus.instance.emit('inventory:add_starting_items' as any, {
            actorId: actor.entityId,
            itemIds: itemIds
        });
    }
}