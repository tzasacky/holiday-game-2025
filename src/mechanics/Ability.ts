import type { Actor } from '../actors/Actor';

export abstract class Ability {
    public name: string;
    public description: string;
    public energyCost: number;
    public cooldown: number;
    public currentCooldown: number = 0;

    constructor(name: string, description: string, cost: number, cooldown: number) {
        this.name = name;
        this.description = description;
        this.energyCost = cost;
        this.cooldown = cooldown;
    }

    public abstract use(user: Actor, target?: Actor): boolean;

    public update() {
        if (this.currentCooldown > 0) {
            this.currentCooldown--;
        }
    }
}

export class HealAbility extends Ability {
    constructor() {
        super('Heal', 'Restores 10 HP', 10, 5);
    }

    public use(user: Actor, target?: Actor): boolean {
        if (this.currentCooldown > 0) return false;
        
        user.heal(10);
        this.currentCooldown = this.cooldown;
        console.log(`${user.name} used Heal!`);
        return true;
    }
}

import { DamageType } from './DamageType';

export class FireballAbility extends Ability {
    constructor() {
        super('Fireball', 'Deals 15 Fire damage', 20, 8);
    }

    public use(user: Actor, target?: Actor): boolean {
        if (this.currentCooldown > 0 || !target) return false;

        target.takeDamage(15, DamageType.Fire);
        
        console.log(`${user.name} cast Fireball on ${target.name}!`);
        this.currentCooldown = this.cooldown;
        return true;
    }
}
