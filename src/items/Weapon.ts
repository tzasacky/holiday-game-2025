import { Equipable } from './Equipable';
import { Actor } from '../actors/Actor';

export abstract class Weapon extends Equipable {
    public minDamage: number = 1;
    public maxDamage: number = 2;
    public range: number = 1;
    
    // Special weapon properties
    public fragile: boolean = false;
    public critChance: number = 0;
    public freezeOnCrit: boolean = false;
    public stunChance: number = 0;
    public unreliable: boolean = false;
    public guaranteedStunOnCrit: boolean = false;
    
    // Wand properties
    public projectileType: string = 'basic';
    public burnChance: number = 0;
    public poisonChance: number = 0;
    public confuseChance: number = 0;
    public multishot: number = 1;
    public penetrating: boolean = false;
    public aoeRadius: number = 0;
    public knockback: number = 0;
    
    // Whip properties
    public entangleChance: number = 0;
    public colorCycling: boolean = false;
    public whipType: string = 'basic';
    public sparkChance: number = 0;
    public lightRadius: number = 0;
    public colorChanging: boolean = false;
    public magicalAura: boolean = false;
    public neverTangles: boolean = false;

    // equip/unequip handled by EnhancedEquipment and Actor
    
    public getFinalStats(): any {
        return {
            damage: (this.minDamage + this.maxDamage) / 2,
            range: this.range,
            critChance: this.critChance
        };
    }
}
