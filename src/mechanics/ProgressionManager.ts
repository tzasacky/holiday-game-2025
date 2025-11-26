import { Actor } from '../actors/Actor';

export class ProgressionManager {
    static addXp(actor: Actor, amount: number) {
        if (!actor.stats) return;

        actor.stats.xp += amount;
        console.log(`${actor.name} gained ${amount} XP! (${actor.stats.xp}/${actor.stats.xpToNextLevel})`);

        if (actor.stats.xp >= actor.stats.xpToNextLevel) {
            ProgressionManager.levelUp(actor);
        }
    }

    static levelUp(actor: Actor) {
        if (!actor.stats) return;

        actor.stats.level++;
        actor.stats.xp -= actor.stats.xpToNextLevel;
        actor.stats.xpToNextLevel = Math.floor(actor.stats.xpToNextLevel * 1.5);

        // Stat Growth
        actor.stats.maxHp += 5;
        actor.stats.hp = actor.stats.maxHp; // Heal on level up
        actor.stats.strength += 1;

        console.log(`${actor.name} reached Level ${actor.stats.level}!`);
        // Visual effect?
    }
}
