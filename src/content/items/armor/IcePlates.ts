import { Armor } from '../../../items/Armor';
import { Actor } from '../../../actors/Actor';
import { StatBoostEffect } from '../../../mechanics/Effect';
import { ItemID } from '../ItemIDs';

export class MeltingIcePlate extends Armor {
    constructor() {
        super(ItemID.MeltingIcePlate, 'Melting Ice Plate', 'Crude ice armor that constantly drips. Slows you down and barely protects.');
        
        this.defense = 3;
        this.coldResist = -2; // Actually makes you colder!
        this.melting = true;
        
        this.effects.push(new StatBoostEffect(
            'Dripping Wet',
            'speed',
            -3
        ));
        
        this.effects.push(new StatBoostEffect(
            'Constantly Cold',
            'warmth',
            -5
        ));
    }

    public use(user: Actor): boolean {
        this.equip(user);
        return true;
    }

    public execute(user: Actor): void {
        console.log(`${user.name} equipped ${this.name}`);
        this.effects.forEach(effect => user.addEffect(effect));
    }
}

export class ThinIcePlate extends Armor {
    constructor() {
        super(ItemID.ThinIcePlate, 'Thin Ice Plate', 'Fragile ice armor that provides decent protection but slows movement.');
        
        this.defense = 5;
        this.coldResist = 8;
        
        this.effects.push(new StatBoostEffect(
            'Ice Weight',
            'speed',
            -2
        ));
        
        this.effects.push(new StatBoostEffect(
            'Frost Shield',
            'coldResist',
            3
        ));
    }

    public use(user: Actor): boolean {
        this.equip(user);
        return true;
    }

    public execute(user: Actor): void {
        console.log(`${user.name} equipped ${this.name}`);
        this.effects.forEach(effect => user.addEffect(effect));
    }
}

export class ThickIcePlate extends Armor {
    constructor() {
        super(ItemID.ThickIcePlate, 'Thick Ice Plate', 'Solid ice armor offering excellent protection. Heavy but reliable.');
        
        this.defense = 8;
        this.coldResist = 12;
        this.reflectsCold = true;
        
        this.effects.push(new StatBoostEffect(
            'Heavy Ice',
            'speed',
            -2
        ));
        
        this.effects.push(new StatBoostEffect(
            'Ice Fortress',
            'coldResist',
            6
        ));
        
        this.effects.push(new StatBoostEffect(
            'Frozen Might',
            'defense',
            2
        ));
    }

    public use(user: Actor): boolean {
        this.equip(user);
        return true;
    }

    public execute(user: Actor): void {
        console.log(`${user.name} equipped ${this.name}`);
        this.effects.forEach(effect => user.addEffect(effect));
    }
}

export class EnchantedIcePlate extends Armor {
    constructor() {
        super(ItemID.EnchantedIcePlate, 'Enchanted Ice Plate', 'Magically reinforced ice armor. Provides excellent protection with minimal weight penalty.');
        
        this.defense = 10;
        this.coldResist = 15;
        this.magicallyLightened = true;
        this.reflectsCold = true;
        
        this.effects.push(new StatBoostEffect(
            'Magical Lightness',
            'speed',
            -1
        ));
        
        this.effects.push(new StatBoostEffect(
            'Enchanted Frost',
            'coldResist',
            8
        ));
        
        this.effects.push(new StatBoostEffect(
            'Ice Magic',
            'intelligence',
            3
        ));
        
        this.effects.push(new StatBoostEffect(
            'Frozen Defense',
            'defense',
            4
        ));
    }

    public use(user: Actor): boolean {
        this.equip(user);
        return true;
    }

    public execute(user: Actor): void {
        console.log(`${user.name} equipped ${this.name}`);
        this.effects.forEach(effect => user.addEffect(effect));
    }
}

export class EternalIcePlate extends Armor {
    constructor() {
        super(ItemID.EternalIcePlate, 'Eternal Ice Plate', 'Legendary armor made from ice that never melts. Provides supreme protection without slowing the wearer.');
        
        this.defense = 12;
        this.coldResist = 20;
        this.neverMelts = true;
        this.reflectsCold = true;
        this.freezeAttackers = true;
        
        this.effects.push(new StatBoostEffect(
            'Eternal Frost',
            'coldResist',
            12
        ));
        
        this.effects.push(new StatBoostEffect(
            'Winter\'s Blessing',
            'intelligence',
            6
        ));
        
        this.effects.push(new StatBoostEffect(
            'Absolute Zero',
            'defense',
            8
        ));
        
        this.effects.push(new StatBoostEffect(
            'Ice Mastery',
            'strength',
            4
        ));
    }

    public use(user: Actor): boolean {
        this.equip(user);
        return true;
    }

    public execute(user: Actor): void {
        console.log(`${user.name} equipped ${this.name}`);
        this.effects.forEach(effect => user.addEffect(effect));
    }
}