import * as ex from 'excalibur';
import { UITheme } from '../UITheme';
import { Item } from '../../items/Item';

export interface ItemSlotConfig {
    size: number;
    showCount?: boolean;
    showHotkey?: boolean;
    hotkey?: string;
    acceptsItemType?: (item: Item) => boolean;
    onItemClick?: (item: Item | null, slotIndex: number) => void;
    onItemRightClick?: (item: Item | null, slotIndex: number) => void;
    onItemDragStart?: (item: Item, slotIndex: number) => void;
    onItemDragEnd?: (item: Item | null, slotIndex: number) => void;
}

export class ItemSlot {
    private item: Item | null = null;
    private config: ItemSlotConfig;
    private slotIndex: number;
    private isHovered: boolean = false;
    private isDragTarget: boolean = false;
    private isSelected: boolean = false;
    
    // Visual elements
    private background!: ex.Rectangle;
    private border!: ex.Rectangle;
    private hotkeyText?: ex.Text;
    private countText?: ex.Text;
    
    constructor(config: ItemSlotConfig, slotIndex: number = 0) {
        this.config = config;
        this.slotIndex = slotIndex;
        
        this.initializeVisuals();
    }
    
    private initializeVisuals() {
        // Background
        this.background = UITheme.createRectangle(
            this.config.size,
            this.config.size,
            {
                fillColor: UITheme.Colors.panelLight,
                strokeColor: UITheme.Colors.border,
                strokeWidth: UITheme.Layout.borderWidth.thin
            }
        );
        
        // Border for states (hover, drag target, etc.)
        this.border = new ex.Rectangle({
            width: this.config.size,
            height: this.config.size,
            color: ex.Color.Transparent,
            strokeColor: UITheme.Colors.borderLight,
            lineWidth: 2
        });
        
        // Hotkey text
        if (this.config.showHotkey && this.config.hotkey) {
            this.hotkeyText = UITheme.createText(
                this.config.hotkey,
                'small',
                UITheme.Colors.textMuted
            );
        }
    }
    
    public setItem(item: Item | null) {
        this.item = item;
        
        // Update count text if needed
        if (this.config.showCount && item && item.count > 1) {
            this.countText = UITheme.createText(
                item.count.toString(),
                'small',
                UITheme.Colors.text
            );
        } else {
            this.countText = undefined;
        }
    }
    
    public getItem(): Item | null {
        return this.item;
    }
    
    public isEmpty(): boolean {
        return this.item === null;
    }
    
    public canAcceptItem(item: Item): boolean {
        if (!this.config.acceptsItemType) return true;
        return this.config.acceptsItemType(item);
    }
    
    public setHovered(hovered: boolean) {
        this.isHovered = hovered;
        this.updateBorderState();
    }
    
    public setDragTarget(isDragTarget: boolean) {
        this.isDragTarget = isDragTarget;
        this.updateBorderState();
    }
    
    public setSelected(selected: boolean) {
        this.isSelected = selected;
        this.updateBorderState();
    }
    
    private updateBorderState() {
        if (this.isSelected) {
            this.border.strokeColor = UITheme.Colors.primary;
            this.border.lineWidth = 3;
        } else if (this.isDragTarget) {
            this.border.strokeColor = UITheme.Colors.accent;
            this.border.lineWidth = 2;
        } else if (this.isHovered) {
            this.border.strokeColor = UITheme.Colors.borderLight;
            this.border.lineWidth = 2;
        } else {
            this.border.strokeColor = ex.Color.Transparent;
            this.border.lineWidth = 1;
        }
    }
    
    public handleClick(pos: ex.Vector, slotBounds: { x: number, y: number }): boolean {
        if (this.isPointInSlot(pos, slotBounds)) {
            this.config.onItemClick?.(this.item, this.slotIndex);
            return true;
        }
        return false;
    }
    
    public handleRightClick(pos: ex.Vector, slotBounds: { x: number, y: number }): boolean {
        if (this.isPointInSlot(pos, slotBounds)) {
            this.config.onItemRightClick?.(this.item, this.slotIndex);
            return true;
        }
        return false;
    }
    
    public handleDragStart(pos: ex.Vector, slotBounds: { x: number, y: number }): boolean {
        if (this.isPointInSlot(pos, slotBounds) && this.item) {
            this.config.onItemDragStart?.(this.item, this.slotIndex);
            return true;
        }
        return false;
    }
    
    public handleDragEnd(item: Item | null): void {
        this.config.onItemDragEnd?.(item, this.slotIndex);
    }
    
    private isPointInSlot(pos: ex.Vector, slotBounds: { x: number, y: number }): boolean {
        return pos.x >= slotBounds.x && 
               pos.x <= slotBounds.x + this.config.size &&
               pos.y >= slotBounds.y && 
               pos.y <= slotBounds.y + this.config.size;
    }
    
    public draw(ctx: ex.ExcaliburGraphicsContext, x: number, y: number) {
        // Draw background
        this.background.draw(ctx, x, y);
        
        // Draw border (for states)
        if (this.border.strokeColor !== ex.Color.Transparent) {
            this.border.draw(ctx, x, y);
        }
        
        // Draw hotkey
        if (this.hotkeyText) {
            this.hotkeyText.draw(ctx, x + 2, y + 2);
        }
        
        // Draw item if present
        if (this.item) {
            this.drawItem(ctx, x, y);
        } else {
            this.drawEmptySlotIcon(ctx, x, y);
        }
        
        // Draw count
        if (this.countText) {
            const countX = x + this.config.size - (this.countText.width || 15) - 2;
            const countY = y + this.config.size - 12;
            
            // Background for count
            ctx.drawRectangle(
                ex.vec(countX - 1, countY - 1),
                (this.countText.width || 15) + 2,
                12,
                UITheme.Colors.backgroundDark
            );
            
            this.countText.draw(ctx, countX, countY);
        }
    }
    
    private drawItem(ctx: ex.ExcaliburGraphicsContext, x: number, y: number) {
        if (!this.item) return;
        
        // Try to get item sprite
        const sprite = this.item.getSprite?.();
        if (sprite) {
            // Draw sprite centered in slot
            const spriteX = x + (this.config.size - 32) / 2; // Assuming 32px sprites
            const spriteY = y + (this.config.size - 32) / 2;
            sprite.draw(ctx, spriteX, spriteY);
        } else {
            // Fallback: draw item name abbreviation
            const nameText = UITheme.createText(
                this.item.name.substring(0, 3).toUpperCase(),
                'small',
                UITheme.Colors.text
            );
            const textX = x + (this.config.size - (nameText.width || 20)) / 2;
            const textY = y + (this.config.size - 10) / 2;
            nameText.draw(ctx, textX, textY);
        }
        
        // Draw rarity indicator
        const rarityColor = UITheme.getItemRarityColor(this.item);
        if (rarityColor !== UITheme.Colors.common) {
            ctx.drawRectangle(
                ex.vec(x, y + this.config.size - 3),
                this.config.size,
                3,
                rarityColor
            );
        }
        
        // Draw cursed indicator
        if (this.item.cursed) {
            ctx.drawCircle(
                ex.vec(x + this.config.size - 8, y + 8),
                4,
                UITheme.Colors.cursed
            );
        }
        
        // Draw identified indicator
        if ('identified' in this.item && !this.item.identified) {
            const qText = UITheme.createText('?', 'small', UITheme.Colors.textWarning);
            qText.draw(ctx, x + 2, y + this.config.size - 8);
        }
    }
    
    private drawEmptySlotIcon(ctx: ex.ExcaliburGraphicsContext, x: number, y: number) {
        // Draw subtle plus icon for empty slots
        const centerX = x + this.config.size / 2;
        const centerY = y + this.config.size / 2;
        const size = 6;
        
        ctx.drawLine(
            ex.vec(centerX - size, centerY),
            ex.vec(centerX + size, centerY),
            UITheme.Colors.textMuted,
            1
        );
        
        ctx.drawLine(
            ex.vec(centerX, centerY - size),
            ex.vec(centerX, centerY + size),
            UITheme.Colors.textMuted,
            1
        );
    }
    
    // Tooltip support
    public getTooltipText(): string {
        if (!this.item) return '';
        
        if ('getTooltipText' in this.item && typeof this.item.getTooltipText === 'function') {
            return this.item.getTooltipText();
        }
        
        // Basic tooltip
        let tooltip = this.item.getDisplayName();
        if (this.item.description) {
            tooltip += '\n' + this.item.description;
        }
        
        return tooltip;
    }
}