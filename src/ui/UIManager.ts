import * as ex from 'excalibur';
import { Hero } from '../actors/Hero';
import { HUD } from './HUD';
import { Hotbar } from './Hotbar';
import { GameJournal, LogCategory } from './GameJournal';
import { InventoryScreen } from './InventoryScreen';

export class UIManager {
    private static _instance: UIManager;
    
    // UI Components
    private hud: HUD | null = null;
    private hotbar: Hotbar | null = null;
    private gameJournal: GameJournal | null = null;
    private inventoryScreen: InventoryScreen | null = null;
    
    private constructor() {}

    public static get instance(): UIManager {
        if (!this._instance) {
            this._instance = new UIManager();
        }
        return this._instance;
    }

    public initialize(hero: Hero) {
        // Initialize DOM components
        this.hud = new HUD(hero);
        this.hotbar = new Hotbar(hero, () => this.toggleInventory());
        this.gameJournal = new GameJournal();
        this.inventoryScreen = new InventoryScreen(hero);
        
        // Add initial welcome message
        this.logToJournal('Welcome to the Holiday Dungeon!', LogCategory.System);
    }

    public showUI() {
        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) {
            uiLayer.style.display = 'flex'; // Use flex as defined in CSS for layout
        }
    }

    public toggleInventory() {
        if (this.inventoryScreen) {
            this.inventoryScreen.toggle();
        }
    }

    public get isInventoryVisible(): boolean {
        return this.inventoryScreen ? this.inventoryScreen.isVisible() : false;
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
}
