import { Artifact } from '../../../items/Artifact';
import { Actor } from '../../../actors/Actor';
import { StatBoostEffect, PeriodicEffect } from '../../../mechanics/Effect';
import { ItemID } from '../ItemIDs';

export class RingOfFrost extends Artifact {
    public passiveEffects = [
        new StatBoostEffect('Frost Touch', 'coldResist', 8),
        new StatBoostEffect('Icy Grip', 'freezeChance', 0.20)
    ];

    constructor() {
        super(ItemID.RingOfFrost, 'Ring of Frost', 'A crystalline ring that emanates cold. Freezes enemies on contact and grants cold immunity.');
    }

    onEquip(actor: Actor) {
        super.onEquip(actor);
        // Stub: onAttackHit property doesn't exist yet on Actor
        console.log(`${actor.name} equips Ring of Frost - 25% chance to freeze on hit`);
        // TODO: Implement onAttackHit callback system
    }
}

export class RingOfHaste extends Artifact {
    public passiveEffects = [
        new StatBoostEffect('Swift Movement', 'speed', 6),
        new StatBoostEffect('Quick Reflexes', 'dexterity', 4)
    ];

    constructor() {
        super(ItemID.RingOfHaste, 'Ring of Haste', 'A golden ring that pulses with energy. Greatly increases movement and attack speed.');
    }

    onEquip(actor: Actor) {
        super.onEquip(actor);
        // actor.actionSpeed *= 1.5; // TODO: Add actionSpeed to Actor
    }

    onUnequip(actor: Actor) {
        super.onUnequip(actor);
        // actor.actionSpeed /= 1.5; // TODO: Add actionSpeed to Actor
    }
}

export class RingOfWarmth extends Artifact {
    public passiveEffects = [
        new StatBoostEffect('Inner Fire', 'warmth', 15),
        new PeriodicEffect('Warming Glow', 'warmth', 2, 5) // +2 warmth every 5 turns
    ];

    constructor() {
        super(ItemID.RingOfWarmth, 'Ring of Warmth', 'A ruby ring that burns with inner fire. Keeps you warm in the coldest conditions.');
    }
}

export class RingOfJingleBells extends Artifact {
    public passiveEffects = [
        new StatBoostEffect('Festive Cheer', 'charisma', 6),
        new StatBoostEffect('Musical Magic', 'luck', 4)
    ];

    constructor() {
        super(ItemID.RingOfJingleBells, 'Ring of Jingle Bells', 'A silver ring adorned with tiny bells. Creates musical magic that confuses enemies.');
    }

    onEquip(actor: Actor) {
        super.onEquip(actor);
        // TODO: Add auraEffect to Actor
        /*
        actor.auraEffect = {
            radius: 3,
            effect: (target: Actor) => {
                if (target.isEnemy && Math.random() < 0.15) {
                    target.addTemporaryEffect('Confused by Jingles', { randomMovement: true }, 2);
                }
            }
        };
        */
    }
}

export class RingOfChristmasSpirit extends Artifact {
    public passiveEffects = [
        new StatBoostEffect('Christmas Joy', 'charisma', 8),
        new StatBoostEffect('Holiday Magic', 'intelligence', 5),
        new StatBoostEffect('Generous Heart', 'luck', 6)
    ];

    constructor() {
        super(ItemID.RingOfChristmasSpirit, 'Ring of Christmas Spirit', 'A magnificent ring that embodies the true spirit of Christmas. Radiates pure joy.');
    }

    onEquip(actor: Actor) {
        super.onEquip(actor);
        // TODO: Add allyBoostAura to Actor
        /*
        actor.allyBoostAura = {
            radius: 4,
            bonuses: { strength: 3, defense: 2, warmth: 5 }
        };
        */
    }
}

export class RingOfElvenGrace extends Artifact {
    public passiveEffects = [
        new StatBoostEffect('Elven Nimbleness', 'dexterity', 7),
        new StatBoostEffect('Woodland Stealth', 'stealth', 8),
        new StatBoostEffect('Keen Senses', 'perception', 6)
    ];

    constructor() {
        super(ItemID.RingOfElvenGrace, 'Ring of Elven Grace', 'An elegant ring crafted by master elves. Grants supernatural grace and stealth.');
    }

    onEquip(actor: Actor) {
        super.onEquip(actor);
        // TODO: Add criticalHitChance and dodgeChance to Actor
        // actor.criticalHitChance += 0.15; // +15% crit chance
        // actor.dodgeChance += 0.20; // +20% dodge chance
    }

    onUnequip(actor: Actor) {
        super.onUnequip(actor);
        // actor.criticalHitChance -= 0.15;
        // actor.dodgeChance -= 0.20;
    }
}

export class RingOfReindeerSpeed extends Artifact {
    public passiveEffects = [
        new StatBoostEffect('Reindeer Sprint', 'speed', 10),
        new StatBoostEffect('Arctic Endurance', 'stamina', 8),
        new StatBoostEffect('Cold Immunity', 'coldResist', 12)
    ];

    constructor() {
        super(ItemID.RingOfReindeerSpeed, 'Ring of Reindeer Speed', 'A ring made from reindeer antler. Grants the legendary speed of Santa\'s reindeer.');
    }

    onEquip(actor: Actor) {
        super.onEquip(actor);
        // TODO: Add dash mechanics to Actor
        // actor.canDashThroughEnemies = true;
        // actor.dashDistance = 3;
    }
}