import { GameActor } from '../components/GameActor';
import { Level } from '../dungeon/Level';
import * as ex from 'excalibur';

/**
 * AI Behavior interface - all behaviors implement this
 * Behaviors are composable and can be mixed/matched per enemy type
 */
export interface AIBehavior {
    /**
     * Execute this behavior for one turn
     * @returns true if behavior completed an action and spent time
     */
    execute(actor: GameActor, level: Level, context: AIContext): boolean;
    
    /**
     * Check if this behavior should be active
     */
    canActivate(actor: GameActor, context: AIContext): boolean;
    
    /**
     * Priority for behavior selection (higher = more important)
     */
    priority: number;
}

/**
 * Context shared across all AI behaviors
 */
export interface AIContext {
    player: GameActor | null;
    canSeePlayer: boolean;
    lastKnownPlayerPos: ex.Vector | null;
    turnsSinceLastSeen: number;
    currentState: string;
}

/**
 * AI Behavior Library - reusable behaviors that can be composed
 */
export class AIBehaviorLibrary {
    /**
     * Spotting Behavior - React to seeing player for first time
     * Costs time to enter alert state
     */
    static Spotting: AIBehavior = {
        priority: 100, // Highest priority
        
        canActivate: (actor, context) => {
            return context.canSeePlayer && 
                   context.currentState !== 'spotting' && 
                   context.currentState !== 'alert' &&
                   context.currentState !== 'chase' &&
                   context.currentState !== 'attack';
        },
        
        execute: (actor, level, context) => {
            context.currentState = 'spotting';
            context.lastKnownPlayerPos = context.player?.gridPos.clone() || null;
            context.turnsSinceLastSeen = 0;
            
            // Spend time to "react" - gives player one free move
            actor.spend(10);
            return true;
        }
    };
    
    /**
     * Alert Behavior - Transition from spotting to active pursuit
     */
    static Alert: AIBehavior = {
        priority: 90,
        
        canActivate: (actor, context) => {
            return context.currentState === 'spotting' && context.canSeePlayer;
        },
        
        execute: (actor, level, context) => {
            context.currentState = 'alert';
            // Don't spend time, just transition state
            return false;
        }
    };
    
    /**
     * Attack Behavior - Attack adjacent enemy
     */
    static Attack: AIBehavior = {
        priority: 80,
        
        canActivate: (actor, context) => {
            if (!context.player) return false;
            // Use Chebyshev distance for 8-way attack range
            const dx = Math.abs(actor.gridPos.x - context.player.gridPos.x);
            const dy = Math.abs(actor.gridPos.y - context.player.gridPos.y);
            const chebyshevDist = Math.max(dx, dy);
            return chebyshevDist <= 1 && context.canSeePlayer;
        },
        
        execute: (actor, level, context) => {
            if (!context.player) return false;
            
            const combat = actor.getGameComponent('combat');
            if (combat) {
                (combat as any).attack(context.player.entityId);
            }
            
            context.currentState = 'attack';
            actor.spend(10);
            return true;
        }
    };
    
    /**
     * Chase Behavior - Move toward player or last known position
     */
    static Chase: AIBehavior = {
        priority: 70,
        
        canActivate: (actor, context) => {
            // Can chase from alert, chase, or attack states
            // This is key - after attacking, if player moves away, we should chase!
            const canChaseFromState = context.currentState === 'alert' || 
                                      context.currentState === 'chase' ||
                                      context.currentState === 'attack';
            return canChaseFromState && (context.canSeePlayer || context.lastKnownPlayerPos !== null);
        },
        
        execute: (actor, level, context) => {
            // Update state to chase
            context.currentState = 'chase';
            // Actual movement handled by AIComponent.executeMovement()
            return false;
        }
    };
    
    /**
     * Search Behavior - Look for player at last known position
     */
    static Search: AIBehavior = {
        priority: 60,
        
        canActivate: (actor, context) => {
            return !context.canSeePlayer && 
                   context.lastKnownPlayerPos !== null &&
                   context.turnsSinceLastSeen < 5;
        },
        
        execute: (actor, level, context) => {
            context.currentState = 'search';
            context.turnsSinceLastSeen++;
            
            if (context.turnsSinceLastSeen >= 5) {
                // Give up search
                context.currentState = 'wander';
                context.lastKnownPlayerPos = null;
            }
            
            // Continue moving toward last known position
            // Movement logic in AIComponent
            return false;
        }
    };
    
    /**
     * Wander Behavior - Random movement when idle
     */
    static Wander: AIBehavior = {
        priority: 10, // Lowest priority
        
        canActivate: (actor, context) => {
            return context.currentState === 'wander' || context.currentState === 'idle';
        },
        
        execute: (actor, level, context) => {
            // Implementation in AIComponent
            return false;
        }
    };
}

/**
 * AI Behavior Composition - defines enemy AI patterns
 */
export interface AIBehaviorComposition {
    behaviors: AIBehavior[];
    name: string;
}

/**
 * Predefined AI compositions for different enemy types
 */
export const AICompositions = {
    /**
     * Default: Standard alert-chase-attack pattern
     */
    Default: {
        name: 'Default',
        behaviors: [
            AIBehaviorLibrary.Spotting,
            AIBehaviorLibrary.Alert,
            AIBehaviorLibrary.Attack,
            AIBehaviorLibrary.Chase,
            AIBehaviorLibrary.Search,
            AIBehaviorLibrary.Wander
        ]
    },
    
    /**
     * Aggressive: Immediate attack, no spotting delay
     * For bosses or special enemies
     */
    Aggressive: {
        name: 'Aggressive',
        behaviors: [
            // Skip spotting, go straight to attack
            AIBehaviorLibrary.Attack,
            AIBehaviorLibrary.Chase,
            AIBehaviorLibrary.Wander
        ]
    },
    
    /**
     * Cautious: Longer search, returns to patrol
     */
    Cautious: {
        name: 'Cautious',
        behaviors: [
            AIBehaviorLibrary.Spotting,
            AIBehaviorLibrary.Alert,
            AIBehaviorLibrary.Attack,
            AIBehaviorLibrary.Chase,
            AIBehaviorLibrary.Search,
            AIBehaviorLibrary.Wander
        ]
    },
    
    // More compositions can be added here:
    // - Cowardly: Runs away when low HP
    // - Territorial: Only chases within certain area
    
    /**
     * Territorial: Miniboss that guards a specific area/room
     */
    Territorial: {
        name: 'Territorial',
        behaviors: [
            AIBehaviorLibrary.Spotting,
            AIBehaviorLibrary.Alert,
            AIBehaviorLibrary.Attack,
            // Custom territorial chase behavior (stays in room)
            {
                priority: 65, // Between Chase and Search
                canActivate: (actor: GameActor, context: AIContext): boolean => {
                    const isInState = context.currentState === 'alert' || 
                                     context.currentState === 'chase' ||
                                     context.currentState === 'attack';
                    return isInState && (context.canSeePlayer || context.lastKnownPlayerPos !== null);
                },
                execute: (actor: GameActor, level: Level, context: AIContext): boolean => {
                    // Only chase if player is in same room or adjacent
                    // Note: getRoomAtPosition needs to be added to Level class
                    const actorRoom = (level as any).getRoomAtPosition?.(actor.gridPos);
                    const playerRoom = context.player ? (level as any).getRoomAtPosition?.(context.player.gridPos) : null;
                    
                    // If player left the room, return to patrol/wander
                    if (actorRoom && playerRoom && actorRoom.id !== playerRoom.id) {
                        context.currentState = 'wander';
                        context.lastKnownPlayerPos = null;
                        return false;
                    }
                    
                    // Otherwise, normal chase behavior
                    context.currentState = 'chase';
                    return false;
                }
            },
            AIBehaviorLibrary.Search,
            AIBehaviorLibrary.Wander
        ]
    }
};
