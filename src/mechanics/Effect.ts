import { Actor } from '../actors/Actor';
import { ActorStats } from '../actors/Stats';

export enum EffectType {
    StatModifier = 'stat_modifier',
    StatusEffect = 'status_effect',
    Instant = 'instant',
    Buff = 'buff',
    Debuff = 'debuff'
}

export interface StatModifier {
    stat: string;
    value: number;
    isMultiplier: boolean;
}

export abstract class Effect {
    public currentDuration: number;
    public modifiers: StatModifier[] = [];

    constructor(
        public name: string,
        public type: EffectType,
        public duration: number = 0,
        public description: string = ""
    ) {
        this.currentDuration = duration;
    }

    abstract apply(target: Actor): void;

    update(target: Actor): void {
        if (this.duration > 0) {
            this.currentDuration--;
            this.onUpdate(target);
        }
    }

    onUpdate(target: Actor): void {}

    remove(target: Actor): void {}
}

export class StatusEffect extends Effect {
    constructor(
        name: string,
        description: string,
        duration: number,
        public onTick: (target: Actor) => void,
        public onApply?: (target: Actor) => void,
        public onRemove?: (target: Actor) => void
    ) {
        super(name, EffectType.StatusEffect, duration, description);
    }

    public apply(target: Actor): void {
        if (this.onApply) this.onApply(target);
        console.log(`Applied Status: ${this.name}`);
    }

    public onUpdate(target: Actor): void {
        this.onTick(target);
    }

    public remove(target: Actor): void {
        if (this.onRemove) this.onRemove(target);
        console.log(`Removed Status: ${this.name}`);
    }
}

export class StatBoostEffect extends Effect {
    constructor(name: string, stat: string, value: number, duration: number = 0) {
        super(name, EffectType.Buff, duration, `Increases ${stat} by ${value}`);
        this.modifiers.push({ stat, value, isMultiplier: false });
    }

    apply(target: Actor): void {
        console.log(`Applied StatBoost: ${this.name}`);
        // Logic to apply stat boost is handled by Actor.recalculateStats() usually, 
        // or we can directly modify if we don't have a recalc system yet.
        // For now, let's assume Actor checks effects for modifiers.
    }
}

export class ActiveEffect extends Effect {
    constructor(name: string, property: string, value: number, duration: number = 0) {
        super(name, EffectType.Buff, duration, `${property} = ${value}`);
        this.modifiers.push({ stat: property, value, isMultiplier: false });
    }

    apply(target: Actor): void {
        console.log(`Applied ActiveEffect: ${this.name}`);
    }
}

export class PeriodicEffect extends Effect {
    constructor(name: string, stat: string, value: number, interval: number, duration: number = 0) {
        super(name, EffectType.Buff, duration, `+${value} ${stat} every ${interval} turns`);
        this.modifiers.push({ stat, value, isMultiplier: false });
    }

    apply(target: Actor): void {
        console.log(`Applied PeriodicEffect: ${this.name}`);
    }
}

export class PermanentStatBoostEffect extends Effect {
    constructor(name: string, stat: string, value: number) {
        super(name, EffectType.Buff, 0, `Permanently +${value} ${stat}`);
        this.modifiers.push({ stat, value, isMultiplier: false });
    }

    apply(target: Actor): void {
        console.log(`Applied PermanentStatBoost: ${this.name}`);
    }
}
