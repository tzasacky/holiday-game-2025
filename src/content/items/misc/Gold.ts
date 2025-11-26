import { Item } from '../../../items/Item';
import { Actor } from '../../../actors/Actor';

import { ItemID } from '../ItemIDs';

export class Gold extends Item {
    constructor(amount: number = 1) {
        super(ItemID.Gold, 'Gold', 'Shiny gold coins.');
        this.stackable = true;
        this.maxStack = 9999;
        this.count = amount;
    }

    public use(actor: Actor): boolean {
        // Gold isn't "used", it's spent.
        return false;
    }
}
