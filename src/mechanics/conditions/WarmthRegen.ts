import { Effect, EffectType } from '../Effect';
import { Actor } from '../../actors/Actor';

export class WarmthRegen extends Effect {
    constructor(duration: number, private amountPerTurn: number) {
        super("Warmth Regen", EffectType.Buff, duration, "Restores warmth over time.");
    }

    apply(target: Actor): void {
        console.log(`${target.name} feels warmer.`);
    }

    onUpdate(target: Actor): void {
        if (target.warmth < 100) { // Assuming 100 is max
            target.warmth = Math.min(100, target.warmth + this.amountPerTurn);
            console.log(`${target.name} recovers ${this.amountPerTurn} warmth.`);
        }
    }

    remove(target: Actor): void {
        console.log(`${target.name} is no longer warming up.`);
    }
}
