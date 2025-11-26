import * as ex from 'excalibur';
import { Actor } from './Actor';
import { GameScene } from '../scenes/GameScene';
import { Logger } from '../core/Logger';
import { Pathfinding } from '../core/Pathfinding';

export enum AIState {
    Idle = 'idle',
    Wander = 'wander',
    Chase = 'chase',
    Attack = 'attack'
}

export class Mob extends Actor {
    public state: AIState = AIState.Wander;
    public viewDistance: number = 8;
    public lastKnownPlayerPos: ex.Vector | null = null;
    private wanderTarget: ex.Vector | null = null;
    private idleTurns: number = 0;

    constructor(gridPos: ex.Vector, maxHp: number, config?: ex.ActorArgs) {
        super(gridPos, maxHp, config);
    }

    public async act(): Promise<boolean> {
        Logger.debug("[Mob] act() called for", this.name);
        if (!this.scene || !(this.scene as GameScene).level) {
            Logger.debug("[Mob] No scene or level, returning false");
            return false;
        }
        if (this.moving) {
            Logger.debug("[Mob] Currently moving, skipping turn");
            return false; // Skip turn if already moving
        }
        const level = (this.scene as GameScene).level!;

        const hero = level.actors.find((a: Actor) => a.isPlayer);
        if (!hero) return false;

        const dist = this.gridPos.distance(hero.gridPos);
        const canSeeHero = dist <= this.viewDistance && this.hasLineOfSight(hero);

        // Update last known position if we can see the hero
        if (canSeeHero) {
            this.lastKnownPlayerPos = hero.gridPos.clone();
        }

        // State transitions
        switch (this.state) {
            case AIState.Wander:
                if (canSeeHero) {
                    this.state = AIState.Chase;
                    this.clearPath(); // Clear wander path
                }
                break;
                
            case AIState.Chase:
                if (!canSeeHero && !this.lastKnownPlayerPos) {
                    this.state = AIState.Wander;
                    this.wanderTarget = null;
                    this.clearPath();
                } else if (dist <= 1.5) { // Adjacent
                    this.state = AIState.Attack;
                }
                break;
                
            case AIState.Attack:
                if (dist > 1.5) {
                    this.state = canSeeHero ? AIState.Chase : AIState.Wander;
                }
                break;
        }

        // Execute state actions
        await this.executeStateAction(hero, dist);
        
        // Spend time for this action
        this.spend(1.0);
        
        return true;
    }

    private async executeStateAction(hero: Actor, dist: number): Promise<void> {
        switch (this.state) {
            case AIState.Wander:
                await this.handleWander();
                break;
                
            case AIState.Chase:
                await this.handleChase(hero);
                break;
                
            case AIState.Attack:
                this.attack(hero);
                break;
                
            case AIState.Idle:
                this.idleTurns++;
                if (this.idleTurns > 2) { // Idle for 2 turns then wander
                    this.state = AIState.Wander;
                    this.idleTurns = 0;
                }
                break;
        }
    }

    private async handleWander(): Promise<void> {
        // If no current target or reached target, pick a new one
        if (!this.wanderTarget || this.gridPos.distance(this.wanderTarget) < 1.5) {
            this.pickNewWanderTarget();
        }

        // Move towards wander target
        if (this.wanderTarget) {
            await this.moveTowardsTarget(this.wanderTarget);
        }
    }

    private async handleChase(hero: Actor): Promise<void> {
        const targetPos = this.lastKnownPlayerPos || hero.gridPos;
        
        // If we reached the last known position but don't see the hero, start wandering
        if (this.gridPos.distance(targetPos) < 1.5 && !this.hasLineOfSight(hero)) {
            this.lastKnownPlayerPos = null;
            this.state = AIState.Wander;
            return;
        }

        await this.moveTowardsTarget(targetPos);
    }

    private async moveTowardsTarget(target: ex.Vector): Promise<void> {
        // Use pathfinding if we don't have a current path or target changed significantly
        if (!this.hasPath()) {
        if (!this.hasPath()) {
            this.findPathTo(target.x, target.y);
            // currentPath is set by findPathTo
        }
        }

        // Move along path
        const nextStep = this.getNextPathStep();
        if (nextStep) {
            const success = await this.moveToPosition(nextStep);
            if (success) {
                this.advancePath();
            } else {
                // Path blocked, recalculate
                this.clearPath();
            }
        }
    }

    private async moveToPosition(targetPos: ex.Vector): Promise<boolean> {
        if (!this.scene || !(this.scene as GameScene).level) return false;
        const level = (this.scene as GameScene).level!;

        // Check if position is valid
        const tile = level.objectMap.getTile(targetPos.x, targetPos.y);
        if (!tile || tile.solid) {
            return false;
        }

        // Check for other actors at target position
        const occupant = level.actors.find((a: Actor) => 
            a !== this && Math.abs(a.gridPos.x - targetPos.x) < 0.5 && Math.abs(a.gridPos.y - targetPos.y) < 0.5
        );
        if (occupant) {
            return false;
        }

        // Update position instantly for game logic
        this.gridPos = targetPos;
        
        // Trigger animation (non-blocking) - uses shared Actor animation system
        this.animateMovement(targetPos);
        
        return true;
    }

    private pickNewWanderTarget(): void {
        if (!this.scene || !(this.scene as GameScene).level) return;
        const level = (this.scene as GameScene).level!;

        // Pick a random point within a reasonable distance
        const range = 5;
        let attempts = 0;
        
        while (attempts < 10) {
            const dx = Math.floor(Math.random() * range * 2) - range;
            const dy = Math.floor(Math.random() * range * 2) - range;
            const target = this.gridPos.add(ex.vec(dx, dy));
            
            // Check bounds
            if (target.x >= 0 && target.x < level.width && target.y >= 0 && target.y < level.height) {
                const tile = level.objectMap.getTile(target.x, target.y);
                if (tile && !tile.solid) {
                    this.wanderTarget = target;
                    return;
                }
            }
            attempts++;
        }
        
        // Fallback: stay idle for a bit
        this.state = AIState.Idle;
    }
    private hasLineOfSight(target: Actor): boolean {
        if (!this.scene || !(this.scene as GameScene).level) return false;
        const level = (this.scene as GameScene).level!;
        
        // Simple raycast or Bresenham's line algorithm check against level.getTile(x, y).solid
        // For now, just distance check is already done by caller.
        // Let's implement a simple check:
        
        const start = this.gridPos;
        const end = target.gridPos;
        
        // If distance is small, assume yes
        if (start.distance(end) < 1.5) return true;
        
        // TODO: Implement proper raycast
        return true; 
    }
}
