import { GameActor } from '../components/GameActor';
import { ItemEntity } from '../factories/ItemFactory';
import { EventBus } from '../core/EventBus';
import { GameEventNames } from '../core/GameEvents';
import { Logger } from '../core/Logger';
import { ItemType, EquipmentSlotType } from '../data/items';
import { InventoryComponent } from '../components/InventoryComponent';
import { EquipmentComponent } from '../components/EquipmentComponent';

export class InventoryUI {
    private container: HTMLElement | null = null;
    private gridContainer: HTMLElement | null = null;
    private closeButton: HTMLElement | null = null;
    private hero: GameActor | null = null;
    private isOpen: boolean = false;
    
    // Drag & Drop State
    private draggedItem: ItemEntity | null = null;
    private draggedFromIndex: number = -1;
    private draggedFromType: 'inventory' | 'equipment' = 'inventory';
    private draggedFromSlotType: EquipmentSlotType | null = null;

    constructor() {
        this.initialize();
    }

    private initialize() {
        this.container = document.getElementById('inventory-screen');
        this.gridContainer = document.getElementById('inventory-grid');
        this.closeButton = document.getElementById('inventory-close');

        if (!this.container || !this.gridContainer) {
            Logger.error('[InventoryUI] Failed to find DOM elements');
            return;
        }

        // Event Listeners
        this.closeButton?.addEventListener('click', () => this.close());
        
        // Close on outside click
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.close();
            }
        });

        // Global Event Bus Listeners
        EventBus.instance.on(GameEventNames.InventoryChange, () => this.refresh());
        EventBus.instance.on(GameEventNames.EquipmentEquipped, () => this.refresh());
        EventBus.instance.on(GameEventNames.EquipmentUnequipped, () => this.refresh());
        EventBus.instance.on(GameEventNames.ItemUse, () => this.refresh());
        
        // Initial setup of equipment slots
        this.setupEquipmentSlots();
    }

    public setHero(hero: GameActor) {
        this.hero = hero;
        this.refresh();
    }

    public toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    public open() {
        if (!this.container) return;
        this.isOpen = true;
        this.container.style.display = 'flex';
        this.refresh();
    }

    public close() {
        if (!this.container) return;
        this.isOpen = false;
        this.container.style.display = 'none';
        
        // Clear tooltip
        const tooltip = document.getElementById('ui-tooltip');
        if (tooltip) tooltip.style.display = 'none';
    }

    public refresh() {
        if (!this.hero || !this.isOpen) return;
        Logger.info('[InventoryUI] Refreshing inventory UI');
        this.renderInventory();
        this.renderEquipment();
    }

    private renderInventory() {
        if (!this.gridContainer || !this.hero) return;

        const inventory = this.hero.getGameComponent<InventoryComponent>('inventory');
        if (!inventory) return;

        Logger.info(`[InventoryUI] Rendering ${inventory.items.length} items`);
        this.gridContainer.innerHTML = '';
        const items = inventory.items || [];
        const capacity = inventory.maxSize || 20;

        for (let i = 0; i < capacity; i++) {
            const item = items[i];
            const slot = this.createSlotElement(item, i, 'inventory');
            this.gridContainer.appendChild(slot);
        }
    }

    private renderEquipment() {
        if (!this.hero) return;

        // Update Main Hand
        this.updateEquipmentSlot(EquipmentSlotType.MainHand, this.hero.weapon);
        
        // Update Body
        this.updateEquipmentSlot(EquipmentSlotType.Body, this.hero.armor);
        
        // Update Accessory (handling array)
        const accessory = this.hero.accessories.length > 0 ? this.hero.accessories[0] : null;
        this.updateEquipmentSlot(EquipmentSlotType.Accessory, accessory);
    }

    private updateEquipmentSlot(type: EquipmentSlotType, item: ItemEntity | null) {
        const slot = document.querySelector(`.equipment-slot[data-slot-type="${type}"]`) as HTMLElement;
        if (!slot) return;

        // Clear existing content
        slot.innerHTML = '';
        
        // Remove old event listeners (by cloning)
        const newSlot = slot.cloneNode(false) as HTMLElement;
        slot.parentNode?.replaceChild(newSlot, slot);
        
        // Re-attach standard listeners
        this.attachSlotEvents(newSlot, item, -1, 'equipment', type);

        if (item) {
            newSlot.appendChild(this.createItemContent(item));
            
            // Add rarity class
            this.setRarityClass(newSlot, item);
        } else {
            newSlot.className = 'equipment-slot'; // Reset classes
        }
    }

    private setupEquipmentSlots() {
        // Initial setup for static equipment slots (listeners are re-attached in updateEquipmentSlot)
        // This might be redundant if we always call refresh(), but good for safety.
    }

    private createSlotElement(item: ItemEntity | null, index: number, context: 'inventory' | 'equipment'): HTMLElement {
        const slot = document.createElement('div');
        slot.className = 'item-slot';
        
        if (item) {
            slot.appendChild(this.createItemContent(item));
            this.setRarityClass(slot, item);
        }

        this.attachSlotEvents(slot, item, index, context);

        return slot;
    }

    private createItemContent(item: ItemEntity): HTMLElement {
        const fragment = document.createDocumentFragment();

        // Icon
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
            icon.style.fontSize = '12px';
            icon.style.color = 'rgba(255,255,255,0.8)';
        }
        
        fragment.appendChild(icon);

        // Count
        if (item.count > 1) {
            const count = document.createElement('div');
            count.className = 'item-count';
            count.innerText = item.count.toString();
            fragment.appendChild(count);
        }

        // Rarity Bar
        const rarityBar = document.createElement('div');
        rarityBar.className = 'item-rarity-bar';
        fragment.appendChild(rarityBar);

        return fragment as unknown as HTMLElement;
    }

    private setRarityClass(element: HTMLElement, item: ItemEntity) {
        // Remove old rarity classes
        element.classList.remove('rarity-common', 'rarity-uncommon', 'rarity-rare', 'rarity-epic', 'rarity-legendary', 'rarity-cursed');
        
        // Add new
        if (item.curses.length > 0) element.classList.add('rarity-cursed');
        else if (item.definition.rarity) element.classList.add(`rarity-${item.definition.rarity}`);
        else element.classList.add('rarity-common');
    }

    private getItemColor(item: ItemEntity): string {
        // Generate a consistent color from item name
        let hash = 0;
        for (let i = 0; i < item.definition.name.length; i++) {
            hash = item.definition.name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    }

    private attachSlotEvents(
        slot: HTMLElement, 
        item: ItemEntity | null, 
        index: number, 
        context: 'inventory' | 'equipment',
        slotType?: EquipmentSlotType
    ) {
        // Click (Select/Use)
        slot.addEventListener('click', (e) => {
            e.stopPropagation();
            if (e.shiftKey && item) {
                // Shift+Click to drop? Or split?
                Logger.info(`Shift+Click on ${item.definition.name}`);
            } else {
                this.handleSlotClick(item, index, context, slotType);
            }
        });

        // Right Click (Equip/Use)
        slot.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleSlotRightClick(item, index, context, slotType);
        });

        // Hover (Tooltip)
        slot.addEventListener('mouseenter', (e) => {
            this.showTooltip(item, e.clientX, e.clientY);
            const nameDisplay = document.getElementById('hover-item-name');
            if (nameDisplay) {
                nameDisplay.innerText = item ? item.getDisplayName() : '';
            }
        });

        slot.addEventListener('mouseleave', () => {
            this.hideTooltip();
            const nameDisplay = document.getElementById('hover-item-name');
            if (nameDisplay) {
                nameDisplay.innerText = 'Hover over an item';
            }
        });

        // Drag & Drop
        if (item) {
            slot.draggable = true;
            slot.addEventListener('dragstart', (e) => {
                this.draggedItem = item;
                this.draggedFromIndex = index;
                this.draggedFromType = context;
                this.draggedFromSlotType = slotType || null;
                
                slot.classList.add('dragging');
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = 'move';
                    // e.dataTransfer.setDragImage(slot, 24, 24); // Optional custom drag image
                }
            });

            slot.addEventListener('dragend', () => {
                slot.classList.remove('dragging');
                this.draggedItem = null;
                this.draggedFromIndex = -1;
                this.draggedFromSlotType = null;
            });
        }

        // Drop Target
        slot.addEventListener('dragover', (e) => {
            e.preventDefault(); // Allow drop
            if (this.draggedItem) {
                e.dataTransfer!.dropEffect = 'move';
                slot.classList.add('drag-over');
            }
        });

        slot.addEventListener('dragleave', () => {
            slot.classList.remove('drag-over');
        });

        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            slot.classList.remove('drag-over');
            this.handleDrop(index, context, slotType);
        });
    }

    // ... (setRarityClass, getItemColor, attachSlotEvents remain same)

    private handleSlotClick(item: ItemEntity | null, index: number, context: string, slotType?: EquipmentSlotType) {
        if (!this.hero) return;

        if (context === 'equipment' && slotType) {
            // Unequip on click
            const equipment = this.hero.getGameComponent<EquipmentComponent>('equipment');
            if (equipment && item) {
                Logger.info(`Unequipping slot ${slotType}`);
                const componentSlot = this.mapSlotTypeToComponentKey(slotType);
                if (componentSlot) {
                    equipment.unequip(componentSlot);
                }
            }
        } else if (item) {
            // Use item (inventory)
            Logger.info(`Clicked ${item.definition.name} - Using item`);
            item.use(this.hero);
        }
    }

    private handleSlotRightClick(item: ItemEntity | null, index: number, context: string, slotType?: EquipmentSlotType) {
        if (!item || !this.hero) return;

        Logger.info(`Right-clicked ${item.definition.name} in ${context}`);

        // Right click also uses/equips/unequips
        if (context === 'inventory') {
            item.use(this.hero);
        } else if (context === 'equipment' && slotType) {
            const equipment = this.hero.getGameComponent<EquipmentComponent>('equipment');
            if (equipment) {
                Logger.info(`Unequipping slot ${slotType}`);
                const componentSlot = this.mapSlotTypeToComponentKey(slotType);
                if (componentSlot) {
                    equipment.unequip(componentSlot);
                }
            }
        }
    }

    private mapSlotTypeToComponentKey(slotType: EquipmentSlotType): string | null {
        switch (slotType) {
            case EquipmentSlotType.MainHand: return 'weapon';
            case EquipmentSlotType.Body: return 'armor';
            case EquipmentSlotType.Accessory: return 'accessory';
            default: return null;
        }
    }

    private handleDrop(targetIndex: number, targetContext: string, targetSlotType?: EquipmentSlotType) {
        if (!this.draggedItem || !this.hero) return;

        Logger.info(`Dropped ${this.draggedItem.definition.name} from ${this.draggedFromType} to ${targetContext}`);

        const inventory = this.hero.getGameComponent<InventoryComponent>('inventory');
        const equipment = this.hero.getGameComponent<EquipmentComponent>('equipment');
        
        if (!inventory || !equipment) return;

        if (this.draggedFromType === 'inventory' && targetContext === 'inventory') {
            // Swap in inventory
            if (this.draggedFromIndex !== targetIndex) {
                // Manual swap since InventoryComponent doesn't have swap method yet
                const temp = inventory.items[this.draggedFromIndex];
                inventory.items[this.draggedFromIndex] = inventory.items[targetIndex];
                inventory.items[targetIndex] = temp;
                // Emit change event manually? Or add swap method to component.
                // Let's just access items directly for now as they are public.
            }
        } else if (this.draggedFromType === 'inventory' && targetContext === 'equipment') {
            // Equip from inventory to specific slot
            if (targetSlotType) {
                // Check if item fits slot
                if (this.canEquipInSlot(this.draggedItem, targetSlotType)) {
                    equipment.equip(this.draggedItem); 
                } else {
                    Logger.warn(`Cannot equip ${this.draggedItem.definition.name} in ${targetSlotType}`);
                }
            }
        } else if (this.draggedFromType === 'equipment' && targetContext === 'inventory') {
            // Unequip to inventory slot
            if (this.draggedFromSlotType) {
                const componentSlot = this.mapSlotTypeToComponentKey(this.draggedFromSlotType);
                if (componentSlot) {
                    equipment.unequip(componentSlot);
                }
            }
        }
        
        // Refresh handled by events
    }

    private canEquipInSlot(item: ItemEntity, slotType: EquipmentSlotType): boolean {
        const type = item.definition.type;
        const id = item.id.toLowerCase();
        
        switch (slotType) {
            case EquipmentSlotType.MainHand:
                return type === ItemType.WEAPON || id.includes('sword') || id.includes('dagger') || id.includes('wand') || id.includes('hammer') || id.includes('staff') || id.includes('whip');
            case EquipmentSlotType.Body:
                return type === ItemType.ARMOR || id.includes('armor') || id.includes('plate') || id.includes('robe') || id.includes('suit') || id.includes('sweater');
            case EquipmentSlotType.Accessory:
                return type === ItemType.ARTIFACT || id.includes('ring') || id.includes('amulet') || id.includes('globe') || id.includes('bell') || id.includes('compass');
            default:
                return false;
        }
    }

    // --- Tooltip ---

    private showTooltip(item: ItemEntity | null, x: number, y: number) {
        if (!item) return;

        const tooltip = document.getElementById('ui-tooltip') || this.createTooltipElement();
        tooltip.style.display = 'block';
        tooltip.style.left = `${x + 15}px`;
        tooltip.style.top = `${y + 15}px`;

        let content = `<span class="tooltip-title" style="color: ${this.getRarityColor(item)}">${item.getDisplayName()}</span>`;
        
        if (item.definition.description) {
            content += `<span class="tooltip-desc">${item.definition.description}</span>`;
        }
        
        // Detailed Stats
        if (item.identified) {
            // Base Stats + Bonus Stats
            const stats = { ...item.definition.stats, ...item.bonusStats };
            
            if (Object.keys(stats).length > 0) {
                content += `<div class="tooltip-stats">`;
                for (const [stat, value] of Object.entries(stats)) {
                    if (value !== 0) {
                        // Format stat name (e.g. maxHp -> Max HP)
                        const formattedStat = stat.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        content += `<div>${formattedStat}: ${value > 0 ? '+' : ''}${value}</div>`;
                    }
                }
                content += `</div>`;
            }

            // Effects (Consumables/Artifacts)
            if (item.definition.effects && item.definition.effects.length > 0) {
                content += `<div class="tooltip-effects" style="margin-top: 4px; color: #60a5fa;">`;
                item.definition.effects.forEach((effect: any) => {
                    const effectName = effect.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
                    content += `<div>• ${effectName}: ${effect.value}</div>`;
                });
                content += `</div>`;
            }
            
            // Enchantments
            if (item.enchantments.length > 0) {
                content += `<div class="tooltip-enchantments">`;
                item.enchantments.forEach((ench: any) => {
                    content += `<div style="color: #a78bfa">• ${ench.name || 'Enchanted'}</div>`;
                });
                content += `</div>`;
            }
            
            // Curses
            if (item.curses.length > 0) {
                content += `<div class="tooltip-curses" style="color: #ef4444">`;
                item.curses.forEach((curse: any) => {
                    content += `<div>• ${curse.name || 'Cursed'}</div>`;
                });
                content += `</div>`;
            }
        } else {
            content += `<div style="color: #9ca3af; font-style: italic; margin-top: 4px;">Unidentified</div>`;
        }

        tooltip.innerHTML = content;
    }

    private hideTooltip() {
        const tooltip = document.getElementById('ui-tooltip');
        if (tooltip) tooltip.style.display = 'none';
    }

    private createTooltipElement(): HTMLElement {
        const tooltip = document.createElement('div');
        tooltip.id = 'ui-tooltip';
        document.body.appendChild(tooltip);
        return tooltip;
    }

    private getRarityColor(item: ItemEntity): string {
        if (item.curses.length > 0) return '#dc2626'; // Red
        switch (item.definition.rarity) {
            case 'legendary': return '#f59e0b'; // Gold
            case 'epic': return '#8b5cf6'; // Purple
            case 'rare': return '#3b82f6'; // Blue
            case 'uncommon': return '#22c55e'; // Green
            default: return '#9ca3af'; // Gray
        }
    }
}
