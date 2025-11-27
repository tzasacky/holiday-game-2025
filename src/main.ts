import * as ex from 'excalibur';
import { loader } from './config/resources';
import { ActorFactory } from './factories/ActorFactory';
import { ActorSpawnSystem } from './components/ActorSpawnSystem';
import { UnifiedSystemInit } from './core/UnifiedSystemInit';
import { AdvancedLevelGenerator } from './dungeon/generators/AdvancedLevelGenerator';
import { SnowyVillageTheme } from './dungeon/themes/SnowyVillageTheme';
import { SnowyVillage } from './dungeon/biomes/SnowyVillage';
import { TurnManager } from './core/TurnManager';
import { WarmthSystem } from './mechanics/WarmthSystem';
import { CandyCaneSpear } from './content/items/weapons/CandyCaneSpear';
import { UIManager } from './ui/UIManager';
import { InputManager } from './core/InputManager';
import { Spawner } from './dungeon/Spawner';
import { GameScene } from './scenes/GameScene';
import { Logger, LogLevel } from './core/Logger';

import { WeakSword } from './content/items/weapons/WeakSword';
import { HotCocoa } from './content/items/consumables/HotCocoa';
import { ItemEntity } from './items/ItemEntity';

// Configuration
const urlParams = new URLSearchParams(window.location.search);
export const AppConfig = {
    UseFallbackRendering: urlParams.get('fallback') === 'true',
    DebugSprites: urlParams.get('debug') === 'sprites'
};

// Set log level (change to LogLevel.DEBUG for verbose logging)  
Logger.setLevel(LogLevel.INFO);

Logger.info("AppConfig:", AppConfig);
Logger.info("Initializing Game Engine...");
const game = new ex.Engine({
    width: 800,
    height: 600,
    canvasElementId: 'game',
    pixelArt: true,
    pixelRatio: 2,
    displayMode: ex.DisplayMode.FillScreen
});

// Enable debug mode to diagnose rendering
game.showDebug(true);

import { FallbackTheme } from './dungeon/themes/FallbackTheme';
import { SpriteDebugScene } from './scenes/SpriteDebugScene';

game.start(loader).then(() => {
    console.log("Game Started! Resources Loaded.");

    if (AppConfig.DebugSprites) {
        console.log("Starting Sprite Debug Mode");
        game.add('debug', new SpriteDebugScene());
        game.goToScene('debug');
        return;
    }

    // Systems
    const warmthSystem = new WarmthSystem();
    // game.currentScene.world.add(warmthSystem); // If using ECS, but we made it a manager for now

    // Scene Setup
    const gameScene = new GameScene();

    // Generation
    const generator = new AdvancedLevelGenerator();
    const theme = AppConfig.UseFallbackRendering ? new FallbackTheme() : new SnowyVillageTheme();
    const biome = new SnowyVillage(theme);
    const level = generator.generate(40, 30, biome, gameScene);
    gameScene.level = level;
    
    // Hero  
    const spawn = level.spawnPoints[0] || ex.vec(5, 5);
    Logger.info("Hero spawn position:", spawn);
    Logger.info("Level size:", level.width, "x", level.height);
    Logger.info("Level spawnPoints:", level.spawnPoints);
    
    // Check if spawn position is valid
    if (spawn.x >= 0 && spawn.x < level.width && spawn.y >= 0 && spawn.y < level.height) {
        const tile = level.objectMap.getTile(spawn.x, spawn.y);
        const terrain = level.terrainData[spawn.x][spawn.y];
        Logger.info("Hero spawn tile solid:", tile ? tile.solid : 'no tile');
        Logger.info("Hero spawn terrain:", terrain);
    } else {
        Logger.error("Hero spawn position is out of bounds!");
    }
    
    // Initialize unified system first
    UnifiedSystemInit.initialize();
    
    const hero = ActorFactory.instance.createHero(spawn);
    if (hero) {
        level.addActor(hero);
        console.log('[main] Hero created with unified system, components:', Array.from(hero.components.keys()));
    } else {
        console.error('[main] Failed to create hero with unified system');
    }
    
    // Camera - set zoom BEFORE going to scene
    game.currentScene.camera.zoom = 1.5; // Much more reasonable zoom
    Logger.info("Set camera zoom to:", game.currentScene.camera.zoom);
    
    // Debug camera position after a short delay
    setTimeout(() => {
        Logger.info("Camera position:", game.currentScene.camera.pos);
        Logger.info("Hero position:", hero.pos);
        Logger.info("Game engine size:", game.drawWidth, "x", game.drawHeight);
        Logger.info("Camera zoom:", game.currentScene.camera.zoom);
        
        // Check if hero is visible in camera viewport
        const cameraLeft = game.currentScene.camera.pos.x - game.drawWidth / (2 * game.currentScene.camera.zoom);
        const cameraRight = game.currentScene.camera.pos.x + game.drawWidth / (2 * game.currentScene.camera.zoom);
        const cameraTop = game.currentScene.camera.pos.y - game.drawHeight / (2 * game.currentScene.camera.zoom);
        const cameraBottom = game.currentScene.camera.pos.y + game.drawHeight / (2 * game.currentScene.camera.zoom);
        
        Logger.info("Camera viewport:", {
            left: cameraLeft,
            right: cameraRight, 
            top: cameraTop,
            bottom: cameraBottom
        });
        
        const heroInView = hero.pos.x >= cameraLeft && hero.pos.x <= cameraRight && 
                          hero.pos.y >= cameraTop && hero.pos.y <= cameraBottom;
        Logger.info("Hero in camera view:", heroInView);
    }, 100);

    // Initialize Input and UI systems
    InputManager.instance.initialize(game);
    InputManager.instance.setGameScene(gameScene);
    UIManager.instance.initialize(hero);
    
    // UI components will be initialized when the scene activates
    
    UIManager.instance.log("Welcome to the Holiday Dungeon!");
    
    // Inventory UI


    // Spawn Mobs
    Spawner.spawnMobs(level);

    // Spawn Items (Keep inline for now or move to Spawner later)
    
    for (let i = 1; i < level.spawnPoints.length; i++) {
        if (Math.random() < 0.3) { // 30% chance for item
             const item = new CandyCaneSpear();
             const entity = new ItemEntity(level.spawnPoints[i], item); // Use spawn point
             // game.currentScene.add(entity); // Level.addEntity does this
             level.addEntity(entity);
        }
    }

    // Starting Equipment
    const sword = new WeakSword();
    hero.inventory.addItem(sword);
    // sword.equip(hero); // Requires EnhancedEquipment wrapper

    const cocoa = new HotCocoa();
    hero.inventory.addItem(cocoa);

    // Input handling for TurnManager (if needed globally)
    // TurnManager is singleton, Hero calls it.

    // Start Game
    game.add('game', gameScene);
    game.goToScene('game');
});