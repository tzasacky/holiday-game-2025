import * as ex from 'excalibur';
import { Hero } from '../actors/Hero';
import { Inventory } from '../items/Inventory';
import { Item } from '../items/Item';
import { Equipable } from '../items/Equipable';

export class InventoryUI extends ex.ScreenElement {
    private actor: Hero;
    private visible: boolean = false;
    
    // Layout Constants
    private readonly SLOT_SIZE = 40;
    private readonly PADDING = 10;
    private readonly COLS = 5;
    private readonly ROWS = 4;
    
    // UI Elements
    private background: ex.Rectangle;
    private slots: ex.Rectangle[] = [];
    private equipmentSlots: ex.Rectangle[] = []; // Weapon, Armor, Artifact, etc.

    // Drag State
    private dragIndex: number = -1;
    private isDragging: boolean = false;
    private dragOffset: ex.Vector = ex.vec(0, 0);
    private dragPos: ex.Vector = ex.vec(0, 0);

    // Text Graphics
    private titleText: ex.Text;
    private mainText: ex.Text;
    private smallText: ex.Text;

    constructor(actor: Hero) {
        super({ z: 100 }); // High Z-index to be on top
        this.actor = actor;
        
        const titleFont = new ex.Font({
            family: 'Arial',
            size: 20,
            unit: ex.FontUnit.Px,
            color: ex.Color.White
        });
        this.titleText = new ex.Text({ font: titleFont, text: '' });

        const textFont = new ex.Font({
            family: 'Arial',
            size: 14,
            unit: ex.FontUnit.Px,
            color: ex.Color.White
        });
        this.mainText = new ex.Text({ font: textFont, text: '' });

        const smallFont = new ex.Font({
            family: 'Arial',
            size: 10,
            unit: ex.FontUnit.Px,
            color: ex.Color.Yellow
        });
        this.smallText = new ex.Text({ font: smallFont, text: '' });
        
        // Background
        const width = (this.SLOT_SIZE + this.PADDING) * this.COLS + this.PADDING + 120; // Extra space for equipment
        const height = (this.SLOT_SIZE + this.PADDING) * this.ROWS + this.PADDING + 40; // Extra height for titles
        
        this.background = new ex.Rectangle({
            width: width,
            height: height,
            color: ex.Color.fromHex('#222222'),
            strokeColor: ex.Color.White,
            lineWidth: 2
        });
    }

    onInitialize(engine: ex.Engine) {
        // Center on screen
        this.pos = ex.vec(engine.drawWidth / 2 - this.background.width / 2, engine.drawHeight / 2 - this.background.height / 2);
        
        // Input Handling
        // We need to be careful about event bubbling. 
        // Since this is an Actor/ScreenElement, we can use built-in pointer events if we have a collider,
        // but for UI it's often easier to use global events and check bounds.
        
        engine.input.keyboard.on('press', (evt) => {
            if (evt.key === ex.Keys.I) {
                this.toggle();
            }
            if (evt.key === ex.Keys.Esc && this.visible) {
                this.toggle();
            }
        });

        engine.input.pointers.primary.on('down', (evt) => {
            if (!this.visible) return;
            // Check if click is within UI bounds
            if (this.isWithinBounds(evt.screenPos)) {
                // evt.cancel(); // Stop propagation to game world? Excalibur doesn't have cancel() on events like this easily
                // We rely on UIManager or InputManager to check if UI is open
                this.handlePointerDown(evt.screenPos);
            }
        });

        engine.input.pointers.primary.on('move', (evt) => {
            if (!this.visible) return;
            if (this.isDragging) {
                this.dragPos = evt.screenPos;
            }
            this.handlePointerMove(evt.screenPos);
        });

        engine.input.pointers.primary.on('up', (evt) => {
            if (!this.visible) return;
            if (this.isDragging) {
                this.handlePointerUp(evt.screenPos);
            }
        });
    }

    private isWithinBounds(pos: ex.Vector): boolean {
        return pos.x >= this.pos.x && pos.x <= this.pos.x + this.background.width &&
               pos.y >= this.pos.y && pos.y <= this.pos.y + this.background.height;
    }

    handlePointerDown(pos: ex.Vector) {
        // Check Inventory Slots
        const startX = this.pos.x + 120;
        const startY = this.pos.y + 40; // Adjusted for title

        for (let i = 0; i < this.actor.inventory.capacity; i++) {
            const col = i % this.COLS;
            const row = Math.floor(i / this.COLS);
            
            const x = startX + col * (this.SLOT_SIZE + this.PADDING);
            const y = startY + row * (this.SLOT_SIZE + this.PADDING);

            if (pos.x >= x && pos.x < x + this.SLOT_SIZE &&
                pos.y >= y && pos.y < y + this.SLOT_SIZE) {
                
                const item = this.actor.inventory.getItem(i);
                if (item) {
                    this.isDragging = true;
                    this.dragIndex = i;
                    this.dragPos = pos;
                    this.dragOffset = ex.vec(pos.x - x, pos.y - y);
                    return;
                }
            }
        }
    }

    handlePointerUp(pos: ex.Vector) {
        this.isDragging = false;
        
        // Check drop target
        const startX = this.pos.x + 120;
        const startY = this.pos.y + 40;

        // 1. Check if dropped on another inventory slot
        for (let i = 0; i < this.actor.inventory.capacity; i++) {
            const col = i % this.COLS;
            const row = Math.floor(i / this.COLS);
            
            const x = startX + col * (this.SLOT_SIZE + this.PADDING);
            const y = startY + row * (this.SLOT_SIZE + this.PADDING);

            if (pos.x >= x && pos.x < x + this.SLOT_SIZE &&
                pos.y >= y && pos.y < y + this.SLOT_SIZE) {
                
                if (i !== this.dragIndex) {
                    this.actor.inventory.swap(this.dragIndex, i);
                }
                this.dragIndex = -1;
                return;
            }
        }

        // 2. Check if dropped outside UI (Drop Item)
        if (pos.x < this.pos.x || pos.x > this.pos.x + this.background.width ||
            pos.y < this.pos.y || pos.y > this.pos.y + this.background.height) {
            
            this.actor.dropItem(this.dragIndex);
            this.dragIndex = -1;
            return;
        }

        // 3. TODO: Check Equipment Slots
        
        this.dragIndex = -1;
    }

    handlePointerMove(pos: ex.Vector) {
        this.dragPos = pos; // Update mouse pos for tooltip
        
        if (this.isDragging) return;

        // Check Inventory Slots for Hover
        const startX = this.pos.x + 120;
        const startY = this.pos.y + 40;
        
        this.hoveredItem = null;

        for (let i = 0; i < this.actor.inventory.capacity; i++) {
            const col = i % this.COLS;
            const row = Math.floor(i / this.COLS);
            
            const x = startX + col * (this.SLOT_SIZE + this.PADDING);
            const y = startY + row * (this.SLOT_SIZE + this.PADDING);

            if (pos.x >= x && pos.x < x + this.SLOT_SIZE &&
                pos.y >= y && pos.y < y + this.SLOT_SIZE) {
                
                const item = this.actor.inventory.getItem(i);
                if (item) {
                    this.hoveredItem = item;
                    return;
                }
            }
        }
        
        // TODO: Check Equipment Slots for Hover
    }

    toggle() {
        this.visible = !this.visible;
    }

    draw(ctx: ex.ExcaliburGraphicsContext, delta: number) {
        if (!this.visible) return;

        // Draw Background
        this.background.draw(ctx, this.pos.x, this.pos.y);

        // Draw Equipment Slots (Left Side) - Armor Stand
        const equipStartX = this.pos.x + 20;
        const equipStartY = this.pos.y + 40;
        
        // Title
        this.titleText.text = "Equipment";
        this.titleText.draw(ctx, equipStartX, this.pos.y + 25);

        // Weapon Slot
        ctx.drawRectangle(ex.vec(equipStartX, equipStartY), this.SLOT_SIZE, this.SLOT_SIZE, ex.Color.fromHex('#333333'));
        ctx.drawRectangle(ex.vec(equipStartX, equipStartY), this.SLOT_SIZE, this.SLOT_SIZE, ex.Color.Transparent, ex.Color.Gray, 1);
        this.mainText.text = "Main Hand";
        this.mainText.draw(ctx, equipStartX, equipStartY - 5);
        
        if (this.actor.weapon) {
            const sprite = this.actor.weapon.getSprite();
            if (sprite) {
                sprite.draw(ctx, equipStartX, equipStartY);
            } else {
                this.mainText.text = this.actor.weapon.name.substring(0, 3);
                this.mainText.draw(ctx, equipStartX + 5, equipStartY + 25);
            }
        } else {
            // Placeholder icon or text
            this.mainText.text = "Empty";
            this.mainText.draw(ctx, equipStartX + 5, equipStartY + 25);
        }

        // Armor Slot
        const armorY = equipStartY + this.SLOT_SIZE + 30;
        ctx.drawRectangle(ex.vec(equipStartX, armorY), this.SLOT_SIZE, this.SLOT_SIZE, ex.Color.fromHex('#333333'));
        ctx.drawRectangle(ex.vec(equipStartX, armorY), this.SLOT_SIZE, this.SLOT_SIZE, ex.Color.Transparent, ex.Color.Gray, 1);
        this.mainText.text = "Body";
        this.mainText.draw(ctx, equipStartX, armorY - 5);

        if (this.actor.armor) {
             const sprite = this.actor.armor.getSprite();
             if (sprite) {
                 sprite.draw(ctx, equipStartX, armorY);
             } else {
                 this.mainText.text = this.actor.armor.name.substring(0, 3);
                 this.mainText.draw(ctx, equipStartX + 5, armorY + 25);
             }
        } else {
             this.mainText.text = "Empty";
             this.mainText.draw(ctx, equipStartX + 5, armorY + 25);
        }


        // Draw Inventory Grid (Right Side)
        const startX = this.pos.x + 120;
        const startY = this.pos.y + 40;
        
        // Grid Title
        this.titleText.text = "Backpack";
        this.titleText.draw(ctx, startX, this.pos.y + 25);

        for (let i = 0; i < this.actor.inventory.capacity; i++) {
            const col = i % this.COLS;
            const row = Math.floor(i / this.COLS);
            
            const x = startX + col * (this.SLOT_SIZE + this.PADDING);
            const y = startY + row * (this.SLOT_SIZE + this.PADDING);

            // Slot Background
            // Highlight Hotbar (First Row)
            let color = ex.Color.fromHex('#444444');
            if (row === 0) {
                color = ex.Color.fromHex('#555555'); // Slightly lighter for hotbar
                // Draw Hotkey number
                this.smallText.text = (col + 1).toString();
                this.smallText.draw(ctx, x + 2, y + 10);
            }
            
            ctx.drawRectangle(ex.vec(x, y), this.SLOT_SIZE, this.SLOT_SIZE, color);
            ctx.drawRectangle(ex.vec(x, y), this.SLOT_SIZE, this.SLOT_SIZE, ex.Color.Transparent, ex.Color.Black, 1);
            
            // Item
            const item = this.actor.inventory.getItem(i);
            // Don't draw if dragging this item
            if (item && !(this.isDragging && this.dragIndex === i)) {
                // Draw Item Sprite
                const sprite = item.getSprite();
                if (!sprite) {
                     console.warn(`Missing sprite for item ${item.name} (ID: ${item.id})`);
                } else {
                    // console.log(`Drawing sprite for ${item.name}:`, sprite);
                }
                if (sprite) {
                    sprite.draw(ctx, x, y); // Draw at slot position
                } else {
                    this.mainText.text = item.name.substring(0, 4);
                    this.mainText.draw(ctx, x + 5, y + 25);
                }
                
                // Stack Count
                if (item.count > 1) {
                    this.mainText.text = item.count.toString();
                    this.mainText.draw(ctx, x + 25, y + 35);
                }
                
                // Color Code (Curse/Enchant)
                if ('isCursed' in item) {
                    const equipable = item as any;
                    if (equipable.isCursed) {
                        ctx.drawCircle(ex.vec(x + 35, y + 5), 3, ex.Color.Red);
                    } else if (equipable.identified && equipable.effects && equipable.effects.length > 0) {
                        ctx.drawCircle(ex.vec(x + 35, y + 5), 3, ex.Color.Green);
                    }
                }
            }
        }
        
        // Draw Dragged Item
        if (this.isDragging) {
            const item = this.actor.inventory.getItem(this.dragIndex);
            if (item) {
                const sprite = item.getSprite();
                // Draw centered on mouse or with offset
                // Using dragPos directly (screen coords)
                if (sprite) {
                    sprite.draw(ctx, this.dragPos.x - this.SLOT_SIZE/2, this.dragPos.y - this.SLOT_SIZE/2);
                } else {
                    this.mainText.text = item.name;
                    this.mainText.draw(ctx, this.dragPos.x, this.dragPos.y);
                }
            }
        }
        
        // Legend
        this.mainText.text = "I: Close | Drag: Move/Drop";
        this.mainText.draw(ctx, this.pos.x + 10, this.pos.y + this.background.height + 20);

        // Draw Tooltip (if hovering and not dragging)
        if (!this.isDragging && this.hoveredItem) {
            this.drawTooltip(ctx, this.hoveredItem, this.dragPos); // dragPos tracks mouse pos
        }
    }

    private hoveredItem: Item | null = null;

    drawTooltip(ctx: ex.ExcaliburGraphicsContext, item: Item, pos: ex.Vector) {
        const padding = 10;
        const lineHeight = 20;
        const width = 200;
        
        // Calculate height based on content
        let lines = [item.name];
        if (item.description) lines.push(item.description);
        
        // Stats
        if ('minDamage' in item) {
             const weapon = item as any;
             lines.push(`Damage: ${weapon.minDamage}-${weapon.maxDamage}`);
        }
        if ('defense' in item) {
             const armor = item as any;
             lines.push(`Defense: ${armor.defense}`);
        }
        
        // Effects
        if ('effects' in item) {
            const equipable = item as any;
            if (equipable.identified && equipable.effects) {
                equipable.effects.forEach((eff: any) => {
                    lines.push(eff.description || eff.name);
                });
            } else if (!equipable.identified) {
                lines.push("Unidentified");
            }
        }

        const height = lines.length * lineHeight + padding * 2;
        
        // Draw Background
        const x = pos.x + 15;
        const y = pos.y + 15;
        
        ctx.drawRectangle(ex.vec(x, y), width, height, ex.Color.Black);
        ctx.drawRectangle(ex.vec(x, y), width, height, ex.Color.Transparent, ex.Color.White, 1);
        
        // Draw Text
        lines.forEach((line, index) => {
            this.mainText.text = line;
            this.mainText.draw(ctx, x + padding, y + padding + index * lineHeight + 10);
        });
    }
}
