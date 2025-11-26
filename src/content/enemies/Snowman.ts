import * as ex from 'excalibur';
import { Mob, AIState } from '../../actors/Mob';
import { DamageType } from '../../mechanics/DamageType';

import { Resources } from '../../config/resources';
import { ActorRegistry } from '../../config/ActorRegistry';

export class Snowman extends Mob {
    constructor(gridPos: ex.Vector) {
        super(gridPos, 30, { // 30 HP
            width: 32,
            height: 32,
            collisionType: ex.CollisionType.Active
        });
        this.name = 'Snowman';
        this.stats.strength = 12;
        this.stats.agility = 5;
    }

    onInitialize(engine: ex.Engine) {
        super.onInitialize(engine);
        ActorRegistry.getInstance().configureActor(this);
    }

    // Override attack to deal Ice damage
    public attack(target: any) {
        super.attack(target, DamageType.Ice);
    }
}
