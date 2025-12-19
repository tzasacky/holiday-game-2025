import { ActorComponent } from './ActorComponent';
import { GameActor } from './GameActor';
import { GameEventNames, BuffApplyEvent, ConditionApplyEvent, PermanentEffectApplyEvent, LogEvent, StatModifyEvent, PermanentEffectRemoveEvent } from '../core/GameEvents';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { EffectID } from '../constants';

export interface ActiveEffect {
    id: string;
    type: 'buff' | 'condition' | 'permanent';
    name: string;
    value: number;
    duration: number; // -1 for infinite
    sourceId?: string; // To track where it came from (e.g. item id)
    tickInterval?: number; // For conditions like poison
    lastTick?: number;
}

export class StatusEffectComponent extends ActorComponent {
    private effects: ActiveEffect[] = [];
    
    constructor(actor: GameActor) {
        super(actor);
    }
    
    protected setupEventListeners(): void {
        this.listen(GameEventNames.BuffApply, (event: BuffApplyEvent) => {
            if (this.isForThisActor(event)) {
                this.applyBuff(event.buffId, event.stat || '', event.value || 0, event.duration);
            }
        });
        
        this.listen(GameEventNames.ConditionApply, (event: ConditionApplyEvent) => {
            if (this.isForThisActor(event)) {
                this.applyCondition(event.conditionId, event.value || 0, event.duration);
            }
        });
        
        this.listen(GameEventNames.PermanentEffectApply, (event: PermanentEffectApplyEvent) => {
            if (this.isForThisActor(event)) {
                this.applyPermanent(event.effectId, event.value || 0, undefined);
            }
        });

        // Listen for removal
        this.listen(GameEventNames.PermanentEffectRemove, (event: PermanentEffectRemoveEvent) => {
             if (this.isForThisActor(event)) {
                 this.removeEffect(event.effectId, event.value);
             }
        });
    }
    
    public onTick(delta: number): void {
        // Delta is in ms? Turn based?
        // Status effects usually tick on turns.
        // We should listen to ActorTurn? Or just use onTick if we want real-time (animations).
        // Gameplay logic should be turn-based. 
        // But let's assume 'duration' is turns?
        // The events define duration. '50' usually means turns.
        // But onTick(delta) is called every frame.
        // We shouldn't decrement turn duration here.
        // We should listen to ActorTurn or ActorSpendTime.
    }

    // Override verify listener for ticks
    public onAttach(): void {
        super.onAttach();
        // Listen to turn event for duration handling
        EventBus.instance.on(GameEventNames.ActorTurn, this.handleTurn);
    }
    
    public onDetach(): void {
        super.onDetach();
        EventBus.instance.off(GameEventNames.ActorTurn, this.handleTurn);
    }
    
    private handleTurn = (event: any) => {
        if (event.actor === this.actor) {
            this.processTurn();
        }
    }
    
    private processTurn(): void {
        // Decrement duration for non-infinite effects
        // Process DoT (Damage over Time)
        
        const expiredEffects: ActiveEffect[] = [];
        
        this.effects.forEach(effect => {
            // Handle conditions (DoT)
            if (effect.type === 'condition') {
                this.handleConditionTick(effect);
            }
            
            if (effect.duration > 0) {
                effect.duration--;
                if (effect.duration <= 0) {
                    expiredEffects.push(effect);
                }
            }
        });
        
        // Remove expired
        expiredEffects.forEach(effect => {
            this.removeEffectInstance(effect);
        });
    }
    
    private handleConditionTick(effect: ActiveEffect): void {
        if (effect.id === EffectID.Poison) {
            // Apply poison damage
            EventBus.instance.emit(GameEventNames.Log, new LogEvent(
                `${this.actor.name} takes poison damage!`,
                'Combat',
                '#800080'
            ));
            // Direct damage or emit event?
            // Emit Damage event? Or direct StatModify?
            // CombatComponent handles damage usually.
            const combat = this.actor.getGameComponent('combat');
            if (combat) {
                // (combat as any).takeDamage(effect.value); // If method exists
                // Or just modify HP
                EventBus.instance.emit(GameEventNames.StatModify, new StatModifyEvent(this.actor, 'hp', -effect.value, 'flat'));
            }
        }
    }
    
    public applyBuff(id: string, stat: string, value: number, duration: number): void {
        Logger.info(`[StatusEffect] Applying Buff ${id}: +${value} ${stat} for ${duration} turns`);
        
        // Add to stats
        EventBus.instance.emit(GameEventNames.StatModify, new StatModifyEvent(
            this.actor,
            stat,
            value,
            'flat'
        ));
        
        this.effects.push({
            id: id,
            type: 'buff',
            name: stat, // Store stat name to reverse it later
            value: value,
            duration: duration
        });
    }
    
    public applyCondition(id: string, value: number, duration: number): void {
        Logger.info(`[StatusEffect] Applying Condition ${id} for ${duration} turns`);
        // Conditions might have immediate effects or passive flags
        if (id === EffectID.Slow) {
             // Modify speed?
             // Speed is not a stat yet.
             // Maybe Speed stat exists?
             // If so:
             // this.applyPermanent(EffectID.SpeedBoost, -value, duration);
        }
        
        this.effects.push({
            id: id,
            type: 'condition',
            name: id,
            value: value,
            duration: duration
        });
    }
    
    public applyPermanent(id: string, value: number, duration: number = -1): void {
        Logger.info(`[StatusEffect] Applying Permanent ${id}: ${value}`);
        
        // Check if it's a known stat
        const knownStats = ['strength', 'defense', 'hp', 'maxHp', 'warmth', 'maxWarmth', 'accuracy', 'critRate', 'speed', 'light_radius', 'christmas_spirit', 'luck', 'warmth_generation', 'cold_resistance'];
        
        if (knownStats.includes(id) || id.endsWith('_boost')) {
            const statName = id.replace('_boost', '');
            EventBus.instance.emit(GameEventNames.StatModify, new StatModifyEvent(
                this.actor,
                statName,
                value,
                'flat'
            ));
        }
        
        this.effects.push({
            id: id,
            type: 'permanent',
            name: id,
            value: value,
            duration: duration
        });
    }
    
    public removeEffect(id: string, value?: number): void {
        // Find matching effect
        // If value is provided, match value too (to remove exact stack)
        const index = this.effects.findIndex(e => e.id === id && (value === undefined || e.value === value));
        
        if (index !== -1) {
            const effect = this.effects[index];
            this.removeEffectInstance(effect);
            this.effects.splice(index, 1);
        }
    }
    
    private removeEffectInstance(effect: ActiveEffect): void {
        Logger.info(`[StatusEffect] Removing ${effect.type} ${effect.id}`);
        
        if (effect.type === 'buff' || effect.type === 'permanent') {
            // Reverse stat mod
            // effect.name holds the stat name for buffs
            // effect.id holds the stat name for permanents (usually)
            
            let statName = effect.name;
            if (effect.type === 'permanent') { 
                 // For permanent, name is id. Check if it maps to stat.
                 if (['strength', 'defense', 'hp', 'maxHp', 'warmth', 'maxWarmth', 'accuracy', 'critRate', 'speed', 'light_radius', 'christmas_spirit', 'luck', 'warmth_generation', 'cold_resistance'].includes(effect.id) || effect.id.endsWith('_boost')) {
                     statName = effect.id.replace('_boost', '');
                 } else {
                     return; // Not a stat mod, just a flag
                 }
            }
            
            EventBus.instance.emit(GameEventNames.StatModify, new StatModifyEvent(
                this.actor,
                statName,
                -effect.value,
                'flat'
            ));
            
             EventBus.instance.emit(GameEventNames.Log, new LogEvent(
                `${effect.id} faded.`,
                'Effect',
                '#888'
            ));
        } else if (effect.type === 'condition') {
             EventBus.instance.emit(GameEventNames.Log, new LogEvent(
                `${effect.id} wore off.`,
                'Effect',
                '#888'
            ));
        }
    }
    
    public hasCondition(id: string): boolean {
        return this.effects.some(e => e.type === 'condition' && e.id === id);
    }
    
    public removeAllConditions(): void {
        const conditions = this.effects.filter(e => e.type === 'condition');
        conditions.forEach(c => this.removeEffectInstance(c));
        this.effects = this.effects.filter(e => e.type !== 'condition');
    }

    public getEffectValue(id: string): number {
        return this.effects
            .filter(e => e.id === id)
            .reduce((sum, e) => sum + e.value, 0);
    }
    
     public saveState(): any {
        return {
            effects: this.effects
        };
    }

    public loadState(data: any): void {
        if (data && data.effects) {
            this.effects = data.effects;
            // Note: We don't re-apply stats here because StatsComponent saves its state (which includes current values).
            // However, if we removed logic...
            // Actually, safe to assume stats are persisted.
        }
    }
}
