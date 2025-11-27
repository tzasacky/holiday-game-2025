import { EventBus } from '../core/EventBus';
import { GameEventNames, AbilityCastEvent, AbilityCheckUsableEvent, AbilityCheckResultEvent, AbilityCastSuccessEvent, AbilityEffectEvent, LevelGeneratedEvent, StatModifyEvent } from '../core/GameEvents';
import { DataManager } from '../core/DataManager';
import { AbilityDefinition, AbilityEffect, AbilityCost } from '../data/abilities';
import { AbilityID } from '../constants/AbilityIDs';
import { Logger } from '../core/Logger';
import { Level } from '../dungeon/Level';
import { GameActor } from '../components/GameActor';

/**
 * AbilityExecutor - Handles ability casting from data definitions
 * 
 * Reads from AbilityDefinitions and executes effects via EffectExecutor
 * Manages cooldowns, costs, and targeting
 */
export class AbilityExecutor {
    private static _instance: AbilityExecutor;
    private cooldowns: Map<string, number> = new Map(); // actorId:abilityId => expiry time
    private currentLevel: Level | null = null;
    
    private constructor() {
        this.setupListeners();
    }
    
    public static get instance(): AbilityExecutor {
        if (!this._instance) {
            this._instance = new AbilityExecutor();
        }
        return this._instance;
    }
    
    private setupListeners(): void {
        EventBus.instance.on(GameEventNames.LevelGenerated, (event: LevelGeneratedEvent) => {
            this.currentLevel = event.level;
        });

        EventBus.instance.on(GameEventNames.AbilityCast, (event: AbilityCastEvent) => {
            this.handleCastAbility(event);
        });
        
        EventBus.instance.on(GameEventNames.AbilityCheckUsable, (event: AbilityCheckUsableEvent) => {
            const result = this.canCastAbility(event.actorId, event.abilityId as AbilityID);
            EventBus.instance.emit(GameEventNames.AbilityCheckResult, new AbilityCheckResultEvent(
                event.abilityId,
                result.success,
                result.reason
            ));
        });
    }
    
    /**
     * Handle ability cast request
     */
    private handleCastAbility(event: AbilityCastEvent): void {
        const { actor, abilityId, abilityTarget } = event;
        const casterId = actor.entityId; // Or actor.id.toString()
        
        // Get ability definition
        const abilityDef = DataManager.instance.query<AbilityDefinition>('ability', abilityId);
        if (!abilityDef) {
            Logger.error(`[AbilityExecutor] Unknown ability: ${abilityId}`);
            return;
        }
        
        // Check if can cast
        const canCast = this.canCastAbility(casterId, abilityId as AbilityID);
        if (!canCast.success) {
            EventBus.instance.emit(GameEventNames.Log, {
                text: `Cannot cast ${abilityDef.name}: ${canCast.reason}`,
                source: 'Ability',
                color: 'red'
            });
            return;
        }
        
        // Pay costs
        this.payCosts(actor, abilityDef.costs);
        
        // Set cooldown
        this.setCooldown(casterId, abilityId as AbilityID, abilityDef.cooldown);
        
        // Execute effects
        this.executeAbilityEffects(actor, abilityTarget, abilityDef);
        
        // Emit cast event for UI/VFX
        EventBus.instance.emit(GameEventNames.AbilityCastSuccess, new AbilityCastSuccessEvent(
            actor,
            abilityId,
            abilityTarget
        ));
        
        // Log
        EventBus.instance.emit(GameEventNames.Log, {
            text: `Cast ${abilityDef.name}!`,
            source: 'Ability',
            color: 'yellow'
        });
    }
    
    /**
     * Check if actor can cast ability
     */
    private canCastAbility(actorId: string, abilityId: AbilityID): { success: boolean; reason?: string } {
        const abilityDef = DataManager.instance.query<AbilityDefinition>('ability', abilityId);
        if (!abilityDef) {
            return { success: false, reason: 'Unknown ability' };
        }
        
        // Check cooldown
        const cooldownKey = `${actorId}:${abilityId}`;
        const cooldownExpiry = this.cooldowns.get(cooldownKey);
        if (cooldownExpiry && Date.now() < cooldownExpiry) {
            const remaining = Math.ceil((cooldownExpiry - Date.now()) / 1000);
            return { success: false, reason: `On cooldown (${remaining}s)` };
        }
        
        // Check costs
        // We need the actor instance to check costs
        if (this.currentLevel) {
            const actor = this.currentLevel.getActorById(actorId);
            if (actor) {
                 const canAfford = this.canAffordCosts(actor, abilityDef.costs);
                 if (!canAfford.success) {
                     return canAfford;
                 }
            }
        }
        
        return { success: true };
    }
    
    /**
     * Check if actor can afford costs
     */
    private canAffordCosts(actor: GameActor, costs: AbilityCost[]): { success: boolean; reason?: string } {
        // This would check actor's resources
        // For now, simplified
        for (const cost of costs) {
            if (cost.type === 'energy' && cost.amount > 0) {
                // TODO: Check actual energy/mana
            }
        }
        return { success: true };
    }
    
    /**
     * Pay ability costs
     */
    private payCosts(actor: GameActor, costs: AbilityCost[]): void {
        costs.forEach(cost => {
            if (cost.type === 'energy') {
                EventBus.instance.emit(GameEventNames.StatModify, new StatModifyEvent(
                    actor,
                    'energy',
                    -cost.amount,
                    'flat'
                ));
            } else if (cost.type === 'health') {
                EventBus.instance.emit(GameEventNames.StatModify, new StatModifyEvent(
                    actor,
                    'hp',
                    -cost.amount,
                    'flat'
                ));
            } else if (cost.type === 'warmth') {
                EventBus.instance.emit(GameEventNames.StatModify, new StatModifyEvent(
                    actor,
                    'warmth',
                    -cost.amount,
                    'flat'
                ));
            }
        });
    }
    
    /**
     * Set ability cooldown
     */
    private setCooldown(actorId: string, abilityId: AbilityID, cooldownSeconds: number): void {
        const cooldownKey = `${actorId}:${abilityId}`;
        const expiryTime = Date.now() + (cooldownSeconds * 1000);
        this.cooldowns.set(cooldownKey, expiryTime);
        
        // Clean up expired cooldowns periodically
        setTimeout(() => {
            this.cooldowns.delete(cooldownKey);
        }, cooldownSeconds * 1000 + 100);
    }
    
    /**
     * Execute ability effects
     */
    private executeAbilityEffects(
        caster: GameActor,
        target: GameActor | any | undefined, // target can be vector
        abilityDef: AbilityDefinition
    ): void {
        Logger.info(`[AbilityExecutor] Executing ${abilityDef.name} effects`);
        
        // Resolve target actor if possible
        let targetActor: GameActor = caster;
        if (target && target instanceof GameActor) {
            targetActor = target;
        }
        
        abilityDef.effects.forEach(effect => {
            this.executeEffect(effect, caster, targetActor);
        });
    }
    
    /**
     * Execute single ability effect
     */
    private executeEffect(
        effect: AbilityEffect,
        caster: GameActor,
        target: GameActor
    ): void {
        // Delegate to EffectExecutor or send appropriate events
        
        // Apply scaling if defined
        if (effect.scaling) {
            // TODO: Query caster's stat and scale value
            Logger.debug(`[AbilityExecutor] Scaling effect by ${effect.scaling.stat}`);
        }
        
        // Emit effect event
        EventBus.instance.emit(GameEventNames.AbilityEffect, new AbilityEffectEvent(
            caster,
            target,
            effect
        ));
    }
    
    /**
     * Get remaining cooldown time
     */
    public getCooldownRemaining(actorId: string, abilityId: AbilityID): number {
        const cooldownKey = `${actorId}:${abilityId}`;
        const expiry = this.cooldowns.get(cooldownKey);
        if (!expiry) return 0;
        
        const remaining = Math.max(0, expiry - Date.now());
        return Math.ceil(remaining / 1000);
    }
}
