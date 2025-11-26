import { Armor } from '../../../items/Armor';
import { Actor } from '../../../actors/Actor';
import { StatBoostEffect } from '../../../mechanics/Effect';
import { ItemID } from '../ItemIDs';

export class TatteredElfCloak extends Armor {
    constructor() {
        super(ItemID.TatteredElfCloak, 'Tattered Elf Cloak', 'A worn green cloak with patched holes. Still retains some elven magic.');
        
        this.defense = 2;
        this.coldResist = 4;
        
        this.effects.push(new StatBoostEffect(
            'Faint Elven Magic',
            'stealth',
            2
        ));
        
        this.effects.push(new StatBoostEffect(
            'Workshop Memory',
            'crafting',
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

export class ElfCloak extends Armor {
    constructor() {
        super(ItemID.ElfCloak, 'Elf Cloak', 'A traditional green and gold elf cloak. Light, warm, and enhances dexterity.');
        
        this.defense = 3;
        this.coldResist = 6;
        
        this.effects.push(new StatBoostEffect(
            'Elven Grace',
            'dexterity',
            3
        ));
        
        this.effects.push(new StatBoostEffect(
            'Woodland Stealth',
            'stealth',
            4
        ));
        
        this.effects.push(new StatBoostEffect(
            'Workshop Training',
            'crafting',
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

export class MasterElfCloak extends Armor {
    constructor() {
        super(ItemID.MasterElfCloak, 'Master Elf Cloak', 'An exquisite cloak worn by master craftsman elves. Greatly enhances all elven abilities.');
        
        this.defense = 5;
        this.coldResist = 10;
        this.magicallyWarded = true;
        
        this.effects.push(new StatBoostEffect(
            'Master\'s Grace',
            'dexterity',
            6
        ));
        
        this.effects.push(new StatBoostEffect(
            'Shadow Walking',
            'stealth',
            7
        ));
        
        this.effects.push(new StatBoostEffect(
            'Master Crafting',
            'crafting',
            6
        ));
        
        this.effects.push(new StatBoostEffect(
            'Elven Wisdom',
            'intelligence',
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

export class ReindeerHideCloak extends Armor {
    constructor() {
        super(ItemID.ReindeerHideCloak, 'Reindeer Hide Cloak', 'A warm cloak made from shed reindeer fur. Provides exceptional cold resistance and speed.');
        
        this.defense = 4;
        this.coldResist = 15;
        this.breathable = true;
        
        this.effects.push(new StatBoostEffect(
            'Reindeer Speed',
            'speed',
            4
        ));
        
        this.effects.push(new StatBoostEffect(
            'Arctic Adaptation',
            'coldResist',
            8
        ));
        
        this.effects.push(new StatBoostEffect(
            'Wild Instincts',
            'perception',
            5
        ));
        
        this.effects.push(new StatBoostEffect(
            'Pack Bond',
            'charisma',
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