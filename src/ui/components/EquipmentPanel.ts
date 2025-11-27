import * as ex from 'excalibur';
import { UITheme } from '../UITheme';
import { ItemSlot, ItemSlotConfig } from './ItemSlot';
import { Item } from '../../items/Item';

export enum EquipmentSlotType {
    MainHand = 'mainhand',
    Body = 'body',
    Accessory = 'accessory'
}

export interface EquipmentSlot {
    type: EquipmentSlotType;
    slot: ItemSlot;
    label: string;
    position: ex.Vector;
}

export interface EquipmentPanelConfig {
    width: number;
    height: number;
    onItemEquip?: (item: Item, slotType: EquipmentSlotType) => void;
    onItemUnequip?: (item: Item, slotType: EquipmentSlotType) => void;
    onSlotRightClick?: (slotType: EquipmentSlotType, item: Item | null) => void;
}

export class EquipmentPanel {
    private config: EquipmentPanelConfig;
    private hero: Hero;
    private slots: Map<EquipmentSlotType, EquipmentSlot> = new Map();
    
    // Visual elements
    private background!: ex.Rectangle;
    private titleText!: ex.Text;
    
    // Layout constants
    private readonly SLOT_SIZE = UITheme.Layout.sizes.slotSize;
    private readonly PADDING = UITheme.Layout.padding.medium;
    
    constructor(config: EquipmentPanelConfig, hero: Hero) {
        this.config = config;
        this.hero = hero;
        
        this.initializeVisuals();
        this.setupEquipmentSlots();
    }
    
    private initializeVisuals() {
        // Background panel
        this.background = UITheme.createRectangle(
            this.config.width,
            this.config.height,
            {
                fillColor: UITheme.Colors.panel,
                strokeColor: UITheme.Colors.border,
                strokeWidth: UITheme.Layout.borderWidth.medium
            }
        );
        
        // Title
        this.titleText = UITheme.createText('Equipment', 'heading');
    }
    
    private setupEquipmentSlots() {
        const slotConfigs: Array<{ type: EquipmentSlotType, label: string, position: ex.Vector }> = [
            { 
                type: EquipmentSlotType.MainHand, 
                label: 'Main Hand',
                position: ex.vec(this.PADDING + 10, 40)
            },
            {
                type: EquipmentSlotType.Body,
                label: 'Body Armor', 
                position: ex.vec(this.PADDING + 10, 90)
            },
            {
                type: EquipmentSlotType.Accessory,
                label: 'Accessory',
                position: ex.vec(this.PADDING + 10, 140)
            }
        ];
        
        slotConfigs.forEach(({ type, label, position }) => {
            const slotConfig: ItemSlotConfig = {
                size: this.SLOT_SIZE,
                acceptsItemType: (item: Item) => this.canEquipInSlot(item, type),
                onItemClick: (item, slotIndex) => this.handleSlotClick(type, item),
                onItemRightClick: (item, slotIndex) => this.handleSlotRightClick(type, item),
                onItemDragStart: (item, slotIndex) => this.onDragStart(type, item),
                onItemDragEnd: (item, slotIndex) => this.handleDragEnd(type, item)
            };
            
            const slot = new ItemSlot(slotConfig, 0);
            
            this.slots.set(type, {
                type,
                slot,
                label,
                position
            });
        });
    }
    
    private canEquipInSlot(item: Item, slotType: EquipmentSlotType): boolean {
        const idStr = item.id.toString();
        
        switch (slotType) {
            case EquipmentSlotType.MainHand:
                return idStr.includes('Dagger') || 
                       idStr.includes('Hammer') || 
                       idStr.includes('Wand') || 
                       idStr.includes('Sword') || 
                       idStr.includes('Lights') ||
                       idStr.includes('Spear');
                       
            case EquipmentSlotType.Body:
                return idStr.includes('Suit') || 
                       idStr.includes('Plate') || 
                       idStr.includes('Cloak') ||
                       idStr.includes('Sweater');
                       
            case EquipmentSlotType.Accessory:
                return idStr.includes('Ring') || 
                       idStr.includes('Artifact') ||
                       idStr.includes('Amulet');
                       
            default:
                return false;
        }
    }
    
    private handleSlotClick(slotType: EquipmentSlotType, item: Item | null) {
        if (item) {
            // Unequip item
            this.config.onItemUnequip?.(item, slotType);
        }
        // If no item, slot click doesn't do anything (items are equipped by dragging)
    }
    
    private handleSlotRightClick(slotType: EquipmentSlotType, item: Item | null) {
        this.config.onSlotRightClick?.(slotType, item);
    }
    
    private onDragStart(slotType: EquipmentSlotType, item: Item) {
        // Start dragging equipped item to unequip it
        // This will be handled by the parent inventory system
    }
    
    private handleDragEnd(slotType: EquipmentSlotType, item: Item | null) {
        if (item && this.canEquipInSlot(item, slotType)) {
            this.config.onItemEquip?.(item, slotType);
        }
    }
    
    public update(hero: Hero) {
        this.hero = hero;
        
        // Update slot contents based on hero equipment
        const mainHandSlot = this.slots.get(EquipmentSlotType.MainHand);
        if (mainHandSlot) {
            mainHandSlot.slot.setItem(hero.weapon);
        }
        
        const bodySlot = this.slots.get(EquipmentSlotType.Body);
        if (bodySlot) {
            bodySlot.slot.setItem(hero.armor);
        }
        
        const accessorySlot = this.slots.get(EquipmentSlotType.Accessory);
        if (accessorySlot && hero.accessories.length > 0) {
            accessorySlot.slot.setItem(hero.accessories[0]); // Show first accessory
        }
    }
    
    public handleClick(pos: ex.Vector, panelBounds: { x: number, y: number }): boolean {
        const localPos = pos.sub(ex.vec(panelBounds.x, panelBounds.y));
        
        for (const [slotType, equipSlot] of this.slots) {
            const slotBounds = {
                x: equipSlot.position.x,
                y: equipSlot.position.y
            };
            
            if (equipSlot.slot.handleClick(localPos, slotBounds)) {
                return true;
            }
        }
        
        return false;
    }
    
    public handleRightClick(pos: ex.Vector, panelBounds: { x: number, y: number }): boolean {
        const localPos = pos.sub(ex.vec(panelBounds.x, panelBounds.y));
        
        for (const [slotType, equipSlot] of this.slots) {
            const slotBounds = {
                x: equipSlot.position.x,
                y: equipSlot.position.y
            };
            
            if (equipSlot.slot.handleRightClick(localPos, slotBounds)) {
                return true;
            }
        }
        
        return false;
    }
    
    public handleDragStart(pos: ex.Vector, panelBounds: { x: number, y: number }): boolean {
        const localPos = pos.sub(ex.vec(panelBounds.x, panelBounds.y));
        
        for (const [slotType, equipSlot] of this.slots) {
            const slotBounds = {
                x: equipSlot.position.x,
                y: equipSlot.position.y
            };
            
            if (equipSlot.slot.handleDragStart(localPos, slotBounds)) {
                return true;
            }
        }
        
        return false;
    }
    
    public handleDrop(pos: ex.Vector, item: Item, panelBounds: { x: number, y: number }): boolean {
        const localPos = pos.sub(ex.vec(panelBounds.x, panelBounds.y));
        
        for (const [slotType, equipSlot] of this.slots) {
            const slotBounds = {
                x: equipSlot.position.x,
                y: equipSlot.position.y
            };
            
            // Check if drop position is over this slot
            if (localPos.x >= slotBounds.x && 
                localPos.x <= slotBounds.x + this.SLOT_SIZE &&
                localPos.y >= slotBounds.y && 
                localPos.y <= slotBounds.y + this.SLOT_SIZE) {
                
                if (this.canEquipInSlot(item, slotType)) {
                    equipSlot.slot.handleDragEnd(item);
                    return true;
                }
            }
        }
        
        return false;
    }
    
    public getHoveredSlot(pos: ex.Vector, panelBounds: { x: number, y: number }): { slotType: EquipmentSlotType, item: Item | null } | null {
        const localPos = pos.sub(ex.vec(panelBounds.x, panelBounds.y));
        
        for (const [slotType, equipSlot] of this.slots) {
            const slotBounds = {
                x: equipSlot.position.x,
                y: equipSlot.position.y
            };
            
            if (localPos.x >= slotBounds.x && 
                localPos.x <= slotBounds.x + this.SLOT_SIZE &&
                localPos.y >= slotBounds.y && 
                localPos.y <= slotBounds.y + this.SLOT_SIZE) {
                
                return {
                    slotType,
                    item: equipSlot.slot.getItem()
                };
            }
        }
        
        return null;
    }
    
    public draw(ctx: ex.ExcaliburGraphicsContext, x: number, y: number) {
        // Draw background
        this.background.draw(ctx, x, y);
        
        // Draw title
        this.titleText.draw(ctx, x + this.PADDING, y + 10);
        
        // Draw equipment slots
        for (const [slotType, equipSlot] of this.slots) {
            const slotX = x + equipSlot.position.x;
            const slotY = y + equipSlot.position.y;
            
            // Draw slot label
            const labelText = UITheme.createText(equipSlot.label, 'small', UITheme.Colors.textSecondary);
            labelText.draw(ctx, slotX, slotY - 15);
            
            // Draw slot
            equipSlot.slot.draw(ctx, slotX, slotY);
        }
    }
    
    public getWidth(): number {
        return this.config.width;
    }
    
    public getHeight(): number {
        return this.config.height;
    }
}