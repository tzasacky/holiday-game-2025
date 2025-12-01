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
    
    // Dynamic getter for current game scene
    private get gameScene(): GameScene | null {
        if (this.engine && this.engine.currentScene instanceof GameScene) {
            return this.engine.currentScene as GameScene;
        }
        return null;
    }

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
        
        // Setup pointer listeners
        this.engine.input.pointers.on('down', (evt) => {
            Logger.debug("[InputManager] Mouse click detected at world pos:", evt.worldPos, "button:", evt.button);
            
            // Check if UI should handle this click first
            // We check if the click hit any active UI element
            const hitUI = this.gameScene?.checkUIHit(evt.screenPos) || false;
            this.isUIInteractionActive = hitUI;
            
            Logger.debug("[InputManager] UI hit check:", hitUI);
            
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
            } else {
                Logger.debug("[InputManager] Click blocked - UI active:", this.isUIInteractionActive, "button:", evt.button);
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
            
            // Handle hotbar keys (1-5)
            if (evt.key === ex.Keys.Digit1) { this.useHotbarSlot(1); return; }
            if (evt.key === ex.Keys.Digit2) { this.useHotbarSlot(2); return; }
            if (evt.key === ex.Keys.Digit3) { this.useHotbarSlot(3); return; }
            if (evt.key === ex.Keys.Digit4) { this.useHotbarSlot(4); return; }
            if (evt.key === ex.Keys.Digit5) { this.useHotbarSlot(5); return; }
            
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
    

    
    // setGameScene removed as we access engine.currentScene dynamically
    
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
        if (this.gameScene.toggleInventory) {
            this.gameScene.toggleInventory();
        }
    }
    
    private useHotbarSlot(slotNumber: number) {
        if (!this.gameScene) return;
        
        Logger.debug(`[InputManager] Using hotbar slot ${slotNumber}`);
        // Access UIManager to get hotbar
        const uiManager = UIManager.instance;
        const hotbar = uiManager.getHotbar();
        if (hotbar) {
            hotbar.useSlot(slotNumber);
        }
    }

    // Helper to get mouse position for movement logic in Hero
    // Consumes the click
    public getClickTarget(): ex.Vector | null {
        Logger.debug("[InputManager] getClickTarget called - UI active:", this.isUIInteractionActive, "lastClickTarget:", this.lastClickTarget);
        
        // Don't allow game world clicks if UI is active
        if (this.isUIInteractionActive) {
            Logger.debug("[InputManager] Blocking click due to UI interaction");
            return null;
        }
        
        if (this.lastClickTarget) {
            const target = this.lastClickTarget;
            this.lastClickTarget = null; // Consume
            Logger.debug("[InputManager] Returning and consuming click target:", target);
            return target;
        }
        Logger.debug("[InputManager] No click target available");
        return null;
    }

    public setClickTarget(target: ex.Vector): void {
        this.lastClickTarget = target;
        // Ensure UI interaction is cleared so this click is processed
        this.isUIInteractionActive = false;
    }

    public hasClickTarget(): boolean {
        return !!this.lastClickTarget && !this.isUIInteractionActive;
    }
    
    // Update UI interaction state  
    public updateUIState() {
        // Simplified - no UI blocking for now to get core game working
        this.isUIInteractionActive = this.gameScene?.isInventoryOpen() || false;
        Logger.debug("[InputManager] updateUIState - gameScene exists:", !!this.gameScene, "inventory open:", this.gameScene?.isInventoryOpen(), "UI active:", this.isUIInteractionActive);
    }
    
    // Check if UI should block game input
    public isUIBlocking(): boolean {
        return this.isUIInteractionActive;
    }
}
