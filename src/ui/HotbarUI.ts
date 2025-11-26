import * as ex from 'excalibur';
import { Hero } from '../actors/Hero';
import { Inventory } from '../items/Inventory';

export class HotbarUI extends ex.ScreenElement {
    private actor: Hero;
    
    // Layout Constants
    private readonly SLOT_SIZE = 40;
    private readonly PADDING = 10;
    private readonly SLOTS = 5;
    
    constructor(actor: Hero) {
        super({ z: 90 }); // Below InventoryUI
        this.actor = actor;
    }

    onInitialize(engine: ex.Engine) {
        // Position at bottom center
        const width = (this.SLOT_SIZE + this.PADDING) * this.SLOTS + this.PADDING;
        this.pos = ex.vec(engine.drawWidth / 2 - width / 2, engine.drawHeight - this.SLOT_SIZE - this.PADDING * 2);
        
        // Input Handling (1-5 keys)
        engine.input.keyboard.on('press', (evt) => {
            let index = -1;
            if (evt.key === ex.Keys.Digit1) index = 0;
            if (evt.key === ex.Keys.Digit2) index = 1;
            if (evt.key === ex.Keys.Digit3) index = 2;
            if (evt.key === ex.Keys.Digit4) index = 3;
            if (evt.key === ex.Keys.Digit5) index = 4;
            
            if (index > -1) {
                this.useSlot(index);
            }
        });
    }

    useSlot(index: number) {
        const item = this.actor.inventory.getItem(index);
        if (item) {
            console.log(`Hotbar used: ${item.name}`);
            if (item.use(this.actor)) {
                // If item consumed, remove it (logic depends on item)
                // For now assuming use() returns true if successful action
                // Item count decrement should be handled by item.use or inventory
            }
        }
    }

    draw(ctx: ex.ExcaliburGraphicsContext, delta: number) {
        const startX = 0;
        const startY = 0;

        for (let i = 0; i < this.SLOTS; i++) {
            const x = startX + i * (this.SLOT_SIZE + this.PADDING);
            const y = startY;

            // Slot Background
            ctx.drawRectangle(ex.vec(x, y), this.SLOT_SIZE, this.SLOT_SIZE, ex.Color.fromHex('#333333'));
            ctx.drawRectangle(ex.vec(x, y), this.SLOT_SIZE, this.SLOT_SIZE, ex.Color.Transparent, ex.Color.White, 2);
            
            // Hotkey Number
            ctx.debug.drawText((i + 1).toString(), ex.vec(x + 2, y + 10));

            // Item
            const item = this.actor.inventory.getItem(i);
            if (item) {
                 const sprite = item.getSprite();
                 if (sprite) {
                     sprite.draw(ctx, x, y);
                 } else {
                     ctx.debug.drawText(item.name.substring(0, 3), ex.vec(x + 5, y + 20));
                 }
                // Stack Count
                if (item.count > 1) {
                    ctx.debug.drawText(item.count.toString(), ex.vec(x + 25, y + 35));
                }
            }
        }
    }
}
