import * as ex from 'excalibur';
import { Level } from '../dungeon/Level';
import { TurnManager } from '../core/TurnManager';
import { UIManager } from '../ui/UIManager';
import { Snowman } from '../content/enemies/Snowman';
import { Hero } from '../actors/Hero';
import { Resources } from '../config/resources';

export class GameScene extends ex.Scene {
    public level: Level | null = null;
    private hero: Hero | null = null;

    public onInitialize(engine: ex.Engine) {
        // UIManager initialization moved to main.ts or onActivate
    }
    
    public onActivate(context: ex.SceneActivationContext<unknown>): void {
        // Add all level actors to the now-active scene
        if (this.level) {
            console.log(`[GameScene] Adding ${this.level.actors.length} actors from level to scene`);
            this.level.actors.forEach(actor => {
                if (!this.actors.includes(actor)) {
                    this.add(actor);
                    // Ensure actor is initialized if it wasn't already
                    if (!actor.isInitialized && actor instanceof Hero) {
                         // Hero might need specific init if not handled by Registry yet
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
            
            const hero = this.level.actors.find(a => a.isPlayer) as Hero;
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
    }

    public onPostUpdate(engine: ex.Engine, delta: number) {
        // UI updates are handled via events
    }
    
    // Utility methods for external access
    public getHero(): Hero | null {
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