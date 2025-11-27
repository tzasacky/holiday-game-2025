import { Item } from './Item';
import { GameActor } from '../components/GameActor';
import { ItemEffect } from '../data/items';

export abstract class Equipable extends Item {
    public isEquipped: boolean = false;
    public identified: boolean = false;
    public isCursed: boolean = false;
    public effects: ItemEffect[] = [];

    identify() {
        this.identified = true;
        console.log(`${this.name} is identified!`);
    }

    getDisplayName(): string {
        return this.identified ? this.name : "Unknown Item";
    }

    public equip(user: GameActor) {
        this.isEquipped = true;
    }

    public unequip(user: GameActor) {
        this.isEquipped = false;
    }
    
    public execute(user: GameActor) {
        if (this.isEquipped) {
            this.unequip(user);
        } else {
            this.equip(user);
        }
    }
}
