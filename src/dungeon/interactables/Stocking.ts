import * as ex from 'excalibur';
import { GameEntity } from '../../core/GameEntity';
import { Interactable } from '../../mechanics/Interactable';
import { Actor } from '../../actors/Actor';
import { LootTable } from '../../config/LootTable';
import { Gold } from '../../content/items/misc/Gold';
import { ItemEntity } from '../../items/ItemEntity';
import { Hero } from '../../actors/Hero';

export class Stocking extends GameEntity implements Interactable {
    public searched: boolean = false;
    private lootTable: LootTable;

    constructor(gridPos: ex.Vector) {
        super(gridPos, { width: 32, height: 32, collisionType: ex.CollisionType.Passive });
        this.lootTable = new LootTable();
        this.lootTable.add(Gold, 100, 1, 5); // Small loot
    }

    onInitialize(engine: ex.Engine) {
        super.onInitialize(engine);
        const rect = new ex.Rectangle({
            width: 16,
            height: 24,
            color: ex.Color.Red
        });
        this.graphics.use(rect);
    }

    interact(actor: Actor): boolean {
        if (this.searched) {
            console.log("Empty stocking.");
            return false;
        }

        this.searched = true;
        console.log("Searched stocking...");
        
        const item = this.lootTable.roll(new ex.Random());
        if (item) {
             console.log(`Found ${item.count}x ${item.name}!`);
             if (actor instanceof Hero) {
                 if (!actor.inventory.addItem(item)) {
                     if (this.scene && (this.scene as any).level) {
                         const level = (this.scene as any).level;
                         level.addEntity(new ItemEntity(this.gridPos, item));
                     }
                 }
             }
        }
        return true;
    }
}
