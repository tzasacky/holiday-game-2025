import { UIComponent } from './components/UIComponent';
import { EventBus } from '../core/EventBus';
import { GameEventNames, InventoryChangeEvent } from '../core/GameEvents';
import { Item } from '../items/Item';
import { SpriteMapper } from './SpriteMapper';

export class Hotbar extends UIComponent {
    private slots: HTMLElement[] = [];
    private readonly SLOT_COUNT = 5;

    constructor(private hero: any, private onInventoryToggle?: () => void) {
        super('#hotbar');
        this.initialize();
    }

    private initialize(): void {
        if (!this.element) return;

        // Clear existing slots (except inventory button if it's there? No, let's rebuild)
        // Actually index.html has inventory-btn. I should preserve it or re-append it.
        // The structure is: <div id="hotbar"> <div id="inventory-btn">...</div> </div>
        // I want slots BEFORE the inventory button.
        
        const inventoryBtn = this.element.querySelector('#inventory-btn');
        if (inventoryBtn) {
            inventoryBtn.addEventListener('click', () => {
                if (this.onInventoryToggle) this.onInventoryToggle();
            });
        }

        // Create slots
        for (let i = 0; i < this.SLOT_COUNT; i++) {
            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.dataset.index = i.toString();
            
            // Add hotkey label
            const hotkey = document.createElement('span');
            hotkey.className = 'hotkey';
            hotkey.textContent = (i + 1).toString();
            slot.appendChild(hotkey);

            // Click handler
            slot.addEventListener('click', () => {
                this.handleSlotClick(i);
            });

            // Insert before inventory button
            if (inventoryBtn) {
                this.element.insertBefore(slot, inventoryBtn);
            } else {
                this.element.appendChild(slot);
            }
            
            this.slots.push(slot);
        }

        // Initial update
        this.updateSlots();

        // Listeners
        EventBus.instance.on(GameEventNames.InventoryChange, (event: InventoryChangeEvent) => {
            this.updateSlots();
        });
    }

    private updateSlots(): void {
        if (!this.hero || !this.hero.inventory) return;

        for (let i = 0; i < this.SLOT_COUNT; i++) {
            const item = this.hero.inventory.getItem(i);
            const slot = this.slots[i];
            
            // Clear previous content (except hotkey)
            // Actually, let's just manage the content div or img
            // Structure: <div class="slot"> <span class="hotkey">1</span> <img src="..."> <span class="count">5</span> </div>
            
            // Remove old item content (keep hotkey which is first child usually)
            // Safer to rebuild content
            const hotkey = slot.querySelector('.hotkey');
            slot.innerHTML = '';
            if (hotkey) slot.appendChild(hotkey);

            if (item) {
                // Item Icon/Sprite
                const icon = document.createElement('div');
                icon.className = 'item-icon';
                icon.textContent = SpriteMapper.getIcon(item);
                slot.appendChild(icon);

                // Count
                if (item.count > 1) {
                    const count = document.createElement('span');
                    count.className = 'count';
                    count.textContent = item.count.toString();
                    slot.appendChild(count);
                }

                // Tooltip
                slot.title = `${item.name}\n${item.description || ''}`;
            } else {
                slot.title = 'Empty';
            }
        }
    }

    private handleSlotClick(index: number): void {
        const item = this.hero.inventory.getItem(index);
        if (item) {
            console.log(`[Hotbar] Using item in slot ${index}: ${item.name}`);
            // Use item logic
            // item.use(this.hero); // Abstract method on Item?
            // EnhancedEquipment has use(). Base Item might not.
            if (typeof item.use === 'function') {
                item.use(this.hero);
            } else {
                console.warn('Item has no use method:', item);
            }
        }
    }
}