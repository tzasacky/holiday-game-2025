import { EventBus } from '../core/EventBus';
import { GameEventNames, ItemUseEvent, AbilityCastEvent, StatChangeEvent, DamageDealtEvent, BuffApplyEvent, ConditionApplyEvent, PermanentEffectApplyEvent, WarmthChangeEvent, LogEvent } from '../core/GameEvents';
import { ItemEffect } from '../data/items';
import { AbilityID } from '../constants';
import { EffectID } from '../constants';
import { Logger } from '../core/Logger';
import { GameActor } from '../components/GameActor';
import { DataManager } from '../core/DataManager';
import { AbilityDefinition } from '../data/abilities';

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
        EventBus.instance.on(GameEventNames.ItemUse, (event: ItemUseEvent) => {
            this.handleItemUse(event);
        });
        
        EventBus.instance.on(GameEventNames.AbilityCast, (event: AbilityCastEvent) => {
            this.handleAbilityCast(event);
        });
    }
    
    private handleItemUse(event: ItemUseEvent): void {
        const actor = event.actor;
        const item = event.item;
        const effects = item.definition.effects;
        
        if (!effects || effects.length === 0) {
            Logger.debug(`[EffectExecutor] No effects for item ${item.getDisplayName()}`);
            return;
        }
        
        Logger.debug(`[EffectExecutor] Applying ${effects.length} effects from ${item.getDisplayName()} to ${actor.name}`);
        
        effects.forEach((effect: ItemEffect) => {
            this.applyEffect(effect, actor);
        });
    }
    
    private handleAbilityCast(event: AbilityCastEvent): void {
        const caster = event.actor;
        const target = event.abilityTarget instanceof GameActor ? event.abilityTarget : caster; // Default to self if target is position or undefined
        
        // We need to get effects from AbilityDefinition since event doesn't carry them
        const abilityDef = DataManager.instance.query<AbilityDefinition>('ability', event.abilityId);
        
        if (!abilityDef || !abilityDef.effects || abilityDef.effects.length === 0) {
            return;
        }
        
        abilityDef.effects.forEach((effect: any) => { // Type as any for now as AbilityEffect might differ from ItemEffect
             // Map AbilityEffect to ItemEffect structure if needed
             const itemEffect: ItemEffect = {
                 type: effect.type,
                 value: effect.value,
                 duration: effect.duration,
                 chance: 1
             };
            this.applyEffect(itemEffect, target, caster);
        });
    }
    
    /**
     * Apply a single effect to a target
     */
    private applyEffect(effect: ItemEffect, target: GameActor, source?: GameActor): void {
        Logger.debug(`[EffectExecutor] Applying effect ${effect.type} (value: ${effect.value}) to ${target.name}`);
        
        switch (effect.type) {
            case AbilityID.Heal:
                this.applyHeal(target, effect.value, source);
                break;
                
            case 'damage':
                this.applyDamage(target, effect.value, source);
                break;
                
            case EffectID.WarmthRestore:
                this.applyWarmth(target, effect.value);
                break;
                
            case EffectID.StrengthBoost:
                this.applyStatBoost(target, 'strength', effect.value, effect.duration);
                break;
                
            case EffectID.DefenseBoost:
                this.applyStatBoost(target, 'defense', effect.value, effect.duration);
                break;
                
            case EffectID.SpeedBoost:
                this.applyStatBoost(target, 'speed', effect.value, effect.duration);
                break;
                
            case EffectID.Poison:
                this.applyCondition(target, EffectID.Poison, effect.value, effect.duration);
                break;
                
            case EffectID.Slow:
                this.applyCondition(target, EffectID.Slow, effect.value, effect.duration);
                break;
                
            case EffectID.Freeze:
                this.applyCondition(target, EffectID.Freeze, effect.value, effect.duration);
                break;
                
            case 'light_radius':
                this.applyPermanentEffect(target, 'light_radius', effect.value);
                break;
                
            case 'luck':
                this.applyPermanentEffect(target, 'luck', effect.value);
                break;
                
            case 'warmth_generation':
                this.applyPermanentEffect(target, 'warmth_generation', effect.value);
                break;
                
            case AbilityID.ChristmasSpirit:
                this.applyPermanentEffect(target, AbilityID.ChristmasSpirit, effect.value);
                break;
                
            default:
                Logger.warn(`[EffectExecutor] Unknown effect type: ${effect.type}`);
        }
    }
    
    private applyHeal(target: GameActor, amount: number, source?: GameActor): void {
        EventBus.instance.emit(GameEventNames.StatModify, new StatChangeEvent(
            target,
            'hp',
            0, 
            0
        ));
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            `Restored ${amount} HP!`,
            'Effect',
            'green'
        ));
    }
    
    private applyDamage(target: GameActor, amount: number, source?: GameActor): void {
        EventBus.instance.emit(GameEventNames.DamageDealt, new DamageDealtEvent(
            target,
            amount,
            source,
            EffectID.Physical as any // Cast to DamageType if needed
        ));
    }
    
    private applyWarmth(target: GameActor, amount: number): void {
        EventBus.instance.emit(GameEventNames.WarmthChange, new WarmthChangeEvent(
            target,
            0, // current placeholder
            100, // max placeholder
            amount
        ));
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            `Restored ${amount} warmth!`,
            'Effect',
            'cyan'
        ));
    }
    
    private applyStatBoost(target: GameActor, stat: string, value: number, duration?: number): void {
        EventBus.instance.emit(GameEventNames.BuffApply, new BuffApplyEvent(
            target,
            `${stat}_boost`,
            duration || 50,
            stat,
            value
        ));
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            `+${value} ${stat}!`,
            'Effect',
            'yellow'
        ));
    }
    
    private applyCondition(target: GameActor, conditionId: string, value: number, duration?: number): void {
        EventBus.instance.emit(GameEventNames.ConditionApply, new ConditionApplyEvent(
            target,
            conditionId,
            duration || 10,
            value
        ));
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            `Applied ${conditionId}!`,
            'Effect',
            'purple'
        ));
    }
    
    private applyPermanentEffect(target: GameActor, effectId: string, value: number): void {
        EventBus.instance.emit(GameEventNames.PermanentEffectApply, new PermanentEffectApplyEvent(
            target,
            effectId,
            value
        ));
        
        Logger.info(`[EffectExecutor] Applied permanent effect ${effectId} = ${value} to ${target.name}`);
    }
}
