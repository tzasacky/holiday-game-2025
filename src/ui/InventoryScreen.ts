import { UIComponent } from './components/UIComponent';
import { EventBus } from '../core/EventBus';
import { GameEventNames, InventoryChangeEvent, ItemEquipEvent, ItemUnequipEvent } from '../core/GameEvents';
import { EnhancedEquipment } from '../mechanics/EquipmentSystem';
import { SpriteMapper } from './SpriteMapper';

export class InventoryScreen extends UIComponent {
    private equipmentPanel: HTMLElement | null = null;
    private inventoryGrid: HTMLElement | null = null;
    private closeBtn: HTMLElement | null = null;

    constructor(private hero: any) {
        super('#inventory-screen');
        this.visible = false; // Hidden by default in CSS
        this.initialize();
    }

    private initialize(): void {
        if (!this.element) return;

        this.equipmentPanel = document.getElementById('equipment-panel');
        this.inventoryGrid = document.getElementById('inventory-grid');
        this.closeBtn = document.getElementById('inventory-close');

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.hide());
        }

        // Listen for events
        const bus = EventBus.instance;
        bus.on(GameEventNames.InventoryChange, () => this.updateInventory());
        bus.on(GameEventNames.ItemEquip, () => this.updateEquipment());
        bus.on(GameEventNames.ItemUnequip, () => this.updateEquipment());

        // Initial update
        this.updateEquipment();
        this.updateInventory();
    }

    public show(): void {
        super.show();
        this.updateEquipment();
        this.updateInventory();
    }

    private updateEquipment(): void {
        if (!this.equipmentPanel || !this.hero) return;
        this.equipmentPanel.innerHTML = '';

        const slots = ['weapon', 'armor']; // Add more as needed
        
        slots.forEach(slotName => {
            const slot = document.createElement('div');
            slot.className = 'equipment-slot';
            slot.dataset.slot = slotName;
            
            const label = document.createElement('div');
            label.className = 'slot-label';
            label.textContent = slotName.charAt(0).toUpperCase() + slotName.slice(1);
            slot.appendChild(label);

            const item = this.hero[slotName];
            if (item) {
                const icon = document.createElement('div');
                icon.className = 'item-icon';
                icon.textContent = SpriteMapper.getIcon(item);
                slot.appendChild(icon);
                
                slot.title = `${item.name}\n${item.description || ''}`;
                
                // Click to unequip
                slot.addEventListener('click', () => {
                    this.hero.unequip(item);
                });
            } else {
                slot.classList.add('empty');
                slot.title = `Empty ${slotName} slot`;
            }

            this.equipmentPanel!.appendChild(slot);
        });
    }

    private updateInventory(): void {
        if (!this.inventoryGrid || !this.hero || !this.hero.inventory) return;
        this.inventoryGrid.innerHTML = '';

        const inventory = this.hero.inventory;
        
        for (let i = 0; i < inventory.capacity; i++) {
            const item = inventory.getItem(i);
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.index = i.toString();

            if (item) {
                const icon = document.createElement('div');
                icon.className = 'item-icon';
                icon.textContent = SpriteMapper.getIcon(item);
                slot.appendChild(icon);

                if (item.count > 1) {
                    const count = document.createElement('span');
                    count.className = 'count';
                    count.textContent = item.count.toString();
                    slot.appendChild(count);
                }

                slot.title = `${item.name}\n${item.description || ''}`;

                // Click to use/equip
                slot.addEventListener('click', () => {
                    if (item instanceof EnhancedEquipment) {
                        this.hero.equip(item);
                    } else if (typeof item.use === 'function') {
                        item.use(this.hero);
                    }
                });
                
                // Right click to drop?
                slot.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    // Drop item logic
                    // this.hero.dropItem(i);
                    console.log('Drop item not implemented in UI yet');
                });
            } else {
                slot.classList.add('empty');
            }

            this.inventoryGrid!.appendChild(slot);
        }
    }
}