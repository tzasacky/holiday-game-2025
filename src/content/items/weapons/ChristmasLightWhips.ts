import { Weapon } from '../../../items/Weapon';
import { Actor } from '../../../actors/Actor';
import { StatBoostEffect } from '../../../mechanics/Effect';
import { ItemID } from '../ItemIDs';
import { DamageType } from '../../../mechanics/DamageType';

export class TangledChristmasLights extends Weapon {
    constructor() {
        super(ItemID.TangledChristmasLights, 'Tangled Christmas Lights', 'A mess of old Christmas lights all knotted together. Barely functional as a weapon.');
        
        this.minDamage = 1;
        this.maxDamage = 2;
        this.range = 2;
        this.whipType = 'light_whip';
        this.entangleChance = 0.1;
        this.critChance = 0.05;
        this.unreliable = true; // Sometimes gets more tangled and misses
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

export class OldChristmasLights extends Weapon {
    constructor() {
        super(ItemID.OldChristmasLights, 'Old Christmas Lights', 'Vintage Christmas lights on a wire. Some bulbs are burnt out but it still works.');
        
        this.minDamage = 2;
        this.maxDamage = 4;
        this.range = 2;
        this.whipType = 'light_whip';
        this.entangleChance = 0.15;
        this.critChance = 0.1;
        this.sparkChance = 0.1; // Occasionally sparks for extra damage
        
        this.effects.push(new StatBoostEffect(
            'Nostalgic Charm',
            'charisma',
            1
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

export class BrightChristmasLights extends Weapon {
    constructor() {
        super(ItemID.BrightChristmasLights, 'Bright Christmas Lights', 'Modern bright Christmas lights that glow cheerfully. Good reach and decent damage.');
        
        this.minDamage = 3;
        this.maxDamage = 6;
        this.range = 2;
        this.whipType = 'light_whip';
        this.entangleChance = 0.2;
        this.critChance = 0.15;
        this.lightRadius = 2; // Provides light
        
        this.effects.push(new StatBoostEffect(
            'Bright Glow',
            'warmth',
            3
        ));
        
        this.effects.push(new StatBoostEffect(
            'Festive Light',
            'charisma',
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

export class LEDChristmasLights extends Weapon {
    constructor() {
        super(ItemID.LEDChristmasLights, 'LED Christmas Lights', 'High-tech LED Christmas lights with multiple color modes. Energy efficient and effective.');
        
        this.minDamage = 4;
        this.maxDamage = 8;
        this.range = 2;
        this.whipType = 'light_whip';
        this.entangleChance = 0.25;
        this.critChance = 0.2;
        this.lightRadius = 3;
        this.colorChanging = true; // Different colors have different effects
        
        this.effects.push(new StatBoostEffect(
            'LED Efficiency',
            'stamina',
            4
        ));
        
        this.effects.push(new StatBoostEffect(
            'Modern Lighting',
            'warmth',
            5
        ));
        
        this.effects.push(new StatBoostEffect(
            'Tech Savvy',
            'intelligence',
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
        
        // LED lights cycle through different modes
        user.onAttack = (target: Actor) => {
            const colorMode = Math.floor(Math.random() * 4);
            switch (colorMode) {
                case 0: // Red - Fire damage
                    target.addTemporaryEffect('LED Burn', { damage: 2 }, 3);
                    console.log('The lights flash red, burning the target!');
                    break;
                case 1: // Blue - Freeze chance
                    if (Math.random() < 0.3) {
                        target.addTemporaryEffect('LED Freeze', { speed: -3 }, 2);
                        console.log('The lights flash blue, chilling the target!');
                    }
                    break;
                case 2: // Green - Poison chance
                    if (Math.random() < 0.25) {
                        target.addTemporaryEffect('LED Toxin', { damage: 1 }, 5);
                        console.log('The lights flash green, sickening the target!');
                    }
                    break;
                case 3: // White - Stun chance
                    if (Math.random() < 0.2) {
                        target.addTemporaryEffect('LED Flash', { stunned: true }, 1);
                        console.log('The lights flash brilliantly, stunning the target!');
                    }
                    break;
            }
        };
    }
}

export class MagicalChristmasLights extends Weapon {
    constructor() {
        super(ItemID.MagicalChristmasLights, 'Magical Christmas Lights', 'Enchanted Christmas lights that pulse with pure holiday magic. The ultimate festive weapon.');
        
        this.minDamage = 6;
        this.maxDamage = 12;
        this.range = 2;
        this.whipType = 'light_whip';
        this.entangleChance = 0.35;
        this.critChance = 0.25;
        this.lightRadius = 5;
        this.magicalAura = true;
        this.neverTangles = true; // Magical lights untangle themselves
        
        this.effects.push(new StatBoostEffect(
            'Christmas Magic',
            'intelligence',
            5
        ));
        
        this.effects.push(new StatBoostEffect(
            'Holiday Warmth',
            'warmth',
            10
        ));
        
        this.effects.push(new StatBoostEffect(
            'Festive Power',
            'strength',
            3
        ));
        
        this.effects.push(new StatBoostEffect(
            'Joyful Spirit',
            'charisma',
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
        
        // Magical lights have powerful special effects
        user.onAttack = (target: Actor) => {
            // Multi-effect chance
            if (Math.random() < 0.4) {
                const effects = [
                    () => {
                        target.addTemporaryEffect('Christmas Curse', { 
                            damage: 3, accuracy: -5, speed: -2 
                        }, 6);
                        console.log('The magical lights curse the enemy with anti-Christmas energy!');
                    },
                    () => {
                        // Spread to nearby enemies
                        if (user.currentLevel) {
                            user.currentLevel.getEntitiesInRadius(target.x, target.y, 2)
                                .filter((e: Actor) => e !== target && e.isEnemy)
                                .forEach((e: Actor) => {
                                    e.takeDamage(4, DamageType.Physical);
                                    console.log(`Christmas magic spreads to ${e.name}!`);
                                });
                        }
                    },
                    () => {
                        user.heal(3);
                        console.log('The magical lights restore your health with Christmas joy!');
                    }
                ];
                
                const randomEffect = effects[Math.floor(Math.random() * effects.length)];
                randomEffect();
            }
            
            // Always has a chance to inspire nearby allies
            if (Math.random() < 0.3 && user.currentLevel) {
                user.currentLevel.getAllAllies().forEach((ally: Actor) => {
                    ally.addTemporaryEffect('Inspired by Lights', { 
                        strength: 2, speed: 1 
                    }, 8);
                });
                console.log('Your magical lights inspire all allies!');
            }
        };
    }
}