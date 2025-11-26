import { Item } from '../../../items/Item';
import { Actor } from '../../../actors/Actor';
import { ItemID } from '../ItemIDs';

export class HotCocoa extends Item {
    constructor() {
        super(ItemID.HotCocoa, 'Hot Cocoa', 'A steaming mug of hot chocolate. Restores warmth and health.');
        this.stackable = true;
        this.maxStack = 5;
    }

    // Logic to be called when used
    public use(user: Actor): boolean {
        user.heal(20);
        user.warmth = Math.min(100, user.warmth + 50);
        console.log(`${user.name} drank Hot Cocoa!`);
        // Remove from inventory logic handled by caller usually
        return true;
    }

    public execute(user: Actor): void {
        this.use(user);
    }
}
