import { ActorComponent } from './ActorComponent';
import { GameEventNames, MovementEvent } from '../core/GameEvents';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { GameScene } from '../scenes/GameScene';
import { CombatComponent } from './CombatComponent';
import { Pathfinding } from '../core/Pathfinding';
import { VisibilitySystem } from '../core/Visibility';
import { AIContext, AIBehavior, AICompositions, AIBehaviorComposition } from '../ai/AIBehaviors';
import * as ex from 'excalibur';

export enum AIState {
    Wander = 'wander',
    Spotting = 'spotting',
    Alert = 'alert',
    Chase = 'chase',
    Attack = 'attack',
    Search = 'search',
    Idle = 'idle'
}

export interface AIConfig {
    type: string;
    viewDistance?: number;
    aggroRange?: number;
    wanderRange?: number;
    behaviorComposition?: string; // 'Default', 'Aggressive', 'Cautious', etc.
}

export class AIComponent extends ActorComponent {
    private state: AIState = AIState.Wander;
    private viewDistance: number = 8;
    private lastKnownPlayerPos: ex.Vector | null = null;
    private turnsSinceLastSeen: number = 0;
    private behaviorComposition: AIBehaviorComposition;
    private context: AIContext;
    
    constructor(actor: any, config: AIConfig = { type: 'basic' }) {
        super(actor);
        this.viewDistance = config.viewDistance ?? 8;
        
        // Select behavior composition
        const compositionName = config.behaviorComposition || 'Default';
        this.behaviorComposition = (AICompositions as any)[compositionName] || AICompositions.Default;
        
        // Initialize AI context
        this.context = {
            player: null,
            canSeePlayer: false,
            lastKnownPlayerPos: null,
            turnsSinceLastSeen: 0,
            currentState: this.state
        };
    }
    
    protected setupEventListeners(): void {
        // Listen for turns
        this.listen(GameEventNames.ActorTurn, (event) => {
            if (this.isForThisActor(event)) {
                Logger.debug('[AIComponent] Handling turn for:', this.actor.name);
                this.handleTurn();
            }
        });
    }
    
    private handleTurn(): void {
        if (this.actor.isKilled() || this.actor.isDead) {
            Logger.debug('[AIComponent] Actor is dead, skipping turn');
            this.actor.spend(10);
            return;
        }

        // Get level from scene
        const scene = this.actor.scene as GameScene;
        if (!scene || !scene.level) {
            Logger.warn('[AIComponent] No level found, skipping turn');
            this.actor.spend(10);
            return;
        }
        
        // Find player
        const player = scene.level.actors.find(a => a.isPlayer);
        
        // Update visibility context
        this.updateContext(player, scene);
        
        // Execute behavior composition
        this.executeBehaviors(scene.level);
    }
    
    private updateContext(player: any, scene: GameScene): void {
        this.context.player = player || null;
        this.context.currentState = this.state;
        this.context.lastKnownPlayerPos = this.lastKnownPlayerPos;
        this.context.turnsSinceLastSeen = this.turnsSinceLastSeen;
        
        // Check line-of-sight using VisibilitySystem
        if (player && scene) {
            this.context.canSeePlayer = VisibilitySystem.instance.canSee(this.actor, player, scene);
            
            // Update last known position if we can see them
            if (this.context.canSeePlayer) {
                this.lastKnownPlayerPos = player.gridPos.clone();
                this.turnsSinceLastSeen = 0;
            } else if (this.lastKnownPlayerPos) {
                this.turnsSinceLastSeen++;
            }
        } else {
            this.context.canSeePlayer = false;
        }
    }
    
    private executeBehaviors(level: any): void {
        // Sort behaviors by priority
        const sortedBehaviors = [...this.behaviorComposition.behaviors].sort((a, b) => b.priority - a.priority);
        
        // Find first behavior that can activate
        for (const behavior of sortedBehaviors) {
            if (behavior.canActivate(this.actor, this.context)) {
                const acted = behavior.execute(this.actor, level, this.context);
                
                // Update state from context
                this.state = this.context.currentState as AIState;
                this.lastKnownPlayerPos = this.context.lastKnownPlayerPos;
                this.turnsSinceLastSeen = this.context.turnsSinceLastSeen;
                
                // If behavior spent time, we're done this turn
                if (acted) {
                    return;
                }
                
                // Otherwise, try to execute movement for chase/search/wander
                if (this.executeMovement(level)) {
                    return;
                }
            }
        }
        
        // Fallback: spend time even if no behavior activated
        this.actor.spend(10);
    }
    
    private executeMovement(level: any): boolean {
        switch (this.state) {
            case AIState.Wander:
                return this.executeWander(level);
                
            case AIState.Chase:
            case AIState.Alert:
                return this.executeChase(this.context.player, level);
                
            case AIState.Search:
                return this.executeSearch(level);
                
            default:
                return false;
        }
    }
    
    private executeWander(level: any): boolean {
        // Simple random movement
        const directions = [
            ex.vec(0, 1), ex.vec(0, -1), 
            ex.vec(1, 0), ex.vec(-1, 0)
        ];
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        
        const toPos = this.actor.gridPos.add(randomDir);
        
        // Try to move
        if (level.isWalkable(toPos.x, toPos.y, this.actor.entityId)) {
            const oldPos = this.actor.gridPos.clone();
            this.actor.gridPos = toPos.clone();
            this.actor.animateMovement(toPos, oldPos);
            
            // Emit movement event
            EventBus.instance.emit(GameEventNames.Movement, {
                actorId: this.actor.entityId,
                actor: this.actor,
                from: oldPos,
                to: toPos
            });
        }
        
        this.actor.spend(10);
        return true;
    }
    
    private executeChase(player: any, level: any): boolean {
        const targetPos = player ? player.gridPos : this.lastKnownPlayerPos;
        
        if (!targetPos) {
            this.state = AIState.Wander;
            return this.executeWander(level);
        }
        
        // Check if adjacent for attack BEFORE moving
        const dist = this.actor.gridPos.distance(targetPos);
        if (dist <= 1 && player && this.context.canSeePlayer) {
            // Adjacent - attack next turn (behavior will handle it)
            return false;
        }
        
        // Not adjacent, so MOVE ONLY
        const path = Pathfinding.findPath(level, this.actor.gridPos, targetPos, { maxDistance: 20 });
        
        if (!path || path.length === 0) {
            Logger.debug('[AIComponent] No path to target, wandering');
            return this.executeWander(level);
        }
        
        // Move one step toward target
        const nextStep = path[0];
        
        if (level.isWalkable(nextStep.x, nextStep.y, this.actor.entityId)) {
            const oldPos = this.actor.gridPos.clone();
            this.actor.gridPos = nextStep.clone();
            this.actor.animateMovement(nextStep, oldPos);
            
            // Emit movement event
            EventBus.instance.emit(GameEventNames.Movement, {
                actorId: this.actor.entityId,
                actor: this.actor,
                from: oldPos,
                to: nextStep
            });
        }
        
        this.actor.spend(10);
        return true;
    }
    
    private executeSearch(level: any): boolean {
        if (!this.lastKnownPlayerPos) {
            this.state = AIState.Wander;
            return false;
        }
        
        // Move toward last known position
        const dist = this.actor.gridPos.distance(this.lastKnownPlayerPos);
        
        // If reached last known position, give up
        if (dist <= 1) {
            Logger.debug(`[AIComponent] ${this.actor.name} reached last known position, giving up search`);
            this.state = AIState.Wander;
            this.lastKnownPlayerPos = null;
            return false;
        }
        
        // Try to path to last known position
        const path = Pathfinding.findPath(level, this.actor.gridPos, this.lastKnownPlayerPos, { maxDistance: 20 });
        
        if (!path || path.length === 0) {
            // Can't reach, give up
            this.state = AIState.Wander;
            this.lastKnownPlayerPos = null;
            return false;
        }
        
        // Move one step
        const nextStep = path[0];
        if (level.isWalkable(nextStep.x, nextStep.y, this.actor.entityId)) {
            const oldPos = this.actor.gridPos.clone();
            this.actor.gridPos = nextStep.clone();
            this.actor.animateMovement(nextStep, oldPos);
            
            EventBus.instance.emit(GameEventNames.Movement, {
                actorId: this.actor.entityId,
                actor: this.actor,
                from: oldPos,
                to: nextStep
            });
        }
        
        this.actor.spend(10);
        return true;
    }
}