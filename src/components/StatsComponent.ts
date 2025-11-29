import { ActorComponent } from './ActorComponent';
import { GameEventNames, HealthChangeEvent, WarmthChangeEvent, StatGetEvent, StatResponseEvent, StatModifyEvent, StatSetEvent, StatChangeEvent } from '../core/GameEvents';
import { Logger } from '../core/Logger';

export class StatsComponent extends ActorComponent {
    private stats = new Map<string, number>();
    
    constructor(actor: any, baseStats: Record<string, number> = {}) {
        super(actor);
        // Initialize base stats
        Object.entries(baseStats).forEach(([stat, value]) => {
            this.stats.set(stat, value);
        });
        
        // Initialize HP to maxHp if not provided
        if (!this.stats.has('hp') && this.stats.has('maxHp')) {
            this.stats.set('hp', this.stats.get('maxHp')!);
        }
        
        // Initialize warmth to maxWarmth if not provided
        if (!this.stats.has('warmth') && this.stats.has('maxWarmth')) {
            this.stats.set('warmth', this.stats.get('maxWarmth')!);
        }
    }
    
    protected setupEventListeners(): void {
        // Listen for stat queries
        this.listen(GameEventNames.StatGet, (event: StatGetEvent) => {
            if (this.isForThisActor(event)) {
                const value = this.stats.get(event.stat) ?? 0;
                this.emit(GameEventNames.StatResponse, new StatResponseEvent(
                    this.actor,
                    event.stat,
                    value,
                    event.requestId
                ));
            }
        });
        
        // Listen for stat modifications
        this.listen(GameEventNames.StatModify, (event: StatModifyEvent) => {
            if (this.isForThisActor(event)) {
                this.modifyStat(event.stat, event.value);
            }
        });
        
        this.listen(GameEventNames.StatSet, (event: StatSetEvent) => {
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
        if (isNaN(value)) {
            Logger.error(`[StatsComponent] Attempted to set stat ${name} to NaN! Actor: ${this.actor.name}`);
            console.trace(); // Trace the call stack
            return; // Prevent setting NaN
        }

        const oldValue = this.stats.get(name) ?? 0;
        this.stats.set(name, value);
        
        this.emit(GameEventNames.StatChange, new StatChangeEvent(
            this.actor,
            name,
            oldValue,
            value
        ));
        
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
        if (isNaN(delta)) {
            Logger.error(`[StatsComponent] Attempted to modify stat ${name} by NaN! Actor: ${this.actor.name}`);
            console.trace();
            return;
        }
        const current = this.getStat(name);
        this.setStat(name, current + delta);
        
        // Enforce caps immediately after modification
        this.applyCaps();
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