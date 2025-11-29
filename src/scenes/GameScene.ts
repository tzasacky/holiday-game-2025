import * as ex from 'excalibur';
import { Level } from '../dungeon/Level';
import { TurnManager } from '../core/TurnManager';
import { UIManager } from '../ui/UIManager';
import { GameActor } from '../components/GameActor';
import { ActorFactory } from '../factories/ActorFactory';
import { UnifiedSystemInit } from '../core/UnifiedSystemInit';
import { Logger } from '../core/Logger';
import { GameEventNames, DieEvent, LevelTransitionEvent } from '../core/GameEvents';
import { EventBus } from '../core/EventBus';
import { DungeonNavigator } from '../core/DungeonNavigator';
import { LevelManager } from '../core/LevelManager';
import { GameState } from '../core/GameState';

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
                
                // Register with level management system
                LevelManager.instance.registerPlayer(hero);
                LevelManager.instance.setCurrentLevel(this.level);
                GameState.instance.registerHero(hero);
                GameState.instance.registerLevel(this.level);
                
                // Register all non-player actors with TurnManager
                this.level.actors.forEach(actor => {
                    if (!actor.isPlayer) {
                        TurnManager.instance.registerActor(actor);
                    }
                });
                
                UIManager.instance.showUI();
                UIManager.instance.update(hero); // Initialize HUD

                // Initialize Canvas UI (Hotbar only)
                this.initializeCanvasUI(hero);
                
                // Discover the starting floor
                DungeonNavigator.instance.discoverFloor(this.level.depth);
                
                Logger.info(`[GameScene] Initial setup complete - Level ${this.level.depth} with ${this.level.actors.length} actors`);
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

        // Listen for level transition events (completed transitions)
        EventBus.instance.on(GameEventNames.LevelTransition, (event: LevelTransitionEvent) => {
            this.handleLevelTransitionComplete(event);
        });
    }

    public onPostUpdate(engine: ex.Engine, delta: number) {
        // UI updates are handled via events
    }

    private async handleLevelTransitionComplete(event: LevelTransitionEvent): Promise<void> {
        Logger.info(`[GameScene] Level transition completed: ${event.direction} from ${event.fromLevel} to ${event.toLevel}`);
        
        try {
            // Get the new level from DungeonNavigator
            const newLevel = DungeonNavigator.instance.getCurrentLevel();
            if (!newLevel) {
                Logger.error(`[GameScene] No level found for floor ${event.toLevel}`);
                return;
            }

            // Clear current scene
            this.clear();

            // Set new level and connect it to this scene
            this.level = newLevel;
            newLevel.scene = this; // Connect level to the GameScene
            LevelManager.instance.setCurrentLevel(newLevel);

            // Add level's tilemaps to the scene
            this.add(newLevel.floorMap);
            this.add(newLevel.objectMap);

            // Refresh level graphics to ensure they're properly rendered
            await newLevel.updateTileGraphics();

            // Find hero in new level
            const hero = newLevel.actors.find(a => a.isPlayer) as GameActor;
            if (hero) {
                this.hero = hero;
                
                // Register with managers
                LevelManager.instance.registerPlayer(hero);
                GameState.instance.registerHero(hero);
                
                // Add all actors to scene
                newLevel.actors.forEach(actor => {
                    this.add(actor);
                    TurnManager.instance.registerActor(actor);
                });

                // Add mobs to scene
                newLevel.mobs.forEach((mob: any) => {
                    mob.z = 1;
                    this.add(mob);
                    TurnManager.instance.registerActor(mob);
                });

                // Update UI
                UIManager.instance.update(hero);
                
                // Reinitialize Canvas UI
                this.initializeCanvasUI(hero);

                // Set up camera
                this.camera.strategy.lockToActor(hero);
                this.camera.zoom = 1.5;

                Logger.info(`[GameScene] Successfully loaded level ${event.toLevel} with ${newLevel.actors.length} actors`);
            } else {
                Logger.error(`[GameScene] No player found in level ${event.toLevel}`);
            }

        } catch (error) {
            Logger.error(`[GameScene] Failed to handle level transition: ${error}`);
        }
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
        // Inventory and Hotbar are now DOM, so they handle their own clicks via pointer-events
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