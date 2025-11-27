import * as ex from 'excalibur';
import { UITheme } from './UITheme';
import { InventoryGrid, InventoryGridConfig } from './components/InventoryGrid';
import { EquipmentPanel, EquipmentPanelConfig, EquipmentSlotType } from './components/EquipmentPanel';
import { GameActor } from '../components/GameActor';
import { ItemEntity } from '../factories/ItemFactory';
import { Inventory } from '../items/Inventory';
import { EventBus } from '../core/EventBus';
import { GameEventNames } from '../core/GameEvents';
import { UIManager } from './UIManager';

export class InventoryScreen extends ex.ScreenElement {
    private hero: GameActor;
    private engine!: ex.Engine;
    
    // Components
    private inventoryGrid!: InventoryGrid;
    private equipmentPanel!: EquipmentPanel;
    
    // Visuals
    private background!: ex.Rectangle;
    private titleText!: ex.Text;
    
    // State
    private isOpen: boolean = false;
    
    // Layout
    private readonly PADDING = UITheme.Layout.padding.medium;
    private readonly SLOT_SIZE = UITheme.Layout.sizes.slotSize;
    
    constructor(hero: GameActor) {
        const PADDING = UITheme.Layout.padding.medium; // 16
        const SLOT_SIZE = UITheme.Layout.sizes.slotSize; // 40
        
        // InventoryGrid dimensions
        // Width = padding + (5 cols * (slot + padding))
        const invWidth = PADDING + (5 * (SLOT_SIZE + PADDING));
        // Height = title(30) + padding + (4 rows * (slot + padding))
        const invHeight = 30 + PADDING + (4 * (SLOT_SIZE + PADDING));
        
        // EquipmentPanel dimensions  
        const equipWidth = 200;
        const equipHeight = invHeight; // Match inventory height
        
        // Total screen size
        // Width = outer padding + invWidth + gap + equipWidth + outer padding
        const totalWidth = PADDING + invWidth + PADDING + equipWidth + PADDING;
        // Height = outer padding + max(invHeight, equipHeight) + outer padding
        const totalHeight = PADDING + Math.max(invHeight, equipHeight) + PADDING;
        
        super({
            z: UITheme.ZIndex.Inventory,
            name: 'InventoryScreen',
            width: totalWidth,
            height: totalHeight,
            visible: false, // Start hidden
        });
        
        this.hero = hero;
        
        this.initialize(invWidth, invHeight, equipWidth, equipHeight);
    }
    
    private initialize(invWidth: number, invHeight: number, equipWidth: number, equipHeight: number) {
        // Background
        this.background = UITheme.createRectangle(
            this.width,
            this.height,
            {
                fillColor: UITheme.Colors.backgroundDark,
                strokeColor: UITheme.Colors.border,
                strokeWidth: UITheme.Layout.borderWidth.thick
            }
        );
        
        const bgGroup = new ex.GraphicsGroup({
            members: [{ graphic: this.background, offset: ex.vec(0, 0) }],
            useAnchor: false // Position from top-left for consistent layout
        });
        this.graphics.use(bgGroup);
        
        // Inventory Grid
        const gridConfig: InventoryGridConfig = {
            rows: 4,
            cols: 5,
            slotSize: this.SLOT_SIZE,
            padding: this.PADDING,
            showHotbarRow: true,
            onItemClick: (item, index) => this.handleItemClick(item, index),
            onItemRightClick: (item, index) => this.handleItemRightClick(item, index),
            onItemDragStart: (item, index) => this.handleDragStart(item, index),
            onItemDragEnd: (item, index) => this.handleDragEnd(item, index),
            onSlotSwap: (from, to) => this.handleSlotSwap(from, to)
        };
        
        this.inventoryGrid = new InventoryGrid(gridConfig);
        // Position inside the screen with padding
        this.inventoryGrid.pos = ex.vec(this.PADDING, this.PADDING);
        this.addChild(this.inventoryGrid);
        
        // Equipment Panel
        const equipConfig: EquipmentPanelConfig = {
            width: equipWidth,
            height: equipHeight,
            padding: this.PADDING,
            slotSize: this.SLOT_SIZE,
            onItemEquip: (item, slotType) => this.handleEquipItem(item, slotType),
            onItemUnequip: (item, slotType) => this.handleUnequipItem(item, slotType),
            onSlotRightClick: (slotType, item) => this.handleEquipSlotRightClick(slotType, item)
        };
        
        this.equipmentPanel = new EquipmentPanel(equipConfig);
        // Position to the right of inventory with gap
        this.equipmentPanel.pos = ex.vec(this.PADDING + invWidth + this.PADDING, this.PADDING);
        this.addChild(this.equipmentPanel);

        
        // Title
        this.titleText = UITheme.createText('Character', 'heading');
        // Add title as a child actor for easier positioning
        const titleActor = new ex.Actor({
            pos: ex.vec(this.width / 2, -20),
            z: 2,
        });
        titleActor.graphics.use(this.titleText);
        this.addChild(titleActor);

        // Force initial visibility state for all children
        this.children.forEach(child => {
            if (child instanceof ex.Actor) {
                child.graphics.visible = false;
            }
        });
    }
    
    onInitialize(engine: ex.Engine) {
        this.engine = engine;
        
        // Center on screen
        const resolution = engine.screen.resolution;
        this.pos = ex.vec(
            (resolution.width - this.width) / 2,
            (resolution.height - this.height) / 2
        );
        
        console.log(`[InventoryScreen] Positioned at ${this.pos.x}, ${this.pos.y}`);
        
        // Input handling for the screen itself (blocking clicks)
        this.on('pointerdown', (evt) => {
            evt.cancel(); // Block clicks from passing through
        });

        // Ensure everything starts in the correct state (hidden)
        this.updateVisibility();
        
        // Listen for inventory changes
        EventBus.instance.on(GameEventNames.InventoryChange, () => {
             if (this.isOpen) {
                 this.updateState();
             }
        });
    }
    
    public toggle() {
        console.log(`[InventoryScreen] toggle() - was ${this.isOpen ? 'open' : 'closed'}`);
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            this.open();
        } else {
            this.close();
        }
    }
    
    public open() {
        console.log(`[InventoryScreen] open()`);
        this.isOpen = true;
        
        // Add to scene to enable pointer events
        if (this.engine && !this.scene?.actors.includes(this)) {
            this.scene?.add(this);
        }
        
        this.updateVisibility();
        this.updateState();
    }
    
    public close() {
        console.log(`[InventoryScreen] close()`);
        this.isOpen = false;
        
        // CRITICAL: Remove from scene to disable ALL pointer events
        if (this.scene?.actors.includes(this)) {
            this.scene.remove(this);
        }
        
        this.updateVisibility();
    }
    
    private updateVisibility() {
        console.log(`[InventoryScreen] updateVisibility - isOpen: ${this.isOpen}`);
        
        // Set graphics visibility AND pointer events
        this.graphics.visible = this.isOpen;
        
        // Update children recursively
        this.children.forEach(child => {
            if (child instanceof ex.Actor) {
                child.graphics.visible = this.isOpen;
                
                // Handle grandchildren (slots)
                child.children.forEach(grandchild => {
                    if (grandchild instanceof ex.Actor) {
                        grandchild.graphics.visible = this.isOpen;
                    }
                });
            }
        });
        
        console.log(`[InventoryScreen] Visibility update complete`);
    }

    
    public isVisible(): boolean {
        return this.isOpen;
    }
    
    public updateState() {
        console.log(`[InventoryScreen] updateState() called - hero:`, !!this.hero);
        if (!this.hero) return;
        
        const inventoryComp = this.hero.getGameComponent('inventory');
        console.log(`[InventoryScreen] inventoryComp:`, !!inventoryComp);
        console.log(`[InventoryScreen] inventoryComp type:`, inventoryComp?.constructor?.name);
        
        if (inventoryComp) {
            console.log(`[InventoryScreen] Calling inventoryGrid.updateInventory()`);
            this.inventoryGrid.updateInventory(inventoryComp);
        } else {
            console.warn(`[InventoryScreen] No inventory component found on hero`);
        }
        
        this.equipmentPanel.updateEquipment(this.hero);
    }
    
    // Interaction Handlers
    
    private handleItemClick(item: ItemEntity | null, index: number) {
        if (item) {
            console.log(`Clicked item: ${item.definition.name} at index ${index}`);
        }
    }
    
    private handleItemRightClick(item: ItemEntity | null, index: number) {
        if (item) {
            // Use/Equip item
            console.log(`Right-clicked item: ${item.definition.name}`);
            item.use(this.hero);
            this.updateState();
        }
    }
    
    private handleDragStart(item: ItemEntity, index: number) {
        console.log(`Started dragging: ${item.definition.name}`);
        // Drag visual logic could go here, or be handled by InventoryGrid internally
    }
    
    private handleDragEnd(item: ItemEntity | null, index: number) {
        console.log(`Stopped dragging`);
        this.updateState();
    }
    
    private handleSlotSwap(fromIndex: number, toIndex: number) {
        const inventory = this.hero.getGameComponent('inventory') as unknown as Inventory;
        if (inventory) {
            inventory.swap(fromIndex, toIndex);
            this.updateState();
        }
    }
    
    private handleEquipItem(item: ItemEntity, slotType: EquipmentSlotType) {
        console.log(`Equipping ${item.definition.name} to ${slotType}`);
        // Logic to equip item would go here (interacting with Inventory/Equipment components)
        // For now, just log
        this.updateState();
    }
    
    private handleUnequipItem(item: ItemEntity, slotType: EquipmentSlotType) {
        console.log(`Unequipping ${item.definition.name} from ${slotType}`);
        // Logic to unequip
        this.updateState();
    }
    
    private handleEquipSlotRightClick(slotType: EquipmentSlotType, item: ItemEntity | null) {
        if (item) {
            console.log(`Right-clicked equipment slot ${slotType} with ${item.definition.name}`);
            // Maybe unequip?
        }
    }
    
    public isPointInBounds(screenPos: ex.Vector): boolean {
        if (!this.isVisible()) return false;
        
        return screenPos.x >= this.pos.x && 
               screenPos.x <= this.pos.x + this.width &&
               screenPos.y >= this.pos.y && 
               screenPos.y <= this.pos.y + this.height;
    }
}