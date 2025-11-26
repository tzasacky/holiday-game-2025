import * as ex from 'excalibur';
import { GameEntity } from '../core/GameEntity';
import { Item } from './Item';
import { Actor } from '../actors/Actor';
import { Hero } from '../actors/Hero';
import { Interactable } from '../mechanics/Interactable';

export class ItemEntity extends GameEntity implements Interactable {
    constructor(gridPos: ex.Vector, public item: Item) {
        super(gridPos, { width: 32, height: 32, collisionType: ex.CollisionType.Passive });
        this.name = item.name;
    }

    onInitialize(engine: ex.Engine) {
        super.onInitialize(engine);
        // Use item sprite from registry via item
        const sprite = this.item.getSprite();
        if (sprite) {
            this.graphics.use(sprite);
        }
    }

    interact(actor: Actor): boolean {
        console.log(`${actor.name} picked up ${this.item.name}`);
        
        if (actor instanceof Hero) {
            if (actor.inventory.addItem(this.item)) {
                this.kill(); // Remove from world
                return true;
            }
            console.log("Inventory full!");
        }
        return false;
    }
}
