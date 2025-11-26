import * as ex from 'excalibur';
import { GameEntity } from '../../core/GameEntity';
import { Interactable } from '../../mechanics/Interactable';
import { Actor } from '../../actors/Actor';
import { DamageType } from '../../mechanics/DamageType';

export class ChristmasTree extends GameEntity implements Interactable {
    public hp: number = 20;

    constructor(gridPos: ex.Vector) {
        super(gridPos, { width: 32, height: 32, collisionType: ex.CollisionType.Fixed });
    }

    onInitialize(engine: ex.Engine) {
        super.onInitialize(engine);
        // Use Polygon for triangle
        const rect = new ex.Polygon({
            points: [ex.vec(16, 0), ex.vec(32, 32), ex.vec(0, 32)],
            color: ex.Color.Green
        });
        this.graphics.use(rect);
    }

    interact(actor: Actor): boolean {
        console.log("A festive tree.");
        return true;
    }

    // Custom takeDamage since it's an entity but not an Actor (unless we make it an Actor?)
    // GameEntity doesn't have takeDamage by default, but we can add it or cast.
    // For now, let's assume we might need to handle this in the combat system or add it here.
    public takeDamage(amount: number, type: DamageType, source?: Actor) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.die();
        }
    }

    public die() {
        console.log("Tree destroyed!");
        // Drop ornaments?
        this.kill();
    }
}
