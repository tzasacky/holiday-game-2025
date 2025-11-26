import * as ex from 'excalibur';
import { GameEntity } from '../../core/GameEntity';
import { Interactable } from '../../mechanics/Interactable';
import { Actor } from '../../actors/Actor';
import { Hero } from '../../actors/Hero';
import { LootTable } from '../../config/LootTable';
import { Gold } from '../../content/items/misc/Gold';
import { CandyCaneSpear } from '../../content/items/weapons/CandyCaneSpear';

export class SnowPile extends GameEntity implements Interactable {
    private searched: boolean = false;
    private lootTable: LootTable;

    constructor(gridPos: ex.Vector) {
        super(gridPos, { width: 32, height: 32, collisionType: ex.CollisionType.Passive });
        
        // Setup Loot Table
        this.lootTable = new LootTable();
        this.lootTable.add(Gold, 50, 1, 10); // 50% chance for 1-10 Gold
        this.lootTable.add(CandyCaneSpear, 10); // 10% chance for Spear
        // 40% chance for nothing (implicit if weights don't sum to 100? No, LootTable logic needs update for "nothing" or we add a "Nothing" entry or just check roll vs total)
        // Actually current LootTable logic sums weights. So to have "nothing", we'd need to roll against a higher number or add a dummy entry.
        // Let's just say it always drops something for now, or we add a "Nothing" chance.
    }

    onInitialize(engine: ex.Engine) {
        super.onInitialize(engine);
        // Visuals: Snow Pile Sprite
        const rect = new ex.Rectangle({
            width: 24,
            height: 16,
            color: ex.Color.White
        });
        this.graphics.use(rect);
    }

    interact(actor: Actor): boolean {
        if (this.searched) {
            console.log("This snow pile has already been searched.");
            return false;
        }

        console.log(`${actor.name} searches the snow pile...`);
        this.searched = true;
        this.graphics.opacity = 0.5; // Visual feedback

        const rng = new ex.Random();
        // 50% chance to find nothing
        if (rng.bool()) {
            console.log("Found nothing.");
            return true;
        }

        const item = this.lootTable.roll(rng);
        if (item) {
            console.log(`Found ${item.count}x ${item.name}!`);
            // Add to inventory or drop on ground
            let added = false;
            if (actor instanceof Hero) {
                added = actor.inventory.addItem(item);
            }

            if (!added) {
                console.log("Inventory full (or not a hero), dropping on ground.");
                
                // Drop on ground
                if (this.scene && (this.scene as any).level) {
                     const level = (this.scene as any).level;
                     const ItemEntityClass = require('../../items/ItemEntity').ItemEntity;
                     const entity = new ItemEntityClass(this.gridPos, item);
                     level.addEntity(entity);
                }
            }
        }

        return true;
    }
}
