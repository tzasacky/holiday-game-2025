import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';
import { HUD } from './HUD';
import { GameJournal, LogCategory } from './GameJournal';
import { InventoryUI } from './InventoryUI';
import { HotbarUI } from './HotbarUI';

export class UIManager {
    private static _instance: UIManager;
    
    // DOM UI Components
    private hud: HUD | null = null;
    private gameJournal: GameJournal | null = null;
    private inventoryUI: InventoryUI | null = null;
    private hotbarUI: HotbarUI | null = null;
    private engine: ex.Engine | null = null;
    
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
        this.gameJournal = new GameJournal();
        this.inventoryUI = new InventoryUI();
        this.hotbarUI = new HotbarUI();
        
        // Listen for custom toggle event from HotbarUI
        document.addEventListener('toggle-inventory', () => {
            this.toggleInventory();
        });
        
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

        // Update Inventory UI
        if (this.inventoryUI) {
            this.inventoryUI.setHero(hero);
        }
        
        // Update Hotbar UI
        if (this.hotbarUI) {
            this.hotbarUI.setHero(hero);
        }
    }
    
    public showUI() {
        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) {
            uiLayer.style.display = 'flex';
        }
    }

    public toggleInventory() {
        if (this.inventoryUI) {
            this.inventoryUI.toggle();
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

    public getHotbar(): HotbarUI | null {
        return this.hotbarUI;
    }

    public get isInventoryVisible(): boolean {
        // TODO: Expose isOpen state from InventoryUI
        return false; 
    }
}
