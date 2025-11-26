import * as ex from 'excalibur';
import { UITheme } from './UITheme';
import { ItemSlot, ItemSlotConfig } from './components/ItemSlot';
import { Item } from '../items/Item';
import { Hero } from '../actors/Hero';

export class Hotbar extends ex.ScreenElement {
    private hero: Hero;
    private slots: ItemSlot[] = [];
    
    // Layout constants
    private readonly SLOT_COUNT = 5;
    private readonly SLOT_SIZE = UITheme.Layout.sizes.hotbarSlotSize;
    private readonly PADDING = UITheme.Layout.padding.medium;
    private readonly ICON_SIZE = 24;
    
    // Visual elements
    private background!: ex.Rectangle;
    private inventoryButton!: ex.Text;
    private inventoryButtonBackground!: ex.Rectangle;
    
    // Interaction state
    private hoveredSlotIndex: number = -1;
    private hoveredTooltipItem: Item | null = null;
    private mousePos: ex.Vector = ex.vec(0, 0);
    
    // Callbacks
    private onInventoryToggle?: () => void;
    
    constructor(hero: Hero, onInventoryToggle?: () => void) {
        super({ z: 95 }); // Below inventory screen, above HUD
        console.log("[Hotbar] Constructor called");
        this.hero = hero;
        this.onInventoryToggle = onInventoryToggle;
        
        console.log("[Hotbar] Initializing visuals...");
        this.initializeVisuals();
        console.log("[Hotbar] Setting up slots...");
        this.setupSlots();
        console.log("[Hotbar] Constructor complete");
    }
    
    private initializeVisuals() {
        const totalWidth = this.SLOT_COUNT * this.SLOT_SIZE + (this.SLOT_COUNT - 1) * this.PADDING + 
                          this.PADDING * 2 + this.ICON_SIZE + this.PADDING; // Extra space for inventory button
        
        // Background
        this.background = UITheme.createRectangle(
            totalWidth,
            this.SLOT_SIZE + this.PADDING * 2,
            {
                fillColor: UITheme.Colors.background,
                strokeColor: UITheme.Colors.border,
                strokeWidth: UITheme.Layout.borderWidth.medium
            }
        );
        
        // Inventory button background
        this.inventoryButtonBackground = UITheme.createRectangle(
            this.ICON_SIZE + this.PADDING,
            this.SLOT_SIZE,
            {
                fillColor: UITheme.Colors.panel,
                strokeColor: UITheme.Colors.border,
                strokeWidth: UITheme.Layout.borderWidth.thin
            }
        );
        
        // Inventory button text
        this.inventoryButton = UITheme.createText('🎒', 'heading');
    }
    
    private setupSlots() {
        for (let i = 0; i < this.SLOT_COUNT; i++) {
            const slotConfig: ItemSlotConfig = {
                size: this.SLOT_SIZE,
                showCount: true,
                showHotkey: true,
                hotkey: (i + 1).toString(),
                onItemClick: (item, slotIndex) => this.handleSlotClick(item, i),
                onItemRightClick: (item, slotIndex) => this.handleSlotRightClick(item, i)
            };
            
            const slot = new ItemSlot(slotConfig, i);
            this.slots.push(slot);
        }
    }
    
    onInitialize(engine: ex.Engine) {
        console.log("[Hotbar] onInitialize called");
        
        // Position at bottom center of screen
        const totalWidth = this.background.width;
        this.pos = ex.vec(
            (engine.drawWidth - totalWidth) / 2,
            engine.drawHeight - this.background.height - UITheme.Layout.padding.large
        );
        console.log("[Hotbar] Positioned at:", this.pos);
        
        // Hotkey input temporarily disabled to avoid conflicts  
        /*
        engine.input.keyboard.on('press', (evt) => {
            let slotIndex = -1;
            switch (evt.key) {
                case ex.Keys.Digit1: slotIndex = 0; break;
                case ex.Keys.Digit2: slotIndex = 1; break;
                case ex.Keys.Digit3: slotIndex = 2; break;
                case ex.Keys.Digit4: slotIndex = 3; break;
                case ex.Keys.Digit5: slotIndex = 4; break;
                case ex.Keys.I: 
                    this.onInventoryToggle?.();
                    break;
            }
            
            if (slotIndex >= 0 && slotIndex < this.SLOT_COUNT) {
                this.useSlot(slotIndex);
            }
        });
        */
        
        // Mouse handling
        engine.input.pointers.primary.on('down', (evt) => {
            if (this.isPointInBounds(evt.screenPos)) {
                this.handleClick(evt.screenPos);
                evt.cancel();
            }
        });
        
        engine.input.pointers.primary.on('move', (evt) => {
            // Only handle mouse move when over the hotbar
            if (this.isPointInBounds(evt.screenPos)) {
                this.handleMouseMove(evt.screenPos);
            }
        });
    }
    
    private isPointInBounds(screenPos: ex.Vector): boolean {
        return screenPos.x >= this.pos.x && 
               screenPos.x <= this.pos.x + this.background.width &&
               screenPos.y >= this.pos.y && 
               screenPos.y <= this.pos.y + this.background.height;
    }
    
    private handleClick(screenPos: ex.Vector) {
        const localPos = screenPos.sub(this.pos);
        
        // Check inventory button
        const inventoryButtonX = this.background.width - this.ICON_SIZE - this.PADDING;
        const inventoryButtonY = this.PADDING;
        
        if (localPos.x >= inventoryButtonX && 
            localPos.x <= inventoryButtonX + this.ICON_SIZE + this.PADDING &&
            localPos.y >= inventoryButtonY && 
            localPos.y <= inventoryButtonY + this.SLOT_SIZE) {
            this.onInventoryToggle?.();
            return;
        }
        
        // Check hotbar slots
        for (let i = 0; i < this.SLOT_COUNT; i++) {
            const slotBounds = this.getSlotBounds(i);
            if (localPos.x >= slotBounds.x && 
                localPos.x <= slotBounds.x + this.SLOT_SIZE &&
                localPos.y >= slotBounds.y && 
                localPos.y <= slotBounds.y + this.SLOT_SIZE) {
                this.handleSlotClick(this.slots[i].getItem(), i);
                return;
            }
        }
    }
    
    private handleMouseMove(screenPos: ex.Vector) {
        this.mousePos = screenPos;
        
        if (!this.isPointInBounds(screenPos)) {
            this.hoveredSlotIndex = -1;
            this.hoveredTooltipItem = null;
            return;
        }
        
        const localPos = screenPos.sub(this.pos);
        let hoveredIndex = -1;
        
        // Check which slot is hovered
        for (let i = 0; i < this.SLOT_COUNT; i++) {
            const slotBounds = this.getSlotBounds(i);
            if (localPos.x >= slotBounds.x && 
                localPos.x <= slotBounds.x + this.SLOT_SIZE &&
                localPos.y >= slotBounds.y && 
                localPos.y <= slotBounds.y + this.SLOT_SIZE) {
                hoveredIndex = i;
                break;
            }
        }
        
        this.hoveredSlotIndex = hoveredIndex;
        
        // Update tooltip
        if (hoveredIndex >= 0) {
            this.hoveredTooltipItem = this.slots[hoveredIndex].getItem();
        } else {
            this.hoveredTooltipItem = null;
        }
        
        // Update hover states
        for (let i = 0; i < this.SLOT_COUNT; i++) {
            this.slots[i].setHovered(i === hoveredIndex);
        }
    }
    
    private getSlotBounds(slotIndex: number): { x: number, y: number } {
        return {
            x: this.PADDING + slotIndex * (this.SLOT_SIZE + this.PADDING),
            y: this.PADDING
        };
    }
    
    private handleSlotClick(item: Item | null, slotIndex: number) {
        if (item) {
            this.useSlot(slotIndex);
        }
    }
    
    private handleSlotRightClick(item: Item | null, slotIndex: number) {
        if (item) {
            // Could show context menu or item details
            console.log(`Right-clicked hotbar slot ${slotIndex + 1}: ${item.name}`);
        }
    }
    
    private useSlot(slotIndex: number) {
        const item = this.getHotbarItem(slotIndex);
        if (item) {
            console.log(`Using hotbar slot ${slotIndex + 1}: ${item.name}`);
            
            // Use the item
            if (item.use(this.hero)) {
                // Item was consumed or action taken
                console.log(`${item.name} was used successfully`);
            }
        }
    }
    
    private getHotbarItem(slotIndex: number): Item | null {
        // Hotbar corresponds to first row of inventory (slots 0-4)
        return this.hero.inventory.getItem(slotIndex);
    }
    
    public update() {
        // Update hotbar slots with current inventory state
        for (let i = 0; i < this.SLOT_COUNT; i++) {
            const item = this.getHotbarItem(i);
            this.slots[i].setItem(item);
        }
    }
    
    public draw(ctx: ex.ExcaliburGraphicsContext, delta: number) {
        // Debug: Only log once per second to avoid spam
        if (Date.now() % 1000 < 16) {
            console.log("[Hotbar] draw() called");
        }
        
        const x = 0;
        const y = 0;
        
        // Draw background
        this.background.draw(ctx, x, y);
        
        // Draw hotbar slots
        for (let i = 0; i < this.SLOT_COUNT; i++) {
            const slotBounds = this.getSlotBounds(i);
            this.slots[i].draw(ctx, x + slotBounds.x, y + slotBounds.y);
        }
        
        // Draw inventory button
        const inventoryButtonX = x + this.background.width - this.ICON_SIZE - this.PADDING;
        const inventoryButtonY = y + this.PADDING;
        
        this.inventoryButtonBackground.draw(ctx, inventoryButtonX, inventoryButtonY);
        
        // Center the inventory icon
        const iconX = inventoryButtonX + (this.ICON_SIZE + this.PADDING - (this.inventoryButton.width || 20)) / 2;
        const iconY = inventoryButtonY + (this.SLOT_SIZE - 16) / 2; // Adjust for text height
        this.inventoryButton.draw(ctx, iconX, iconY);
        
        // Draw tooltip
        if (this.hoveredTooltipItem) {
            this.drawTooltip(ctx);
        }
    }
    
    private drawTooltip(ctx: ex.ExcaliburGraphicsContext) {
        if (!this.hoveredTooltipItem) return;
        
        const mouseLocalPos = this.mousePos.sub(this.pos);
        let tooltipX = mouseLocalPos.x + 15;
        let tooltipY = mouseLocalPos.y - 80; // Above the hotbar
        
        // Get tooltip text
        let tooltipText = this.hoveredTooltipItem.getDisplayName();
        if (this.hoveredTooltipItem.description) {
            tooltipText += '\n' + this.hoveredTooltipItem.description;
        }
        
        // Add enhanced equipment info
        if ('getTooltipText' in this.hoveredTooltipItem) {
            tooltipText = (this.hoveredTooltipItem as any).getTooltipText();
        }
        
        const lines = tooltipText.split('\n');
        const lineHeight = 16;
        const padding = UITheme.Layout.padding.medium;
        const maxWidth = 200;
        const height = lines.length * lineHeight + padding * 2;
        
        // Adjust position to keep tooltip on screen
        if (tooltipX + maxWidth > this.background.width) {
            tooltipX = mouseLocalPos.x - maxWidth - 15;
        }
        if (tooltipY < 0) {
            tooltipY = mouseLocalPos.y + 30; // Below cursor if no room above
        }
        
        // Draw background
        ctx.drawRectangle(
            ex.vec(tooltipX, tooltipY),
            maxWidth,
            height,
            UITheme.Colors.backgroundDark
        );
        
        ctx.drawRectangle(
            ex.vec(tooltipX, tooltipY),
            maxWidth,
            height,
            ex.Color.Transparent,
            UITheme.Colors.borderLight,
            1
        );
        
        // Draw text lines
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