import { Equipable } from './Equipable';
import { Actor } from '../actors/Actor';

export abstract class Armor extends Equipable {
    public defense: number = 1;
    public coldResist: number = 0;
    
    // Special armor properties
    public magicallyWarded: boolean = false;
    public breathable: boolean = false;
    public melting: boolean = false;
    public reflectsCold: boolean = false;
    public magicallyLightened: boolean = false;
    public neverMelts: boolean = false;
    public freezeAttackers: boolean = false;
    public selfRepairing: boolean = false;

    // equip/unequip handled by EnhancedEquipment and Actor
    
    public getFinalStats(): any {
        return {
            defense: this.defense,
            coldResist: this.coldResist
        };
    }
}
