import * as ex from 'excalibur';
import { Level } from '../dungeon/Level';
import { TurnManager } from '../core/TurnManager';
import { UIManager } from '../ui/UIManager';
import { GameActor } from '../components/GameActor';
import { Logger } from '../core/Logger';
import { GameEventNames, DieEvent, LevelTransitionEvent } from '../core/GameEvents';
import { EventBus } from '../core/EventBus';
import { DungeonNavigator } from '../core/DungeonNavigator';
import { LevelManager } from '../core/LevelManager';
import { GameState } from '../core/GameState';

export class GameScene extends ex.Scene {
    public level: Level | null = null;
    private hero: GameActor | null = null;

    // Constructor to initialize with a specific level
    constructor(level: Level) {
        super();
        this.level = level;
    }

    public onInitialize(engine: ex.Engine) {
        // Setup level entities once when scene is created
        if (this.level) {
            this.setupLevel(this.level);
        }
    }
    
    public onActivate(context: ex.SceneActivationContext<unknown>): void {
        Logger.info(`[GameScene] Activating scene for level ${this.level?.depth}`);
        
        // 1. Re-attach Hero
        const hero = LevelManager.instance.getPlayer();
        if (hero) {
            this.hero = hero;
            
            // Ensure hero is not in the scene before adding (safety check)
            if (!this.actors.includes(hero)) {
                hero.z = 20; // Ensure hero is above floor items (Z=0) and interactables (Z=5) and mobs (Z=10)
                this.add(hero);
                Logger.info(`[GameScene] Re-attached hero to scene`);
            }
            
            // Update hero position based on entrance/exit
            // If coming from a transition, DungeonNavigator/Level should have set the correct position on the hero
            // or we can set it here if we have context data.
            // For now, assume hero.pos is correct or set by DungeonNavigator before transition.
            
            // Register with managers
            GameState.instance.registerHero(hero);
            
            // Update UI
            UIManager.instance.showUI();
            UIManager.instance.update(hero);
            
            // Camera
            this.camera.strategy.lockToActor(hero);
            this.camera.zoom = 1.5;
        } else {
            Logger.error('[GameScene] No hero found in LevelManager during activation!');
        }
        
        // 2. Register Level and add Hero to level's actors list
        if (this.level) {
            LevelManager.instance.setCurrentLevel(this.level);
            GameState.instance.registerLevel(this.level);
            DungeonNavigator.instance.discoverFloor(this.level.depth);
            
            // Add hero to level's actors list if not already there
            if (this.hero && !this.level.actors.includes(this.hero)) {
                this.level.actors.push(this.hero);
                Logger.info(`[GameScene] Added hero to level ${this.level.depth} actors list`);
            }
        }
        
        // 3. Register Actors with TurnManager
        // Since onDeactivate clears the TurnManager, we must re-register ALL actors
        // (Hero + Mobs) every time we activate the scene.
        
        // Register Hero
        if (this.hero) {
            TurnManager.instance.registerActor(this.hero);
            Logger.info(`[GameScene] Registered hero with TurnManager`);
        }
        
        // Register Mobs/Actors
        if (this.level) {
            this.level.actors.forEach(actor => {
                if (!actor.isPlayer) {
                    TurnManager.instance.registerActor(actor);
                }
            });
            Logger.info(`[GameScene] Registered ${this.level.actors.length - (this.hero ? 1 : 0)} mobs with TurnManager`);
        }
        
        // 4. Start Turns
        TurnManager.instance.processTurns();
        
        // Listen for death events
        EventBus.instance.on(GameEventNames.Death, this.handleDeath);
        
        // Listen for level transition events
        EventBus.instance.on(GameEventNames.LevelTransition, this.handleLevelTransitionComplete);
    }

    public onDeactivate(context: ex.SceneActivationContext<unknown>): void {
        Logger.info(`[GameScene] Deactivating scene for level ${this.level?.depth}`);
        
        // 1. Save State - REMOVED
        // Handled by DungeonNavigator.transitionToFloor BEFORE moving the player.
        // Saving here would overwrite the correct state with the new level's player position.
        // DungeonNavigator.instance.saveCurrentLevel();
        
        // 2. Remove Hero from level's actors list
        // This ensures hero is only in one level's actors list at a time
        if (this.hero && this.level) {
            const index = this.level.actors.indexOf(this.hero);
            if (index > -1) {
                this.level.actors.splice(index, 1);
                Logger.info(`[GameScene] Removed hero from level ${this.level.depth} actors list`);
            }
        }
        
        // 3. Stop Turns
        TurnManager.instance.clear(); // This clears the turn queue, but doesn't kill actors
        
        // Cleanup listeners
        EventBus.instance.off(GameEventNames.Death, this.handleDeath);
        EventBus.instance.off(GameEventNames.LevelTransition, this.handleLevelTransitionComplete);
    }

    private handleDeath = (event: DieEvent) => {
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
             
             // Check for Game Over
             if (event.actor.isPlayer) {
                 Logger.info('[GameScene] Hero died! Triggering Game Over...');
                 EventBus.instance.emit(GameEventNames.GameOver, {});
             }
         }
    }

    private handleLevelTransitionComplete = (event: LevelTransitionEvent) => {
        Logger.info(`[GameScene] Level transition requested: ${event.direction} to ${event.toLevel}`);
        // Transition is handled by DungeonNavigator switching scenes
        // We just need to ensure we don't block it.
    }

    private async setupLevel(level: Level): Promise<void> {
        Logger.info(`[GameScene] Setting up level ${level.depth} with ${level.actors.length} actors`);
        
        // Add tilemaps
        if (!this.tileMaps.includes(level.floorMap)) this.add(level.floorMap);
        if (!this.tileMaps.includes(level.objectMap)) this.add(level.objectMap);
        
        // Add actors (EXCEPT HERO - Hero is added in onActivate)
        // Add actors (EXCEPT HERO - Hero is added in onActivate)
        // Note: We do NOT register with TurnManager here anymore.
        // Registration happens in onActivate to ensure it persists across scene switches.
        level.actors.forEach(actor => {
            if (!actor.isPlayer && !this.actors.includes(actor)) {
                actor.z = 10; 
                this.add(actor);
            }
        });
        
        // Add items
        level.items.forEach(item => {
            if (!this.actors.includes(item)) this.add(item);
        });
        
        // Add interactables
        level.interactables.forEach(interactable => {
            if (!this.actors.includes(interactable)) this.add(interactable);
        });
        
        // Ensure graphics are updated
        await level.updateTileGraphics();
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

    public toggleInventory() {
        UIManager.instance.toggleInventory();
    }

    public checkUIHit(screenPos: ex.Vector): boolean {
        return false;
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

    private initializeCanvasUI(hero: GameActor) {
        // Canvas UI removed in favor of DOM UI
    }
}