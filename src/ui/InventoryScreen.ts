import * as ex from 'excalibur';
import { UITheme } from './UITheme';
import { EquipmentPanel, EquipmentSlotType } from './components/EquipmentPanel';
import { InventoryGrid } from './components/InventoryGrid';
import { Item } from '../items/Item';
import { Hero } from '../actors/Hero';
import { EnhancedEquipment } from '../mechanics/EquipmentSystem';

export class InventoryScreen extends ex.ScreenElement {
    private hero: Hero;
    private visible: boolean = false;
    
    // UI Components
    private equipmentPanel!: EquipmentPanel;
    private inventoryGrid!: InventoryGrid;
    
    // Layout
    private readonly SCREEN_WIDTH = 600;
    private readonly SCREEN_HEIGHT = 400;
    private readonly EQUIPMENT_PANEL_WIDTH = 180;
    private readonly PADDING = UITheme.Layout.padding.large;
    
    // Visual elements
    private background!: ex.Rectangle;
    private titleText!: ex.Text;
    private closeButton!: ex.Text;
    
    // Interaction state
    private draggedItem: Item | null = null;
    private draggedFromInventory: boolean = false;
    private draggedFromEquipment: boolean = false;
    private draggedFromSlot: number = -1;
    private mousePos: ex.Vector = ex.vec(0, 0);
    private hoveredTooltipItem: Item | null = null;
    
    // Action buttons
    private trashButton!: ex.Text;
    private sortButton!: ex.Text;
    private closeButtonBounds!: { x: number, y: number, width: number, height: number };
    private trashButtonBounds!: { x: number, y: number, width: number, height: number };
    private sortButtonBounds!: { x: number, y: number, width: number, height: number };
    
    constructor(hero: Hero) {
        super({ 
            z: 110,
            width: 600,
            height: 400,
            anchor: ex.vec(0, 0)
        }); // Above HUD and Journal
        this.hero = hero;
        
        this.initializeComponents();
        this.initializeVisuals();
        
        // Use onPostDraw for custom rendering
        this.graphics.onPostDraw = (ctx: ex.ExcaliburGraphicsContext, delta: number) => {
             this.customDraw(ctx, delta);
        };
    }
    
    private initializeComponents() {
        // Equipment Panel
        this.equipmentPanel = new EquipmentPanel({
            width: this.EQUIPMENT_PANEL_WIDTH,
            height: this.SCREEN_HEIGHT - 60, // Leave space for title and buttons
            onItemEquip: (item, slotType) => this.handleEquipItem(item, slotType),
            onItemUnequip: (item, slotType) => this.handleUnequipItem(item, slotType),
            onSlotRightClick: (slotType, item) => this.handleEquipmentRightClick(slotType, item)
        }, this.hero);
        
        // Inventory Grid
        const gridWidth = this.SCREEN_WIDTH - this.EQUIPMENT_PANEL_WIDTH - this.PADDING * 3;
        const slotSize = UITheme.Layout.sizes.slotSize;
        const gridPadding = UITheme.Layout.padding.small;
        const cols = Math.floor((gridWidth - gridPadding * 2) / (slotSize + gridPadding));
        const rows = 4;
        
        this.inventoryGrid = new InventoryGrid({
            rows: rows,
            cols: cols,
            slotSize: slotSize,
            padding: gridPadding,
            showHotbarRow: true,
            onItemClick: (item, slotIndex) => this.handleInventoryItemClick(item, slotIndex),
            onItemRightClick: (item, slotIndex) => this.handleInventoryItemRightClick(item, slotIndex),
            onItemDragStart: (item, slotIndex) => this.handleInventoryDragStart(item, slotIndex),
            onItemDragEnd: (item, slotIndex) => this.handleInventoryDragEnd(item, slotIndex),
            onSlotSwap: (fromIndex, toIndex) => this.handleInventorySlotSwap(fromIndex, toIndex)
        }, this.hero.inventory);
    }
    
    private initializeVisuals() {
        // Main background
        this.background = UITheme.createRectangle(
            this.SCREEN_WIDTH,
            this.SCREEN_HEIGHT,
            {
                fillColor: UITheme.Colors.backgroundDark,
                strokeColor: UITheme.Colors.border,
                strokeWidth: UITheme.Layout.borderWidth.medium
            }
        );
        
        // Title
        this.titleText = UITheme.createText('Inventory & Equipment', 'title');
        
        // Close button
        this.closeButton = UITheme.createText('✕', 'heading', UITheme.Colors.textDanger);
        
        // Action buttons
        this.trashButton = UITheme.createText('🗑️ Trash', 'body');
        this.sortButton = UITheme.createText('📋 Sort', 'body');
        
        // Button bounds for click detection
        this.closeButtonBounds = {
            x: this.SCREEN_WIDTH - 30,
            y: 5,
            width: 25,
            height: 25
        };
        
        this.trashButtonBounds = {
            x: this.EQUIPMENT_PANEL_WIDTH + this.PADDING * 2,
            y: this.SCREEN_HEIGHT - 30,
            width: 60,
            height: 25
        };
        
        this.sortButtonBounds = {
            x: this.EQUIPMENT_PANEL_WIDTH + this.PADDING * 2 + 70,
            y: this.SCREEN_HEIGHT - 30,
            width: 50,
            height: 25
        };
    }
    
    onPostUpdate(engine: ex.Engine, delta: number) {
        // Center on screen - ScreenElements use viewport coordinates
        const viewportWidth = engine.screen.viewport.width;
        const viewportHeight = engine.screen.viewport.height;
        
        this.pos = ex.vec(
            (viewportWidth - this.SCREEN_WIDTH) / 2,
            (viewportHeight - this.SCREEN_HEIGHT) / 2
        );
    }

    onInitialize(engine: ex.Engine) {
        console.log("[InventoryScreen] onInitialize called");
        // Center on screen
        this.onPostUpdate(engine, 0);
        console.log("[InventoryScreen] Position set to:", this.pos);
        
        // Mouse handling - only when visible and within bounds
        engine.input.pointers.primary.on('down', (evt) => {
            if (this.visible && this.isPointInBounds(evt.screenPos)) {
                this.handleMouseDown(evt.screenPos);
                evt.cancel(); // Only cancel if we handle it
            }
        });
        
        engine.input.pointers.primary.on('up', (evt) => {
            if (this.visible && this.isPointInBounds(evt.screenPos)) {
                this.handleMouseUp(evt.screenPos);
            }
        });
        
        engine.input.pointers.primary.on('move', (evt) => {
            if (this.visible && this.isPointInBounds(evt.screenPos)) {
                this.handleMouseMove(evt.screenPos);
            }
        });
    }
    
    private isPointInBounds(screenPos: ex.Vector): boolean {
        return screenPos.x >= this.pos.x && 
               screenPos.x <= this.pos.x + this.SCREEN_WIDTH &&
               screenPos.y >= this.pos.y && 
               screenPos.y <= this.pos.y + this.SCREEN_HEIGHT;
    }
    
    private handleMouseDown(screenPos: ex.Vector) {
        const localPos = screenPos.sub(this.pos);
        
        // Check close button
        if (this.isPointInButtonBounds(localPos, this.closeButtonBounds)) {
            this.hide();
            return;
        }
        
        // Check action buttons
        if (this.isPointInButtonBounds(localPos, this.trashButtonBounds)) {
            this.handleTrashClick();
            return;
        }
        
        if (this.isPointInButtonBounds(localPos, this.sortButtonBounds)) {
            this.handleSortClick();
            return;
        }
        
        // Check equipment panel
        const equipmentBounds = {
            x: this.pos.x + this.PADDING,
            y: this.pos.y + 40
        };
        
        if (this.equipmentPanel.handleDragStart(screenPos, equipmentBounds)) {
            return;
        }
        
        // Check inventory grid
        const inventoryBounds = {
            x: this.pos.x + this.EQUIPMENT_PANEL_WIDTH + this.PADDING * 2,
            y: this.pos.y + 40
        };
        
        if (this.inventoryGrid.handleDragStart(screenPos, inventoryBounds)) {
            return;
        }
        
        // Regular clicks
        this.equipmentPanel.handleClick(screenPos, equipmentBounds) ||
        this.inventoryGrid.handleClick(screenPos, inventoryBounds);
    }
    
    private handleMouseUp(screenPos: ex.Vector) {
        if (this.draggedItem) {
            this.handleDrop(screenPos);
            this.draggedItem = null;
            this.draggedFromInventory = false;
            this.draggedFromEquipment = false;
            this.draggedFromSlot = -1;
        }
    }
    
    private handleMouseMove(screenPos: ex.Vector) {
        this.mousePos = screenPos;
        
        if (!this.draggedItem) {
            const inventoryBounds = { 
                x: this.pos.x + this.EQUIPMENT_PANEL_WIDTH + this.PADDING * 2, 
                y: this.pos.y + 40 
            };
            
            this.inventoryGrid.handleMouseMove(screenPos, inventoryBounds);
            this.updateTooltip(screenPos);
        }
    }
    
    private handleDrop(screenPos: ex.Vector) {
        if (!this.draggedItem) return;
        
        const equipmentBounds = { x: this.pos.x + this.PADDING, y: this.pos.y + 40 };
        const inventoryBounds = { 
            x: this.pos.x + this.EQUIPMENT_PANEL_WIDTH + this.PADDING * 2, 
            y: this.pos.y + 40 
        };
        
        // Try to drop on equipment first
        if (this.equipmentPanel.handleDrop(screenPos, this.draggedItem, equipmentBounds)) {
            if (this.draggedFromInventory) {
                this.hero.inventory.removeItem(this.draggedItem);
            }
            return;
        }
        
        // Try to drop on inventory
        if (this.inventoryGrid.handleDrop(screenPos, this.draggedItem, inventoryBounds)) {
            return;
        }
        
        // Drop outside screen = drop on ground
        if (!this.isPointInBounds(screenPos)) {
            this.dropItemOnGround(this.draggedItem);
        }
    }
    
    private isPointInButtonBounds(pos: ex.Vector, bounds: { x: number, y: number, width: number, height: number }): boolean {
        return pos.x >= bounds.x && pos.x <= bounds.x + bounds.width &&
               pos.y >= bounds.y && pos.y <= bounds.y + bounds.height;
    }
    
    // Event handlers
    private handleEquipItem(item: Item, slotType: EquipmentSlotType) {
        if (item instanceof EnhancedEquipment) {
            this.hero.equip(item);
        }
    }
    
    private handleUnequipItem(item: Item, slotType: EquipmentSlotType) {
        if (item instanceof EnhancedEquipment) {
            if (this.hero.unequip(item)) {
                this.hero.inventory.addItem(item);
            }
        }
    }
    
    private handleEquipmentRightClick(slotType: EquipmentSlotType, item: Item | null) {
        if (item) {
            console.log(`Right-clicked equipment: ${item.name}`);
        }
    }
    
    private handleInventoryItemClick(item: Item | null, slotIndex: number) {
        if (item) {
            item.use(this.hero);
        }
    }
    
    private handleInventoryItemRightClick(item: Item | null, slotIndex: number) {
        if (item) {
            console.log(`Right-clicked inventory item: ${item.name}`);
        }
    }
    
    private handleInventoryDragStart(item: Item, slotIndex: number) {
        this.draggedItem = item;
        this.draggedFromInventory = true;
        this.draggedFromSlot = slotIndex;
    }
    
    private handleInventoryDragEnd(item: Item | null, slotIndex: number) {
        // Handled by drop logic
    }
    
    private handleInventorySlotSwap(fromIndex: number, toIndex: number) {
        this.hero.inventory.swap(fromIndex, toIndex);
    }
    
    private handleTrashClick() {
        console.log('Trash clicked - implement item deletion');
    }
    
    private handleSortClick() {
        console.log('Sort clicked - implement inventory sorting');
    }
    
    private dropItemOnGround(item: Item) {
        for (let i = 0; i < this.hero.inventory.capacity; i++) {
            if (this.hero.inventory.getItem(i) === item) {
                this.hero.dropItem(i);
                break;
            }
        }
    }
    
    private updateTooltip(screenPos: ex.Vector) {
        const equipmentBounds = { x: this.pos.x + this.PADDING, y: this.pos.y + 40 };
        const hoveredEquipment = this.equipmentPanel.getHoveredSlot(screenPos, equipmentBounds);
        if (hoveredEquipment?.item) {
            this.hoveredTooltipItem = hoveredEquipment.item;
            return;
        }
        
        const hoveredInventory = this.inventoryGrid.getHoveredSlot();
        if (hoveredInventory?.item) {
            this.hoveredTooltipItem = hoveredInventory.item;
            return;
        }
        
        this.hoveredTooltipItem = null;
    }
    
    public show() {
        this.visible = true;
        UITheme.Animations.fadeIn(this, 200);
    }
    
    public hide() {
        this.visible = false;
        
        if (this.draggedItem) {
            this.inventoryGrid.cancelDrag();
            this.draggedItem = null;
            this.draggedFromInventory = false;
            this.draggedFromEquipment = false;
            this.draggedFromSlot = -1;
        }
    }
    
    public toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    public isVisible(): boolean {
        return this.visible;
    }
    
    public updateState() {
        if (this.visible) {
            this.equipmentPanel.update(this.hero);
            this.inventoryGrid.update(this.hero.inventory);
        }
    }
    
    private customDraw(ctx: ex.ExcaliburGraphicsContext, delta: number) {
        if (!this.visible) return;
        
        // Debug log once per second
        if (Date.now() % 1000 < 16) {
            console.log("[InventoryScreen] customDraw called at", this.pos);
        }
        
        // Draw at (0, 0) - onPostDraw context is already positioned at this.pos
        const x = 0;
        let y = 0;
        
        // Draw main background
        this.background.draw(ctx, x, y);
        
        // Draw title
        this.titleText.draw(ctx, x + this.PADDING, y + 10);
        
        // Draw close button
        this.closeButton.draw(ctx, x + this.closeButtonBounds.x, y + this.closeButtonBounds.y);
        
        // Draw equipment panel
        this.equipmentPanel.draw(ctx, x + this.PADDING, y + 40);
        
        // Draw inventory grid
        const inventoryX = x + this.EQUIPMENT_PANEL_WIDTH + this.PADDING * 2;
        this.inventoryGrid.draw(ctx, inventoryX, y + 40);
        
        // Draw action buttons
        this.trashButton.draw(ctx, x + this.trashButtonBounds.x, y + this.trashButtonBounds.y);
        this.sortButton.draw(ctx, x + this.sortButtonBounds.x, y + this.sortButtonBounds.y);
        
        // Draw dragged item
        if (this.draggedItem) {
            this.drawDraggedItem(ctx);
        }
        
        // Draw tooltip
        if (this.hoveredTooltipItem && !this.draggedItem) {
            this.drawTooltip(ctx);
        }
    }
    
    private drawDraggedItem(ctx: ex.ExcaliburGraphicsContext) {
        if (!this.draggedItem) return;
        
        const mouseLocalPos = this.mousePos.sub(this.pos);
        const itemX = mouseLocalPos.x - UITheme.Layout.sizes.slotSize / 2;
        const itemY = mouseLocalPos.y - UITheme.Layout.sizes.slotSize / 2;
        
        ctx.drawRectangle(
            ex.vec(itemX, itemY),
            UITheme.Layout.sizes.slotSize,
            UITheme.Layout.sizes.slotSize,
            ex.Color.fromRGB(255, 255, 255, 0.3)
        );
        
        const sprite = this.draggedItem.getSprite?.();
        if (sprite) {
            sprite.draw(ctx, itemX + 4, itemY + 4);
        } else {
            const itemText = UITheme.createText(
                this.draggedItem.name.substring(0, 3).toUpperCase(),
                'small'
            );
            itemText.draw(ctx, itemX + 8, itemY + 16);
        }
    }
    
    private drawTooltip(ctx: ex.ExcaliburGraphicsContext) {
        if (!this.hoveredTooltipItem) return;
        
        const mouseLocalPos = this.mousePos.sub(this.pos);
        const tooltipX = mouseLocalPos.x + 15;
        const tooltipY = mouseLocalPos.y + 15;
        
        let tooltipText = this.hoveredTooltipItem.getDisplayName();
        if (this.hoveredTooltipItem.description) {
            tooltipText += '\n' + this.hoveredTooltipItem.description;
        }
        
        if ('getTooltipText' in this.hoveredTooltipItem) {
            tooltipText = (this.hoveredTooltipItem as any).getTooltipText();
        }
        
        const rawLines = tooltipText.split('\n');
        const lineHeight = 16;
        const padding = UITheme.Layout.padding.medium;
        const maxWidth = 250;
        const maxCharsPerLine = 30; // Approximate characters that fit in maxWidth
        
        // Wrap text to stay within bounds
        const lines: string[] = [];
        rawLines.forEach(line => {
            if (line.length <= maxCharsPerLine) {
                lines.push(line);
            } else {
                // Simple word wrapping
                const words = line.split(' ');
                let currentLine = '';
                words.forEach(word => {
                    if ((currentLine + word).length <= maxCharsPerLine) {
                        currentLine += (currentLine ? ' ' : '') + word;
                    } else {
                        if (currentLine) lines.push(currentLine);
                        currentLine = word;
                    }
                });
                if (currentLine) lines.push(currentLine);
            }
        });
        
        const height = lines.length * lineHeight + padding * 2;
        
        // Draw tooltip background FIRST (with fill and stroke combined)
        ctx.drawRectangle(
            ex.vec(tooltipX, tooltipY),
            maxWidth,
            height,
            UITheme.Colors.backgroundDark,
            UITheme.Colors.borderLight,
            1
        );
        
        // Draw text lines ON TOP OF background
        lines.forEach((line, index) => {
            const lineText = UITheme.createText(line, 'small');
            lineText.draw(
                ctx,
                tooltipX + padding,
                tooltipY + padding + index * lineHeight
            );
        });
    }
}