import { Weapon } from '../../../items/Weapon';
import { Actor } from '../../../actors/Actor';
import { StatBoostEffect } from '../../../mechanics/Effect';
import { ItemID } from '../ItemIDs';

export class BrokenToyHammer extends Weapon {
    constructor() {
        super(ItemID.BrokenToyHammer, 'Broken Toy Hammer', 'A sad, cracked toy hammer held together with Christmas tape. Barely functional.');
        
        this.minDamage = 1;
        this.maxDamage = 2;
        this.range = 1;
        this.stunChance = 0.05;
        this.unreliable = true; // Sometimes misses even when it should hit
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

export class WoodenToyHammer extends Weapon {
    constructor() {
        super(ItemID.WoodenToyHammer, 'Wooden Toy Hammer', 'A classic wooden toy hammer. Simple but effective, with a chance to stun.');
        
        this.minDamage = 2;
        this.maxDamage = 4;
        this.range = 1;
        this.stunChance = 0.10;
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

export class SteelToyHammer extends Weapon {
    constructor() {
        super(ItemID.SteelToyHammer, 'Steel Toy Hammer', 'A heavy steel toy hammer. Packs a punch and reliably stuns foes.');
        
        this.minDamage = 3;
        this.maxDamage = 6;
        this.range = 1;
        this.stunChance = 0.15;
        
        this.effects.push(new StatBoostEffect(
            'Heavy Strike',
            'strength',
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

export class EnchantedToyHammer extends Weapon {
    constructor() {
        super(ItemID.EnchantedToyHammer, 'Enchanted Toy Hammer', 'A magically enhanced toy hammer that glows with holiday spirit. Strong stunning power.');
        
        this.minDamage = 4;
        this.maxDamage = 8;
        this.range = 1;
        this.stunChance = 0.20;
        
        this.effects.push(new StatBoostEffect(
            'Enchanted Strike',
            'strength',
            3
        ));
        
        this.effects.push(new StatBoostEffect(
            'Christmas Magic',
            'warmth',
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

export class NutcrackerHammer extends Weapon {
    constructor() {
        super(ItemID.NutcrackerHammer, 'Nutcracker Hammer', 'The legendary hammer of the Nutcracker King. Guaranteed stuns and devastating damage.');
        
        this.minDamage = 6;
        this.maxDamage = 12;
        this.range = 1;
        this.stunChance = 0.35;
        this.guaranteedStunOnCrit = true;
        
        this.effects.push(new StatBoostEffect(
            'Nutcracker\'s Might',
            'strength',
            5
        ));
        
        this.effects.push(new StatBoostEffect(
            'Royal Authority',
            'charisma',
            3
        ));
        
        this.effects.push(new StatBoostEffect(
            'Christmas Royalty',
            'warmth',
            8
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