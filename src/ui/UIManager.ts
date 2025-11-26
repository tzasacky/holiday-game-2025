import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';
import { HUD } from './HUD';
import { GameJournal, LogCategory } from './GameJournal';

export class UIManager {
    private static _instance: UIManager;
    
    // DOM UI Components
    private hud: HUD | null = null;
    private gameJournal: GameJournal | null = null;
    private engine: ex.Engine | null = null;
    
    // Excalibur UI Components (ScreenElements)
    private hotbar: any | null = null; // Import Hotbar type if needed
    
    private constructor() {}

    public static get instance(): UIManager {
        if (!this._instance) {
            this._instance = new UIManager();
        }
        return this._instance;
    }

    public initialize(engine: ex.Engine) {
        this.engine = engine;
        // Initialize DOM components
        // HUD requires a hero, but we might not have one yet. 
        // It's better to initialize HUD when we have a hero via update() or a separate method.
        // For now, we'll instantiate GameJournal which is independent.
        this.gameJournal = new GameJournal();
        
        // Add initial welcome message
        this.logToJournal('Welcome to the Holiday Dungeon!', LogCategory.System);
    }
    
    public update(hero: GameActor) {
        // Initialize HUD if not exists
        if (!this.hud) {
            this.hud = new HUD(hero);
        }
        
        // Update HUD
        this.hud.update();
    }
    
    /**
     * Register the hotbar instance so InputManager can access it
     */
    public registerHotbar(hotbar: any) {
        this.hotbar = hotbar;
    }

    public showUI() {
        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) {
            uiLayer.style.display = 'flex';
        }
    }

    // Logging methods
    public log(message: string) {
        this.logToJournal(message, LogCategory.System);
    }
    
    public logToJournal(message: string, category: LogCategory, color?: string) {
        if (this.gameJournal) {
            this.gameJournal.addEntry(message, category, color);
        }
    }
    
    public logCombat(message: string) {
        this.logToJournal(message, LogCategory.Combat, '#ef4444');
    }
    
    public logItem(message: string) {
        this.logToJournal(message, LogCategory.Items, '#f59e0b');
    }
    
    public logEffect(message: string) {
        this.logToJournal(message, LogCategory.Effects, '#22c55e');
    }
    
    public logInteraction(message: string) {
        this.logToJournal(message, LogCategory.Interactions, '#3b82f6');
    }
    
    public logMovement(message: string) {
        this.logToJournal(message, LogCategory.Movement, '#6b7280');
    }

    public getHotbar(): any {
        return this.hotbar;
    }

    public get isInventoryVisible(): boolean {
        const scene = this.engine?.currentScene as any;
        if (scene && scene.isInventoryOpen) {
            return scene.isInventoryOpen();
        }
        return false;
    }
}
