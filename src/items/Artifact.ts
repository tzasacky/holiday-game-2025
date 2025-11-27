import { Item } from './Item';
import { GameActor } from '../components/GameActor';
import { ItemEffect } from '../data/items';
import { ItemID } from '../constants/ItemIDs';

export abstract class Artifact extends Item {
    public equipped: boolean = false;
    public abstract passiveEffects: ItemEffect[];

    constructor(id: ItemID, name: string, description: string) {
        super(id, name, description);
    }

    // Artifacts are typically toggled or passive
    use(actor: GameActor): boolean {
        this.equipped = !this.equipped;
        if (this.equipped) {
            this.onEquip(actor);
        } else {
            this.onUnequip(actor);
        }
        return true;
    }

    onEquip(actor: GameActor) {
        console.log(`${actor.name} equips ${this.name}.`);
        // Logic to apply effects should be handled by EquipmentSystem or EffectExecutor
        // For now, we just log it as we don't have direct effect application on GameActor yet
    }

    onUnequip(actor: GameActor) {
        console.log(`${actor.name} un-equips ${this.name}.`);
        // Logic to remove effects
    }
}
