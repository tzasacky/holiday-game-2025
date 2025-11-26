import { Item } from './Item';
import { Actor } from '../actors/Actor';
import { Effect } from '../mechanics/Effect';

import { ItemID } from '../content/items/ItemIDs';

export abstract class Artifact extends Item {
    public equipped: boolean = false;
    public abstract passiveEffects: Effect[];

    constructor(id: ItemID, name: string, description: string) {
        super(id, name, description);
    }

    // Artifacts are typically toggled or passive
    use(actor: Actor): boolean {
        this.equipped = !this.equipped;
        if (this.equipped) {
            this.onEquip(actor);
        } else {
            this.onUnequip(actor);
        }
        return true;
    }

    onEquip(actor: Actor) {
        console.log(`${actor.name} equips ${this.name}.`);
        this.passiveEffects.forEach(effect => actor.addEffect(effect));
    }

    onUnequip(actor: Actor) {
        console.log(`${actor.name} un-equips ${this.name}.`);
        this.passiveEffects.forEach(effect => actor.removeEffect(effect));
    }
}
