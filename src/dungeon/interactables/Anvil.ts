import * as ex from 'excalibur';
import { GameEntity } from '../../core/GameEntity';
import { Interactable } from '../../mechanics/Interactable';
import { Actor } from '../../actors/Actor';

export class Anvil extends GameEntity implements Interactable {
    constructor(gridPos: ex.Vector) {
        super(gridPos, { width: 32, height: 32, collisionType: ex.CollisionType.Fixed });
    }

    onInitialize(engine: ex.Engine) {
        super.onInitialize(engine);
        const rect = new ex.Rectangle({
            width: 32,
            height: 20,
            color: ex.Color.Black
        });
        this.graphics.use(rect);
    }

    interact(actor: Actor): boolean {
        console.log("Anvil: Repair or upgrade gear! (Not implemented)");
        return true;
    }
}
