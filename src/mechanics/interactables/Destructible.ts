import * as ex from 'excalibur';
import { Actor } from '../../actors/Actor';
import { Interactable } from '../Interactable';
import { GameEntity } from '../../core/GameEntity';
import { DamageType } from '../DamageType';

export class Destructible extends GameEntity implements Interactable {
    public hp: number = 10;
    public maxHp: number = 10;
    public isDestroyed: boolean = false;

    constructor(pos: ex.Vector, public name: string, sprite: ex.Graphic, hp: number = 10) {
        super(pos);
        this.graphics.use(sprite);
        this.hp = hp;
        this.maxHp = hp;
    }

    interact(actor: Actor): boolean {
        // Default interaction might be "shake" or "hit"
        // For now, let's say interacting attacks it
        console.log(`${actor.name} hits the ${this.name}.`);
        this.takeDamage(1, DamageType.Physical); // Simple hit
        return true;
    }

    public takeDamage(amount: number, type: DamageType) {
        if (this.isDestroyed) return;

        this.hp -= amount;
        if (this.hp <= 0) {
            this.destroy();
            // Visual feedback (flash, shake)
            // this.actions.shake(2, 200); // Shake not available on ActionsComponent directly
            console.log("Destructible hit!");
        }
    }

    private destroy() {
        this.isDestroyed = true;
        console.log(`${this.name} is destroyed!`);
        // Change sprite to destroyed version or remove
        // Drop loot?
        this.kill(); // Remove from scene
    }
}
