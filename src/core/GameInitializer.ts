import * as ex from 'excalibur';
import { ResourceManager } from './ResourceManager';
import { TileGraphicsManager } from '../graphics/TileGraphicsManager';
import { UnifiedSystemInit } from './UnifiedSystemInit';
import { AdvancedLevelGenerator } from '../dungeon/algorithms/AdvancedLevelGenerator';
import { getBiomesForFloor } from '../data/biomes';
import { GameScene } from '../scenes/GameScene';
import { ActorFactory } from '../factories/ActorFactory';
import { InputManager } from './InputManager';
import { UIManager } from '../ui/UIManager';
import { Spawner } from '../dungeon/Spawner';
import { Logger } from './Logger';
import { Level } from '../dungeon/Level';

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
            
            // Stage 4: Generate Level
            Logger.info("🏰 Stage 4: Generating level...");
            const { gameScene, level } = await this.generateLevel(game);
            Logger.info(`🏰 Level generated with ${level.rooms.length} rooms`);
            
            // Stage 5: Create and Setup Hero
            Logger.info("🦸 Stage 5: Creating hero...");
            const hero = await this.createHero(level);
            Logger.info(`🦸 Hero created at position ${hero.gridPos.x}, ${hero.gridPos.y}`);
            
            // Stage 6: Spawn Entities
            Logger.info("👹 Stage 6: Spawning entities...");
            await this.spawnEntities(level);
            Logger.info("👹 Entities spawned");
            
            // Stage 7: Setup Scene and UI
            Logger.info("🖥️ Stage 7: Setting up scene and UI...");
            await this.setupGameScene(game, gameScene, level, hero);
            Logger.info("🖥️ Scene and UI setup complete");
            
            Logger.info("✅ Game initialization complete!");
            
            return { gameScene, level };
            
        } catch (error) {
            Logger.error("❌ Game initialization failed:", error);
            throw error;
        }
    }
    
    private static async generateLevel(game: ex.Engine): Promise<{ gameScene: GameScene; level: Level }> {
        const gameScene = new GameScene();
        const generator = new AdvancedLevelGenerator();
        
        // Get biome for floor 1
        const availableBiomes = getBiomesForFloor(1);
        if (availableBiomes.length === 0) {
            throw new Error("No biomes available for floor 1");
        }
        
        const biome = availableBiomes[0];
        Logger.info(`🌍 Using biome: ${biome.name} (${biome.id})`);
        
        // Generate level
        const level = generator.generate(40, 30, biome, gameScene);
        gameScene.level = level;
        
        // Update tile graphics with new system
        await level.updateTileGraphics();
        
        return { gameScene, level };
    }
    
    private static async createHero(level: Level): Promise<any> {
        const spawn = level.entrancePoint;
        
        // Validate spawn position
        if (spawn.x < 0 || spawn.x >= level.width || spawn.y < 0 || spawn.y >= level.height) {
            throw new Error(`Invalid spawn position: ${spawn.x}, ${spawn.y}`);
        }
        
        // Check if spawn position is walkable
        if (!level.isWalkable(spawn.x, spawn.y)) {
            Logger.warn(`Spawn position ${spawn.x}, ${spawn.y} is not walkable, finding alternative...`);
            
            // Find nearby walkable position
            const alternativeSpawn = this.findNearbyWalkablePosition(level, spawn);
            if (alternativeSpawn) {
                spawn.setTo(alternativeSpawn.x, alternativeSpawn.y);
                Logger.info(`Using alternative spawn position: ${spawn.x}, ${spawn.y}`);
            } else {
                throw new Error("Could not find a walkable spawn position");
            }
        }
        
        // Create hero
        const hero = ActorFactory.instance.createHero(spawn);
        if (!hero) {
            throw new Error("Failed to create hero");
        }
        
        // Add hero to level
        level.addActor(hero);
        
        Logger.info(`Hero created with components: ${Array.from(hero.gameComponents.keys())}`);
        
        return hero;
    }
    
    private static findNearbyWalkablePosition(level: Level, center: ex.Vector): ex.Vector | null {
        const maxRadius = 5;
        
        for (let radius = 1; radius <= maxRadius; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
                    
                    const x = center.x + dx;
                    const y = center.y + dy;
                    
                    if (level.isWalkable(x, y)) {
                        return ex.vec(x, y);
                    }
                }
            }
        }
        
        return null;
    }
    
    private static async spawnEntities(level: Level): Promise<void> {
        // Spawn mobs
        const spawnConfig = {
            floorNumber: 1,
            spawnDensity: 'medium' as const,
            roomType: 'normal' as const,
            roomArea: level.width * level.height * 0.6
        };
        
        Spawner.spawnMobs(level, spawnConfig);
        Logger.info(`Spawned ${level.mobs.length} mobs`);
        
        // Items are spawned via room templates and loot system
        Logger.info("Items will be spawned via room templates and loot system");
    }
    
    private static async setupGameScene(
        game: ex.Engine, 
        gameScene: GameScene, 
        level: Level, 
        hero: any
    ): Promise<void> {
        // Register scene
        game.add('game', gameScene);
        
        // Setup camera
        game.currentScene.camera.zoom = 1.5;
        Logger.info(`Camera zoom set to: ${game.currentScene.camera.zoom}`);
        
        // Initialize input system
        InputManager.instance.initialize(game);
        InputManager.instance.setGameScene(gameScene);
        Logger.info("Input system initialized");
        
        // Initialize UI system
        UIManager.instance.initialize(hero);
        Logger.info("UI system initialized");
        
        // Welcome message
        UIManager.instance.log("Welcome to the Holiday Dungeon!");
        
        // Debug info
        setTimeout(() => {
            this.logDebugInfo(game, hero, level);
        }, 100);
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
        
        // Show error screen or fallback
        // For now, just log and rethrow
        throw error;
    }
}