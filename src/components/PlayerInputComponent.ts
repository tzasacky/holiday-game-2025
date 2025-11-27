import { ActorComponent } from './ActorComponent';
import { InputManager, GameActionType } from '../core/InputManager';

export class PlayerInputComponent extends ActorComponent {
    private inputManager!: InputManager;
    private actionQueue: GameActionType[] = [];
    
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
                this.queueAction(event.action);
            }
        });
    }
    
    queueAction(action: GameActionType): void {
        this.actionQueue.push(action);
    }
    
    private async handleTurn(): Promise<void> {
        // Check for queued actions first
        let action = this.actionQueue.shift();
        
        // If no queued action, get from input manager
        if (!action) {
            action = this.inputManager.getNextAction();
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
    
    private processAction(action: GameActionType): void {
        switch (action.type) {
            case 'move':
                this.emit('movement:request', {
                    actorId: this.actor.entityId,
                    direction: action.direction
                });
                break;
                
            case 'attack':
                this.emit('combat:attack', {
                    attackerId: this.actor.entityId,
                    targetId: action.targetId
                });
                break;
                
            case 'interact':
                this.emit('interaction:request', {
                    actorId: this.actor.entityId,
                    targetId: action.targetId
                });
                break;
                
            case 'use_item':
                this.emit('inventory:use_item', {
                    actorId: this.actor.entityId,
                    itemId: action.itemId
                });
                break;
                
            case 'wait':
                // Just spend time, no other action needed
                break;
        }
    }
}