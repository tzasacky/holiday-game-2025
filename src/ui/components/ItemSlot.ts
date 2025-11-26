import * as ex from 'excalibur';
import { UITheme } from '../UITheme';
import { ItemEntity } from '../../factories/ItemFactory';

export interface ItemSlotConfig {
    size: number;
    showCount?: boolean;
    showHotkey?: boolean;
    hotkey?: string;
    acceptsItemType?: (item: ItemEntity) => boolean;
    onItemClick?: (item: ItemEntity | null, slotIndex: number) => void;
    onItemRightClick?: (item: ItemEntity | null, slotIndex: number) => void;
    onItemDragStart?: (item: ItemEntity, slotIndex: number) => void;
    onItemDragEnd?: (item: ItemEntity | null, slotIndex: number) => void;
}

export class ItemSlot extends ex.Actor {
    private config: ItemSlotConfig;
    private slotIndex: number;
    private item: ItemEntity | null = null;
    
    // Visuals
    private background!: ex.Rectangle;
    private border!: ex.Rectangle;
    private countText?: ex.Text;
    private hotkeyText?: ex.Text;
    
    // State
    private isHovered: boolean = false;
    private isDragTarget: boolean = false;
    private isSelected: boolean = false;
    
    constructor(config: ItemSlotConfig, slotIndex: number = 0) {
        super({
            width: config.size,
            height: config.size,
            name: `ItemSlot-${slotIndex}`,
        });
        
        this.config = config;
        this.slotIndex = slotIndex;
    }
    
    onInitialize(engine: ex.Engine) {
        this.initializeVisuals();
        this.setupInput();
    }
    
    private initializeVisuals() {
        this.graphics.use(new ex.GraphicsGroup({ members: [] })); // Clear default
        this.updateVisuals();
    }
    
    
    private setupInput() {
        this.on('pointerenter', (evt) => {
            console.log(`[ItemSlot-${this.slotIndex}] PointerEnter - screenPos: (${evt.screenPos.x}, ${evt.screenPos.y}), worldPos: (${evt.worldPos.x}, ${evt.worldPos.y})`);
            this.setHovered(true);
        });
        
        this.on('pointerleave', (evt) => {
            console.log(`[ItemSlot-${this.slotIndex}] PointerLeave`);
            this.setHovered(false);
        });
        
        this.on('pointerdown', (evt) => {
            console.log(`[ItemSlot-${this.slotIndex}] PointerDown - button: ${evt.button}, screenPos: (${evt.screenPos.x}, ${evt.screenPos.y}), this.pos: (${this.pos.x}, ${this.pos.y})`);
            if (evt.button === ex.PointerButton.Left) {
                this.config.onItemClick?.(this.item, this.slotIndex);
                if (this.item) {
                    this.config.onItemDragStart?.(this.item, this.slotIndex);
                }
            } else if (evt.button === ex.PointerButton.Right) {
                this.config.onItemRightClick?.(this.item, this.slotIndex);
            }
        });
        
        this.on('pointerup', (evt) => {
             // Drag end logic is usually handled by a global drag manager or the container
             // But we can signal it here if needed
        });
    }

    
    public setItem(item: ItemEntity | null) {
        this.item = item;
        this.updateVisuals();
    }
    
    public getItem(): ItemEntity | null {
        return this.item;
    }
    
    public isEmpty(): boolean {
        return this.item === null;
    }
    
    public canAcceptItem(item: ItemEntity): boolean {
        if (!this.config.acceptsItemType) return true;
        return this.config.acceptsItemType(item);
    }
    
    public setHovered(hovered: boolean) {
        this.isHovered = hovered;
        this.updateVisuals();
    }
    
    public setDragTarget(isDragTarget: boolean) {
        this.isDragTarget = isDragTarget;
        this.updateVisuals();
    }
    
    public setSelected(selected: boolean) {
        this.isSelected = selected;
        this.updateVisuals();
    }
    
    public handleDragEnd(item: ItemEntity | null): void {
        this.config.onItemDragEnd?.(item, this.slotIndex);
    }
    
    
    private updateVisuals() {
        console.log(`[ItemSlot-${this.slotIndex}] updateVisuals() called - has item: ${!!this.item}`);
        const members: { graphic: ex.Graphic, offset: ex.Vector }[] = [];
        
        
        // Background - positioned at (0, 0) from top-left
        const bg = UITheme.createRectangle(
            this.config.size,
            this.config.size,
            {
                fillColor: UITheme.Colors.panelLight,
                strokeColor: UITheme.Colors.border,
                strokeWidth: UITheme.Layout.borderWidth.thin
            }
        );
        members.push({ graphic: bg, offset: ex.vec(0, 0) });
        
        // Border (State-based) - overlay on background
        let borderColor = ex.Color.Transparent;
        let borderWidth = 1;
        
        if (this.isSelected) {
            borderColor = UITheme.Colors.primary;
            borderWidth = 3;
        } else if (this.isDragTarget) {
            borderColor = UITheme.Colors.accent;
            borderWidth = 2;
        } else if (this.isHovered) {
            borderColor = UITheme.Colors.borderLight;
            borderWidth = 2;
        }
        
        if (borderColor !== ex.Color.Transparent) {
            const border = new ex.Rectangle({
                width: this.config.size,
                height: this.config.size,
                color: ex.Color.Transparent,
                strokeColor: borderColor,
                lineWidth: borderWidth
            });
            members.push({ graphic: border, offset: ex.vec(0, 0) });
        }
        
        // Hotkey label - top-left corner
        if (this.config.showHotkey && this.config.hotkey) {
            const hotkeyText = UITheme.createText(
                this.config.hotkey,
                'small',
                UITheme.Colors.textMuted
            );
            members.push({ graphic: hotkeyText, offset: ex.vec(4, 4) });
        }
        
        // Item sprite or fallback
        if (this.item) {
            console.log(`[ItemSlot-${this.slotIndex}] Rendering item: ${this.item.definition.name} (ID: ${this.item.id})`);
            const sprite = this.item.getSprite?.();
            console.log(`[ItemSlot-${this.slotIndex}] getSprite() returned:`, sprite ? sprite.constructor.name : 'null');
            
            if (sprite) {
                // Center the 32x32 sprite in the slot
                const spriteX = (this.config.size - 32) / 2;
                const spriteY = (this.config.size - 32) / 2;
                members.push({ graphic: sprite, offset: ex.vec(spriteX, spriteY) });
            } else {
                // Fallback rendering when sprite not available
                console.warn(`[ItemSlot-${this.slotIndex}] No sprite for item '${this.item.definition.name}' (ID: ${this.item.id})`);
                
                // Create fallback graphic - colored rectangle with text
                const fallbackBg = new ex.Rectangle({
                    width: 28,
                    height: 28,
                    color: UITheme.Colors.panelLight.lighten(0.2)
                });
                
                const nameText = UITheme.createText(
                    this.item.definition.name.substring(0, 3).toUpperCase(),
                    'small',
                    UITheme.Colors.text
                );
                
                // Center both the background and text
                const fallbackX = (this.config.size - 28) / 2;
                const fallbackY = (this.config.size - 28) / 2;
                members.push({ graphic: fallbackBg, offset: ex.vec(fallbackX, fallbackY) });
                
                const textX = this.config.size / 2 - (nameText.width || 10) / 2;
                const textY = this.config.size / 2 - 6; // Approximate text height centering
                members.push({ graphic: nameText, offset: ex.vec(textX, textY) });
            }
            
            // Rarity indicator bar at bottom
            const rarityColor = UITheme.getItemRarityColor(this.item);
            if (rarityColor !== UITheme.Colors.common) {
                const rarityBar = new ex.Rectangle({
                    width: this.config.size,
                    height: 3,
                    color: rarityColor
                });
                members.push({ graphic: rarityBar, offset: ex.vec(0, this.config.size - 3) });
            }
            
            // Stack count badge - bottom-right corner
            if (this.config.showCount && this.item.count > 1) {
                const countText = UITheme.createText(
                    this.item.count.toString(),
                    'small',
                    UITheme.Colors.text
                );
                const countX = this.config.size - (countText.width || 15) - 4;
                const countY = this.config.size - 14;
                
                // Background for count
                const countBg = new ex.Rectangle({
                    width: (countText.width || 15) + 4,
                    height: 14,
                    color: UITheme.Colors.backgroundDark
                });
                
                members.push({ graphic: countBg, offset: ex.vec(countX - 2, countY - 1) });
                members.push({ graphic: countText, offset: ex.vec(countX, countY) });
            }
        }
        
        // Use GraphicsGroup with useAnchor: false for consistent top-left positioning
        console.log(`[ItemSlot-${this.slotIndex}] Setting GraphicsGroup with ${members.length} members`);
        members.forEach((m, i) => {
            console.log(`[ItemSlot-${this.slotIndex}]   Member ${i}: ${m.graphic.constructor.name} at offset (${m.offset.x}, ${m.offset.y})`);
        });
        
        this.graphics.use(new ex.GraphicsGroup({ 
            members,
            useAnchor: false // Critical: position from top-left corner
        }));
        
        console.log(`[ItemSlot-${this.slotIndex}] updateVisuals() complete`);
    }
    
    // Tooltip support
    public getTooltipText(): string {
        if (!this.item) return '';
        
        if ('getTooltipText' in this.item && typeof this.item.getTooltipText === 'function') {
            return this.item.getTooltipText();
        }
        
        let tooltip = this.item.getDisplayName();
        if (this.item.definition.description) {
            tooltip += '\n' + this.item.definition.description;
        }
        
        return tooltip;
    }
    
    // Compatibility methods for manual interaction if needed (but prefer events)
    public handleClick(pos: ex.Vector, slotBounds: { x: number, y: number }): boolean {
        // Deprecated, use events
        return false;
    }
    
    public handleRightClick(pos: ex.Vector, slotBounds: { x: number, y: number }): boolean {
        return false;
    }
    
    public handleDragStart(pos: ex.Vector, slotBounds: { x: number, y: number }): boolean {
        return false;
    }
}
