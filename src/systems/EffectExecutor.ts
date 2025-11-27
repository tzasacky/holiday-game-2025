import { EventBus } from '../core/EventBus';
import { GameEventNames } from '../core/GameEvents';
import { ItemEffect } from '../data/items';
import { AbilityID } from '../constants';
import { EffectID } from '../constants';

/**
 * EffectExecutor - Applies effects from data definitions
 * Listens to item:use events and executes effects via EventBus
 */
export class EffectExecutor {
    private static _instance: EffectExecutor;
    
    private constructor() {
        this.setupListeners();
    }
    
    public static get instance(): EffectExecutor {
        if (!this._instance) {
            this._instance = new EffectExecutor();
        }
        return this._instance;
    }
    
    private setupListeners(): void {
        EventBus.instance.on('item:use' as any, (data: any) => {
            this.handleItemUse(data);
        });
        
        EventBus.instance.on('ability:cast' as any, (data: any) => {
            this.handleAbilityCast(data);
        });
    }
    
    private handleItemUse(data: any): void {
        const { userId, effects, definition } = data;
        
        if (!effects || effects.length === 0) {
            console.log(`[EffectExecutor] No effects for item ${definition.name}`);
            return;
        }
        
        console.log(`[EffectExecutor] Applying ${effects.length} effects from ${definition.name} to ${userId}`);
        
        effects.forEach((effect: ItemEffect) => {
            this.applyEffect(effect, userId);
        });
    }
    
    private handleAbilityCast(data: any): void {
        const { casterId, targetId, effects } = data;
        
        if (!effects || effects.length === 0) {
            return;
        }
        
        effects.forEach((effect: ItemEffect) => {
            this.applyEffect(effect, targetId || casterId, casterId);
        });
    }
    
    /**
     * Apply a single effect to a target
     */
    private applyEffect(effect: ItemEffect, targetId: string, sourceId?: string): void {
        console.log(`[EffectExecutor] Applying effect ${effect.type} (value: ${effect.value}) to ${targetId}`);
        
        switch (effect.type) {
            case AbilityID.Heal:
                this.applyHeal(targetId, effect.value);
                break;
                
            case 'damage':
                this.applyDamage(targetId, effect.value, sourceId);
                break;
                
            case EffectID.WarmthRestore:
                this.applyWarmth(targetId, effect.value);
                break;
                
            case EffectID.StrengthBoost:
                this.applyStatBoost(targetId, 'strength', effect.value, effect.duration);
                break;
                
            case EffectID.DefenseBoost:
                this.applyStatBoost(targetId, 'defense', effect.value, effect.duration);
                break;
                
            case EffectID.SpeedBoost:
                this.applyStatBoost(targetId, 'speed', effect.value, effect.duration);
                break;
                
            case EffectID.Poison:
                this.applyCondition(targetId, EffectID.Poison, effect.value, effect.duration);
                break;
                
            case EffectID.Slow:
                this.applyCondition(targetId, EffectID.Slow, effect.value, effect.duration);
                break;
                
            case EffectID.Freeze:
                this.applyCondition(targetId, EffectID.Freeze, effect.value, effect.duration);
                break;
                
            case 'light_radius':
                this.applyPermanentEffect(targetId, 'light_radius', effect.value);
                break;
                
            case 'luck':
                this.applyPermanentEffect(targetId, 'luck', effect.value);
                break;
                
            case 'warmth_generation':
                this.applyPermanentEffect(targetId, 'warmth_generation', effect.value);
                break;
                
            case AbilityID.ChristmasSpirit:
                this.applyPermanentEffect(targetId, AbilityID.ChristmasSpirit, effect.value);
                break;
                
            default:
                console.warn(`[EffectExecutor] Unknown effect type: ${effect.type}`);
        }
    }
    
    private applyHeal(targetId: string, amount: number): void {
        EventBus.instance.emit('stat:change' as any, {
            actorId: targetId,
            stat: 'hp',
            delta: amount
        });
        
        EventBus.instance.emit(GameEventNames.Log, {
            text: `Restored ${amount} HP!`,
            source: 'Effect',
            color: 'green'
        });
    }
    
    private applyDamage(targetId: string, amount: number, sourceId?: string): void {
        EventBus.instance.emit('damage:dealt' as any, {
            targetId: targetId,
            sourceId: sourceId,
            damage: amount,
            damageType: EffectID.Physical
        });
    }
    
    private applyWarmth(targetId: string, amount: number): void {
        EventBus.instance.emit(GameEventNames.WarmthChange, {
            actorId: targetId,
            newValue: amount, // StatsComponent will handle clamping
            delta: amount
        });
        
        EventBus.instance.emit(GameEventNames.Log, {
            text: `Restored ${amount} warmth!`,
            source: 'Effect',
            color: 'cyan'
        });
    }
    
    private applyStatBoost(targetId: string, stat: string, value: number, duration?: number): void {
        EventBus.instance.emit('buff:apply' as any, {
            actorId: targetId,
            buffId: `${stat}_boost`,
            stat: stat,
            value: value,
            duration: duration || 50
        });
        
        EventBus.instance.emit(GameEventNames.Log, {
            text: `+${value} ${stat}!`,
            source: 'Effect',
            color: 'yellow'
        });
    }
    
    private applyCondition(targetId: string, conditionId: string, value: number, duration?: number): void {
        EventBus.instance.emit('condition:apply' as any, {
            actorId: targetId,
            conditionId: conditionId,
            value: value,
            duration: duration || 10
        });
        
        EventBus.instance.emit(GameEventNames.Log, {
            text: `Applied ${conditionId}!`,
            source: 'Effect',
            color: 'purple'
        });
    }
    
    private applyPermanentEffect(targetId: string, effectId: string, value: number): void {
        EventBus.instance.emit('permanent_effect:apply' as any, {
            actorId: targetId,
            effectId: effectId,
            value: value
        });
        
        console.log(`[EffectExecutor] Applied permanent effect ${effectId} = ${value} to ${targetId}`);
    }
}
