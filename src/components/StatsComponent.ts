import { ActorComponent } from './ActorComponent';
import { GameEventNames, HealthChangeEvent, WarmthChangeEvent } from '../core/GameEvents';

export class StatsComponent extends ActorComponent {
    private stats = new Map<string, number>();
    
    constructor(actor: any, baseStats: Record<string, number> = {}) {
        super(actor);
        // Initialize base stats
        Object.entries(baseStats).forEach(([stat, value]) => {
            this.stats.set(stat, value);
        });
    }
    
    protected setupEventListeners(): void {
        // Listen for stat queries
        this.listen('stat:get', (event) => {
            if (this.isForThisActor(event)) {
                const value = this.stats.get(event.stat) ?? 0;
                this.emit('stat:response', {
                    actorId: this.actor.entityId,
                    stat: event.stat,
                    value: value
                });
            }
        });
        
        // Listen for stat modifications
        this.listen('stat:modify', (event) => {
            if (this.isForThisActor(event)) {
                this.modifyStat(event.stat, event.delta);
            }
        });
        
        this.listen('stat:set', (event) => {
            if (this.isForThisActor(event)) {
                this.setStat(event.stat, event.value);
            }
        });
        
        // Warmth changes are handled via setStat directly or specific request events if needed
    }
    
    getStat(name: string): number {
        return this.stats.get(name) ?? 0;
    }
    
    setStat(name: string, value: number): void {
        const oldValue = this.stats.get(name) ?? 0;
        this.stats.set(name, value);
        
        this.emit('stat:changed', {
            actorId: this.actor.entityId,
            stat: name,
            oldValue: oldValue,
            newValue: value
        });
        
        // Emit specific events for UI
        if (name === 'hp' || name === 'maxHp') {
            this.emit(GameEventNames.HealthChange, new HealthChangeEvent(
                this.actor,
                this.getStat('hp'),
                this.getStat('maxHp'),
                value - oldValue
            ));
        }
        
        if (name === 'warmth' || name === 'maxWarmth') {
            this.emit(GameEventNames.WarmthChange, new WarmthChangeEvent(
                this.actor,
                this.getStat('warmth'),
                this.getStat('maxWarmth'),
                value - oldValue
            ));
        }
    }
    
    modifyStat(name: string, delta: number): void {
        const current = this.getStat(name);
        this.setStat(name, current + delta);
    }
    
    // Apply caps based on max stats
    applyCaps(): void {
        const hp = this.getStat('hp');
        const maxHp = this.getStat('maxHp');
        if (hp > maxHp) this.setStat('hp', maxHp);
        
        const warmth = this.getStat('warmth');
        const maxWarmth = this.getStat('maxWarmth');
        if (warmth > maxWarmth) this.setStat('warmth', maxWarmth);
    }
}