import { GameActor } from '../components/GameActor';
import { EventBus } from '../core/EventBus';
import { GameEventNames, LevelUpEvent, XpGainEvent } from '../core/GameEvents';

export class ProgressionSystem {
    private static _instance: ProgressionSystem;
    
    public static get instance(): ProgressionSystem {
        if (!this._instance) {
            this._instance = new ProgressionSystem();
        }
        return this._instance;
    }

    public addXp(actor: GameActor, amount: number) {
        const stats = actor.getGameComponent('stats') as any;
        if (!stats) return;

        const currentXp = stats.getStat('xp') || 0;
        const xpToNextLevel = stats.getStat('xpToNextLevel') || 100;
        
        const newXp = currentXp + amount;
        stats.setStat('xp', newXp);
        
        EventBus.instance.emit(GameEventNames.XpGain, new XpGainEvent(actor, amount));
        console.log(`${actor.name} gained ${amount} XP! (${newXp}/${xpToNextLevel})`);

        if (newXp >= xpToNextLevel) {
            this.levelUp(actor);
        }
    }

    public levelUp(actor: GameActor) {
        const stats = actor.getGameComponent('stats') as any;
        if (!stats) return;

        const currentLevel = stats.getStat('level') || 1;
        const newLevel = currentLevel + 1;
        
        stats.setStat('level', newLevel);
        
        // XP Rollover
        const currentXp = stats.getStat('xp');
        const xpToNextLevel = stats.getStat('xpToNextLevel') || 100;
        stats.setStat('xp', currentXp - xpToNextLevel);
        stats.setStat('xpToNextLevel', Math.floor(xpToNextLevel * 1.5));

        // Stat Growth
        const maxHp = stats.getStat('maxHp');
        stats.setStat('maxHp', maxHp + 5);
        stats.setStat('hp', maxHp + 5); // Heal on level up
        
        const strength = stats.getStat('strength');
        stats.setStat('strength', strength + 1);

        console.log(`${actor.name} reached Level ${newLevel}!`);
        EventBus.instance.emit(GameEventNames.LevelUp, new LevelUpEvent(actor, newLevel));
    }
}
