import { Weapon } from '../../../items/Weapon';
import { Actor } from '../../../actors/Actor';

import { ItemID } from '../ItemIDs';

export class WeakSword extends Weapon {
    constructor() {
        super(ItemID.WeakSword, 'Weak Sword', 'A dull, rusty sword.');
        this.minDamage = 1;
        this.maxDamage = 3;
        this.range = 1;
    }

    public use(actor: Actor): boolean {
        this.equip(actor);
        return true;
    }
}
