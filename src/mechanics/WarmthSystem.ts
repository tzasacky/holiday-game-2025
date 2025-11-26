import * as ex from 'excalibur';
import { Hero } from '../actors/Hero';
import { DamageType } from './DamageType';
import { Level } from '../dungeon/Level';

export class WarmthSystem extends ex.System {
    public systemType = ex.SystemType.Update;
    private hero: Hero | null = null;
    private level: Level | null = null;
    private warmthDecayRate: number = 1; // Per turn or second? Let's say per turn for now, but system updates per frame.
    // Actually, warmth should probably be turn-based.
    // But for visual feedback, we might want continuous updates if we use real-time elements.
    // Let's stick to turn-based for gameplay logic, but maybe this system handles visual effects?
    // Or maybe this system hooks into the TurnManager?
    
    // For now, let's make it a simple manager that TurnManager calls, rather than an ECS System, 
    // to keep it tightly coupled with the turn loop as requested.
    
    constructor() {
        super();
    }

    public update(elapsed: number) {
        // Visual updates if any
    }

    public processTurn(hero: Hero, level: Level) {
        // Check environment
        // Check heat sources
        let warmthChange = -this.warmthDecayRate;
        
        // TODO: Check for heat sources in level
        
        hero.warmth = ex.clamp(hero.warmth + warmthChange, 0, 100);
        
        if (hero.warmth <= 0) {
            hero.takeDamage(1, DamageType.Ice); // Frostbite
        }
    }
}
