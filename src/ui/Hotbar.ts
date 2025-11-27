import { UIComponent } from './components/UIComponent';
import { EventBus } from '../core/EventBus';
import { GameEventNames, InventoryChangeEvent } from '../core/GameEvents';
import { SpriteMapper } from './SpriteMapper';
import { GameActor } from '../components/GameActor';
import { InventoryComponent } from '../components/InventoryComponent';
import { ItemEntity } from '../factories/ItemFactory';
import { Logger } from '../core/Logger';

export class Hotbar extends UIComponent {
    private slots: HTMLElement[] = [];
    private hotbarItems: (ItemEntity | null)[] = [];
    private readonly SLOT_COUNT = 5;

    constructor(private hero: GameActor, private onInventoryToggle?: () => void) {
        super('#hotbar');
        this.hotbarItems = new Array(this.SLOT_COUNT).fill(null);
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

            // Click handler for using items
            slot.addEventListener('click', (event) => {
                this.handleSlotClick(i, event);
            });
            
            // Context menu for moving items
            slot.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                this.handleSlotRightClick(i);
            });
            
            // Drag and drop support
            slot.addEventListener('dragover', this.handleDragOver.bind(this));
            slot.addEventListener('drop', (event) => this.handleDrop(event, i));

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
            // Hotbar doesn't automatically update from inventory changes
            // It maintains its own state
        });
    }

    private updateSlots(): void {
        for (let i = 0; i < this.SLOT_COUNT; i++) {
            const item = this.hotbarItems[i];
            const slot = this.slots[i];
            
            // Clear previous content (except hotkey)
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
                slot.title = `${item.getDisplayName()}\nRight-click to remove\nClick to use\n\n${item.definition.description || ''}`;
                slot.className = `slot ${SpriteMapper.getCSSClass(item)}`;
                
                // Make draggable
                icon.draggable = true;
                icon.addEventListener('dragstart', (event) => this.handleDragStart(event, i));
            } else {
                slot.title = 'Empty hotbar slot\nDrag item here or right-click inventory item';
                slot.className = 'slot empty-hotbar-slot';
            }
        }
    }

    private handleSlotClick(index: number, event: MouseEvent): void {
        const item = this.hotbarItems[index];
        
        if (item) {
            Logger.info(`[Hotbar] Using item from slot ${index + 1}: ${item.definition.name}`);
            this.useHotbarItem(index);
        }
    }
    
    private handleSlotRightClick(index: number): void {
        const item = this.hotbarItems[index];
        
        if (item) {
            // Remove from hotbar and return to inventory
            this.removeFromHotbar(index);
        }
    }
    
    private handleDragStart(event: DragEvent, index: number): void {
        if (event.dataTransfer) {
            event.dataTransfer.setData('text/plain', `hotbar:${index}`);
            event.dataTransfer.effectAllowed = 'move';
        }
    }
    
    private handleDragOver(event: DragEvent): void {
        event.preventDefault();
        event.dataTransfer!.dropEffect = 'move';
    }
    
    private handleDrop(event: DragEvent, targetIndex: number): void {
        event.preventDefault();
        
        const data = event.dataTransfer?.getData('text/plain');
        if (!data) return;
        
        if (data.startsWith('inventory:')) {
            // Moving from inventory to hotbar
            const inventoryIndex = parseInt(data.split(':')[1]);
            this.moveFromInventoryToHotbar(inventoryIndex, targetIndex);
        } else if (data.startsWith('hotbar:')) {
            // Moving within hotbar
            const sourceIndex = parseInt(data.split(':')[1]);
            this.swapHotbarSlots(sourceIndex, targetIndex);
        }
    }
    
    // Public methods for external use (like numkey presses)
    public useSlot(slotNumber: number): void {
        if (slotNumber >= 1 && slotNumber <= this.SLOT_COUNT) {
            this.useHotbarItem(slotNumber - 1);
        }
    }
    
    public addToHotbar(item: ItemEntity): boolean {
        // Find first empty slot
        for (let i = 0; i < this.SLOT_COUNT; i++) {
            if (!this.hotbarItems[i]) {
                this.hotbarItems[i] = item;
                this.updateSlots();
                return true;
            }
        }
        return false; // No empty slots
    }
    
    public removeFromHotbar(index: number): ItemEntity | null {
        const item = this.hotbarItems[index];
        if (item) {
            this.hotbarItems[index] = null;
            this.updateSlots();
            
            // Return to inventory
            const inventoryComp = this.hero.getGameComponent('inventory') as InventoryComponent;
            if (inventoryComp) {
                const success = inventoryComp.addItemEntity(item);
                if (!success) {
                    // If inventory full, put back in hotbar
                    this.hotbarItems[index] = item;
                    this.updateSlots();
                    Logger.warn('[Hotbar] Cannot return item to inventory - inventory full');
                    return null;
                }
            }
        }
        return item;
    }
    
    private useHotbarItem(index: number): void {
        const item = this.hotbarItems[index];
        if (!item) return;
        
        const inventoryComp = this.hero.getGameComponent('inventory') as InventoryComponent;
        if (!inventoryComp) return;
        
        // Use the item
        const success = inventoryComp.useItem(item.id);
        
        if (success) {
            // If item was consumed, remove from hotbar
            if (item.count <= 0) {
                this.hotbarItems[index] = null;
                this.updateSlots();
            } else {
                // Update count display
                this.updateSlots();
            }
        }
    }
    
    private moveFromInventoryToHotbar(inventoryIndex: number, hotbarIndex: number): void {
        const inventoryComp = this.hero.getGameComponent('inventory') as InventoryComponent;
        if (!inventoryComp) return;
        
        const items = inventoryComp.getItems();
        const item = items[inventoryIndex];
        
        if (item) {
            // If hotbar slot occupied, swap
            const existingItem = this.hotbarItems[hotbarIndex];
            if (existingItem) {
                // Return existing item to inventory at the source position
                inventoryComp.setItemAtIndex(inventoryIndex, existingItem);
            } else {
                // Remove item from inventory
                inventoryComp.removeItemAtIndex(inventoryIndex);
            }
            
            // Place in hotbar
            this.hotbarItems[hotbarIndex] = item;
            this.updateSlots();
        }
    }
    
    private swapHotbarSlots(sourceIndex: number, targetIndex: number): void {
        const temp = this.hotbarItems[sourceIndex];
        this.hotbarItems[sourceIndex] = this.hotbarItems[targetIndex];
        this.hotbarItems[targetIndex] = temp;
        this.updateSlots();
    }
}