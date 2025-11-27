import { ActorComponent } from './ActorComponent';
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
    private wanderTarget: ex.Vector | null = null;
    private idleTurns: number = 0;
    
    constructor(actor: any, config: AIConfig = { type: 'basic' }) {
        super(actor);
        this.viewDistance = config.viewDistance ?? 8;
    }
    
    protected setupEventListeners(): void {
        // Listen for turns
        this.listen('actor:turn', (event) => {
            if (this.isForThisActor(event)) {
                this.handleTurn();
            }
        });
        
        // Listen for level/scene updates to get player position
        this.listen('level:actor_positions', (event) => {
            this.updatePlayerAwareness(event.actors);
        });
    }
    
    private async handleTurn(): Promise<void> {
        // Request current level state
        this.emit('level:get_actors', {
            requesterId: this.actor.entityId,
            responseEvent: 'level:actor_positions'
        });
        
        // AI decision will be made in updatePlayerAwareness
    }
    
    private updatePlayerAwareness(actors: any[]): void {
        // Find player
        const player = actors.find((a: any) => a.isPlayer);
        if (!player) {
            this.makeDecision(null);
            return;
        }
        
        // Check if can see player
        const dist = this.actor.gridPos.distance(player.gridPos);
        const canSeePlayer = dist <= this.viewDistance && this.hasLineOfSight(player);
        
        if (canSeePlayer) {
            this.lastKnownPlayerPos = player.gridPos.clone();
        }
        
        this.makeDecision(player);
    }
    
    private makeDecision(player: any | null): void {
        const canSeePlayer = player && this.actor.gridPos.distance(player.gridPos) <= this.viewDistance;
        
        // State transitions
        switch (this.state) {
            case AIState.Wander:
                if (canSeePlayer) {
                    this.state = AIState.Chase;
                    this.wanderTarget = null;
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
                this.executeWander();
                break;
                
            case AIState.Chase:
                this.executeChase(player);
                break;
                
            case AIState.Attack:
                this.executeAttack(player);
                break;
        }
        
        // Spend turn time
        this.emit('actor:spend_time', {
            actorId: this.actor.entityId,
            time: 10
        });
    }
    
    private executeWander(): void {
        // Simple random movement
        const directions = [
            ex.vec(0, 1), ex.vec(0, -1), 
            ex.vec(1, 0), ex.vec(-1, 0)
        ];
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        
        this.emit('movement:request', {
            actorId: this.actor.entityId,
            direction: randomDir
        });
    }
    
    private executeChase(player: any): void {
        if (!player) return;
        
        // Check if adjacent for attack
        const dist = this.actor.gridPos.distance(player.gridPos);
        if (dist <= 1.5) { // Adjacent
            this.state = AIState.Attack;
            this.executeAttack(player);
            return;
        }
        
        // Move toward player
        const direction = player.gridPos.sub(this.actor.gridPos).normalize();
        const moveDir = ex.vec(
            Math.round(direction.x),
            Math.round(direction.y)
        );
        
        this.emit('movement:request', {
            actorId: this.actor.entityId,
            direction: moveDir
        });
    }
    
    private executeAttack(player: any): void {
        if (!player) return;
        
        this.emit('combat:attack', {
            attackerId: this.actor.entityId,
            targetId: player.entityId
        });
        
        this.state = AIState.Chase; // Return to chase after attack
    }
    
    private hasLineOfSight(target: any): boolean {
        // TODO: Implement proper line of sight
        // For now, just return true within view distance
        return true;
    }
}