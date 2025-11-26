import { Weapon } from '../../../items/Weapon';
import { Actor } from '../../../actors/Actor';
import { StatBoostEffect } from '../../../mechanics/Effect';
import { ItemID } from '../ItemIDs';

export class SparklerWand extends Weapon {
    constructor() {
        super(ItemID.SparklerWand, 'Sparkler Wand', 'A tiny sparkler that shoots weak sparks. Barely counts as a weapon.');
        
        this.minDamage = 1;
        this.maxDamage = 2;
        this.range = 3;
        this.projectileType = 'spark';
        this.burnChance = 0.05;
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

export class CandlestickWand extends Weapon {
    constructor() {
        super(ItemID.CandlestickWand, 'Candlestick Wand', 'An ornate candlestick that shoots warm flames. Provides light and warmth.');
        
        this.minDamage = 2;
        this.maxDamage = 4;
        this.range = 4;
        this.projectileType = 'flame';
        this.burnChance = 0.10;
        
        this.effects.push(new StatBoostEffect(
            'Warm Glow',
            'warmth',
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

export class HollyWand extends Weapon {
    constructor() {
        super(ItemID.HollyWand, 'Holly Wand', 'A wand topped with sharp holly leaves. Shoots thorny projectiles.');
        
        this.minDamage = 2;
        this.maxDamage = 5;
        this.range = 5;
        this.projectileType = 'thorn';
        this.poisonChance = 0.15;
        
        this.effects.push(new StatBoostEffect(
            'Nature\'s Blessing',
            'defense',
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

export class MistletoeWand extends Weapon {
    constructor() {
        super(ItemID.MistletoeWand, 'Mistletoe Wand', 'A charming wand of mistletoe. Confuses enemies with holiday cheer.');
        
        this.minDamage = 1;
        this.maxDamage = 3;
        this.range = 4;
        this.projectileType = 'charm';
        this.confuseChance = 0.25;
        
        this.effects.push(new StatBoostEffect(
            'Holiday Charm',
            'charisma',
            4
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

export class ChristmasTreeStaff extends Weapon {
    constructor() {
        super(ItemID.ChristmasTreeStaff, 'Christmas Tree Staff', 'A miniature Christmas tree on a staff. Shoots ornaments and provides festive energy.');
        
        this.minDamage = 3;
        this.maxDamage = 6;
        this.range = 6;
        this.projectileType = 'ornament';
        this.multishot = 3; // Shoots 3 ornaments
        
        this.effects.push(new StatBoostEffect(
            'Christmas Spirit',
            'warmth',
            5
        ));
        
        this.effects.push(new StatBoostEffect(
            'Festive Energy',
            'stamina',
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

export class StarTopperWand extends Weapon {
    constructor() {
        super(ItemID.StarTopperWand, 'Star Topper Wand', 'A wand crowned with a brilliant star. Shoots beams of starlight.');
        
        this.minDamage = 4;
        this.maxDamage = 8;
        this.range = 7;
        this.projectileType = 'starlight';
        this.penetrating = true; // Goes through enemies
        
        this.effects.push(new StatBoostEffect(
            'Stellar Power',
            'intelligence',
            4
        ));
        
        this.effects.push(new StatBoostEffect(
            'Guiding Light',
            'accuracy',
            6
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

export class FireworksWand extends Weapon {
    constructor() {
        super(ItemID.FireworksWand, 'Fireworks Wand', 'A wand that launches spectacular fireworks. Area of effect explosions.');
        
        this.minDamage = 5;
        this.maxDamage = 10;
        this.range = 8;
        this.projectileType = 'firework';
        this.aoeRadius = 2;
        this.burnChance = 0.20;
        
        this.effects.push(new StatBoostEffect(
            'Explosive Power',
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

export class GrandFinaleWand extends Weapon {
    constructor() {
        super(ItemID.GrandFinaleWand, 'Grand Finale Wand', 'The ultimate fireworks wand. Creates massive explosions that light up the entire battlefield.');
        
        this.minDamage = 8;
        this.maxDamage = 16;
        this.range = 10;
        this.projectileType = 'grand_firework';
        this.aoeRadius = 4;
        this.burnChance = 0.35;
        this.knockback = 2;
        
        this.effects.push(new StatBoostEffect(
            'Grand Finale',
            'strength',
            6
        ));
        
        this.effects.push(new StatBoostEffect(
            'Pyrotechnic Mastery',
            'intelligence',
            4
        ));
        
        this.effects.push(new StatBoostEffect(
            'Spectacular Show',
            'charisma',
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