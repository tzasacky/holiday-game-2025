import * as ex from 'excalibur';
import { Actor } from '../../actors/Actor';
import { Interactable } from '../Interactable';
import { GameEntity } from '../../core/GameEntity';

export class Teleporter extends GameEntity implements Interactable {
    public targetPos: ex.Vector | null = null;

    constructor(pos: ex.Vector, public name: string, sprite: ex.Graphic) {
        super(pos);
        this.graphics.use(sprite);
    }

    interact(actor: Actor): boolean {
        if (this.targetPos) {
            console.log(`${actor.name} teleported by ${this.name}!`);
            // Teleport logic
            // We need to update gridPos and potentially world pos
            // And ensure camera follows if it's the player
            
            // This is a bit hacky, ideally we use a method on Actor to teleport
            actor.gridPos = this.targetPos.clone();
            actor.pos = ex.vec(
                actor.gridPos.x * 16, // Assuming 16x16 tiles, should use constant
                actor.gridPos.y * 16
            );
            
            return true;
        } else {
            console.log(`${this.name} is inactive.`);
            return false;
        }
    }
}
