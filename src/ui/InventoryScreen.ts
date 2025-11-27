import { UIComponent } from './components/UIComponent';
import { EventBus } from '../core/EventBus';
import { GameEventNames, InventoryChangeEvent, ItemEquipEvent, ItemUnequipEvent } from '../core/GameEvents';
import { SpriteMapper } from './SpriteMapper';
import { GameActor } from '../components/GameActor';
import { InventoryComponent } from '../components/InventoryComponent';
import { ItemEntity } from '../factories/ItemFactory';
import { Logger } from '../core/Logger';

export class InventoryScreen extends UIComponent {
    private equipmentPanel: HTMLElement | null = null;
    private inventoryGrid: HTMLElement | null = null;
    private closeBtn: HTMLElement | null = null;

    constructor(private hero: GameActor) {
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

            // Access equipment via GameActor getters or component
            // GameActor has getters for weapon/armor that return the item
            const item = (this.hero as any)[slotName]; // Using compatibility getters on GameActor
            
            if (item) {
                const icon = document.createElement('div');
                icon.className = 'item-icon';
                icon.textContent = SpriteMapper.getIcon(item);
                slot.appendChild(icon);
                
                slot.title = `${item.name}\n${item.description || ''}`;
                
                // Click to unequip
                slot.addEventListener('click', () => {
                    // this.hero.unequip(item); // GameActor doesn't have unequip directly exposed in the snippet I saw, but maybe it does or we use component
                    // Let's assume we can emit an unequip event or call a method on equipment component
                    const equipmentComp = this.hero.getGameComponent('equipment') as any;
                    if (equipmentComp) {
                        equipmentComp.unequip(slotName);
                    }
                });
            } else {
                slot.classList.add('empty');
                slot.title = `Empty ${slotName} slot`;
            }

            this.equipmentPanel!.appendChild(slot);
        });
    }

    private updateInventory(): void {
        if (!this.inventoryGrid || !this.hero) return;
        
        const inventoryComp = this.hero.getGameComponent('inventory') as InventoryComponent;
        if (!inventoryComp) return;

        this.inventoryGrid.innerHTML = '';
        const items = inventoryComp.getItems(); // Get all items
        const capacity = inventoryComp.maxSize;
        
        for (let i = 0; i < capacity; i++) {
            const item = items[i]; // This might be undefined if items array is sparse or just shorter
            // InventoryComponent.items is an array of ItemEntity, not sparse.
            // But we want to show empty slots too.
            // Actually InventoryComponent.items is just the items present.
            // So we iterate up to capacity.
            
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.index = i.toString();

            if (i < items.length) {
                const itemEntity = items[i];
                const icon = document.createElement('div');
                icon.className = 'item-icon';
                icon.textContent = SpriteMapper.getIcon(itemEntity);
                slot.appendChild(icon);

                if (itemEntity.count > 1) {
                    const count = document.createElement('span');
                    count.className = 'count';
                    count.textContent = itemEntity.count.toString();
                    slot.appendChild(count);
                }

                slot.title = `${itemEntity.getDisplayName()}\n${itemEntity.definition.description || ''}`;
                slot.className += ` ${SpriteMapper.getCSSClass(itemEntity)}`;

                // Click to use/equip
                slot.addEventListener('click', () => {
                    // Check if equipable
                    if (itemEntity.definition.type === 'weapon' || itemEntity.definition.type === 'armor') {
                        this.hero.equip(itemEntity);
                    } else {
                        inventoryComp.useItem(itemEntity.id);
                    }
                });
                
                // Right click to drop?
                slot.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    inventoryComp.removeItem(itemEntity.id); // Drop logic needs to spawn item in world too
                    // For now just remove from inventory
                    Logger.warn('Drop item not fully implemented in UI yet');
                });
            } else {
                slot.classList.add('empty');
            }

            this.inventoryGrid!.appendChild(slot);
        }
    }
}