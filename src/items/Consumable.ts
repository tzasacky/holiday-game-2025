import { Item } from './Item';
import { Actor } from '../actors/Actor';

export abstract class Consumable extends Item {
    // Projectile/Grenade properties
    public projectile: boolean = false;
    public grenade: boolean = false;
    public range: number = 0;
    public damage: { min: number, max: number } | null = null;
    public aoeRadius: number = 0;
    
    // Status Effects
    public stunChance: number = 0;
    public freezeChance: number = 0;
    public poisonChance: number = 0;
    public failureChance: number = 0;
    
    // Special Flags
    public disgustingEffect: boolean = false;
    public extraDamageToNaughty: number = 0;
    public shrapnelEffect: boolean = false;
    public holyDamage: boolean = false;
    public stunAllInRadius: boolean = false;
    public knockbackAll: boolean = false;
    public christmasThemed: boolean = false;
}
