import { Actor } from '../../actors/Actor';
import * as ex from 'excalibur';

export class Merchant extends Actor {
    constructor(gridPos: ex.Vector) {
        super(gridPos, 1000, { // High HP (invincible-ish)
            width: 32,
            height: 32,
            color: ex.Color.Yellow,
            collisionType: ex.CollisionType.Fixed // Doesn't move
        });
        this.name = "Merchant Elf";
        this.isPlayer = false;
    }

    onInitialize(engine: ex.Engine) {
        super.onInitialize(engine);
        // Visuals (Placeholder)
        const text = new ex.Text({
            text: "$",
            color: ex.Color.Black,
            font: new ex.Font({ size: 20 })
        });
        this.graphics.add(text);
    }

    public async act(): Promise<boolean> {
        // Merchant does nothing, just spend time
        this.spend(1.0);
        return true;
    }
}
