import * as ex from 'excalibur';
import { Hero } from '../actors/Hero';
import { Inventory } from '../items/Inventory';
import { GameJournal, LogCategory } from './GameJournal';

export class UIManager {
    private static _instance: UIManager;
    
    // Canvas UI Components
    private gameJournal: GameJournal | null = null;
    
    // DOM Elements (legacy - will be phased out)
    private hpText: HTMLElement | null = null;
    private hpBar: HTMLElement | null = null;
    private logWindow: HTMLElement | null = null;
    private inventoryModal: HTMLElement | null = null;
    private inventoryGrid: HTMLElement | null = null;
    
    // UI State
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
        
        // Initialize canvas-based UI components
        this.gameJournal = new GameJournal();
        engine.currentScene.add(this.gameJournal);
        
        // Add initial welcome message
        this.logToJournal('Welcome to the Holiday Dungeon!', LogCategory.System);
    }

    public update(hero: Hero) {
        // No-op: UI updates handled by Excalibur actors (HUD, InventoryScreen)
    }

    public log(message: string) {
        // Maintain backward compatibility with existing log calls
        this.logToJournal(message, LogCategory.System);
    }
    
    // New enhanced logging methods
    public logToJournal(message: string, category: LogCategory, color?: ex.Color) {
        if (this.gameJournal) {
            this.gameJournal.addEntry(message, category, color);
        }
    }
    
    public logCombat(message: string) {
        this.logToJournal(message, LogCategory.Combat, ex.Color.fromHex('#ef4444'));
    }
    
    public logItem(message: string) {
        this.logToJournal(message, LogCategory.Items, ex.Color.fromHex('#f59e0b'));
    }
    
    public logEffect(message: string) {
        this.logToJournal(message, LogCategory.Effects, ex.Color.fromHex('#22c55e'));
    }
    
    public logInteraction(message: string) {
        this.logToJournal(message, LogCategory.Interactions, ex.Color.fromHex('#3b82f6'));
    }
    
    public logMovement(message: string) {
        this.logToJournal(message, LogCategory.Movement, ex.Color.fromHex('#6b7280'));
    }
    
    // Helper for GameScene to check inventory state via UIManager if needed
    // But GameScene should check InventoryScreen directly
    public get isInventoryVisible(): boolean {
        // This is now handled by GameScene checking InventoryScreen
        return false; 
    }
    
    // Journal-specific methods
    public isJournalExpanded(): boolean {
        return this.gameJournal?.isExpanded() || false;
    }
    
    public clearJournal() {
        this.gameJournal?.clear();
    }
    
    public getJournalEntryCount(): number {
        return this.gameJournal?.getFilteredEntryCount() || 0;
    }
}
