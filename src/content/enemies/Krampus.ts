import * as ex from 'excalibur';
import { Mob, AIState } from '../../actors/Mob';
import { DamageType } from '../../mechanics/DamageType';

import { Resources } from '../../config/resources';
import { ActorRegistry } from '../../config/ActorRegistry';

export class Krampus extends Mob {
    constructor(gridPos: ex.Vector) {
        super(gridPos, 200, { // Boss HP
            width: 32,
            height: 32,
            collisionType: ex.CollisionType.Active
        });
        this.name = 'Krampus';
        this.stats.strength = 20;
        this.stats.agility = 15;
        this.viewDistance = 12;
    }

    onInitialize(engine: ex.Engine) {
        super.onInitialize(engine);
        ActorRegistry.getInstance().configureActor(this);
    }

    public attack(target: any) {
        super.attack(target, DamageType.Physical);
        // Chance to steal item?
    }
}
