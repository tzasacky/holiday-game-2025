import * as ex from 'excalibur';
import { Level } from '../dungeon/Level';
import { TurnManager } from '../core/TurnManager';
import { UIManager } from '../ui/UIManager';
import { GameActor } from '../components/GameActor';
import { ActorFactory } from '../factories/ActorFactory';
import { UnifiedSystemInit } from '../core/UnifiedSystemInit';
import { Logger } from '../core/Logger';
import { GameEventNames, DieEvent } from '../core/GameEvents';
import { EventBus } from '../core/EventBus';

export class GameScene extends ex.Scene {
    public level: Level | null = null;
    private hero: GameActor | null = null;

    public onInitialize(engine: ex.Engine) {}
    
    public onActivate(context: ex.SceneActivationContext<unknown>): void {
        // Add all level actors to the now-active scene
        if (this.level) {
            Logger.info(`[GameScene] Adding ${this.level.actors.length} actors from level to scene`);
            this.level.actors.forEach(actor => {
                if (!this.actors.includes(actor)) {
                    this.add(actor);
                    // Ensure actor is initialized if it wasn't already
                    if (!actor.isInitialized && actor instanceof GameActor) {
                         // GameActor components handle initialization
                    }
                }
            });
            
            // Add mobs to scene  
            this.level.mobs.forEach((mob: any) => {
                if (!this.actors.includes(mob)) {
                    mob.z = 1;
                    this.add(mob);
                    if (!mob.isInitialized) {
                        mob._initialize(this.engine);
                    }
                }
            });
            
            const hero = this.level.actors.find(a => a.isPlayer) as GameActor;
            if (hero) {
                this.hero = hero;
                TurnManager.instance.registerActor(hero);
                
                // Register all non-player actors with TurnManager
                this.level.actors.forEach(actor => {
                    if (!actor.isPlayer) {
                        TurnManager.instance.registerActor(actor);
                    }
                });
                
                UIManager.instance.showUI();
            }
            
            // Set up camera to follow hero
            if (hero) {
                this.camera.strategy.lockToActor(hero);
                this.camera.zoom = 1.5;
            }
            
            // Start Turns
            TurnManager.instance.processTurns();
        }
        
        // Listen for death events to clean up level data
        EventBus.instance.on(GameEventNames.Death, (event: DieEvent) => {
             if (this.level) {
                 const index = this.level.actors.indexOf(event.actor);
                 if (index > -1) {
                     this.level.actors.splice(index, 1);
                     Logger.info(`[GameScene] Removed ${event.actor.name} from level actors`);
                 }
                 const mobIndex = this.level.mobs.indexOf(event.actor);
                 if (mobIndex > -1) {
                     this.level.mobs.splice(mobIndex, 1);
                 }
             }
        });
    }

    public onPostUpdate(engine: ex.Engine, delta: number) {
        // UI updates are handled via events
    }
    
    // Utility methods for external access
    public getHero(): GameActor | null {
        return this.hero;
    }
    
    public isInventoryOpen(): boolean {
        return UIManager.instance.isInventoryVisible;
    }
    
    public logCombat(message: string) {
        UIManager.instance.logCombat(message);
    }
    
    public logItem(message: string) {
        UIManager.instance.logItem(message);
    }
    
    public logEffect(message: string) {
        UIManager.instance.logEffect(message);
    }
    
    public logInteraction(message: string) {
        UIManager.instance.logInteraction(message);
    }
}