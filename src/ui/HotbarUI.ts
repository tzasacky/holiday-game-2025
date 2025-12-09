import { GameActor } from '../components/GameActor';
import { ItemEntity } from '../factories/ItemFactory';
import { EventBus } from '../core/EventBus';
import { GameEventNames } from '../core/GameEvents';
import { Logger } from '../core/Logger';
import { InventoryComponent } from '../components/InventoryComponent';

export class HotbarUI {
    private container: HTMLElement | null = null;
    private hero: GameActor | null = null;
    private slots: HTMLElement[] = [];
    private readonly SLOT_COUNT = 5;

    constructor() {
        this.initialize();
    }

    private initialize() {
        this.container = document.getElementById('hotbar');
        if (!this.container) {
            Logger.error('[HotbarUI] Failed to find #hotbar element');
            return;
        }

        // Clear existing content (if any)
        this.container.innerHTML = '';
        this.slots = [];

        // Create slots
        for (let i = 0; i < this.SLOT_COUNT; i++) {
            const slot = document.createElement('div');
            slot.className = 'hotbar-slot';
            slot.dataset.index = i.toString();
            
            // Hotkey label
            const hotkey = document.createElement('span');
            hotkey.className = 'hotbar-hotkey';
            hotkey.innerText = (i + 1).toString();
            slot.appendChild(hotkey);
            
            // Click handler
            slot.addEventListener('click', () => this.handleSlotClick(i));
            
            this.container.appendChild(slot);
            this.slots.push(slot);
        }

        // Inventory Toggle Button
        const invBtn = document.createElement('div');
        invBtn.className = 'hotbar-slot inventory-btn';
        invBtn.innerText = 'I';
        invBtn.title = 'Open Inventory (I)';
        invBtn.addEventListener('click', () => {
            // Dispatch custom event or call UIManager
            // Since we don't have direct access to UIManager instance here easily without circular dep,
            // we can emit an event or rely on UIManager to wire it up.
            // Let's use a global event or assume UIManager handles the 'I' key anyway.
            // But for click, we need to trigger it.
            // We'll emit a custom event on the document
            document.dispatchEvent(new CustomEvent('toggle-inventory'));
        });
        this.container.appendChild(invBtn);

        // Listen for inventory changes
        EventBus.instance.on(GameEventNames.InventoryChange, () => this.refresh());
        EventBus.instance.on(GameEventNames.ItemUse, () => this.refresh());
    }

    public setHero(hero: GameActor) {
        this.hero = hero;
        this.refresh();
    }

    public refresh() {
        if (!this.hero) return;

        const inventory = this.hero.getGameComponent<InventoryComponent>('inventory');
        if (!inventory) return;

        for (let i = 0; i < this.SLOT_COUNT; i++) {
            const item = inventory.getItemByIndex(i);
            this.updateSlot(i, item);
        }
    }

    private updateSlot(index: number, item: ItemEntity | null) {
        const slot = this.slots[index];
        if (!slot) return;

        // Clear item content (keep hotkey)
        const hotkey = slot.querySelector('.hotbar-hotkey');
        slot.innerHTML = '';
        if (hotkey) slot.appendChild(hotkey);

        if (item) {
            const icon = document.createElement('div');
            icon.className = 'item-icon';
            
            const graphics = item.definition.graphics;
            if (graphics && graphics.resource) {
                // Use CSS background image for sprite
                icon.style.backgroundImage = `url(${graphics.resource.path})`;
                
                // Calculate position
                const col = graphics.col ?? 0;
                const row = graphics.row ?? 0;
                
                icon.style.backgroundPosition = `-${col * 32}px -${row * 32}px`;
                icon.style.width = '32px';
                icon.style.height = '32px';
                icon.style.backgroundRepeat = 'no-repeat';
            } else {
                // Fallback
                icon.style.backgroundColor = this.getItemColor(item);
                icon.innerText = item.definition.name.substring(0, 2).toUpperCase();
                icon.style.display = 'flex';
                icon.style.justifyContent = 'center';
                icon.style.alignItems = 'center';
            }
            
            slot.appendChild(icon);
            
            if (item.count > 1) {
                const count = document.createElement('div');
                count.className = 'item-count';
                count.innerText = item.count.toString();
                slot.appendChild(count);
            }
            
            // Rarity border/glow
            this.setRarityClass(slot, item);
        } else {
            slot.className = 'hotbar-slot'; // Reset
        }
    }

    private handleSlotClick(index: number) {
        if (!this.hero) return;
        
        const inventory = this.hero.getGameComponent<InventoryComponent>('inventory');
        if (!inventory) return;

        const item = inventory.getItemByIndex(index);
        
        if (item) {
            item.use(this.hero);
        }
    }

    private getItemColor(item: ItemEntity): string {
        let hash = 0;
        for (let i = 0; i < item.definition.name.length; i++) {
            hash = item.definition.name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    }

    private setRarityClass(element: HTMLElement, item: ItemEntity) {
        element.classList.remove('rarity-common', 'rarity-uncommon', 'rarity-rare', 'rarity-epic', 'rarity-legendary', 'rarity-cursed');
        if (item.curses.length > 0) element.classList.add('rarity-cursed');
        else if (item.definition.rarity) element.classList.add(`rarity-${item.definition.rarity}`);
        else element.classList.add('rarity-common');
    }

    public useSlot(slotIndex: number) {
        // InputManager sends 1-based index (1-5)
        if (slotIndex >= 1 && slotIndex <= this.SLOT_COUNT) {
            this.handleSlotClick(slotIndex - 1);
        }
    }
}
