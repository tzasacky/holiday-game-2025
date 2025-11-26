import * as ex from 'excalibur';
import { loader } from './config/resources';
import { Logger, LogLevel } from './core/Logger';
import { GameInitializer } from './core/GameInitializer';
import { SpriteDebugScene } from './scenes/SpriteDebugScene';
import { GameOverScene } from './scenes/GameOverScene';
import { EventBus } from './core/EventBus';
import { GameEventNames } from './core/GameEvents';

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
game.showDebug(false);

game.start(loader).then(async () => {
    Logger.info("Game Started! Resources Loaded.");

    if (AppConfig.DebugSprites) {
        Logger.info("Starting Sprite Debug Mode");
        game.add('debug', new SpriteDebugScene());
        game.goToScene('debug');
        return;
    }

    // Register Game Over Scene
    game.add('gameover', new GameOverScene());
    
    // Listen for Game Over event
    EventBus.instance.on(GameEventNames.GameOver, () => {
        Logger.info("Game Over! Switching to game over scene.");
        game.goToScene('gameover');
    });

    try {
        // Use new staged initialization system
        const { gameScene, level } = await GameInitializer.initializeGame(game);
        
        // Start the game
        game.goToScene('game');
        
        Logger.info("🎮 Game is ready to play!");
        
    } catch (error) {
        Logger.error("💥 Failed to initialize game:", error);
        
        // Try to handle the error gracefully
        try {
            await GameInitializer.handleInitializationError(error as Error, game);
        } catch (handlerError) {
            Logger.error("💥 Error handler also failed:", handlerError);
            
            // Show fallback error message
            document.body.innerHTML = `
                <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                    <h1>🎮 Game Initialization Failed</h1>
                    <p>Sorry, the game could not start properly.</p>
                    <p>Error: ${(error as Error).message}</p>
                    <button onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }
}).catch((error) => {
    Logger.error("💥 Failed to start game engine:", error);
    
    // Show fallback error message for loader failures
    document.body.innerHTML = `
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h1>🎮 Game Loading Failed</h1>
            <p>Sorry, the game resources could not be loaded.</p>
            <p>Error: ${error.message}</p>
            <button onclick="location.reload()">Retry</button>
        </div>
    `;
});