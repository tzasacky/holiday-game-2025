import * as ex from 'excalibur';
import { UITheme } from './UITheme';
import { ItemSlot, ItemSlotConfig } from './components/ItemSlot';
import { GameActor } from '../components/GameActor';
import { ItemEntity } from '../factories/ItemFactory';
import { EventBus } from '../core/EventBus';
import { GameEventNames } from '../core/GameEvents';


export class Hotbar extends ex.ScreenElement {
    private hero: GameActor;
    private engine!: ex.Engine;
    private slots: ItemSlot[] = [];
    
    // Layout constants
    private readonly SLOT_COUNT = 5;
    private readonly SLOT_SIZE = UITheme.Layout.sizes.hotbarSlotSize;
    private readonly PADDING = UITheme.Layout.padding.medium;
    private readonly ICON_SIZE = 24;
    
    // Visuals
    private background!: ex.Rectangle;
    private inventoryButton!: ex.Text;
    private inventoryButtonBackground!: ex.Rectangle;
    
    // Interaction State
    private hoveredSlotIndex: number = -1;
    private hoveredTooltipItem: ItemEntity | null = null;
    
    // Callbacks
    private onInventoryToggle?: () => void;

    constructor(hero: GameActor, onInventoryToggle?: () => void) {
        // Calculate width properly:
        // - left padding
        // - 5 slots with padding between them
        // - right padding before button
        // - button width
        // - final right padding
        const PADDING = UITheme.Layout.padding.medium; // 15
        const SLOT_SIZE = UITheme.Layout.sizes.hotbarSlotSize; // 48
        const BUTTON_SIZE = 40; // Inventory button
        
        // Width = left pad + (5 slots) + (4 gaps between slots) + gap before button + button + right pad
        const width = PADDING + (5 * SLOT_SIZE) + (4 * PADDING) + PADDING + BUTTON_SIZE + PADDING;
        const height = SLOT_SIZE + (PADDING * 2);

        super({
            z: UITheme.ZIndex.Hotbar,
            name: 'Hotbar',
            width: width,
            height: height,
        });
        
        this.hero = hero;
        this.onInventoryToggle = onInventoryToggle;
        
        this.initialize(width, height);
        
        // Listen for inventory changes to update hotbar
        EventBus.instance.on(GameEventNames.InventoryChange, () => {
            console.log(`[Hotbar] InventoryChange event received, updating state`);
            this.updateState();
        });
        
        // Initial update
        this.updateState();
    }
    
    private initialize(width: number, height: number) {
        // Background
        this.background = UITheme.createRectangle(
            width,
            height,
            {
                fillColor: UITheme.Colors.backgroundDark,
                strokeColor: UITheme.Colors.border,
                strokeWidth: UITheme.Layout.borderWidth.medium
            }
        );
        
        // Set graphic with proper anchoring
        const bgGroup = new ex.GraphicsGroup({
            members: [{ graphic: this.background, offset: ex.vec(0, 0) }],
            useAnchor: false // Position from top-left
        });
        this.graphics.use(bgGroup);
        
        // Create Slots
        for (let i = 0; i < this.SLOT_COUNT; i++) {
            const slotConfig: ItemSlotConfig = {
                size: this.SLOT_SIZE,
                showCount: true,
                showHotkey: true,
                hotkey: (i + 1).toString(),
                onItemClick: (item, index) => this.handleSlotClick(item, index),
                onItemRightClick: (item, index) => this.handleSlotRightClick(item, index)
            };
            
            const slot = new ItemSlot(slotConfig, i);
            
            // Position slot relative to hotbar
            const slotX = this.PADDING + i * (this.SLOT_SIZE + this.PADDING);
            const slotY = this.PADDING;
            slot.pos = ex.vec(slotX, slotY);
            
            this.addChild(slot);
            this.slots.push(slot);
        }
        
        // Inventory Button - simple actor for click handling
        // Position: after the slots + gap
        const inventoryButtonX = this.PADDING + (5 * this.SLOT_SIZE) + (4 * this.PADDING) + this.PADDING;
        const inventoryButtonY = this.PADDING;
        const buttonWidth = 40;
        
        const invBtnActor = new ex.Actor({
            pos: ex.vec(inventoryButtonX, inventoryButtonY),
            width: buttonWidth,
            height: this.SLOT_SIZE,
            name: 'InventoryButton'
        });
        
        this.inventoryButtonBackground = UITheme.createRectangle(
            buttonWidth,
            this.SLOT_SIZE,
            {
                fillColor: UITheme.Colors.panelLight,
                strokeColor: UITheme.Colors.border,
                strokeWidth: 1
            }
        );
        
        this.inventoryButton = UITheme.createText('I', 'heading', UITheme.Colors.text);
        
        invBtnActor.graphics.use(new ex.GraphicsGroup({
            members: [
                { graphic: this.inventoryButtonBackground, offset: ex.vec(0, 0) },
                // Center the text within the button
                { graphic: this.inventoryButton, offset: ex.vec(buttonWidth / 2 - 4, this.SLOT_SIZE / 2 - 7) }
            ],
            useAnchor: false
        }));
        
        invBtnActor.on('pointerdown', () => {
             this.onInventoryToggle?.();
        });
        
        this.addChild(invBtnActor);
    }
    
    onInitialize(engine: ex.Engine) {
        this.engine = engine;
        
        // Center at bottom of screen using logical resolution
        const resolution = engine.screen.resolution;
        this.pos = ex.vec(
            (resolution.width - this.background.width) / 2,
            resolution.height - this.background.height - 10
        );
        console.log(`[Hotbar] Positioned at ${this.pos.x}, ${this.pos.y} (Resolution: ${resolution.width}x${resolution.height})`);
    }
    
    public isPointInBounds(screenPos: ex.Vector): boolean {
        return screenPos.x >= this.pos.x && 
               screenPos.x <= this.pos.x + this.background.width &&
               screenPos.y >= this.pos.y && 
               screenPos.y <= this.pos.y + this.background.height;
    }
    
    private handleSlotClick(item: ItemEntity | null, slotIndex: number) {
        if (item) {
            this.useSlot(slotIndex);
        }
    }
    
    private handleSlotRightClick(item: ItemEntity | null, slotIndex: number) {
        if (item) {
            console.log(`Right-clicked hotbar slot ${slotIndex + 1}: ${item.definition.name}`);
        }
    }
    
    /**
     * Use a hotbar slot by number (1-5)
     * Public so InputManager can call this for keyboard hotkeys
     */
    public useSlot(slotNumber: number) {
        // Convert 1-based slot number to 0-based index
        const slotIndex = slotNumber - 1;
        
        if (slotIndex < 0 || slotIndex >= this.SLOT_COUNT) {
            console.warn(`[Hotbar] Invalid slot number: ${slotNumber}`);
            return;
        }
        
        const item = this.getHotbarItem(slotIndex);
        if (item) {
            console.log(`Using hotbar slot ${slotNumber}: ${item.definition.name}`);
            item.use(this.hero);
        } else {
            console.log(`[Hotbar] Slot ${slotNumber} is empty`);
        }
    }
    
    
    private getHotbarItem(slotIndex: number): ItemEntity | null {
        const inventoryComp = this.hero.getGameComponent('inventory') as any;
        if (!inventoryComp) {
            console.warn(`[Hotbar] No inventory component found on hero`);
            return null;
        }
        
        // InventoryComponent uses getItemByIndex, not getItem
        if (typeof inventoryComp.getItemByIndex === 'function') {
            return inventoryComp.getItemByIndex(slotIndex);
        }
        
        // Fallback: direct array access
        return inventoryComp.items?.[slotIndex] || null;
    }

    
    
    public updateState() {
        console.log(`[Hotbar] updateState() called`);
        
        const inventoryComp = this.hero.getGameComponent('inventory') as any;
        if (!inventoryComp) {
            console.warn(`[Hotbar] No inventory component found`);
            return;
        }
        
        console.log(`[Hotbar] InventoryComponent has ${inventoryComp.items?.length || 0} items`);
        
        for (let i = 0; i < this.SLOT_COUNT; i++) {
            // Use InventoryComponent API
            const item = inventoryComp.getItemByIndex?.(i) || inventoryComp.items?.[i] || null;
            
            console.log(`[Hotbar] Slot ${i}: ${item ? item.definition.name : 'empty'}`);
            this.slots[i].setItem(item);
        }
    }

    
    // Removed onPostDraw as we are using child actors now
}