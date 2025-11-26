import * as ex from 'excalibur';
import { GameEntity } from '../../core/GameEntity';
import { Interactable } from '../../mechanics/Interactable';
import { Actor } from '../../actors/Actor';

export class SleighStation extends GameEntity implements Interactable {
    constructor(gridPos: ex.Vector) {
        super(gridPos, { width: 64, height: 32, collisionType: ex.CollisionType.Fixed });
    }

    onInitialize(engine: ex.Engine) {
        super.onInitialize(engine);
        const rect = new ex.Rectangle({
            width: 64,
            height: 32,
            color: ex.Color.Red
        });
        this.graphics.use(rect);
    }

    interact(actor: Actor): boolean {
        console.log("Sleigh Station: Fast travel! (Not implemented)");
        return true;
    }
}
