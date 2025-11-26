import { Item } from '../../../items/Item';
import { Actor } from '../../../actors/Actor';
import { ItemID } from '../ItemIDs';

export class Fruitcake extends Item {
    constructor() {
        super(ItemID.Fruitcake, 'Fruitcake', 'A dense, sticky cake. Very filling.');
    }

    public use(user: Actor): boolean {
        user.heal(50);
        // user.satiety += 100; // If we had hunger
        console.log(`${user.name} ate the Fruitcake!`);
        return true;
    }

    public execute(user: Actor): void {
        this.use(user);
    }
}
