import * as ex from 'excalibur';
import { GameEntity } from '../../core/GameEntity';
import { Interactable } from '../../mechanics/Interactable';
import { Actor } from '../../actors/Actor';

export class AlchemyPot extends GameEntity implements Interactable {
    constructor(gridPos: ex.Vector) {
        super(gridPos, { width: 32, height: 32, collisionType: ex.CollisionType.Fixed });
    }

    onInitialize(engine: ex.Engine) {
        super.onInitialize(engine);
        const circle = new ex.Circle({
            radius: 16,
            color: ex.Color.Violet
        });
        this.graphics.use(circle);
    }

    interact(actor: Actor): boolean {
        console.log("Alchemy Pot: Throw items in to brew! (Not implemented)");
        return true;
    }
}
