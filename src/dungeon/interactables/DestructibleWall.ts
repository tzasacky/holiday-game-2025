import * as ex from 'excalibur';
import { GameEntity } from '../../core/GameEntity';
import { Interactable } from '../../mechanics/Interactable';
import { Actor } from '../../actors/Actor';
import { DamageType } from '../../mechanics/DamageType';

export class DestructibleWall extends GameEntity implements Interactable {
    public hp: number = 30;

    constructor(gridPos: ex.Vector) {
        super(gridPos, { width: 32, height: 32, collisionType: ex.CollisionType.Fixed });
    }

    onInitialize(engine: ex.Engine) {
        super.onInitialize(engine);
        const rect = new ex.Rectangle({
            width: 32,
            height: 32,
            color: ex.Color.fromHex('#555555') // Cracked wall color
        });
        this.graphics.use(rect);
    }

    interact(actor: Actor): boolean {
        console.log("A cracked wall. Looks weak.");
        return true;
    }

    public takeDamage(amount: number, type: DamageType, source?: Actor) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.die();
        }
    }

    public die() {
        console.log("Wall crumbled!");
        this.kill();
    }
}
