import { Weapon } from '../../../items/Weapon';
import { Actor } from '../../../actors/Actor';
import { StatBoostEffect } from '../../../mechanics/Effect';
import { ItemID } from '../ItemIDs';

export class MeltingIcicleDagger extends Weapon {
    constructor() {
        super(ItemID.MeltingIcicleDagger, 'Melting Icicle Dagger', 'A pathetic icicle that drips constantly. Fragile and unreliable.');
        
        this.minDamage = 1;
        this.maxDamage = 3;
        this.range = 1;
        this.critChance = 0.15;
        this.fragile = true; // 25% chance to break on hit
    }

    public use(actor: Actor): boolean {
        this.equip(actor);
        return true;
    }
    
    public execute(user: Actor): void {
        console.log(`${user.name} equipped ${this.name}`);
        this.effects.forEach(effect => user.addEffect(effect));
    }
}

export class FrostyIcicleDagger extends Weapon {
    constructor() {
        super(ItemID.FrostyIcicleDagger, 'Frosty Icicle Dagger', 'A cold, sharp icicle. Decent for stabbing, with a good chance to critical hit.');
        
        this.minDamage = 2;
        this.maxDamage = 5;
        this.range = 1;
        this.critChance = 0.20;
        
        this.effects.push(new StatBoostEffect(
            'Frosty Touch',
            'coldResist',
            2
        ));
    }

    public use(actor: Actor): boolean {
        this.equip(actor);
        return true;
    }
    
    public execute(user: Actor): void {
        console.log(`${user.name} equipped ${this.name}`);
        this.effects.forEach(effect => user.addEffect(effect));
    }
}

export class SharpIcicleDagger extends Weapon {
    constructor() {
        super(ItemID.SharpIcicleDagger, 'Sharp Icicle Dagger', 'A wickedly sharp icicle. Excellent critical hit chance and frost damage.');
        
        this.minDamage = 3;
        this.maxDamage = 7;
        this.range = 1;
        this.critChance = 0.25;
        
        this.effects.push(new StatBoostEffect(
            'Sharp Frost',
            'coldResist',
            3
        ));
        
        this.effects.push(new StatBoostEffect(
            'Precision',
            'accuracy',
            5
        ));
    }

    public use(actor: Actor): boolean {
        this.equip(actor);
        return true;
    }
    
    public execute(user: Actor): void {
        console.log(`${user.name} equipped ${this.name}`);
        this.effects.forEach(effect => user.addEffect(effect));
    }
}

export class PerfectIcicleDagger extends Weapon {
    constructor() {
        super(ItemID.PerfectIcicleDagger, 'Perfect Icicle Dagger', 'A flawless icicle of supernatural sharpness. Freezes enemies on critical hits.');
        
        this.minDamage = 4;
        this.maxDamage = 9;
        this.range = 1;
        this.critChance = 0.30;
        this.freezeOnCrit = true;
        
        this.effects.push(new StatBoostEffect(
            'Perfect Frost',
            'coldResist',
            5
        ));
        
        this.effects.push(new StatBoostEffect(
            'Master Precision',
            'accuracy',
            8
        ));
        
        this.effects.push(new StatBoostEffect(
            'Winter\'s Edge',
            'strength',
            3
        ));
    }

    public use(actor: Actor): boolean {
        this.equip(actor);
        return true;
    }
    
    public execute(user: Actor): void {
        console.log(`${user.name} equipped ${this.name}`);
        this.effects.forEach(effect => user.addEffect(effect));
    }
}