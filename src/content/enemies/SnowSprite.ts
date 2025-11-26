import * as ex from 'excalibur';
import { Mob, AIState } from '../../actors/Mob';
import { Resources } from '../../config/resources';
import { ActorRegistry } from '../../config/ActorRegistry';

export class SnowSprite extends Mob {
    constructor(gridPos: ex.Vector) {
        super(gridPos, 10, {
            width: 32,
            height: 32,
            color: ex.Color.Cyan // Placeholder
        });
        this.name = 'Snow Sprite';
        this.state = AIState.Wander;
    }

    onInitialize(engine: ex.Engine) {
        super.onInitialize(engine);
        ActorRegistry.getInstance().configureActor(this);
    }
}
