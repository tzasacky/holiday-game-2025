import { ActorComponent } from './ActorComponent';
import { InputManager, GameActionType } from '../core/InputManager';
import * as ex from 'excalibur';

export interface PlayerAction {
    type: GameActionType;
    direction?: ex.Vector;
    targetId?: string;
    itemId?: string;
}

export class PlayerInputComponent extends ActorComponent {
    private inputManager!: InputManager;
    private actionQueue: PlayerAction[] = [];
    
    protected setupEventListeners(): void {
        this.inputManager = InputManager.instance;
        
        // Listen for turns
        this.listen('actor:turn', (event) => {
            if (this.isForThisActor(event)) {
                this.handleTurn();
            }
        });
        
        // Listen for input events
        this.listen('player:input', (event) => {
            if (this.isForThisActor(event)) {
                this.queueAction(event.actionType);
            }
        });
    }
    
    queueAction(actionType: GameActionType): void {
        const action: PlayerAction = {
            type: actionType,
            direction: this.getDirectionFromAction(actionType)
        };
        this.actionQueue.push(action);
    }
    
    private async handleTurn(): Promise<void> {
        // Check for queued actions first
        let action = this.actionQueue.shift();
        
        // If no queued action, check for click target or wait
        if (!action) {
            const clickTarget = this.inputManager.getClickTarget();
            if (clickTarget) {
                action = {
                    type: GameActionType.MoveNorth, // Will be calculated based on direction
                    direction: clickTarget
                };
            } else {
                // No action this turn
                action = { type: GameActionType.Wait };
            }
        }
        
        if (action) {
            this.emit('player:action', {
                actorId: this.actor.entityId,
                action: action
            });
            
            // Convert action to appropriate event
            this.processAction(action);
        }
        
        // Spend turn time
        this.emit('actor:spend_time', {
            actorId: this.actor.entityId,
            time: 10
        });
    }
    
    private processAction(action: PlayerAction): void {
        switch (action.type) {
            case GameActionType.MoveNorth:
            case GameActionType.MoveSouth:
            case GameActionType.MoveEast:
            case GameActionType.MoveWest:
                this.emit('movement:request', {
                    actorId: this.actor.entityId,
                    direction: action.direction || this.getDirectionFromAction(action.type)
                });
                break;
                
            case GameActionType.Interact:
                this.emit('interaction:request', {
                    actorId: this.actor.entityId,
                    targetId: action.targetId
                });
                break;
                
            case GameActionType.Wait:
                // Just spend time, no other action needed
                break;
                
            case GameActionType.Inventory:
                // This is handled by InputManager directly, shouldn't reach here
                break;
        }
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