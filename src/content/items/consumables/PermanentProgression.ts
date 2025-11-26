import { Consumable } from '../../../items/Consumable';
import { Actor } from '../../../actors/Actor';
import { PermanentStatBoostEffect } from '../../../mechanics/Effect';
import { ItemID } from '../ItemIDs';

export class StarCookie extends Consumable {
    constructor() {
        super(ItemID.StarCookie, 'Star Cookie', 'A magical star-shaped cookie that permanently increases strength. One bite grants eternal power.');
        
        this.stackable = true;
        this.maxStack = 5;
        this.rare = true;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} eats the Star Cookie and feels permanently stronger!`);
        
        // Permanently increase strength by 1
        const strengthBoost = new PermanentStatBoostEffect(
            'Star Power',
            'strength',
            1
        );
        actor.addEffect(strengthBoost);
        
        this.count--;
        if (this.count <= 0) {
            // Remove from inventory
            return true;
        }
        return false;
    }
}

export class LiquidCourage extends Consumable {
    constructor() {
        super(ItemID.LiquidCourage, 'Liquid Courage', 'A glowing red potion that permanently increases maximum health. Tastes like Christmas punch.');
        
        this.stackable = true;
        this.maxStack = 3;
        this.rare = true;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} drinks the Liquid Courage and feels more resilient!`);
        
        // Permanently increase max HP by 5
        const hpBoost = new PermanentStatBoostEffect(
            'Liquid Courage',
            'maxHp',
            5
        );
        actor.addEffect(hpBoost);
        
        // Also heal to full
        actor.heal(actor.maxHp);
        
        this.count--;
        if (this.count <= 0) {
            return true;
        }
        return false;
    }
}

export class ScrollOfElvenCraftsmanship extends Consumable {
    constructor() {
        super(ItemID.ScrollOfElvenCraftsmanship, 'Scroll of Elven Craftsmanship', 'A scroll inscribed with ancient elven techniques. Improves equipment quality.');
        this.stackable = true;
        this.maxStack = 5;
        this.rare = true;
    }

    public use(actor: Actor): boolean {
        console.log(`${actor.name} reads the scroll... (Effect not implemented yet)`);
        // TODO: Implement upgrade logic
        this.count--;
        return true;
    }
}