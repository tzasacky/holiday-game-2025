import { ActorComponent } from './ActorComponent';
import { GameEventNames, MovementEvent } from '../core/GameEvents';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { GameScene } from '../scenes/GameScene';
import { CombatComponent } from './CombatComponent';
import { Pathfinding } from '../core/Pathfinding';
import * as ex from 'excalibur';

export enum AIState {
    Wander = 'wander',
    Chase = 'chase',
    Attack = 'attack',
    Idle = 'idle'
}

export interface AIConfig {
    type: string;
    viewDistance?: number;
    aggroRange?: number;
    wanderRange?: number;
}

export class AIComponent extends ActorComponent {
    private state: AIState = AIState.Wander;
    private viewDistance: number = 8;
    private lastKnownPlayerPos: ex.Vector | null = null;
    
    constructor(actor: any, config: AIConfig = { type: 'basic' }) {
        super(actor);
        this.viewDistance = config.viewDistance ?? 8;
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
        if (this.actor.isKilled()) {
            Logger.debug('[AIComponent] Actor is dead, skipping turn');
            // Must spend time to avoid infinite loop in TurnManager
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
        
        if (player) {
            this.updatePlayerAwareness(player);
        } else {
            this.makeDecision(null, scene.level);
        }
    }
    
    private updatePlayerAwareness(player: any): void {
        // Check if can see player
        const dist = this.actor.gridPos.distance(player.gridPos);
        const canSeePlayer = dist <= this.viewDistance;
        
        if (canSeePlayer) {
            this.lastKnownPlayerPos = player.gridPos.clone();
        }
        
        const scene = this.actor.scene as GameScene;
        this.makeDecision(player, scene.level);
    }
    
    private makeDecision(player: any | null, level: any): void {
        const canSeePlayer = player && this.actor.gridPos.distance(player.gridPos) <= this.viewDistance;
        
        // State transitions
        switch (this.state) {
            case AIState.Wander:
                if (canSeePlayer) {
                    this.state = AIState.Chase;
                }
                break;
                
            case AIState.Chase:
                if (!canSeePlayer && !this.lastKnownPlayerPos) {
                    this.state = AIState.Wander;
                }
                break;
        }
        
        // Execute state actions
        switch (this.state) {
            case AIState.Wander:
                this.executeWander(level);
                break;
                
            case AIState.Chase:
                this.executeChase(player, level);
                break;
                
            case AIState.Attack:
                this.executeAttack(player);
                break;
        }
    }
    
    private executeWander(level: any): void {
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
            this.actor.animateMovement(toPos);
            
            // Emit movement event
            EventBus.instance.emit(GameEventNames.Movement, {
                actorId: this.actor.entityId,
                actor: this.actor,
                from: oldPos,
                to: toPos
            });
        }
        
        this.actor.spend(10);
    }
    
    private executeChase(player: any, level: any): void {
        const targetPos = player ? player.gridPos : this.lastKnownPlayerPos;
        
        if (!targetPos) {
            this.state = AIState.Wander;
            this.executeWander(level);
            return;
        }
        
        // Check if adjacent for attack
        const dist = this.actor.gridPos.distance(targetPos);
        if (dist <= 1.5 && player) { // Adjacent and player is visible
            this.state = AIState.Attack;
            this.executeAttack(player);
            return;
        }
        
        // Compute path synchronously
        const path = Pathfinding.findPath(level, this.actor.gridPos, targetPos, { maxDistance: 20 });
        
        if (!path || path.length === 0) {
            // No path found, just wander
            Logger.debug('[AIComponent] No path to player, wandering');
            this.executeWander(level);
            return;
        }
        
        // Move one step toward player
        const nextStep = path[0];
        
        if (level.isWalkable(nextStep.x, nextStep.y, this.actor.entityId)) {
            const oldPos = this.actor.gridPos.clone();
            this.actor.gridPos = nextStep.clone();
            this.actor.animateMovement(nextStep);
            
            // Emit movement event
            EventBus.instance.emit(GameEventNames.Movement, {
                actorId: this.actor.entityId,
                actor: this.actor,
                from: oldPos,
                to: nextStep
            });
        }
        
        this.actor.spend(10);
    }
    
    private executeAttack(player: any): void {
        if (!player) {
             this.actor.spend(10);
             return;
        }
        
        const combat = this.actor.getGameComponent('combat') as CombatComponent;
        if (combat) {
            combat.attack(player.entityId);
        } else {
            Logger.warn(`[AIComponent] Actor ${this.actor.name} tried to attack but has no CombatComponent`);
        }
        
        this.state = AIState.Chase; // Return to chase after attack
        this.actor.spend(10);
    }
}