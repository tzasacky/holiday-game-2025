import * as ex from 'excalibur';
import { GameEntity } from '../../core/GameEntity';
import { Interactable } from '../../mechanics/Interactable';
import { Actor } from '../../actors/Actor';
import { LootTable } from '../../config/LootTable';
import { ScrollOfElvenCraftsmanship } from '../../content/items/consumables/PermanentProgression'; // Example scroll
import { ItemEntity } from '../../items/ItemEntity';
import { Hero } from '../../actors/Hero';

export class Bookshelf extends GameEntity implements Interactable {
    public searched: boolean = false;
    private lootTable: LootTable;

    constructor(gridPos: ex.Vector) {
        super(gridPos, { width: 32, height: 32, collisionType: ex.CollisionType.Fixed });
        this.lootTable = new LootTable();
        this.lootTable.add(ScrollOfElvenCraftsmanship, 20); // Rare scroll
    }

    onInitialize(engine: ex.Engine) {
        super.onInitialize(engine);
        const rect = new ex.Rectangle({
            width: 32,
            height: 32,
            color: ex.Color.Brown
        });
        this.graphics.use(rect);
    }

    interact(actor: Actor): boolean {
        if (this.searched) {
            console.log("Just old books.");
            return false;
        }

        this.searched = true;
        console.log("Searching bookshelf...");
        
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
        } else {
            console.log("Found nothing interesting.");
        }
        return true;
    }
}
