import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';
import { Level } from '../dungeon/Level';
import { EventBus } from '../core/EventBus';
import { GameEventNames } from '../core/GameEvents';
import { Logger } from '../core/Logger';

export interface MoveResult {
    success: boolean;
    reason?: string;
    blocker?: GameActor;
}

const TILE_SIZE = 32;
const MOVE_SPEED = 240; // ms per tile

/**
 * Centralized movement system - handles all actor movement synchronously
 */
export class MovementSystem {
    private static _instance: MovementSystem;

    public static get instance(): MovementSystem {
        if (!MovementSystem._instance) {
            MovementSystem._instance = new MovementSystem();
        }
        return MovementSystem._instance;
    }

    private constructor() {}

    /**
     * Synchronously move an actor to a new position
     * Validates movement, updates state, triggers animation
     */
    public moveActor(actor: GameActor, toPosition: ex.Vector, level: Level): MoveResult {
        // Validate movement
        if (!level.isWalkable(toPosition.x, toPosition.y, actor.entityId)) {
            // Check what's blocking
            const blocker = level.getActorAt(toPosition.x, toPosition.y);
            
            if (blocker) {
                // Actor blocking - trigger bump-to-attack
                this.handleBumpAttack(actor, blocker);
                return {
                    success: false,
                    reason: 'blocked_by_actor',
                    blocker
                };
            }
            
            return {
                success: false,
                reason: 'blocked_by_terrain'
            };
        }

        // Store old position
        const oldPos = actor.gridPos.clone();

        // Update logical position immediately
        actor.gridPos = toPosition.clone();

        // Trigger visual animation (fire-and-forget)
        this.animateMovement(actor, toPosition);

        // Emit movement event for observers
        EventBus.instance.emit(GameEventNames.Movement, {
            actorId: actor.entityId,
            from: oldPos,
            to: toPosition,
            actor
        });

        Logger.debug(`[MovementSystem] ${actor.name} moved from ${oldPos} to ${toPosition}`);

        return { success: true };
    }

    /**
     * Check if an actor can move to a position
     */
    public canMoveTo(actor: GameActor, position: ex.Vector, level: Level): boolean {
        return level.isWalkable(position.x, position.y, actor.entityId);
    }

    /**
     * Trigger visual movement animation
     * Animation is decoupled from logical movement
     */
    private animateMovement(actor: GameActor, toPosition: ex.Vector): void {
        const worldX = toPosition.x * TILE_SIZE;
        const worldY = toPosition.y * TILE_SIZE;

        // Clear any existing movement actions
        actor.actions.clearActions();

        // Smooth movement animation
        actor.actions.moveTo(worldX, worldY, MOVE_SPEED).callMethod(() => {
            // Sync visual position to grid position (in case of drift)
            actor.pos.x = actor.gridPos.x * TILE_SIZE;
            actor.pos.y = actor.gridPos.y * TILE_SIZE;
        });
    }

    /**
     * Handle bump-to-attack when movement is blocked by an actor
     */
    private handleBumpAttack(attacker: GameActor, target: GameActor): void {
        Logger.debug(`[MovementSystem] ${attacker.name} bumped into ${target.name}, initiating attack`);

        // Get combat component
        const combat = attacker.getGameComponent('combat') as any;
        if (combat && typeof combat.attack === 'function') {
            combat.attack(target.entityId);
        } else {
            Logger.warn(`[MovementSystem] ${attacker.name} has no combat component, cannot attack`);
        }
    }
}
