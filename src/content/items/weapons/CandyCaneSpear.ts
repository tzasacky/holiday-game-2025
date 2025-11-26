import { Weapon } from '../../../items/Weapon';
import { Actor } from '../../../actors/Actor';
import { DamageType } from '../../../mechanics/DamageType';
import { StatBoostEffect } from '../../../mechanics/Effect';

import { ItemID } from '../ItemIDs';

export class CandyCaneSpear extends Weapon {
    constructor() {
        super(ItemID.CandyCaneSpear, 'Candy Cane Spear', 'A sharp, minty spear. Reach 2.');
        
        // Weapon stats
        this.minDamage = 3;
        this.maxDamage = 6;
        this.range = 2;

        // Add +2 Strength modifier
        this.effects.push(new StatBoostEffect(
            'Minty Sharpness',
            'strength',
            2
        ));

        // Set Sprite (Index 0 for Candy Cane Spear)
        // this.graphics.use(Item.getItemSprite(0)); // Item.getItemSprite doesn't exist yet
    }

    public use(actor: Actor): boolean {
        this.equip(actor);
        return true;
    }
    
    public execute(user: Actor): void {
        console.log(`${user.name} equipped ${this.name}`);
        // Apply effects
        this.effects.forEach(effect => user.addEffect(effect));
    }
}
