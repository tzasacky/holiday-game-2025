import * as ex from 'excalibur';
import { UITheme } from './UITheme';
import { ItemSlot, ItemSlotConfig } from './components/ItemSlot';
import { Item } from '../items/Item';
import { Hero } from '../actors/Hero';

export class Hotbar extends ex.ScreenElement {
    private hero: Hero;
    private engine!: ex.Engine;
    private slots: ItemSlot[] = [];
    
    // Layout constants
    private readonly SLOT_COUNT = 5;
    private readonly SLOT_SIZE = UITheme.Layout.sizes.hotbarSlotSize;
    private readonly PADDING = UITheme.Layout.padding.medium;
    private readonly ICON_SIZE = 24;
    private totalWidth: number = 0;
    
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
        super({ 
            z: UITheme.ZIndex.Hotbar,
            width: 300, // Estimated width
            height: 60,
            anchor: ex.vec(0, 0)
        }); 
        console.log("[Hotbar] Constructor called");
        this.hero = hero;
        this.onInventoryToggle = onInventoryToggle;
        
        console.log("[Hotbar] Initializing visuals...");
        this.initializeVisuals();
        console.log("[Hotbar] Setting up slots...");
        this.setupSlots();
        
        // Use onPostDraw for custom rendering
        this.graphics.onPostDraw = (ctx: ex.ExcaliburGraphicsContext, delta: number) => {
             this.customDraw(ctx, delta);
        };
        
        console.log("[Hotbar] Constructor complete");
    }
    
    private initializeVisuals() {
        this.totalWidth = this.SLOT_COUNT * this.SLOT_SIZE + (this.SLOT_COUNT - 1) * this.PADDING + 
                          this.PADDING * 2 + this.ICON_SIZE + this.PADDING; // Extra space for inventory button
        
        // Background
        this.background = UITheme.createRectangle(
            this.totalWidth,
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
    
    onPostUpdate(engine: ex.Engine, delta: number) {
        // Dynamic positioning: Bottom Center
        // ScreenElements use viewport (CSS pixel) coordinates, not draw coordinates
        const viewportWidth = engine.screen.viewport.width;
        const viewportHeight = engine.screen.viewport.height;
        
        const barHeight = this.SLOT_SIZE + this.PADDING * 2;
        const yPos = viewportHeight - barHeight - UITheme.Layout.padding.large;
        
        const newX = (viewportWidth - this.totalWidth) / 2;
        const newY = Math.max(0, yPos);
        
        // Debug log once per second
        if (Date.now() % 1000 < 16) {
            console.log(`[Hotbar] Positioning: viewport=${viewportWidth}x${viewportHeight}, barHeight=${barHeight}, totalWidth=${this.totalWidth}, pos=(${newX}, ${newY})`);
        }
        
        this.pos = ex.vec(newX, newY);
    }

    onInitialize(engine: ex.Engine) {
        this.engine = engine;
        console.log("[Hotbar] onInitialize called");
        
        // Initial positioning
        this.onPostUpdate(engine, 0);
        console.log("[Hotbar] Positioned at:", this.pos);
        
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
        const barHeight = this.SLOT_SIZE + this.PADDING * 2;
        return screenPos.x >= this.pos.x && 
               screenPos.x <= this.pos.x + this.totalWidth &&
               screenPos.y >= this.pos.y && 
               screenPos.y <= this.pos.y + barHeight;
    }
    
    private handleClick(screenPos: ex.Vector) {
        const localPos = screenPos.sub(this.pos);
        
        // Check inventory button
        const inventoryButtonX = this.totalWidth - this.ICON_SIZE - this.PADDING;
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
    
    public updateState() {
        // Update hotbar slots with current inventory state
        for (let i = 0; i < this.SLOT_COUNT; i++) {
            const item = this.getHotbarItem(i);
            this.slots[i].setItem(item);
        }
    }
    
    private customDraw(ctx: ex.ExcaliburGraphicsContext, delta: number) {
        // Debug: Only log once per second to avoid spam
        if (Date.now() % 1000 < 16) {
            console.log("[Hotbar] customDraw called");
        }
        
        // Draw at (0, 0) - onPostDraw context is already positioned at this.pos
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
        const inventoryButtonX = x + this.totalWidth - this.ICON_SIZE - this.PADDING;
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
        
        // Calculate tooltip position in LOCAL coordinates (relative to hotbar)
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
        
        const rawLines = tooltipText.split('\n');
        const lineHeight = 16;
        const padding = UITheme.Layout.padding.medium;
        const maxWidth = 200;
        const maxCharsPerLine = 25; // Approximate characters that fit in maxWidth
        
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
        
        // Edge detection using viewport coordinates
        const viewportWidth = this.engine.screen.viewport.width;
        
        // Check if tooltip goes off the right side (tooltip position is relative to element)
        if (tooltipX + maxWidth > viewportWidth - this.pos.x) {
            tooltipX = mouseLocalPos.x - maxWidth - 15;
        }
        
        // Check if tooltip goes off the top
        if (tooltipY < -this.pos.y) {
            tooltipY = mouseLocalPos.y + 30; // Below cursor if no room above
        }
        
        // LAYER 1: Draw tooltip background FIRST
        ctx.drawRectangle(
            ex.vec(tooltipX, tooltipY),
            maxWidth,
            height,
            UITheme.Colors.backgroundDark,
            UITheme.Colors.borderLight,
            1
        );
        
        // LAYER 2: Draw text lines ON TOP OF background
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