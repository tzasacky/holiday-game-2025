import * as ex from 'excalibur';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { GameEventNames, ItemSpawnRequestEvent } from '../core/GameEvents';
import { ItemFactory } from '../factories/ItemFactory';
import { WorldItemEntity } from '../items/WorldItemEntity';
import { Level } from '../dungeon/Level';

/**
 * Handles ItemSpawnRequest events to actually create WorldItemEntity objects in the world
 * This is the missing piece that converts loot spawn events into actual items on the ground
 */
export class ItemSpawnHandler {
    private static _instance: ItemSpawnHandler;

    public static get instance(): ItemSpawnHandler {
        if (!ItemSpawnHandler._instance) {
            ItemSpawnHandler._instance = new ItemSpawnHandler();
        }
        return ItemSpawnHandler._instance;
    }

    private constructor() {
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        EventBus.instance.on(GameEventNames.ItemSpawnRequest, (event: any) => {
            this.handleItemSpawnRequest(event);
        });
        
        Logger.info('[ItemSpawnHandler] Initialized - listening for ItemSpawnRequest events');
    }

    /**
     * Handle ItemSpawnRequest event by creating actual WorldItemEntity objects
     */
    private handleItemSpawnRequest(event: any): void {
        const { itemId, position, level, count } = event;

        if (!itemId || !position || !level) {
            Logger.warn(`[ItemSpawnHandler] Invalid ItemSpawnRequest data:`, event);
            return;
        }

        if (!(level instanceof Level)) {
            Logger.error(`[ItemSpawnHandler] Invalid level object in ItemSpawnRequest`);
            return;
        }

        const itemCount = count || 1;
        
        try {
            // Create ItemEntity using ItemFactory (same pattern as PrefabExecutor)
            const itemEntity = ItemFactory.instance.createAt(itemId, position, itemCount);
            
            if (itemEntity) {
                // Create WorldItemEntity to represent the item in the world
                const worldItem = new WorldItemEntity(position, itemEntity);
                
                // Add to level
                level.addItem(worldItem);
                
                Logger.debug(`[ItemSpawnHandler] Spawned ${itemCount}x ${itemId} at ${position.x},${position.y}`);
            } else {
                Logger.warn(`[ItemSpawnHandler] Failed to create ItemEntity for ${itemId}`);
            }
        } catch (error) {
            Logger.error(`[ItemSpawnHandler] Error spawning item ${itemId}:`, error);
        }
    }

    /**
     * Initialize the handler - should be called during system setup
     */
    public static initialize(): void {
        ItemSpawnHandler.instance; // Triggers singleton creation and event listener setup
        Logger.info('[ItemSpawnHandler] System initialized');
    }
}