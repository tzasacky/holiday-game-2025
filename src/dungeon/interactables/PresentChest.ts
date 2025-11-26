import * as ex from 'excalibur';
import { GameEntity } from '../../core/GameEntity';
import { Interactable } from '../../mechanics/Interactable';
import { Actor } from '../../actors/Actor';
import { LootTable } from '../../config/LootTable';
import { Gold } from '../../content/items/misc/Gold';
import { ItemEntity } from '../../items/ItemEntity';
import { Hero } from '../../actors/Hero';

export class PresentChest extends GameEntity implements Interactable {
    public isOpen: boolean = false;
    public isLocked: boolean = false;
    public keyId: string | null = null;
    public isMimic: boolean = false;
    private lootTable: LootTable;

    constructor(gridPos: ex.Vector, isLocked: boolean = false, keyId: string | null = null, isMimic: boolean = false) {
        super(gridPos, { width: 32, height: 32, collisionType: ex.CollisionType.Fixed });
        this.isLocked = isLocked;
        this.keyId = keyId;
        this.isMimic = isMimic;
        
        this.lootTable = new LootTable();
        // TODO: Populate with better loot
        this.lootTable.add(Gold, 100, 10, 50);
    }

    onInitialize(engine: ex.Engine) {
        super.onInitialize(engine);
        this.updateVisuals();
    }

    interact(actor: Actor): boolean {
        if (this.isOpen) {
            console.log("It's empty.");
            return false;
        }

        if (this.isLocked) {
             if (actor instanceof Hero && this.keyId && actor.inventory.hasItem(this.keyId)) {
                console.log(`Unlocked chest with ${this.keyId}!`);
                actor.inventory.removeItemByName(this.keyId, 1);
                this.isLocked = false;
            } else {
                console.log("Locked! Needs key: " + this.keyId);
                return false;
            }
        }

        if (this.isMimic) {
            console.log("It's a trap! Mimic!");
            // Transform into Mimic Mob
            // this.scene.add(new Mimic(this.gridPos));
            this.kill();
            return true;
        }

        this.open(actor);
        return true;
    }

    open(actor: Actor) {
        this.isOpen = true;
        this.updateVisuals();
        console.log("Opened chest!");
        
        const item = this.lootTable.roll(new ex.Random());
        if (item) {
             console.log(`Found ${item.count}x ${item.name}!`);
             if (actor instanceof Hero) {
                 if (!actor.inventory.addItem(item)) {
                     // Drop on ground
                     if (this.scene && (this.scene as any).level) {
                         const level = (this.scene as any).level;
                         level.addEntity(new ItemEntity(this.gridPos, item));
                     }
                 }
             }
        }
    }

    private updateVisuals() {
        const color = this.isOpen ? ex.Color.Gray : (this.isMimic ? ex.Color.Violet : ex.Color.Green);
        const rect = new ex.Rectangle({
            width: 28,
            height: 28,
            color: color,
            strokeColor: ex.Color.Yellow,
            lineWidth: 2
        });
        this.graphics.use(rect);
    }
}
