import { Armor } from '../../../items/Armor';
import { Actor } from '../../../actors/Actor';
import { StatBoostEffect } from '../../../mechanics/Effect';
import { ItemID } from '../ItemIDs';

export class TornSantaSuit extends Armor {
    constructor() {
        super(ItemID.TornSantaSuit, 'Torn Santa Suit', 'A pathetic, tattered red suit with holes. Barely provides any protection.');
        
        this.defense = 1;
        this.coldResist = 1;
        
        this.effects.push(new StatBoostEffect(
            'Faded Cheer',
            'charisma',
            1
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

export class TatteredSantaSuit extends Armor {
    constructor() {
        super(ItemID.TatteredSantaSuit, 'Tattered Santa Suit', 'A worn but functional Santa suit. Shows signs of many Christmas seasons.');
        
        this.defense = 2;
        this.coldResist = 3;
        
        this.effects.push(new StatBoostEffect(
            'Modest Cheer',
            'charisma',
            2
        ));
        
        this.effects.push(new StatBoostEffect(
            'Holiday Spirit',
            'warmth',
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

export class ClassicSantaSuit extends Armor {
    constructor() {
        super(ItemID.ClassicSantaSuit, 'Classic Santa Suit', 'A traditional red and white Santa suit. Perfectly balanced stats and timeless style.');
        
        this.defense = 4;
        this.coldResist = 6;
        
        this.effects.push(new StatBoostEffect(
            'Ho Ho Ho!',
            'charisma',
            4
        ));
        
        this.effects.push(new StatBoostEffect(
            'Christmas Magic',
            'warmth',
            5
        ));
        
        this.effects.push(new StatBoostEffect(
            'Gift Giving',
            'luck',
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

export class LuxurySantaSuit extends Armor {
    constructor() {
        super(ItemID.LuxurySantaSuit, 'Luxury Santa Suit', 'A premium Santa suit made from the finest materials. Fur-trimmed and magnificent.');
        
        this.defense = 6;
        this.coldResist = 9;
        
        this.effects.push(new StatBoostEffect(
            'Magnificent Presence',
            'charisma',
            6
        ));
        
        this.effects.push(new StatBoostEffect(
            'Premium Warmth',
            'warmth',
            8
        ));
        
        this.effects.push(new StatBoostEffect(
            'Generous Spirit',
            'luck',
            5
        ));
        
        this.effects.push(new StatBoostEffect(
            'Santa\'s Wisdom',
            'intelligence',
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

export class MagnificentSantaSuit extends Armor {
    constructor() {
        super(ItemID.MagnificentSantaSuit, 'Magnificent Santa Suit', 'The legendary suit of the real Santa Claus. Radiates pure Christmas magic.');
        
        this.defense = 8;
        this.coldResist = 15;
        this.selfRepairing = true;
        
        this.effects.push(new StatBoostEffect(
            'True Santa\'s Presence',
            'charisma',
            10
        ));
        
        this.effects.push(new StatBoostEffect(
            'North Pole Warmth',
            'warmth',
            15
        ));
        
        this.effects.push(new StatBoostEffect(
            'Christmas Miracle',
            'luck',
            8
        ));
        
        this.effects.push(new StatBoostEffect(
            'Ancient Wisdom',
            'intelligence',
            6
        ));
        
        this.effects.push(new StatBoostEffect(
            'Santa\'s Strength',
            'strength',
            5
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