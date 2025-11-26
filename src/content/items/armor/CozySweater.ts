import { Equipable } from '../../../items/Equipable';
import { Actor } from '../../../actors/Actor';
import { StatBoostEffect } from '../../../mechanics/Effect';
import { ItemID } from '../ItemIDs';

export class CozySweater extends Equipable {
    constructor() {
        super(ItemID.CozySweater, 'Cozy Sweater', 'Keeps you warm and stylish.');
        
        // Add +10 Warmth modifier
        this.effects.push(new StatBoostEffect(
            'Cozy Warmth',
            'warmth',
            10
        ));
    }

    public use(user: Actor): boolean {
        this.equip(user);
        return true;
    }

    public execute(user: Actor): void {
        console.log(`${user.name} equipped ${this.name}`);
        // Apply effects
        this.effects.forEach(effect => user.addEffect(effect));
    }
}
