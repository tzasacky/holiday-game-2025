import { UIComponent } from './components/UIComponent';
import { EventBus } from '../core/EventBus';
import { GameEventNames, InventoryChangeEvent } from '../core/GameEvents';
import { SpriteMapper } from './SpriteMapper';
import { GameActor } from '../components/GameActor';
import { InventoryComponent } from '../components/InventoryComponent';

export class Hotbar extends UIComponent {
    private slots: HTMLElement[] = [];
    private readonly SLOT_COUNT = 5;

    constructor(private hero: GameActor, private onInventoryToggle?: () => void) {
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
        if (!this.hero) return;
        
        const inventoryComp = this.hero.getGameComponent('inventory') as InventoryComponent;
        if (!inventoryComp) return;

        const items = inventoryComp.getItems();

        for (let i = 0; i < this.SLOT_COUNT; i++) {
            const item = items[i]; // May be undefined
            const slot = this.slots[i];
            
            // Clear previous content (except hotkey)
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
                slot.title = `${item.getDisplayName()}\n${item.definition.description || ''}`;
                slot.className = `slot ${SpriteMapper.getCSSClass(item)}`;
            } else {
                slot.title = 'Empty';
                slot.className = 'slot';
            }
        }
    }

    private handleSlotClick(index: number): void {
        const inventoryComp = this.hero.getGameComponent('inventory') as InventoryComponent;
        if (!inventoryComp) return;

        const items = inventoryComp.getItems();
        const item = items[index];
        
        if (item) {
            console.log(`[Hotbar] Using item in slot ${index}: ${item.definition.name}`);
            inventoryComp.useItem(item.id);
        }
    }
}