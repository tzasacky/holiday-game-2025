import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';
import { Level } from '../dungeon/Level';
import { Logger } from '../core/Logger';

/**
 * Interface for movement behaviors
 */
export interface IMovementBehavior {
    /**
     * Get the next move for this behavior
     * @returns Next target position, or null if no move available
     */
    getNextMove(actor: GameActor, level: Level): ex.Vector | null;

    /**
     * Called after a move attempt
     * @param success Whether the move succeeded
     * @param reason Optional reason for failure
     */
    onMoveResult(success: boolean, reason?: string): void;

    /**
     * Check if this behavior is complete
     */
    isComplete(): boolean;

    /**
     * Cancel this behavior
     */
    cancel(): void;
}

/**
 * Single-step directional movement
 */
export class DirectMoveBehavior implements IMovementBehavior {
    private completed: boolean = false;
    private targetPosition: ex.Vector;

    constructor(private direction: ex.Vector, private startPosition: ex.Vector) {
        this.targetPosition = startPosition.add(direction);
    }

    getNextMove(actor: GameActor, level: Level): ex.Vector | null {
        if (this.completed) return null;
        return this.targetPosition;
    }

    onMoveResult(success: boolean, reason?: string): void {
        // Single move is always complete after one attempt
        this.completed = true;
        
        if (!success) {
            Logger.debug(`[DirectMoveBehavior] Move failed: ${reason}`);
        }
    }

    isComplete(): boolean {
        return this.completed;
    }

    cancel(): void {
        this.completed = true;
    }
}

/**
 * Follow a pre-computed path
 */
export class PathFollowBehavior implements IMovementBehavior {
    private currentIndex: number = 0;
    private cancelled: boolean = false;

    constructor(
        private path: ex.Vector[],
        private stopOnBlock: boolean = true
    ) {
        // Path should not include starting position
        // If it does, skip it
        if (path.length > 0 && path[0]) {
            // We assume path[0] might be current position, so we start at index 0
            // and increment after each successful move
        }
    }

    getNextMove(actor: GameActor, level: Level): ex.Vector | null {
        if (this.cancelled || this.currentIndex >= this.path.length) {
            return null;
        }

        const nextStep = this.path[this.currentIndex];
        
        // Validate next step is adjacent to current position
        const currentPos = actor.gridPos;
        const distance = Math.abs(nextStep.x - currentPos.x) + Math.abs(nextStep.y - currentPos.y);
        
        if (distance > 1) {
            // Path is invalid (not adjacent) - might be stale
            Logger.warn(`[PathFollowBehavior] Path invalid, next step not adjacent (distance: ${distance})`);
            this.cancel();
            return null;
        }

        return nextStep;
    }

    onMoveResult(success: boolean, reason?: string): void {
        if (success) {
            // Move to next step in path
            this.currentIndex++;
        } else {
            // Move failed
            if (this.stopOnBlock) {
                Logger.debug(`[PathFollowBehavior] Path blocked: ${reason}, stopping`);
                this.cancel();
            } else {
                // Try to continue (might work next turn)
                Logger.debug(`[PathFollowBehavior] Path blocked: ${reason}, will retry`);
            }
        }
    }

    isComplete(): boolean {
        return this.cancelled || this.currentIndex >= this.path.length;
    }

    cancel(): void {
        this.cancelled = true;
    }

    /**
     * Get number of remaining steps in path
     */
    public getRemainingSteps(): number {
        return Math.max(0, this.path.length - this.currentIndex);
    }
}
