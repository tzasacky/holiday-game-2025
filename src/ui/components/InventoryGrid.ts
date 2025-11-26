import * as ex from 'excalibur';
import { UITheme } from '../UITheme';
import { ItemSlot, ItemSlotConfig } from './ItemSlot';
import { Item } from '../../items/Item';
import { Inventory } from '../../items/Inventory';

export interface InventoryGridConfig {
    rows: number;
    cols: number;
    slotSize: number;
    padding: number;
    showHotbarRow?: boolean;
    onItemClick?: (item: Item | null, slotIndex: number) => void;
    onItemRightClick?: (item: Item | null, slotIndex: number) => void;
    onItemDragStart?: (item: Item, slotIndex: number) => void;
    onItemDragEnd?: (item: Item | null, slotIndex: number) => void;
    onSlotSwap?: (fromIndex: number, toIndex: number) => void;
}

export class InventoryGrid {
    private config: InventoryGridConfig;
    private inventory: Inventory;
    private slots: ItemSlot[] = [];
    
    // Drag state
    private draggedItem: Item | null = null;
    private draggedFromIndex: number = -1;
    private hoveredSlotIndex: number = -1;
    
    // Visual elements
    private background!: ex.Rectangle;
    private titleText!: ex.Text;
    
    // Layout calculations
    private width: number;
    private height: number;
    
    constructor(config: InventoryGridConfig, inventory: Inventory) {
        this.config = config;
        this.inventory = inventory;
        
        this.width = config.cols * config.slotSize + (config.cols - 1) * config.padding + 2 * config.padding;
        this.height = config.rows * config.slotSize + (config.rows - 1) * config.padding + 2 * config.padding + 25; // +25 for title
        
        this.initializeVisuals();
        this.setupSlots();
    }
    
    private initializeVisuals() {
        // Background
        this.background = UITheme.createRectangle(
            this.width,
            this.height,
            {
                fillColor: UITheme.Colors.panel,
                strokeColor: UITheme.Colors.border,
                strokeWidth: UITheme.Layout.borderWidth.medium
            }
        );
        
        // Title
        this.titleText = UITheme.createText('Inventory', 'heading');
    }
    
    private setupSlots() {
        const totalSlots = this.config.rows * this.config.cols;
        
        for (let i = 0; i < totalSlots; i++) {
            const row = Math.floor(i / this.config.cols);
            const col = i % this.config.cols;
            
            const slotConfig: ItemSlotConfig = {
                size: this.config.slotSize,
                showCount: true,
                showHotkey: this.config.showHotbarRow && row === 0,
                hotkey: this.config.showHotbarRow && row === 0 ? (col + 1).toString() : undefined,
                onItemClick: (item, slotIndex) => this.handleSlotClick(item, i),
                onItemRightClick: (item, slotIndex) => this.handleSlotRightClick(item, i),
                onItemDragStart: (item, slotIndex) => this.onDragStart(item, i),
                onItemDragEnd: (item, slotIndex) => this.handleDragEnd(item, i)
            };
            
            const slot = new ItemSlot(slotConfig, i);
            this.slots.push(slot);
        }
    }
    
    private handleSlotClick(item: Item | null, slotIndex: number) {
        this.config.onItemClick?.(item, slotIndex);
    }
    
    private handleSlotRightClick(item: Item | null, slotIndex: number) {
        this.config.onItemRightClick?.(item, slotIndex);
    }
    
    private onDragStart(item: Item, slotIndex: number) {
        this.draggedItem = item;
        this.draggedFromIndex = slotIndex;
        this.config.onItemDragStart?.(item, slotIndex);
    }
    
    private handleDragEnd(item: Item | null, slotIndex: number) {
        if (this.draggedItem && this.draggedFromIndex !== -1 && slotIndex !== this.draggedFromIndex) {
            // Swap items
            this.config.onSlotSwap?.(this.draggedFromIndex, slotIndex);
        }
        
        this.draggedItem = null;
        this.draggedFromIndex = -1;
        this.config.onItemDragEnd?.(item, slotIndex);
    }
    
    public update(inventory: Inventory) {
        this.inventory = inventory;
        
        // Update all slots with current inventory state
        for (let i = 0; i < this.slots.length && i < inventory.capacity; i++) {
            const item = inventory.getItem(i);
            this.slots[i].setItem(item);
        }
    }
    
    public handleClick(pos: ex.Vector, gridBounds: { x: number, y: number }): boolean {
        const slotIndex = this.getSlotAtPosition(pos, gridBounds);
        if (slotIndex !== -1) {
            const slotBounds = this.getSlotBounds(slotIndex, gridBounds);
            const slot = this.slots[slotIndex];
            return slot.handleClick(pos, slotBounds);
        }
        return false;
    }
    
    public handleRightClick(pos: ex.Vector, gridBounds: { x: number, y: number }): boolean {
        const slotIndex = this.getSlotAtPosition(pos, gridBounds);
        if (slotIndex !== -1) {
            const slotBounds = this.getSlotBounds(slotIndex, gridBounds);
            const slot = this.slots[slotIndex];
            return slot.handleRightClick(pos, slotBounds);
        }
        return false;
    }
    
    public handleDragStart(pos: ex.Vector, gridBounds: { x: number, y: number }): boolean {
        const slotIndex = this.getSlotAtPosition(pos, gridBounds);
        if (slotIndex !== -1) {
            const slotBounds = this.getSlotBounds(slotIndex, gridBounds);
            const slot = this.slots[slotIndex];
            return slot.handleDragStart(pos, slotBounds);
        }
        return false;
    }
    
    public handleMouseMove(pos: ex.Vector, gridBounds: { x: number, y: number }) {
        const slotIndex = this.getSlotAtPosition(pos, gridBounds);
        
        // Update hover states
        for (let i = 0; i < this.slots.length; i++) {
            this.slots[i].setHovered(i === slotIndex);
            
            // Set drag target if we're dragging and this slot can accept the item
            if (this.draggedItem && i !== this.draggedFromIndex) {
                const canAccept = this.slots[i].canAcceptItem(this.draggedItem);
                this.slots[i].setDragTarget(i === slotIndex && canAccept);
            } else {
                this.slots[i].setDragTarget(false);
            }
        }
        
        this.hoveredSlotIndex = slotIndex;
    }
    
    public handleDrop(pos: ex.Vector, item: Item, gridBounds: { x: number, y: number }): boolean {
        const slotIndex = this.getSlotAtPosition(pos, gridBounds);
        if (slotIndex !== -1 && this.slots[slotIndex].canAcceptItem(item)) {
            this.slots[slotIndex].handleDragEnd(item);
            return true;
        }
        return false;
    }
    
    private getSlotAtPosition(pos: ex.Vector, gridBounds: { x: number, y: number }): number {
        const localPos = pos.sub(ex.vec(gridBounds.x, gridBounds.y));
        
        // Account for title and padding
        const contentY = localPos.y - 25 - this.config.padding;
        const contentX = localPos.x - this.config.padding;
        
        if (contentX < 0 || contentY < 0) return -1;
        
        const col = Math.floor(contentX / (this.config.slotSize + this.config.padding));
        const row = Math.floor(contentY / (this.config.slotSize + this.config.padding));
        
        if (col < 0 || col >= this.config.cols || row < 0 || row >= this.config.rows) {
            return -1;
        }
        
        const slotIndex = row * this.config.cols + col;
        return slotIndex < this.slots.length ? slotIndex : -1;
    }
    
    private getSlotBounds(slotIndex: number, gridBounds: { x: number, y: number }): { x: number, y: number } {
        const row = Math.floor(slotIndex / this.config.cols);
        const col = slotIndex % this.config.cols;
        
        return {
            x: gridBounds.x + this.config.padding + col * (this.config.slotSize + this.config.padding),
            y: gridBounds.y + 25 + this.config.padding + row * (this.config.slotSize + this.config.padding)
        };
    }
    
    public getHoveredSlot(): { slotIndex: number, item: Item | null } | null {
        if (this.hoveredSlotIndex === -1) return null;
        
        return {
            slotIndex: this.hoveredSlotIndex,
            item: this.slots[this.hoveredSlotIndex]?.getItem() || null
        };
    }
    
    public isDragging(): boolean {
        return this.draggedItem !== null;
    }
    
    public getDraggedItem(): Item | null {
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
    
    public draw(ctx: ex.ExcaliburGraphicsContext, x: number, y: number) {
        // Draw background
        this.background.draw(ctx, x, y);
        
        // Draw title
        this.titleText.draw(ctx, x + this.config.padding, y + 10);
        
        // Draw hotbar indicator line if enabled
        if (this.config.showHotbarRow) {
            const hotbarY = y + 25 + this.config.padding + this.config.slotSize + this.config.padding / 2;
            ctx.drawLine(
                ex.vec(x + this.config.padding, hotbarY),
                ex.vec(x + this.width - this.config.padding, hotbarY),
                UITheme.Colors.border,
                1
            );
            
            // Hotbar label
            const hotbarLabel = UITheme.createText('Hotbar', 'small', UITheme.Colors.textSecondary);
            hotbarLabel.draw(ctx, x + this.width - 50, y + 30 + this.config.slotSize);
        }
        
        // Draw all slots
        for (let i = 0; i < this.slots.length; i++) {
            const slotBounds = this.getSlotBounds(i, { x, y });
            
            // Don't draw the dragged item in its original position
            if (i === this.draggedFromIndex) {
                // Draw empty slot
                const emptySlot = new ItemSlot({
                    size: this.config.slotSize,
                    showCount: false
                });
                emptySlot.draw(ctx, slotBounds.x, slotBounds.y);
            } else {
                this.slots[i].draw(ctx, slotBounds.x, slotBounds.y);
            }
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
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i]) {
                // We'll need to add a getter for selected state
                // For now, return -1
            }
        }
        return -1;
    }
}