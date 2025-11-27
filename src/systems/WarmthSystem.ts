import { GameActor } from '../components/GameActor';
import { DamageType } from '../data/mechanics';
import { DataManager } from '../core/DataManager';

export class WarmthSystem {
    private static _instance: WarmthSystem;
    
    public static get instance(): WarmthSystem {
        if (!this._instance) {
            this._instance = new WarmthSystem();
        }
        return this._instance;
    }

    public processTurn(actor: GameActor, floor: number): void {
        // Only process warmth for actors with warmth stat
        if (actor.warmth === undefined || actor.warmth === null) return;

        // Get configuration from DataManager
        const difficulty = DataManager.instance.query<any>('difficulty', 'warmthDecayRate') || 1;
        const progression = DataManager.instance.query<any>('progression_rules', 'warmth_decay_scaling');
        
        // Calculate decay
        let decay = difficulty;
        if (progression && progression.scaling) {
             const base = progression.scaling.baseValue || 0;
             const coeff = progression.scaling.coefficient || 0;
             decay = base + (coeff * floor);
        }

        // Apply decay
        const currentWarmth = actor.warmth;
        const newWarmth = Math.max(0, currentWarmth - decay);
        actor.warmth = newWarmth;

        // Check for freezing damage
        if (newWarmth <= 0) {
            const combat = actor.getGameComponent('combat');
            if (combat) {
                // Assuming combat component has takeDamage, otherwise we need another way
                // But GameActor doesn't expose takeDamage directly in the new interface
                // We'll cast to any for now as per the pattern in GameActor getters
                (combat as any).takeDamage(1, DamageType.Ice);
            }
        }
    }
}
