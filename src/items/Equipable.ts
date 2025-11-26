import { Effect } from '../mechanics/Effect';
import { Item } from './Item';
import { Actor } from '../actors/Actor';

export abstract class Equipable extends Item {
    public isEquipped: boolean = false;
    public identified: boolean = false;
    public isCursed: boolean = false;
    public effects: Effect[] = [];

    identify() {
        this.identified = true;
        console.log(`${this.name} is identified!`);
    }

    getDisplayName(): string {
        return this.identified ? this.name : "Unknown Item";
    }

    public equip(user: Actor) {
        this.isEquipped = true;
        // Logic handled by subclasses or here if we cast?
        // Better: Actor should have equipWeapon/equipArmor methods?
        // Or we check instance type here.
        // Circular dependency risk if we import Weapon/Armor here?
        // Let's rely on the fact that we know what this is.
        
        // Actually, let's make this abstract or override in Weapon/Armor
    }

    public unequip(user: Actor) {
        this.isEquipped = false;
    }
    
    public execute(user: Actor) {
        if (this.isEquipped) {
            this.unequip(user);
        } else {
            this.equip(user);
        }
    }
}
