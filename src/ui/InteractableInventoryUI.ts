import { GameActor } from '../components/GameActor';
import { ItemEntity } from '../factories/ItemFactory';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { InventoryComponent } from '../components/InventoryComponent';
import { InteractableComponent } from '../components/InteractableComponent';
import { Inventory } from '../items/Inventory';

export class InteractableInventoryUI {
    private container: HTMLElement | null = null;
    private leftGridContainer: HTMLElement | null = null;
    private rightGridContainer: HTMLElement | null = null;
    private closeButton: HTMLElement | null = null;
    private titleElement: HTMLElement | null = null;
    private interactableInventory: Inventory | null = null;
    private interactableComponent: InteractableComponent | null = null;
    private playerActor: GameActor | null = null;
    private isOpen: boolean = false;
    
    // Drag & Drop State
    private draggedItem: ItemEntity | null = null;
    private draggedFromIndex: number = -1;
    private draggedFromSide: 'left' | 'right' = 'left';

    constructor() {
        this.initialize();
    }

    private initialize() {
        this.createDOMElements();
        this.setupEventListeners();
    }

    private createDOMElements() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'interactable-inventory-screen';
        this.container.className = 'inventory-screen';
        this.container.style.display = 'none';
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.container.style.zIndex = '1000';
        this.container.style.alignItems = 'center';
        this.container.style.justifyContent = 'center';

        // Create content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'inventory-content';
        contentContainer.style.backgroundColor = '#1f1f1f';
        contentContainer.style.border = '2px solid #444';
        contentContainer.style.borderRadius = '8px';
        contentContainer.style.padding = '20px';
        contentContainer.style.minWidth = '800px';
        contentContainer.style.minHeight = '400px';
        contentContainer.style.display = 'flex';
        contentContainer.style.flexDirection = 'column';
        contentContainer.style.position = 'relative';

        // Title
        this.titleElement = document.createElement('h2');
        this.titleElement.style.color = '#fff';
        this.titleElement.style.margin = '0 0 20px 0';
        this.titleElement.style.textAlign = 'center';
        this.titleElement.innerText = 'Container Inventory';

        // Close button
        this.closeButton = document.createElement('button');
        this.closeButton.innerText = '×';
        this.closeButton.style.position = 'absolute';
        this.closeButton.style.top = '10px';
        this.closeButton.style.right = '10px';
        this.closeButton.style.background = 'none';
        this.closeButton.style.border = 'none';
        this.closeButton.style.color = '#fff';
        this.closeButton.style.fontSize = '24px';
        this.closeButton.style.cursor = 'pointer';
        this.closeButton.style.zIndex = '1001';

        // Create two-panel layout
        const panelContainer = document.createElement('div');
        panelContainer.style.display = 'flex';
        panelContainer.style.gap = '20px';
        panelContainer.style.flex = '1';

        // Left panel (interactable inventory)
        const leftPanel = document.createElement('div');
        leftPanel.style.flex = '1';
        leftPanel.style.display = 'flex';
        leftPanel.style.flexDirection = 'column';

        const leftTitle = document.createElement('h3');
        leftTitle.innerText = 'Container';
        leftTitle.style.color = '#fff';
        leftTitle.style.margin = '0 0 10px 0';

        this.leftGridContainer = document.createElement('div');
        this.leftGridContainer.className = 'inventory-grid';
        this.leftGridContainer.style.display = 'grid';
        this.leftGridContainer.style.gridTemplateColumns = 'repeat(5, 1fr)';
        this.leftGridContainer.style.gap = '2px';
        this.leftGridContainer.style.backgroundColor = '#333';
        this.leftGridContainer.style.padding = '10px';
        this.leftGridContainer.style.borderRadius = '4px';

        leftPanel.appendChild(leftTitle);
        leftPanel.appendChild(this.leftGridContainer);

        // Right panel (player inventory)
        const rightPanel = document.createElement('div');
        rightPanel.style.flex = '1';
        rightPanel.style.display = 'flex';
        rightPanel.style.flexDirection = 'column';

        const rightTitle = document.createElement('h3');
        rightTitle.innerText = 'Your Inventory';
        rightTitle.style.color = '#fff';
        rightTitle.style.margin = '0 0 10px 0';

        this.rightGridContainer = document.createElement('div');
        this.rightGridContainer.className = 'inventory-grid';
        this.rightGridContainer.style.display = 'grid';
        this.rightGridContainer.style.gridTemplateColumns = 'repeat(5, 1fr)';
        this.rightGridContainer.style.gap = '2px';
        this.rightGridContainer.style.backgroundColor = '#333';
        this.rightGridContainer.style.padding = '10px';
        this.rightGridContainer.style.borderRadius = '4px';

        rightPanel.appendChild(rightTitle);
        rightPanel.appendChild(this.rightGridContainer);

        panelContainer.appendChild(leftPanel);
        panelContainer.appendChild(rightPanel);

        contentContainer.appendChild(this.titleElement);
        contentContainer.appendChild(this.closeButton);
        contentContainer.appendChild(panelContainer);
        this.container.appendChild(contentContainer);

        // Add to document
        document.body.appendChild(this.container);
    }

    private setupEventListeners() {
        // Close button
        this.closeButton?.addEventListener('click', () => this.close());
        
        // Close on outside click
        this.container?.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.close();
            }
        });

        // Listen for interactable inventory open events
        EventBus.instance.on('interactable:open_inventory', (event: any) => {
            this.openInteractableInventory(event.interactable, event.inventory, event.entity);
        });
    }

    public openInteractableInventory(
        interactable: InteractableComponent, 
        inventory: Inventory, 
        playerActor: GameActor
    ) {
        this.interactableComponent = interactable;
        this.interactableInventory = inventory;
        this.playerActor = playerActor;
        
        if (this.titleElement) {
            this.titleElement.innerText = `${interactable.interactableDefinition.name} Inventory`;
        }

        this.open();
    }

    private open() {
        if (!this.container) return;
        this.isOpen = true;
        this.container.style.display = 'flex';
        this.refresh();
    }

    private close() {
        if (!this.container) return;
        this.isOpen = false;
        this.container.style.display = 'none';
        
        this.interactableComponent = null;
        this.interactableInventory = null;
        this.playerActor = null;
    }

    private refresh() {
        if (!this.isOpen || !this.interactableInventory || !this.playerActor) return;
        
        this.renderInteractableInventory();
        this.renderPlayerInventory();
    }

    private renderInteractableInventory() {
        if (!this.leftGridContainer || !this.interactableInventory) return;

        this.leftGridContainer.innerHTML = '';
        const capacity = this.interactableInventory.capacity;

        for (let i = 0; i < capacity; i++) {
            const item = this.interactableInventory.getItem(i);
            const slot = this.createSlotElement(item, i, 'left');
            this.leftGridContainer.appendChild(slot);
        }
    }

    private renderPlayerInventory() {
        if (!this.rightGridContainer || !this.playerActor) return;

        const inventoryComponent = this.playerActor.getGameComponent<InventoryComponent>('inventory');
        if (!inventoryComponent) return;

        this.rightGridContainer.innerHTML = '';
        const items = inventoryComponent.items || [];
        const capacity = inventoryComponent.maxSize || 20;

        for (let i = 0; i < capacity; i++) {
            const item = items[i] || null;
            const slot = this.createSlotElement(item, i, 'right');
            this.rightGridContainer.appendChild(slot);
        }
    }

    private createSlotElement(item: ItemEntity | null, index: number, side: 'left' | 'right'): HTMLElement {
        const slot = document.createElement('div');
        slot.className = 'item-slot';
        slot.style.width = '48px';
        slot.style.height = '48px';
        slot.style.backgroundColor = '#555';
        slot.style.border = '1px solid #777';
        slot.style.borderRadius = '4px';
        slot.style.display = 'flex';
        slot.style.alignItems = 'center';
        slot.style.justifyContent = 'center';
        slot.style.position = 'relative';
        slot.style.cursor = 'pointer';
        
        if (item) {
            slot.appendChild(this.createItemContent(item));
            this.setRarityClass(slot, item);
        }

        this.attachSlotEvents(slot, item, index, side);
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
            icon.style.width = '32px';
            icon.style.height = '32px';
        }
        
        fragment.appendChild(icon);

        // Count
        if (item.count > 1) {
            const count = document.createElement('div');
            count.className = 'item-count';
            count.style.position = 'absolute';
            count.style.bottom = '2px';
            count.style.right = '2px';
            count.style.fontSize = '8px';
            count.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            count.style.padding = '1px 3px';
            count.style.borderRadius = '2px';
            count.style.color = '#fff';
            count.innerText = item.count.toString();
            fragment.appendChild(count);
        }

        // Rarity Bar
        const rarityBar = document.createElement('div');
        rarityBar.className = 'item-rarity-bar';
        rarityBar.style.position = 'absolute';
        rarityBar.style.bottom = '0';
        rarityBar.style.left = '0';
        rarityBar.style.right = '0';
        rarityBar.style.height = '2px';
        rarityBar.style.backgroundColor = this.getRarityColor(item);
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
        let hash = 0;
        for (let i = 0; i < item.definition.name.length; i++) {
            hash = item.definition.name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
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

    private attachSlotEvents(slot: HTMLElement, item: ItemEntity | null, index: number, side: 'left' | 'right') {
        // Click to transfer item
        slot.addEventListener('click', (e) => {
            e.stopPropagation();
            if (item) {
                this.transferItem(item, index, side);
            }
        });

        // Drag & Drop
        if (item) {
            slot.draggable = true;
            slot.addEventListener('dragstart', (e) => {
                this.draggedItem = item;
                this.draggedFromIndex = index;
                this.draggedFromSide = side;
                slot.style.opacity = '0.5';
            });

            slot.addEventListener('dragend', () => {
                slot.style.opacity = '1';
                this.draggedItem = null;
                this.draggedFromIndex = -1;
            });
        }

        // Drop target
        slot.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.draggedItem) {
                slot.style.backgroundColor = '#666';
            }
        });

        slot.addEventListener('dragleave', () => {
            slot.style.backgroundColor = '#555';
        });

        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            slot.style.backgroundColor = '#555';
            
            if (this.draggedItem) {
                this.handleDrop(index, side);
            }
        });

        // Hover tooltip
        slot.addEventListener('mouseenter', (e) => {
            if (item) {
                this.showTooltip(item, e.clientX, e.clientY);
            }
        });

        slot.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
    }

    private transferItem(item: ItemEntity, fromIndex: number, fromSide: 'left' | 'right') {
        if (fromSide === 'left') {
            // Transfer from container to player
            this.moveFromContainerToPlayer(item, fromIndex);
        } else {
            // Transfer from player to container
            this.moveFromPlayerToContainer(item, fromIndex);
        }
    }

    private moveFromContainerToPlayer(item: ItemEntity, fromIndex: number) {
        if (!this.playerActor || !this.interactableInventory) return;

        const inventoryComponent = this.playerActor.getGameComponent<InventoryComponent>('inventory');
        if (!inventoryComponent) return;

        const success = inventoryComponent.addItemEntity(item);
        if (success) {
            this.interactableInventory.drop(fromIndex);
            Logger.info(`Transferred ${item.getDisplayName()} to player inventory`);
            this.refresh();
        } else {
            Logger.warn('Player inventory is full');
        }
    }

    private moveFromPlayerToContainer(item: ItemEntity, fromIndex: number) {
        if (!this.playerActor || !this.interactableInventory) return;

        const inventoryComponent = this.playerActor.getGameComponent<InventoryComponent>('inventory');
        if (!inventoryComponent) return;

        const success = this.interactableInventory.addItem(item);
        if (success) {
            inventoryComponent.removeItemAtIndex(fromIndex);
            Logger.info(`Transferred ${item.getDisplayName()} to container`);
            this.refresh();
        } else {
            Logger.warn('Container is full');
        }
    }

    private handleDrop(targetIndex: number, targetSide: 'left' | 'right') {
        if (!this.draggedItem) return;

        if (this.draggedFromSide !== targetSide) {
            // Cross-side transfer
            this.transferItem(this.draggedItem, this.draggedFromIndex, this.draggedFromSide);
        } else {
            // Same side - swap items
            this.swapItems(this.draggedFromIndex, targetIndex, targetSide);
        }
    }

    private swapItems(fromIndex: number, toIndex: number, side: 'left' | 'right') {
        if (fromIndex === toIndex) return;

        if (side === 'left' && this.interactableInventory) {
            this.interactableInventory.swap(fromIndex, toIndex);
        } else if (side === 'right' && this.playerActor) {
            const inventoryComponent = this.playerActor.getGameComponent<InventoryComponent>('inventory');
            if (inventoryComponent) {
                // Manual swap since InventoryComponent doesn't have swap method
                const temp = inventoryComponent.items[fromIndex];
                inventoryComponent.items[fromIndex] = inventoryComponent.items[toIndex];
                inventoryComponent.items[toIndex] = temp;
            }
        }

        this.refresh();
    }

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
        tooltip.style.position = 'absolute';
        tooltip.style.backgroundColor = '#1f1f1f';
        tooltip.style.color = '#fff';
        tooltip.style.border = '1px solid #444';
        tooltip.style.borderRadius = '4px';
        tooltip.style.padding = '8px 12px';
        tooltip.style.fontSize = '12px';
        tooltip.style.lineHeight = '1.4';
        tooltip.style.zIndex = '1002';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.maxWidth = '300px';
        tooltip.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        document.body.appendChild(tooltip);
        return tooltip;
    }
}