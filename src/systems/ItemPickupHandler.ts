import * as ex from 'excalibur';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { GameEventNames, MovementEvent, ItemPickupAttemptEvent } from '../core/GameEvents';
import { Level } from '../dungeon/Level';
import { GameActor } from '../components/GameActor';

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
        const scene = actor.scene as any;
        const level = scene?.level as Level;

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
                worldItem.interact(actor);
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