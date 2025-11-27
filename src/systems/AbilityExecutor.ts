// TODO: this
// import { EventBus } from '../core/EventBus';
// import { GameEventNames } from '../core/GameEvents';
// import { DataManager } from '../core/DataManager';
// import { AbilityDefinition, AbilityEffect, AbilityCost } from '../data/abilities';
// import { AbilityID } from '../constants';

// /**
//  * AbilityExecutor - Handles ability casting from data definitions
//  * 
//  * Reads from AbilityDefinitions and executes effects via EffectExecutor
//  * Manages cooldowns, costs, and targeting
//  */
// export class AbilityExecutor {
//     private static _instance: AbilityExecutor;
//     private cooldowns: Map<string, number> = new Map(); // actorId:abilityId => expiry time
    
//     private constructor() {
//         this.setupListeners();
//     }
    
//     public static get instance(): AbilityExecutor {
//         if (!this._instance) {
//             this._instance = new AbilityExecutor();
//         }
//         return this._instance;
//     }
    
//     private setupListeners(): void {
//         EventBus.instance.on('ability:cast' as any, (data: any) => {
//             this.handleCastAbility(data);
//         });
        
//         EventBus.instance.on('ability:check_usable' as any, (data: any) => {
//             const result = this.canCastAbility(data.casterId, data.abilityId);
//             EventBus.instance.emit('ability:check_result' as any, {
//                 requestId: data.requestId,
//                 canCast: result.success,
//                 reason: result.reason
//             });
//         });
//     }
    
//     /**
//      * Handle ability cast request
//      */
//     private handleCastAbility(data: {
//         casterId: string;
//         abilityId: AbilityID;
//         targetId?: string;
//         targetPos?: { x: number; y: number };
//     }): void {
//         const { casterId, abilityId, targetId, targetPos } = data;
        
//         // Get ability definition
//         const abilityDef = DataManager.instance.query<AbilityDefinition>('ability', abilityId);
//         if (!abilityDef) {
//             console.error(`[AbilityExecutor] Unknown ability: ${abilityId}`);
//             return;
//         }
        
//         // Check if can cast
//         const canCast = this.canCastAbility(casterId, abilityId);
//         if (!canCast.success) {
//             EventBus.instance.emit(GameEventNames.Log, {
//                 text: `Cannot cast ${abilityDef.name}: ${canCast.reason}`,
//                 source: 'Ability',
//                 color: 'red'
//             });
//             return;
//         }
        
//         // Pay costs
//         this.payCosts(casterId, abilityDef.costs);
        
//         // Set cooldown
//         this.setCooldown(casterId, abilityId, abilityDef.cooldown);
        
//         // Execute effects
//         this.executeAbilityEffects(casterId, targetId, targetPos, abilityDef);
        
//         // Emit cast event for UI/VFX
//         EventBus.instance.emit('ability:cast_success' as any, {
//             casterId,
//             abilityId,
//             targetId,
//             targetPos,
//             abilityName: abilityDef.name
//         });
        
//         // Log
//         EventBus.instance.emit(GameEventNames.Log, {
//             text: `Cast ${abilityDef.name}!`,
//             source: 'Ability',
//             color: 'yellow'
//         });
//     }
    
//     /**
//      * Check if actor can cast ability
//      */
//     private canCastAbility(actorId: string, abilityId: AbilityID): { success: boolean; reason?: string } {
//         const abilityDef = DataManager.instance.query<AbilityDefinition>('ability', abilityId);
//         if (!abilityDef) {
//             return { success: false, reason: 'Unknown ability' };
//         }
        
//         // Check cooldown
//         const cooldownKey = `${actorId}:${abilityId}`;
//         const cooldownExpiry = this.cooldowns.get(cooldownKey);
//         if (cooldownExpiry && Date.now() < cooldownExpiry) {
//             const remaining = Math.ceil((cooldownExpiry - Date.now()) / 1000);
//             return { success: false, reason: `On cooldown (${remaining}s)` };
//         }
        
//         // Check costs
//         const canAfford = this.canAffordCosts(actorId, abilityDef.costs);
//         if (!canAfford.success) {
//             return canAfford;
//         }
        
//         return { success: true };
//     }
    
//     /**
//      * Check if actor can afford costs
//      */
//     private canAffordCosts(actorId: string, costs: AbilityCost[]): { success: boolean; reason?: string } {
//         // This would check actor's resources
//         // For now, simplified
//         for (const cost of costs) {
//             if (cost.type === 'energy' && cost.amount > 0) {
//                 // TODO: Check actual energy/mana
//             }
//         }
//         return { success: true };
//     }
    
//     /**
//      * Pay ability costs
//      */
//     private payCosts(actorId: string, costs: AbilityCost[]): void {
//         costs.forEach(cost => {
//             if (cost.type === 'energy') {
//                 EventBus.instance.emit('stat:modify' as any, {
//                     actorId,
//                     stat: 'energy',
//                     delta: -cost.amount
//                 });
//             } else if (cost.type === 'health') {
//                 EventBus.instance.emit('stat:modify' as any, {
//                     actorId,
//                     stat: 'hp',
//                     delta: -cost.amount
//                 });
//             } else if (cost.type === 'warmth') {
//                 EventBus.instance.emit('stat:modify' as any, {
//                     actorId,
//                     stat: 'warmth',
//                     delta: -cost.amount
//                 });
//             }
//         });
//     }
    
//     /**
//      * Set ability cooldown
//      */
//     private setCooldown(actorId: string, abilityId: AbilityID, cooldownSeconds: number): void {
//         const cooldownKey = `${actorId}:${abilityId}`;
//         const expiryTime = Date.now() + (cooldownSeconds * 1000);
//         this.cooldowns.set(cooldownKey, expiryTime);
        
//         // Clean up expired cooldowns periodically
//         setTimeout(() => {
//             this.cooldowns.delete(cooldownKey);
//         }, cooldownSeconds * 1000 + 100);
//     }
    
//     /**
//      * Execute ability effects
//      */
//     private executeAbilityEffects(
//         casterId: string,
//         targetId: string | undefined,
//         targetPos: { x: number; y: number } | undefined,
//         abilityDef: AbilityDefinition
//     ): void {
//         console.log(`[AbilityExecutor] Executing ${abilityDef.name} effects`);
        
//         abilityDef.effects.forEach(effect => {
//             this.executeEffect(effect, casterId, targetId, targetPos);
//         });
//     }
    
//     /**
//      * Execute single ability effect
//      */
//     private executeEffect(
//         effect: AbilityEffect,
//         casterId: string,
//         targetId: string | undefined,
//         targetPos: { x: number; y: number } | undefined
//     ): void {
//         // Delegate to EffectExecutor or send appropriate events
//         const effectData: any = {
//             casterId,
//             targetId: targetId || casterId,
//             type: effect.type,
//             value: effect.value,
//             duration: effect.duration
//         };
        
//         // Apply scaling if defined
//         if (effect.scaling) {
//             // TODO: Query caster's stat and scale value
//             console.log(`[AbilityExecutor] Scaling effect by ${effect.scaling.stat}`);
//         }
        
//         // Emit effect event
//         EventBus.instance.emit('ability:effect' as any, effectData);
        
//         // Also emit item:use event for EffectExecutor to handle
//         EventBus.instance.emit('ability:cast' as any, {
//             casterId,
//             targetId: targetId || casterId,
//             effects: [effect]
//         });
//     }
    
//     /**
//      * Public API: Request to cast ability
//      */
//     public castAbility(casterId: string, abilityId: AbilityID, targetId?: string, targetPos?: { x: number; y: number }): void {
//         EventBus.instance.emit('ability:cast' as any, {
//             casterId,
//             abilityId,
//             targetId,
//             targetPos
//         });
//     }
    
//     /**
//      * Get remaining cooldown time
//      */
//     public getCooldownRemaining(actorId: string, abilityId: AbilityID): number {
//         const cooldownKey = `${actorId}:${abilityId}`;
//         const expiry = this.cooldowns.get(cooldownKey);
//         if (!expiry) return 0;
        
//         const remaining = Math.max(0, expiry - Date.now());
//         return Math.ceil(remaining / 1000);
//     }
// }
