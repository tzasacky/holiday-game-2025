import { Effect, EffectType } from '../Effect';
import { Actor } from '../../actors/Actor';
import { DamageType } from '../DamageType';

export class Freezing extends Effect {
    constructor(duration: number) {
        super("Freezing", EffectType.Debuff, duration, "Rooted and taking cold damage.");
    }

    apply(target: Actor): void {
        console.log(`${target.name} is frozen solid!`);
        // TODO: Apply Root (prevent movement)
        // target.canMove = false; 
    }

    onUpdate(target: Actor): void {
        // Deal Cold Damage
        target.takeDamage(2, DamageType.Ice);
    }

    remove(target: Actor): void {
        console.log(`${target.name} thaws out.`);
        // TODO: Remove Root
        // target.canMove = true;
    }
}
