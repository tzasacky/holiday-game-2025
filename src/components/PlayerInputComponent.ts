import { ActorComponent } from './ActorComponent';
import { InputManager, GameActionType } from '../core/InputManager';
import { GameEventNames, ActorSpendTimeEvent } from '../core/GameEvents';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { MovementSystem } from '../systems/MovementSystem';
import { PathfindingSystem } from '../systems/PathfindingSystem';
import { IMovementBehavior, DirectMoveBehavior, PathFollowBehavior } from '../systems/MovementBehavior';
import * as ex from 'excalibur';

export interface PlayerAction {
    type: GameActionType;
    direction?: ex.Vector;
    targetId?: string;
    itemId?: string;
}

export class PlayerInputComponent extends ActorComponent {
    private inputManager!: InputManager;
    private actionQueue: PlayerAction[] = []
;
    private currentBehavior: IMovementBehavior | null = null;
    
    protected setupEventListeners(): void {
        // Listen for turns
        this.listen(GameEventNames.ActorTurn, (event) => {
            if (this.isForThisActor(event)) {
                Logger.debug('[PlayerInputComponent] Handling turn for:', this.actor.name);
                // Ensure inputManager is available when we need it
                if (!this.inputManager) {
                    this.inputManager = InputManager.instance;
                }
                this.handleTurn();
            }
        });
        
        // Listen for input events
        this.listen(GameEventNames.PlayerInput, (event: any) => {
            this.queueAction(event.actionType);
        });
    }
    
    queueAction(actionType: GameActionType): void {
        const action: PlayerAction = {
            type: actionType,
            direction: this.getDirectionFromAction(actionType)
        };
        this.actionQueue.push(action);
    }
    
    public hasPendingAction(): boolean {
        // Check if we have a behavior in progress
        if (this.currentBehavior && !this.currentBehavior.isComplete()) {
            return true;
        }
        
        // Check queue
        if (this.actionQueue.length > 0) {
            return true;
        }
        
        // Check for click target
        return this.inputManager?.hasClickTarget() || false;
    }

    private handleTurn(): void {
        const scene = this.actor.scene as any;
        const level = scene?.level;
        
        if (!level) {
            Logger.warn('[PlayerInputComponent] No level found');
            this.spendTime(10);
            return;
        }

        // 1. Continue existing behavior if not complete
        if (this.currentBehavior && !this.currentBehavior.isComplete()) {
            this.executeBehavior(level);
            return;
        }

        // 2. Check for queued actions
        let action = this.actionQueue.shift();
        
        // 3. If no queued action, check for click target
        if (!action) {
            const clickTarget = this.inputManager?.getClickTarget();
            if (clickTarget) {
                action = this.handleClickTarget(clickTarget, level);
            } else {
                // No action this turn
                action = { type: GameActionType.Wait };
            }
        }
        
        if (action) {
            this.processAction(action, level);
        }
    }

    /**
     * Handle click target - create appropriate behavior
     */
    private handleClickTarget(clickTarget: ex.Vector, level: any): PlayerAction {
        const currentPos = this.actor.gridPos;
        const dist = currentPos.distance(clickTarget);
        
        if (dist <= 1.5) {
            // Adjacent click - direct movement
            const direction = clickTarget.sub(currentPos);
            const gridDir = ex.vec(
                Math.round(direction.x),
                Math.round(direction.y)
            );
            
            return {
                type: GameActionType.MoveNorth, // Placeholder
                direction: gridDir
            };
        } else {
            // Distant click - pathfinding
            Logger.debug(`[PlayerInputComponent] Computing path to ${clickTarget}`);
            
            const path = PathfindingSystem.instance.findPath(
                currentPos,
                clickTarget,
                level,
                this.actor.entityId
            );
            
            if (path && path.length > 0) {
                this.currentBehavior = new PathFollowBehavior(path, true);
                Logger.debug(`[PlayerInputComponent] Path found, ${path.length} steps`);
                
                // Execute first step immediately
                this.executeBehavior(level);
                return { type: GameActionType.Wait }; // Already handled
            } else {
                Logger.warn('[PlayerInputComponent] No path found to target');
                // Spend time anyway
                this.spendTime(10);
                return { type: GameActionType.Wait };
            }
        }
    }

    /**
     * Execute current behavior's next move
     */
    private executeBehavior(level: any): void {
        if (!this.currentBehavior) return;

        const nextMove = this.currentBehavior.getNextMove(this.actor, level);
        
        if (!nextMove) {
            // Behavior complete
            this.currentBehavior = null;
            this.spendTime(10);
            return;
        }

        // Execute movement
        const result = MovementSystem.instance.moveActor(this.actor, nextMove, level);
        
        // Notify behavior of result
        this.currentBehavior.onMoveResult(result.success, result.reason);
        
        // Spend time
        this.spendTime(10);
        
        // If behavior is now complete, clear it
        if (this.currentBehavior.isComplete()) {
            this.currentBehavior = null;
        }
    }
    
    private processAction(action: PlayerAction, level: any): void {
        switch (action.type) {
            case GameActionType.MoveNorth:
            case GameActionType.MoveSouth:
            case GameActionType.MoveEast:
            case GameActionType.MoveWest:
                const direction = action.direction || this.getDirectionFromAction(action.type);
                const toPos = this.actor.gridPos.add(direction);
                
                // Create and execute direct movement behavior
                this.currentBehavior = new DirectMoveBehavior(direction, this.actor.gridPos);
                const nextMove = this.currentBehavior.getNextMove(this.actor, level);
                
                if (nextMove) {
                    const result = MovementSystem.instance.moveActor(this.actor, nextMove, level);
                    this.currentBehavior.onMoveResult(result.success, result.reason);
                }
                
                this.spendTime(10);
                this.currentBehavior = null; // Direct move is always complete
                break;
                
            case GameActionType.Wait:
                this.spendTime(10);
                break;
                
            case GameActionType.Interact:
            case GameActionType.Inventory:
                // Handled elsewhere
                break;
        }
    }
    
    private spendTime(amount: number): void {
        const timeEvent = new ActorSpendTimeEvent(this.actor.entityId, amount);
        EventBus.instance.emit(GameEventNames.ActorSpendTime, timeEvent);
    }
    
    private getDirectionFromAction(actionType: GameActionType): ex.Vector {
        switch (actionType) {
            case GameActionType.MoveNorth: return ex.vec(0, -1);
            case GameActionType.MoveSouth: return ex.vec(0, 1);
            case GameActionType.MoveEast: return ex.vec(1, 0);
            case GameActionType.MoveWest: return ex.vec(-1, 0);
            default: return ex.vec(0, 0);
        }
    }
}