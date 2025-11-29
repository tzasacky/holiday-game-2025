import * as ex from 'excalibur';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { GameEventNames, MovementEvent, ItemPickupAttemptEvent } from '../core/GameEvents';
import { Level } from '../dungeon/Level';
import { GameActor } from '../components/GameActor';
import { GameScene } from '../scenes/GameScene';

/**
 * Handles automatic item pickup when a player moves onto items
 * Listens for Movement events and checks for items at the destination
 */
export class ItemPickupHandler {
    private static _instance: ItemPickupHandler;

    public static get instance(): ItemPickupHandler {
        if (!ItemPickupHandler._instance) {
            ItemPickupHandler._instance = new ItemPickupHandler();
        }
        return ItemPickupHandler._instance;
    }

    private constructor() {
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        EventBus.instance.on(GameEventNames.Movement, (event: MovementEvent) => {
            this.handleMovement(event);
        });
        
        Logger.info('[ItemPickupHandler] Initialized - listening for Movement events');
    }

    /**
     * Handle movement events and check for items at the destination
     */
    private handleMovement(event: MovementEvent): void {
        const { actor, to } = event;

        // Only handle player movements (not AI)
        if (!actor || !this.isPlayer(actor)) {
            return;
        }

        // Get level from actor's scene
        // Get level from actor's scene
        // Safe cast to GameScene which we know has a level property
        const scene = actor.scene as unknown as GameScene;
        const level = scene?.level;

        if (!level) {
            return;
        }

        // Check for items at the destination position
        const items = level.getItemsAt(to.x, to.y);
        
        if (items.length === 0) {
            return;
        }

        // Attempt to pick up each item
        for (const worldItem of items) {
            Logger.debug(`[ItemPickupHandler] Player ${actor.name} moved onto ${worldItem.item.getDisplayName()} at ${to.x},${to.y}`);
            
            try {
                // Trigger the item's interact method which handles the pickup logic
                // The interact method should return true if pickup was successful
                const pickupSuccessful = worldItem.interact(actor);

                if (pickupSuccessful) {
                    // Remove the item entity from the game world
                    worldItem.kill();
                    
                    // Remove from level's items list so it can't be picked up again
                    if (level) {
                        level.removeItem(worldItem);
                    }
                    
                    // Emit pickup event for UI updates
                    EventBus.instance.emit(GameEventNames.ItemPickup, {
                        actor: actor,
                        item: worldItem.item // Assuming worldItem.item is the actual item data
                    });
                }
            } catch (error) {
                Logger.error(`[ItemPickupHandler] Error picking up item ${worldItem.item.getDisplayName()}:`, error);
            }
        }
    }

    /**
     * Check if the actor is a player (not an AI-controlled entity)
     */
    private isPlayer(actor: GameActor): boolean {
        // GameActor has an isPlayer boolean property
        return actor.isPlayer === true;
    }

    /**
     * Initialize the handler - should be called during system setup
     */
    public static initialize(): void {
        ItemPickupHandler.instance; // Triggers singleton creation and event listener setup
        Logger.info('[ItemPickupHandler] System initialized');
    }
}