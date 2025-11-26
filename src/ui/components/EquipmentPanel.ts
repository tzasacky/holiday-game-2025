import * as ex from 'excalibur';
import { UITheme } from '../UITheme';
import { ItemSlot, ItemSlotConfig } from './ItemSlot';
import { GameActor } from '../../components/GameActor';
import { ItemEntity } from '../../factories/ItemFactory';

export enum EquipmentSlotType {
    MainHand = 'mainHand',
    Body = 'body',
    Accessory = 'accessory'
}

export interface EquipmentPanelConfig {
    width: number;
    height: number;
    padding: number;
    slotSize: number;
    onItemEquip?: (item: ItemEntity, slotType: EquipmentSlotType) => void;
    onItemUnequip?: (item: ItemEntity, slotType: EquipmentSlotType) => void;
    onSlotRightClick?: (slotType: EquipmentSlotType, item: ItemEntity | null) => void;
}

export class EquipmentPanel extends ex.Actor {
    private config: EquipmentPanelConfig;
    private hero: GameActor | null = null;
    
    // Visuals
    private background!: ex.Rectangle;
    private titleText!: ex.Text;
    
    // Slots
    private slots: Map<EquipmentSlotType, {
        type: EquipmentSlotType;
        slot: ItemSlot;
        label: string;
        position: ex.Vector;
    }> = new Map();
    
    // Layout constants
    private readonly PADDING = 10;
    private readonly SLOT_SIZE = 40;
    
    constructor(config: EquipmentPanelConfig) {
        super({
            width: config.width,
            height: config.height,
            name: 'EquipmentPanel',
        });
        
        this.config = config;
    }
    
    onInitialize(engine: ex.Engine) {
        this.initializeVisuals();
        this.createSlots();
    }
    
    private initializeVisuals() {
        this.background = UITheme.createRectangle(
            this.config.width,
            this.config.height,
            {
                fillColor: UITheme.Colors.panel,
                strokeColor: UITheme.Colors.border,
                strokeWidth: UITheme.Layout.borderWidth.medium
            }
        );
        
        this.titleText = UITheme.createText('Equipment', 'title');
        // Add background and title to graphics
        const group = new ex.GraphicsGroup({
            members: [
                { graphic: this.background, offset: ex.vec(0, 0) },
                { graphic: this.titleText, offset: ex.vec(this.config.padding, 15) }
            ],
            useAnchor: false // Position from top-left for consistent layout
        });
        
        this.graphics.use(group);
    }
    
    private createSlots() {
        // Define slot layout
        const slotConfigs = [
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
                acceptsItemType: (item: ItemEntity) => this.canEquipInSlot(item, type),
                onItemClick: (item, slotIndex) => this.handleSlotClick(type, item),
                onItemRightClick: (item, slotIndex) => this.handleSlotRightClick(type, item),
                onItemDragStart: (item, slotIndex) => this.onDragStart(type, item),
                onItemDragEnd: (item, slotIndex) => this.handleDragEnd(type, item)
            };
            
            const slot = new ItemSlot(slotConfig, 0);
            slot.pos = position;
            
            // Add label
            const labelText = UITheme.createText(label, 'small', UITheme.Colors.textSecondary);
            // We can add the label to the panel's graphics group or as a child actor
            // Let's add to panel's graphics for simplicity
            const currentGraphics = this.graphics.current as ex.GraphicsGroup;
            if (currentGraphics) {
                currentGraphics.members.push({
                    graphic: labelText,
                    offset: ex.vec(position.x, position.y - 15)
                });
            }
            
            slot.graphics.visible = false; // Start hidden, controlled by InventoryScreen
            
            this.addChild(slot);
            
            this.slots.set(type, {
                type,
                slot,
                label,
                position
            });
        });
    }
    
    private canEquipInSlot(item: ItemEntity, slotType: EquipmentSlotType): boolean {
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
    
    private handleSlotClick(slotType: EquipmentSlotType, item: ItemEntity | null) {
        if (item) {
            // Unequip item
            this.config.onItemUnequip?.(item, slotType);
        }
        // If no item, slot click doesn't do anything (items are equipped by dragging)
    }
    
    private handleSlotRightClick(slotType: EquipmentSlotType, item: ItemEntity | null) {
        this.config.onSlotRightClick?.(slotType, item);
    }
    
    private onDragStart(slotType: EquipmentSlotType, item: ItemEntity) {
        // Start dragging equipped item to unequip it
        // This will be handled by the parent inventory system
    }
    
    private handleDragEnd(slotType: EquipmentSlotType, item: ItemEntity | null) {
        if (item && this.canEquipInSlot(item, slotType)) {
            this.config.onItemEquip?.(item, slotType);
        }
    }
    
    public updateEquipment(hero: GameActor) {
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
    
    // Compatibility methods removed
    
    public getHoveredSlot(pos: ex.Vector, panelBounds: { x: number, y: number }): { slotType: EquipmentSlotType, item: ItemEntity | null } | null {
        // Similar to InventoryGrid, we can implement this if needed, but slots handle their own hover
        return null;
    }
    
    public getWidth(): number {
        return this.config.width;
    }
    
    public getHeight(): number {
        return this.config.height;
    }
}
