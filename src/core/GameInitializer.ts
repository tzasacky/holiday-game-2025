import * as ex from 'excalibur';
import { ResourceManager } from './ResourceManager';
import { TileGraphicsManager } from '../graphics/TileGraphicsManager';
import { UnifiedSystemInit } from './UnifiedSystemInit';
import { GameScene } from '../scenes/GameScene';
import { InputManager } from './InputManager';
import { UIManager } from '../ui/UIManager';
import { Logger } from './Logger';
import { Level } from '../dungeon/Level';
import { DungeonNavigator } from './DungeonNavigator';
import { LevelManager } from './LevelManager';

export class GameInitializer {
    public static async initializeGame(game: ex.Engine): Promise<{ gameScene: GameScene; level: Level }> {
        Logger.info("🎮 Starting game initialization...");
        
        try {
            // Stage 1: Load Resources
            Logger.info("📦 Stage 1: Loading resources...");
            const resourcesLoaded = await ResourceManager.instance.ensureAllLoaded();
            
            if (!resourcesLoaded) {
                throw new Error("Failed to load all required resources");
            }
            
            const progress = ResourceManager.instance.getLoadingProgress();
            Logger.info(`📦 Resources loaded: ${Math.round(progress * 100)}%`);
            
            // Stage 2: Initialize Graphics Systems
            Logger.info("🎨 Stage 2: Initializing graphics...");
            await TileGraphicsManager.instance.initialize();
            Logger.info("🎨 Graphics systems initialized");
            
            // Stage 3: Initialize Game Systems
            Logger.info("⚙️ Stage 3: Initializing game systems...");
            UnifiedSystemInit.initialize();
            Logger.info("⚙️ Game systems initialized");
            
            // Stage 4: Initialize Game Content via DungeonNavigator
            Logger.info("🏰 Stage 4: Initializing game content...");
            const startSceneKey = await DungeonNavigator.instance.initializeGame(game);
            
            // Get the initial level and hero
            const level = DungeonNavigator.instance.getCurrentLevel();
            if (!level) {
                throw new Error("Failed to initialize level");
            }
            
            const hero = LevelManager.instance.getPlayer();
            if (!hero) {
                throw new Error("Failed to initialize hero");
            }

            // Initialize UI system
            UIManager.instance.initialize(game);
            UIManager.instance.update(hero);
            Logger.info("UI system initialized");
            
            // Initialize input system
            // InputManager needs to know about the current scene, but since scenes change, 
            // it should ideally hook into the engine or we update it on scene change.
            // For now, let's pass the engine and let it handle global input.
            // If it needs specific scene access, we might need to update it.
            InputManager.instance.initialize(game);
            // InputManager.instance.setGameScene(gameScene); // Removed as scene is dynamic
            Logger.info("Input system initialized");
            
            // Welcome message
            UIManager.instance.log("Welcome to the Holiday Dungeon!");
            
            // Debug info
            setTimeout(() => {
                // this.logDebugInfo(game, hero, level); // Commented out as it relied on static scene
            }, 100);
            
            Logger.info("✅ Game initialization complete!");
            
            // We return null for gameScene as it's managed dynamically now
            return { gameScene: null as any, level };
            
        } catch (error) {
            Logger.error("❌ Game initialization failed:", error);
            throw error;
        }
    }
    
    private static logDebugInfo(game: ex.Engine, hero: any, level: Level): void {
        Logger.info("=== Debug Information ===");
        Logger.info(`Camera position: ${game.currentScene.camera.pos.x}, ${game.currentScene.camera.pos.y}`);
        Logger.info(`Hero position: ${hero.pos.x}, ${hero.pos.y}`);
        Logger.info(`Hero grid position: ${hero.gridPos.x}, ${hero.gridPos.y}`);
        Logger.info(`Game engine size: ${game.drawWidth} x ${game.drawHeight}`);
        Logger.info(`Camera zoom: ${game.currentScene.camera.zoom}`);
        Logger.info(`Level size: ${level.width} x ${level.height}`);
        Logger.info(`Level actors: ${level.actors.length}`);
        Logger.info(`Level mobs: ${level.mobs.length}`);
        Logger.info(`Level rooms: ${level.rooms.length}`);
        
        // Check if hero is in camera view
        const cameraLeft = game.currentScene.camera.pos.x - game.drawWidth / (2 * game.currentScene.camera.zoom);
        const cameraRight = game.currentScene.camera.pos.x + game.drawWidth / (2 * game.currentScene.camera.zoom);
        const cameraTop = game.currentScene.camera.pos.y - game.drawHeight / (2 * game.currentScene.camera.zoom);
        const cameraBottom = game.currentScene.camera.pos.y + game.drawHeight / (2 * game.currentScene.camera.zoom);
        
        const heroInView = hero.pos.x >= cameraLeft && hero.pos.x <= cameraRight && 
                          hero.pos.y >= cameraTop && hero.pos.y <= cameraBottom;
        
        Logger.info(`Hero in camera view: ${heroInView}`);
        Logger.info("========================");
    }
    
    public static async handleInitializationError(error: Error, game: ex.Engine): Promise<void> {
        Logger.error("Handling initialization error:", error);
        throw error;
    }
}