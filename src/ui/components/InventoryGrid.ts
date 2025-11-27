import * as ex from 'excalibur';
import { UITheme } from '../UITheme';
import { ItemSlot, ItemSlotConfig } from './ItemSlot';
import { Inventory } from '../../items/Inventory';
import { ItemEntity } from '../../factories/ItemFactory';

export interface InventoryGridConfig {
    rows: number;
    cols: number;
    slotSize: number;
    padding: number;
    showHotbarRow?: boolean;
    onItemClick?: (item: ItemEntity | null, slotIndex: number) => void;
    onItemRightClick?: (item: ItemEntity | null, slotIndex: number) => void;
    onItemDragStart?: (item: ItemEntity, slotIndex: number) => void;
    onItemDragEnd?: (item: ItemEntity | null, slotIndex: number) => void;
    onSlotSwap?: (fromIndex: number, toIndex: number) => void;
}

export class InventoryGrid extends ex.Actor {
    private config: InventoryGridConfig;
    private inventory: Inventory | null = null;
    
    // Visuals
    private background!: ex.Rectangle;
    private titleText!: ex.Text;
    private slots: ItemSlot[] = [];
    
    // State
    private draggedItem: ItemEntity | null = null;
    private draggedFromIndex: number = -1;
    
    constructor(config: InventoryGridConfig) {
        // Calculate dimensions
        const width = config.cols * (config.slotSize + config.padding) + config.padding;
        const height = config.rows * (config.slotSize + config.padding) + config.padding + 30; // +30 for title
        
        super({
            width: width,
            height: height,
            name: 'InventoryGrid',
        });
        
        this.config = config;
    }
    
    onInitialize(engine: ex.Engine) {
        this.initializeVisuals();
        this.createSlots();
    }
    
    private initializeVisuals() {
        this.background = UITheme.createRectangle(
            this.width,
            this.height,
            {
                fillColor: UITheme.Colors.panel,
                strokeColor: UITheme.Colors.border,
                strokeWidth: UITheme.Layout.borderWidth.medium
            }
        );
        
        this.titleText = UITheme.createText('Inventory', 'title');
        
        // Add background and title to graphics
        const group = new ex.GraphicsGroup({
            members: [
                { graphic: this.background, offset: ex.vec(0, 0) },
                { graphic: this.titleText, offset: ex.vec(this.config.padding, 15) }
            ],
            useAnchor: false // Position from top-left for consistent layout
        });
        
        // Add hotbar separator line if needed
        if (this.config.showHotbarRow) {
            // Thin rectangle as separator line
            const hotbarY = 25 + this.config.padding + this.config.slotSize + this.config.padding / 2;
            const line = new ex.Rectangle({
                width: this.width - this.config.padding * 2,
                height: 1,
                color: UITheme.Colors.border
            });
            
            group.members.push({ 
                graphic: line, 
                offset: ex.vec(this.config.padding, hotbarY) 
            });
            
            // Hotbar label
            const hotbarLabel = UITheme.createText('Hotbar', 'small', UITheme.Colors.textSecondary);
            group.members.push({
                graphic: hotbarLabel,
                offset: ex.vec(this.width - 50, 30 + this.config.slotSize)
            });
        }
        
        this.graphics.use(group);
    }
    
    private createSlots() {
        const totalSlots = this.config.rows * this.config.cols;
        
        for (let i = 0; i < totalSlots; i++) {
            const slotConfig: ItemSlotConfig = {
                size: this.config.slotSize,
                showCount: true,
                showHotkey: this.config.showHotbarRow && i < this.config.cols, // First row is hotbar
                hotkey: (i + 1).toString(),
                acceptsItemType: (item: ItemEntity) => true, // Inventory accepts all items
                onItemClick: (item, slotIndex) => this.handleSlotClick(item, i),
                onItemRightClick: (item, slotIndex) => this.handleSlotRightClick(item, i),
                onItemDragStart: (item, slotIndex) => this.onDragStart(item, i),
                onItemDragEnd: (item, slotIndex) => this.handleDragEnd(item, i)
            };
            
            const slot = new ItemSlot(slotConfig, i);
            
            // Position slot
            const row = Math.floor(i / this.config.cols);
            const col = i % this.config.cols;
            
            const slotX = this.config.padding + col * (this.config.slotSize + this.config.padding);
            const slotY = 25 + this.config.padding + row * (this.config.slotSize + this.config.padding);
            
            slot.pos = ex.vec(slotX, slotY);
            slot.graphics.visible = false; // Start hidden, controlled by InventoryScreen
            
            this.addChild(slot);
            this.slots.push(slot);
        }
    }
    
    private handleSlotClick(item: ItemEntity | null, slotIndex: number) {
        this.config.onItemClick?.(item, slotIndex);
    }
    
    private handleSlotRightClick(item: ItemEntity | null, slotIndex: number) {
        this.config.onItemRightClick?.(item, slotIndex);
    }
    
    private onDragStart(item: ItemEntity, slotIndex: number) {
        this.draggedItem = item;
        this.draggedFromIndex = slotIndex;
        this.config.onItemDragStart?.(item, slotIndex);
    }
    
    private handleDragEnd(item: ItemEntity | null, slotIndex: number) {
        if (this.draggedItem && this.draggedFromIndex !== -1 && slotIndex !== this.draggedFromIndex) {
            // Swap items
            this.config.onSlotSwap?.(this.draggedFromIndex, slotIndex);
        }
        
        this.draggedItem = null;
        this.draggedFromIndex = -1;
        this.config.onItemDragEnd?.(item, slotIndex);
    }
    
    
    public updateInventory(inventoryComp: any) {
        if (!inventoryComp) {
            console.warn(`[InventoryGrid] No inventory component provided`);
            return;
        }
        
        console.log(`[InventoryGrid] updateInventory called`);
        console.log(`[InventoryGrid]   Component type:`, inventoryComp.constructor?.name);
        console.log(`[InventoryGrid]   Has getItemByIndex:`, typeof inventoryComp.getItemByIndex);
        console.log(`[InventoryGrid]   Has items array:`, Array.isArray(inventoryComp.items));
        
        // InventoryComponent has items array, not capacity/getItem
        const items = inventoryComp.items || [];
        const maxSize = inventoryComp.maxSize || inventoryComp.getMaxSize?.() || 20;
        
        console.log(`[InventoryGrid] Inventory has ${items.length} items, maxSize: ${maxSize}`);
        
        // Update all slots with current inventory state
        for (let i = 0; i < this.slots.length && i < maxSize; i++) {
            // Try getItemByIndex first, then direct array access
            const item = inventoryComp.getItemByIndex?.(i) || items[i] || null;
            
            console.log(`[InventoryGrid] Slot ${i}: ${item ? item.definition.name : 'empty'}`);
            this.slots[i].setItem(item);
        }
        
        console.log(`[InventoryGrid] Update complete`);
    }

    
    // Compatibility methods removed as input is handled by slots/actors
    
    public getHoveredSlot(): { slotIndex: number, item: ItemEntity | null } | null {
        // Find hovered slot
        // Since slots are children, we can check their hover state if we exposed it
        // Or we can just iterate and check bounds (but bounds are screen space?)
        // Actually, ItemSlot tracks its own hover state.
        // We can add a getter to ItemSlot or just iterate.
        
        for (let i = 0; i < this.slots.length; i++) {
            // We need to access the private isHovered or add a public getter
            // Let's assume we add a public getter to ItemSlot or just rely on the fact that
            // we don't need this method anymore if tooltips are handled by the slots?
            // But InventoryScreen might use this for global tooltip.
        }
        return null; 
    }
    
    public isDragging(): boolean {
        return this.draggedItem !== null;
    }
    
    public getDraggedItem(): ItemEntity | null {
        return this.draggedItem;
    }
    
    public cancelDrag() {
        this.draggedItem = null;
        this.draggedFromIndex = -1;
        
        // Clear all drag target states
        for (const slot of this.slots) {
            slot.setDragTarget(false);
        }
    }
    
    public getWidth(): number {
        return this.width;
    }
    
    public getHeight(): number {
        return this.height;
    }
    
    // Utility methods for keyboard navigation
    public selectSlot(slotIndex: number) {
        // Clear all selections
        for (const slot of this.slots) {
            slot.setSelected(false);
        }
        
        // Select the specified slot
        if (slotIndex >= 0 && slotIndex < this.slots.length) {
            this.slots[slotIndex].setSelected(true);
        }
    }
    
    public getSelectedSlot(): number {
        // We'll need to add a getter for selected state
        return -1;
    }
}
