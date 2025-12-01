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

        // Listen for successful pickups to remove from level
        EventBus.instance.on(GameEventNames.ItemPickupResult, (event: any) => {
            if (event.success) {
                this.handlePickupSuccess(event);
            }
        });
        
        Logger.info('[ItemPickupHandler] Initialized - listening for Movement and PickupResult events');
    }

    /**
     * Handle successful pickup - remove from level
     */
    private handlePickupSuccess(event: any): void {
        const actor = event.actor;
        const itemEntity = event.item;
        
        // Get level
        const scene = actor.scene as unknown as GameScene;
        const level = scene?.level;
        
        if (!level) return;

        // Find the WorldItemEntity that corresponds to this ItemEntity
        // We need to find it in the level's items list
        const worldItem = level.items.find(wi => wi.item === itemEntity);
        
        if (worldItem) {
            Logger.info(`[ItemPickupHandler] Removing picked up item ${itemEntity.getDisplayName()} from level`);
            level.removeItem(worldItem);
            // WorldItemEntity handles its own kill() on success
        }
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
                // The interact method returns true if interaction started
                worldItem.interact(actor);
                
                // We do NOT remove the item here anymore.
                // We wait for ItemPickupResult event to confirm success.
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