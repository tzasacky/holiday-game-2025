import * as ex from 'excalibur';
import { UIManager } from '../ui/UIManager';
import { GameScene } from '../scenes/GameScene';
import { Logger } from './Logger';
import { TurnManager } from './TurnManager';

export enum GameActionType {
    MoveNorth = 'move_north',
    MoveSouth = 'move_south',
    MoveEast = 'move_east',
    MoveWest = 'move_west',
    Wait = 'wait',
    Inventory = 'inventory',
    Interact = 'interact'
}

export class InputManager {
    private static _instance: InputManager;
    private engine!: ex.Engine;
    private gameScene: GameScene | null = null;

    private lastClickTarget: ex.Vector | null = null;
    private isUIInteractionActive: boolean = false;

    private constructor() {}

    public static get instance(): InputManager {
        if (!this._instance) {
            this._instance = new InputManager();
        }
        return this._instance;
    }

    public initialize(engine: ex.Engine) {
        this.engine = engine;
        
        // Get reference to game scene
        this.gameScene = engine.currentScene as GameScene;
        
        // Setup pointer listeners
        this.engine.input.pointers.on('down', (evt) => {
            // Check if UI should handle this click first
            this.isUIInteractionActive = this.gameScene?.isInventoryOpen() || false;
            
            // Only set click target for game world if UI isn't handling it
            if (!this.isUIInteractionActive && evt.button === ex.PointerButton.Left) {
                // Convert world coordinates to tile coordinates (32px per tile)
                const tileX = Math.floor(evt.worldPos.x / 32);
                const tileY = Math.floor(evt.worldPos.y / 32);
                this.lastClickTarget = ex.vec(tileX, tileY);
                Logger.debug("[Input] Game World Click at tile:", this.lastClickTarget);
                
                // Wake up TurnManager to process the click during Hero's turn
                Logger.debug("[InputManager] Waking up TurnManager for click processing");
                TurnManager.instance.processTurns();
            }
        });

        // Setup keyboard listeners for turn-based input
        this.engine.input.keyboard.on('press', (evt) => {
            if (this.isUIInteractionActive) return;
            
            // Handle UI keys first (these don't cost turns)
            if (evt.key === ex.Keys.I) {
                Logger.debug("[InputManager] Inventory key pressed");
                this.toggleInventory();
                return;
            }
            
            // Process movement keys immediately for turn-based gameplay
            let action: GameActionType | null = null;
            
            if (evt.key === ex.Keys.ArrowUp || evt.key === ex.Keys.W) action = GameActionType.MoveNorth;
            else if (evt.key === ex.Keys.ArrowDown || evt.key === ex.Keys.S) action = GameActionType.MoveSouth;
            else if (evt.key === ex.Keys.ArrowLeft || evt.key === ex.Keys.A) action = GameActionType.MoveWest;
            else if (evt.key === ex.Keys.ArrowRight || evt.key === ex.Keys.D) action = GameActionType.MoveEast;
            else if (evt.key === ex.Keys.Space || evt.key === ex.Keys.Numpad5) action = GameActionType.Wait;
            else if (evt.key === ex.Keys.E) action = GameActionType.Interact;
            
            if (action) {
                Logger.debug("[InputManager] Keyboard action:", action);
                this.queueGameAction(action);
            }
        });

        // Note: UI input handling is now done by individual UI components
        // This keeps game input separate from UI input
    }
    
    public setGameScene(gameScene: GameScene) {
        this.gameScene = gameScene;
    }
    
    private queueGameAction(action: GameActionType) {
        if (!this.gameScene) return;
        
        const hero = this.gameScene.getHero();
        if (!hero) return;
        
        Logger.debug("[InputManager] Queuing action for hero:", action);
        
        // Queue the action - let TurnManager process it naturally
        hero.queueAction(action);
        
        // Wake up TurnManager to process the queued action
        Logger.debug("[InputManager] Waking up TurnManager to process action");
        TurnManager.instance.processTurns();
    }
    
    private toggleInventory() {
        if (!this.gameScene) return;
        
        Logger.debug("[InputManager] Toggling inventory");
        // Access the scene's inventory toggle method
        if ((this.gameScene as any).toggleInventory) {
            (this.gameScene as any).toggleInventory();
        }
    }

    getAction(): GameActionType | null {
        if (!this.engine) return null;
        
        Logger.debug("[InputManager] getAction called - UI blocking:", this.isUIInteractionActive);
        
        // Don't process game actions if UI is active
        if (this.isUIInteractionActive) {
            return null;
        }
        
        const k = this.engine.input.keyboard;
        
        // Debug: Log all current key states
        Logger.debug("[InputManager] Checking keyboard input...");

        // Movement keys
        if (k.wasPressed(ex.Keys.ArrowUp) || k.wasPressed(ex.Keys.W)) { Logger.debug("[Input] Key pressed: MoveNorth"); return GameActionType.MoveNorth; }
        if (k.wasPressed(ex.Keys.ArrowDown) || k.wasPressed(ex.Keys.S)) { Logger.debug("[Input] Key pressed: MoveSouth"); return GameActionType.MoveSouth; }
        if (k.wasPressed(ex.Keys.ArrowLeft) || k.wasPressed(ex.Keys.A)) { Logger.debug("[Input] Key pressed: MoveWest"); return GameActionType.MoveWest; }
        if (k.wasPressed(ex.Keys.ArrowRight) || k.wasPressed(ex.Keys.D)) { Logger.debug("[Input] Key pressed: MoveEast"); return GameActionType.MoveEast; }
        if (k.wasPressed(ex.Keys.Space) || k.wasPressed(ex.Keys.Numpad5)) { Logger.debug("[Input] Key pressed: Wait"); return GameActionType.Wait; }
        if (k.wasPressed(ex.Keys.E)) { Logger.debug("[Input] Key pressed: Interact"); return GameActionType.Interact; }

        Logger.debug("[InputManager] No keys pressed");
        return null;
    }
    
    // Helper to get mouse position for movement logic in Hero
    // Consumes the click
    getClickTarget(): ex.Vector | null {
        // Don't allow game world clicks if UI is active
        if (this.isUIInteractionActive) {
            return null;
        }
        
        if (this.lastClickTarget) {
            const target = this.lastClickTarget;
            this.lastClickTarget = null; // Consume
            return target;
        }
        return null;
    }
    
    // Update UI interaction state
    public updateUIState() {
        // Simplified - no UI blocking for now to get core game working
        this.isUIInteractionActive = false; // this.gameScene?.isInventoryOpen() || false;
    }
    
    // Check if UI should block game input
    public isUIBlocking(): boolean {
        return this.isUIInteractionActive;
    }
}
