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
        
        // Cache DOM elements (legacy support)
        this.hpText = document.getElementById('hp-text');
        this.hpBar = document.getElementById('hp-bar');
        this.logWindow = document.getElementById('log-window');
        this.inventoryModal = document.getElementById('inventory-modal');
        this.inventoryGrid = document.querySelector('.inventory-grid');

        // Bind Events
        const closeBtn = document.getElementById('close-inventory');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.toggleInventory(false);
            });
        }
        
        // Prevent clicks on modal from reaching game
        if (this.inventoryModal) {
            this.inventoryModal.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
            });
             this.inventoryModal.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
        }
        
        // Hide DOM log window since we now use canvas journal
        if (this.logWindow) {
            this.logWindow.style.display = 'none';
        }
        
        // Add initial welcome message
        this.logToJournal('Welcome to the Holiday Dungeon!', LogCategory.System);
    }

    public update(hero: Hero) {
        this.updateStats(hero);
        if (hero.inventory) {
            this.updateInventoryUI(hero.inventory);
        }
    }

    private updateStats(hero: Hero) {
        if (this.hpText) {
            this.hpText.innerText = `${Math.ceil(hero.hp)}/${hero.maxHp}`;
        }
        if (this.hpBar) {
            const percent = Math.max(0, Math.min(100, (hero.hp / hero.maxHp) * 100));
            this.hpBar.style.width = `${percent}%`;
        }
    }

    public log(message: string) {
        // Maintain backward compatibility with existing log calls
        this.logToJournal(message, LogCategory.System);
        
        // Also update DOM log if it exists (legacy support)
        const logContent = document.getElementById('log-content');
        if (logContent) {
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.innerText = message;
            logContent.appendChild(entry);
            logContent.scrollTop = logContent.scrollHeight;
        }
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

    public toggleInventory(show?: boolean) {
        if (!this.inventoryModal) return;
        
        const isHidden = this.inventoryModal.classList.contains('hidden');
        const shouldShow = show !== undefined ? show : isHidden;

        if (shouldShow) {
            this.inventoryModal.classList.remove('hidden');
        } else {
            this.inventoryModal.classList.add('hidden');
        }
    }
    
    public get isInventoryVisible(): boolean {
        return this.inventoryModal ? !this.inventoryModal.classList.contains('hidden') : false;
    }

    private updateInventoryUI(inventory: Inventory) {
        if (!this.inventoryGrid) return;
        
        // Simple redraw for now (optimization: only update changed slots)
        // Actually, let's just update content if we have slots
        const slots = this.inventoryGrid.children;
        
        for (let i = 0; i < slots.length; i++) {
            if (i >= inventory.capacity) break;
            
            const slot = slots[i] as HTMLElement;
            const item = inventory.getItem(i);
            
            // Clear slot
            slot.innerHTML = '';
            
            if (item) {
                // For now just text or a placeholder div
                const itemDiv = document.createElement('div');
                itemDiv.innerText = item.name.substring(0, 2);
                itemDiv.style.color = 'white';
                itemDiv.style.fontSize = '10px';
                slot.appendChild(itemDiv);
                
                // TODO: Add click handler for item use
            }
        }
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
