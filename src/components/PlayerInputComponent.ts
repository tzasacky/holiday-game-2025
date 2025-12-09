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
import { DamageType } from '../data/mechanics';
import { InteractionType } from '../constants/InteractionType';
import { GameScene } from '../scenes/GameScene';
import { LevelManager } from '../core/LevelManager';
import { TurnManager } from '../core/TurnManager';

export interface PlayerAction {
    type: GameActionType;
    direction?: ex.Vector;
    targetId?: string;
    itemId?: string;
}

export class PlayerInputComponent extends ActorComponent {
    private inputManager!: InputManager;
    private actionQueue: PlayerAction[] = [];
    private isAnimating: boolean = false;
    
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
        // CRITICAL: Block new actions while animation is playing
        if (this.isAnimating) {
            Logger.debug('[PlayerInputComponent] Ignoring input - animation in progress');
            return;
        }
        
        // Only allow one action in queue at a time to prevent stacking
        if (this.actionQueue.length > 0) {
            Logger.debug('[PlayerInputComponent] Ignoring input - action already queued');
            return;
        }
        
        const action: PlayerAction = {
            type: actionType,
            direction: this.getDirectionFromAction(actionType)
        };
        this.actionQueue.push(action);
    }
    
    public hasPendingAction(): boolean {
        // If currently animating, tell TurnManager we're not ready
        // This prevents the turn loop from spinning on us
        if (this.isAnimating) {
            return false;
        }
        
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
        // Use LevelManager to get the current level
        const level = LevelManager.instance.getCurrentLevel();
        
        if (!level) {
            Logger.warn(`[PlayerInputComponent] HandleTurn: No current level in LevelManager!`);
            return;
        }

        // If animating, don't process any new input or actions
        // But path continuation is handled via setTimeout, not handleTurn
        if (this.isAnimating) {
            Logger.debug('[PlayerInputComponent] Skipping turn - animation in progress');
            // Don't spend - the animation timeout will call spend when ready
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
     * Follow the current path - executes one step and schedules the next
     * This bypasses processAction to maintain proper animation sequencing
     */
    private followPath(level: Level): void {
        const nextStep = this.actor.getNextPathStep();
        
        if (!nextStep) {
            this.actor.clearPath();
            this.actor.spend(10);
            return;
        }

        // Check for interactions at next step that should stop pathfinding
        const interaction = Pathfinding.getInteractionAt(level, nextStep.x, nextStep.y);
        
        if (interaction === InteractionType.DoorOpen || 
            interaction === InteractionType.DoorLocked ||
            interaction === InteractionType.ActorAttack) {
            
            if (interaction === InteractionType.DoorOpen || interaction === InteractionType.DoorLocked) {
                const interactableEntity = level.getInteractableAt(nextStep.x, nextStep.y);
                if (interactableEntity) {
                    Logger.info(`[PlayerInputComponent] Interacting with ${interactableEntity.name} at ${nextStep} during pathfinding`);
                    interactableEntity.interact(this.actor);
                }
            }
            this.actor.clearPath();
            this.actor.spend(10);
            return;
        }

        // Check if next step is walkable
        if (!level.isWalkable(nextStep.x, nextStep.y, this.actor.entityId)) {
            Logger.debug('[PlayerInputComponent] Path blocked, clearing');
            this.actor.clearPath();
            this.actor.spend(10);
            return;
        }

        // Execute the move directly
        this.isAnimating = true;
        const oldPos = this.actor.gridPos.clone();
        this.actor.gridPos = nextStep.clone();
        this.actor.animateMovement(nextStep, oldPos);
        this.actor.advancePath();

        // Emit movement event
        EventBus.instance.emit(GameEventNames.Movement, {
            actorId: this.actor.entityId,
            actor: this.actor,
            from: oldPos,
            to: nextStep
        });

        // CRITICAL: Spend time IMMEDIATELY so enemies can act while we animate
        // If we wait until after animation, TurnManager will stop processing when
        // player returns false (due to isAnimating), and enemies won't get turns.
        this.actor.spend(10);

        // After animation completes, clear animating flag and wake up TurnManager
        // to continue processing (player gets another turn if they have more path)
        const animationDuration = 250;
        setTimeout(() => {
            this.isAnimating = false;
            // Wake up TurnManager to continue processing
            TurnManager.instance.processTurns();
        }, animationDuration);
    }
    /**
     * Handle click target - compute path or direct move
     */
    private handleClickTarget(clickTarget: ex.Vector, level: Level): PlayerAction {
        const currentPos = this.actor.gridPos;
        const dx = clickTarget.x - currentPos.x;
        const dy = clickTarget.y - currentPos.y;
        const manhattanDist = Math.abs(dx) + Math.abs(dy);
        
        if (manhattanDist === 1) {
            // Cardinal adjacent click - direct movement
            const gridDir = ex.vec(dx, dy);
            
            return {
                type: GameActionType.MoveNorth, // Placeholder
                direction: gridDir
            };
        } else if (manhattanDist === 0) {
            // Clicked on self - wait
            return { type: GameActionType.Wait };
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
                // Log tile info to help debug invisible obstacles
                const terrain = level.getTile(clickTarget.x, clickTarget.y);
                const actor = level.getActorAt(clickTarget.x, clickTarget.y);
                const interactable = level.getInteractableAt(clickTarget.x, clickTarget.y);
                const decor = level.getDecorAt(clickTarget.x, clickTarget.y);
                const isProtected = level.isProtectedTile(clickTarget.x, clickTarget.y);
                
                Logger.info(`[Tile Info] Clicked (${clickTarget.x},${clickTarget.y}): ` +
                    `terrain=${terrain}, ` +
                    `actor=${actor?.name || 'none'}, ` +
                    `interactable=${interactable?.name || 'none'}, ` +
                    `decor=[${decor.map(d => d.decorId).join(',')}], ` +
                    `protected=${isProtected}`);
                
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
                    this.actor.animateMovement(toPos, oldPos);  // Pass old position
                    
                    // Emit movement event
                    EventBus.instance.emit(GameEventNames.Movement, {
                        actorId: this.actor.entityId,
                        actor: this.actor,
                        from: oldPos,
                        to: toPos
                    });

                    // Check for "stepped on" interactions
                    const steppedOnInteractable = level.getInteractableAt(toPos.x, toPos.y);
                    if (steppedOnInteractable) {
                        const type = steppedOnInteractable.interactableDefinition.type;
                        
                        if (type === InteractableType.Chasm) {
                            Logger.info(`[PlayerInputComponent] Stepped on Chasm! Falling...`);
                            // Fall logic: Damage and respawn at entrance? Or game over?
                            // For now, just log and maybe damage
                            const combat = this.actor.getGameComponent<CombatComponent>('combat');
                            if (combat) combat.takeDamage(10, DamageType.Physical); // Fall damage
                            EventBus.instance.emit(GameEventNames.Message, { message: "You fall into the chasm!", type: 'danger' });
                        } else if (type === InteractableType.Ice) {
                            // Crack ice
                            Logger.info(`[PlayerInputComponent] Stepped on Thin Ice`);
                            steppedOnInteractable.takeDamage(10, this.actor); // Break it
                            EventBus.instance.emit(GameEventNames.Message, { message: "The ice cracks beneath your feet!", type: 'warning' });
                        } else if (type === InteractableType.SlipperyIce) {
                            // Slide logic: Queue another move in the same direction
                            Logger.info(`[PlayerInputComponent] Stepped on Slippery Ice - Sliding!`);
                            EventBus.instance.emit(GameEventNames.Message, { message: "You slide on the ice!", type: 'info' });
                            
                            // Determine slide direction from movement
                            const slideDir = toPos.sub(oldPos);
                            if (slideDir.x !== 0 || slideDir.y !== 0) {
                                let slideActionType = GameActionType.Wait;
                                if (slideDir.x > 0) slideActionType = GameActionType.MoveEast;
                                else if (slideDir.x < 0) slideActionType = GameActionType.MoveWest;
                                else if (slideDir.y > 0) slideActionType = GameActionType.MoveSouth;
                                else if (slideDir.y < 0) slideActionType = GameActionType.MoveNorth;
                                
                                this.actionQueue.unshift({ type: slideActionType });
                            }
                        } else if (type === InteractableType.Portal) {
                            // Stairs - trigger interaction immediately when stepped on
                            Logger.info(`[PlayerInputComponent] Stepped on stairs - triggering transition`);
                            steppedOnInteractable.interact(this.actor);
                        }
                    }

                    // CRITICAL: Spend time IMMEDIATELY so enemies can act during animation
                    this.actor.spend(10);
                    
                    // Set animating flag and wake up TurnManager after animation
                    this.isAnimating = true;
                    const animationDuration = 250;
                    setTimeout(() => {
                        this.isAnimating = false;
                        TurnManager.instance.processTurns();
                    }, animationDuration);
                    return; // Exit early

                } else {
                    // Check for interaction
                    const interaction = Pathfinding.getInteractionAt(level, toPos.x, toPos.y);
                    if (interaction && interaction !== InteractionType.ActorAttack && interaction !== InteractionType.None) {
                        // New entity-based interaction system
                        const interactableEntity = level.getInteractableAt(toPos.x, toPos.y);
                        if (interactableEntity) {
                            Logger.info(`[PlayerInputComponent] Blocked position - interacting with ${interactableEntity.name} at ${toPos}`);
                            interactableEntity.interact(this.actor);
                        }
                    } else if (interaction === InteractionType.ActorAttack) {
                        // Bump-to-attack using interaction system
                        const blocker = level.getActorAt(toPos.x, toPos.y);
                        if (blocker && blocker.canInteract && blocker.canInteract(this.actor)) {
                            blocker.interact(this.actor);
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