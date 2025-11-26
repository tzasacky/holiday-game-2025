import * as ex from 'excalibur';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { GameEventNames, MovementEvent } from '../core/GameEvents';
import { Level } from '../dungeon/Level';
import { GameActor } from '../components/GameActor';
import { TerrainType, TerrainDefinitions } from '../data/terrain';
import { InteractableType } from '../data/interactables';

/**
 * Centralized Movement event processor to eliminate race conditions
 * Processes movement effects in a deterministic order:
 * 1. Item pickup (immediate)
 * 2. Terrain effects (damage, slippery, etc.)
 * 3. Interactable updates (door auto-close, etc.)
 */
export class MovementProcessor {
    private static _instance: MovementProcessor;

    public static get instance(): MovementProcessor {
        if (!MovementProcessor._instance) {
            MovementProcessor._instance = new MovementProcessor();
        }
        return MovementProcessor._instance;
    }

    private constructor() {
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        EventBus.instance.on(GameEventNames.Movement, (event: MovementEvent) => {
            this.processMovement(event);
        });
        
        Logger.info('[MovementProcessor] Initialized - centralized movement processing');
    }

    /**
     * Process movement events in deterministic order
     */
    private processMovement(event: MovementEvent): void {
        const { actor, from, to } = event;

        // Get level from actor's scene
        const scene = actor.scene as any;
        const level = scene?.level as Level;

        if (!level) {
            return;
        }

        try {
            // 1. ITEM PICKUP (Players only, immediate)
            if (actor.isPlayer) {
                this.handleItemPickup(actor, level, to);
            }

            // 2. TERRAIN EFFECTS (All actors)
            this.handleTerrainEffects(actor, level, to);

            // 3. INTERACTABLE UPDATES (All actors)  
            this.handleInteractableUpdates(actor, level, from, to);

        } catch (error) {
            Logger.error(`[MovementProcessor] Error processing movement for ${actor.name}:`, error);
        }
    }

    /**
     * Handle automatic item pickup when player moves onto items
     */
    private handleItemPickup(actor: GameActor, level: Level, position: ex.Vector): void {
        const items = level.getItemsAt(position.x, position.y);
        
        if (items.length === 0) {
            return;
        }

        for (const worldItem of items) {
            Logger.debug(`[MovementProcessor] Player ${actor.name} picking up ${worldItem.item.getDisplayName()} at ${position.x},${position.y}`);
            
            try {
                worldItem.interact(actor);
            } catch (error) {
                Logger.error(`[MovementProcessor] Error picking up item ${worldItem.item.getDisplayName()}:`, error);
            }
        }
    }

    /**
     * Handle terrain-based effects (ice, fire, etc.)
     */
    private handleTerrainEffects(actor: GameActor, level: Level, position: ex.Vector): void {
        const terrainType = level.getTile(position.x, position.y);
        const terrain = TerrainDefinitions[terrainType];

        if (!terrain || !terrain.effects) {
            return;
        }

        // Apply terrain effects
        for (const effect of terrain.effects) {
            try {
                this.applyTerrainEffect(actor, effect, terrainType);
            } catch (error) {
                Logger.error(`[MovementProcessor] Error applying terrain effect ${effect.type}:`, error);
            }
        }
    }

    /**
     * Handle interactable state updates (door auto-close, etc.)
     */
    private handleInteractableUpdates(actor: GameActor, level: Level, from: ex.Vector, to: ex.Vector): void {
        // Only process for player movements to avoid excessive processing
        if (!actor.isPlayer) {
            return;
        }

        // Check all doors for auto-close behavior
        for (const entity of level.scene.entities) {
            if ((entity as any).definition?.type === InteractableType.DOOR) {
                this.handleDoorAutoClose(entity as any, actor, from, to);
            }
        }
    }

    /**
     * Handle door auto-close logic
     */
    private handleDoorAutoClose(doorEntity: any, actor: GameActor, from: ex.Vector, to: ex.Vector): void {
        if (!doorEntity.interactableComponent || doorEntity.interactableComponent.currentState !== 'open') {
            return;
        }

        const doorPos = doorEntity.gridPos;
        const wasOnDoor = (doorPos.x === from.x && doorPos.y === from.y);
        const isLeavingDoor = (doorPos.x !== to.x || doorPos.y !== to.y);

        if (wasOnDoor && isLeavingDoor) {
            Logger.debug(`[MovementProcessor] Auto-closing door at ${doorPos.x},${doorPos.y} - player moved from door to ${to.x},${to.y}`);
            doorEntity.interactableComponent.setState('closed');
        }
    }

    /**
     * Apply a specific terrain effect to an actor
     */
    private applyTerrainEffect(actor: GameActor, effect: any, terrainType: TerrainType): void {
        switch (effect.type) {
            case 'damage':
                EventBus.instance.emit(GameEventNames.Damage, {
                    target: actor,
                    amount: effect.value || 1,
                    damageType: effect.damageType || 'environmental',
                    source: `${TerrainType[terrainType]} terrain`
                });
                break;

            case 'effect':
                EventBus.instance.emit(GameEventNames.EffectApply, {
                    target: actor,
                    effectId: effect.effectId,
                    duration: effect.duration || 1,
                    source: 'terrain'
                });
                break;

            case 'sound':
                EventBus.instance.emit(GameEventNames.SoundPlay, {
                    soundId: effect.soundId,
                    position: actor.pos
                });
                break;

            default:
                Logger.debug(`[MovementProcessor] Unknown terrain effect type: ${effect.type}`);
        }
    }

    /**
     * Initialize the processor - should be called during system setup
     */
    public static initialize(): void {
        MovementProcessor.instance; // Triggers singleton creation
        Logger.info('[MovementProcessor] System initialized');
    }
}