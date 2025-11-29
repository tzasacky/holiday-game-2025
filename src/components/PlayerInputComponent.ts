import { ActorComponent } from './ActorComponent';
import { InputManager, GameActionType } from '../core/InputManager';
import { GameEventNames, MovementEvent } from '../core/GameEvents';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { Pathfinding } from '../core/Pathfinding';
import { TerrainType } from '../data/terrain';
import { InteractableType } from '../data/interactables';
import * as ex from 'excalibur';
import { Level } from '../dungeon/Level';
import { InteractableEntity } from '../entities/InteractableEntity';
import { CombatComponent } from './CombatComponent';
import { InteractionType } from '../constants/InteractionType';
import { GameScene } from '../scenes/GameScene';
import { LevelManager } from '../core/LevelManager';

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
        // Listen for turns
        this.listen(GameEventNames.ActorTurn, (event) => {
            if (this.isForThisActor(event)) {
                Logger.debug('[PlayerInputComponent] Handling turn for:', this.actor.name);
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
        // Check if we have a path to follow
        if (this.actor.hasPath()) {
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
        // Use LevelManager to get the current level, which is more reliable than actor.scene during transitions
        const level = LevelManager.instance.getCurrentLevel();
        
        if (!level) {
            Logger.warn(`[PlayerInputComponent] HandleTurn: No current level in LevelManager!`);
            // If no level found (e.g. during transition), just return without spending action
            // This prevents infinite loops or crashes during scene switches
            return;
        }

        // 1. Continue existing path if we have one
        if (this.actor.hasPath()) {
            this.followPath(level);
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
     * Follow the current path
     */
    private followPath(level: Level): void {
        const nextStep = this.actor.getNextPathStep();
        
        if (!nextStep) {
            this.actor.clearPath();
            this.actor.spend(10);
            return;
        }

        // Check for interactions at next step
        const interaction = Pathfinding.getInteractionAt(level, nextStep.x, nextStep.y);
        
        if (interaction && interaction !== InteractionType.ActorAttack && interaction !== InteractionType.None) {
            // New entity-based interaction system
            const interactableEntity = level.getInteractableAt(nextStep.x, nextStep.y);
            if (interactableEntity) {
                Logger.info(`[PlayerInputComponent] Interacting with ${interactableEntity.name} at ${nextStep} during pathfinding`);
                
                // Simple interaction during pathfinding - let the interactable handle movement via events
                interactableEntity.interact(this.actor);
                // Clear path after interaction - player will continue on next click
                this.actor.clearPath();
                this.actor.spend(10);
                return;
            }
        }
        
        // Legacy terrain-based door handling removed
        // All doors are now InteractableEntities handled by entity_interact above

        // Check if next step is walkable
        if (!level.isWalkable(nextStep.x, nextStep.y, this.actor.entityId)) {
            Logger.debug('[PlayerInputComponent] Path blocked, clearing');
            this.actor.clearPath();
            this.actor.spend(10);
            return;
        }

        // Move to next step
        const oldPos = this.actor.gridPos.clone();
        this.actor.gridPos = nextStep.clone();
        this.actor.animateMovement(nextStep);
        this.actor.advancePath();

        // Emit movement event for observers (CollisionSystem, UI, etc.)
        EventBus.instance.emit(GameEventNames.Movement, {
            actorId: this.actor.entityId,
            actor: this.actor,
            from: oldPos,
            to: nextStep
        });

        this.actor.spend(10);
    }

    /**
     * Handle click target - compute path or direct move
     */
    private handleClickTarget(clickTarget: ex.Vector, level: Level): PlayerAction {
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
            
            const path = Pathfinding.findPath(level, currentPos, clickTarget);
            
            if (path && path.length > 0) {
                this.actor.setPath(path);
                Logger.debug(`[PlayerInputComponent] Path found, ${path.length} steps`);
                
                // Execute first step immediately
                this.followPath(level);
                return { type: GameActionType.Wait }; // Already handled
            } else {
                Logger.warn('[PlayerInputComponent] No path found to target');
                this.actor.spend(10);
                return { type: GameActionType.Wait };
            }
        }
    }

    /**
     * Process a player action
     */
    private processAction(action: PlayerAction, level: Level): void {
        switch (action.type) {
            case GameActionType.MoveNorth:
            case GameActionType.MoveSouth:
            case GameActionType.MoveEast:
            case GameActionType.MoveWest:
                const direction = action.direction || this.getDirectionFromAction(action.type);
                const toPos = this.actor.gridPos.add(direction);
                
                // Check for interaction before movement
                const interaction = Pathfinding.getInteractionAt(level, toPos.x, toPos.y);
                
                if (interaction && interaction !== InteractionType.ActorAttack && interaction !== InteractionType.None) {
                    // New entity-based interaction system
                    const interactableEntity = level.getInteractableAt(toPos.x, toPos.y);
                    if (interactableEntity) {
                        Logger.info(`[PlayerInputComponent] Interacting with ${interactableEntity.name} at ${toPos}`);
                        
                        // Simple interaction - let the interactable handle movement via events
                        interactableEntity.interact(this.actor);
                        this.actor.spend(10);
                        break;
                    }
                }
                
                // Legacy terrain-based door handling removed
                
                // Check if walkable
                if (level.isWalkable(toPos.x, toPos.y, this.actor.entityId)) {
                    const oldPos = this.actor.gridPos.clone();
                    this.actor.gridPos = toPos.clone();
                    this.actor.animateMovement(toPos);
                    
                    // Emit movement event
                    EventBus.instance.emit(GameEventNames.Movement, {
                        actorId: this.actor.entityId,
                        actor: this.actor,
                        from: oldPos,
                        to: toPos
                    });
                } else {
                    // Check for interaction
                    const interaction = Pathfinding.getInteractionAt(level, toPos.x, toPos.y);
                    if (interaction && interaction !== InteractionType.ActorAttack && interaction !== InteractionType.None) {
                        // New entity-based interaction system
                        const interactableEntity = level.getInteractableAt(toPos.x, toPos.y);
                        if (interactableEntity) {
                            Logger.info(`[PlayerInputComponent] Blocked position - interacting with ${interactableEntity.name} at ${toPos}`);
                            
                            // Special handling for doors - if opened, move through them
                            if (interactableEntity.definition.type === InteractableType.DOOR) {
                                const wasBlocking = interactableEntity.shouldBlockMovement();
                                interactableEntity.interact(this.actor);
                                
                                // If door was blocking but is now open, move through it
                                if (wasBlocking && !interactableEntity.shouldBlockMovement()) {
                                    const oldPos = this.actor.gridPos.clone();
                                    this.actor.gridPos = toPos.clone();
                                    this.actor.animateMovement(toPos);
                                    
                                    // Emit movement event
                                    EventBus.instance.emit(GameEventNames.Movement, {
                                        actorId: this.actor.entityId,
                                        actor: this.actor,
                                        from: oldPos,
                                        to: toPos
                                    });
                                }
                            } else {
                                interactableEntity.interact(this.actor);
                            }
                        }
                    } else if (interaction === InteractionType.ActorAttack) {
                        // Bump-to-attack
                        const blocker = level.getActorAt(toPos.x, toPos.y);
                        if (blocker) {
                            const combat = this.actor.getGameComponent<CombatComponent>('combat');
                            if (combat) {
                                combat.attack(blocker.entityId);
                            }
                        }
                    }
                }
                
                this.actor.spend(10);
                break;
                
            case GameActionType.Wait:
                this.actor.spend(10);
                break;
                
            case GameActionType.Interact:
            case GameActionType.Inventory:
                // Handled elsewhere
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