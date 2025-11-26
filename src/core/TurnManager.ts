import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';
import { PriorityQueue } from './PriorityQueue';
import { Logger } from './Logger';
import { EventBus } from './EventBus';
import { GameEventNames, DieEvent } from './GameEvents';

/**
 * TurnManager - Manages turn-based game loop using priority queue
 * Works with GameActor's time-based system
 */
export class TurnManager {
    private static _instance: TurnManager;
    private actors: PriorityQueue<GameActor> = new PriorityQueue<GameActor>();
    
    // Time System
    public static now: number = 0;

    private constructor() {}

    public static get instance(): TurnManager {
        if (!this._instance) {
            this._instance = new TurnManager();
            this._instance.initialize();
        }
        return this._instance;
    }

    private initialize() {
        EventBus.instance.on(GameEventNames.Death, (event: DieEvent) => {
            Logger.info(`[TurnManager] Handling death for ${event.actor.name}`);
            this.unregisterActor(event.actor);
        });
    }

    public registerActor(actor: GameActor) {
        // We can't easily check existence in heap without O(N) scan, 
        // but register is rare.
        // For now, just push. If we need strict uniqueness, we can maintain a Set alongside.
        actor.time = TurnManager.now;
        this.actors.push(actor);
    }

    public unregisterActor(actor: GameActor) {
        this.actors.remove(actor);
    }

    public async processTurns() {
        Logger.debug("[TurnManager] processTurns starting, actors count:", this.actors.length);
        let processing = true;
        
        // Safety break to prevent infinite loops in a single frame
        let loops = 0;
        const MAX_LOOPS = 100; 

        while (processing && loops < MAX_LOOPS) {
            if (this.actors.length === 0) {
                Logger.debug("[TurnManager] No actors, breaking");
                break;
            }

            // Peek at the next actor
            const currentActor = this.actors.peek();
            if (!currentActor) {
                Logger.debug("[TurnManager] No current actor, breaking");
                break;
            }
            
            Logger.debug("[TurnManager] Processing actor:", currentActor.name, "isPlayer:", currentActor.isPlayer, "time:", currentActor.time);
            
            // Advance game time
            if (currentActor.time > TurnManager.now) {
                TurnManager.now = currentActor.time;
            }

            // Act
            // If act() returns false, it means the actor is waiting (e.g. Player input)
            // and we should stop processing until they are ready.
            const didAct = await currentActor.act();
            Logger.debug("[TurnManager] Actor", currentActor.name, "didAct:", didAct);
            
            if (!didAct) {
                // Only stop processing if it's the PLAYER waiting for input
                if (currentActor.isPlayer) {
                    Logger.debug("[TurnManager] Player waiting for input, stopping processing");
                    processing = false;
                } else {
                    // Non-player actors that can't act should skip their turn with a small time penalty
                    Logger.debug("[TurnManager] Mob", currentActor.name, "can't act, skipping turn with time penalty");
                    currentActor.time += 0.1; // Small time penalty to prevent infinite loops
                    this.actors.pop();
                    this.actors.push(currentActor);
                    loops++;
                }
            } else {
                // Actor acted, they should have updated their time.
                // We need to re-insert them into the priority queue to update their position
                // Pop and Push is the cleanest way since their key (time) changed
                this.actors.pop(); 
                this.actors.push(currentActor);
                
                loops++;
            }
        }
        Logger.debug("[TurnManager] processTurns finished");
    }
    
    // Helper for GameActor to access time
    public static getTime(): number {
        return this.now;
    }
    
    public getActorCount(): number {
        return this.actors.length;
    }
    
    public get isPlayerTurnActive(): boolean {
        if (this.actors.length === 0) return false;
        const current = this.actors.peek();
        // Player's turn is active when they are the next to act (lowest time)
        return !!(current && current.isPlayer);
    }
    
}
