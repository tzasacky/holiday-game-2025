import { ActorComponent } from './ActorComponent';
import { GameEventNames, AttackEvent, DamageEvent, DamageDealtEvent, StatModifyEvent, DieEvent, LogEvent } from '../core/GameEvents';
import { DamageType } from '../data/mechanics';
import { StatsComponent } from './StatsComponent';
import { EquipmentComponent } from './EquipmentComponent';
import { GameActor } from './GameActor';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { TurnManager } from '../core/TurnManager';
import { LevelManager } from '../core/LevelManager';

export class CombatComponent extends ActorComponent {
    private lastAttackTime = 0;
    
    protected setupEventListeners(): void {
        // Listen for combat commands
        this.listen(GameEventNames.Attack, (event: AttackEvent) => {
            // Check if we are the attacker (event.attacker is GameActor)
            if (event.attacker === this.actor) {
                // If the event is already fully formed with a target, we don't need to do anything
                // But if this is a command to attack, we might need to handle it.
                // Actually, AttackEvent seems to be the RESULT of an attack initiation.
                // Let's assume we listen for a command or input that triggers handleAttack.
                // But the original code listened for 'combat:attack' with attackerId.
                // If we use strict events, we should probably have an AttackRequestEvent or similar.
                // For now, let's keep the logic but check event properties.
                
                // If event.target is set, we're good.
            }
        });
        
        // We need a way to trigger attacks. Usually Input or AI triggers it.
        // They should call handleAttack directly or emit an event.
        
        // Listen for damage requests (using a specific event name for requests if needed, or reusing DamageEvent if it's a request)
        // Original code used 'combat:take_damage'. Let's use GameEventNames.Damage for the request/notification.
        // But GameEventNames.Damage maps to DamageEvent which has a target.
        this.listen(GameEventNames.Damage, (event: DamageEvent) => {
            if (event.target === this.actor) {
                this.takeDamage(event.damage, event.type, event.source, event.isCounterAttack);
            }
        });
        
        // Listen for death events
        this.listen(GameEventNames.Death, (event: DieEvent) => {
            if (event.actor === this.actor) {
                this.handleDeath();
            }
        });
    }
    
    private getActorById(id: string): GameActor | undefined {
        // Use LevelManager to get current level's actors
        // This is more reliable than scene.actors, especially during scene transitions
        const level = LevelManager.instance.getCurrentLevel();
        if (!level) return undefined;
        return level.actors.find((a: GameActor) => a.entityId === id || a.name === id);
    }
    
    private calculateDamage(): number {
        // Get base damage from actor's stats
        const statsComp = this.actor.getGameComponent<StatsComponent>('stats');
        let baseDamage = statsComp ? (statsComp.getStat('strength') || 10) : 10;
        
        // Add equipment bonuses
        const equipmentComp = this.actor.getGameComponent<EquipmentComponent>('equipment');
        if (equipmentComp) {
            const weapon = equipmentComp.getEquipment('weapon');
            if (weapon && weapon.definition.stats?.damage) {
                baseDamage += weapon.definition.stats.damage;
            }
        }
        
        // Check for critical hit
        const critRate = statsComp?.getStat('critRate') || 0;
        const isCrit = Math.random() * 100 < critRate;
        
        if (isCrit) {
            baseDamage *= 2;
            Logger.debug(`[CombatComponent] ${this.actor.name} CRITICAL HIT!`);
        }
        
        // Add some randomization (±10%)
        const variance = 0.1;
        const multiplier = 1 + (Math.random() * 2 - 1) * variance;
        
        return Math.max(1, Math.floor(baseDamage * multiplier));
    }
    
    // Public method to initiate attack
    public attack(targetId: string, isCounterAttack: boolean = false): void {
        this.handleAttack(targetId, isCounterAttack);
    }
    
    private handleAttack(targetId: string, isCounterAttack: boolean = false): void {
        const now = Date.now();
        if (!isCounterAttack && now - this.lastAttackTime < 500) return; // Attack cooldown (skip for counter-attacks)
        if (!isCounterAttack) this.lastAttackTime = now;
        
        // Resolve target
        const target = this.getActorById(targetId);
        if (!target) {
            console.warn(`[CombatComponent] Could not find target ${targetId}`);
            return;
        }
        
        // Check accuracy
        const statsComp = this.actor.getGameComponent<StatsComponent>('stats');
        const accuracy = statsComp?.getStat('accuracy') || 100;
        const hitRoll = Math.random() * 100;
        
        if (hitRoll > accuracy) {
            Logger.debug(`[CombatComponent] ${this.actor.name} MISSED ${target.name}! (${hitRoll.toFixed(1)} > ${accuracy})`);
            // Emit miss event?
            return;
        }
        
        // Calculate damage
        const damage = this.calculateDamage();
        
        // Emit attack event
        EventBus.instance.emit(GameEventNames.Attack, new AttackEvent(
            this.actor,
            target,
            damage,
            isCounterAttack
        ));
        
        // Send damage to target
        EventBus.instance.emit(GameEventNames.Damage, new DamageEvent(
            target,
            damage,
            DamageType.Physical,
            this.actor,
            isCounterAttack
        ));
    }
    
    public takeDamage(amount: number, type: DamageType, source?: GameActor, isCounterAttack: boolean = false): void {
        // Calculate final damage with defense
        let finalDamage = amount;
        if (type === DamageType.Physical) {
            const defense = this.getTotalDefense();
            finalDamage = Math.max(0, amount - defense);
        }
        
        Logger.debug(`[CombatComponent] ${this.actor.name} taking ${finalDamage} damage (${amount} - ${this.getTotalDefense()} defense)`);
        
        // Get HP before damage
        const statsComp = this.actor.getGameComponent<StatsComponent>('stats');
        const hpBefore = statsComp?.getStat('hp') ?? 0;
        
        // Apply damage to HP
        EventBus.instance.emit(GameEventNames.StatModify, new StatModifyEvent(
            this.actor,
            'hp',
            -finalDamage,
            'flat'
        ));
        
        // Emit damage dealt event (result)
        EventBus.instance.emit(GameEventNames.DamageDealt, new DamageDealtEvent(
            this.actor,
            finalDamage,
            source,
            type
        ));
        
        // Check for death AFTER damage applied
        const hpAfter = hpBefore - finalDamage;
        Logger.debug(`[CombatComponent] ${this.actor.name} HP: ${hpBefore} -> ${hpAfter}`);
        
        if (hpAfter <= 0) {
            Logger.info(`[CombatComponent] ${this.actor.name} died!`);
            EventBus.instance.emit(GameEventNames.Death, new DieEvent(
                this.actor,
                source
            ));
        } else if (source && !isCounterAttack && type === DamageType.Physical) {
            // Counter-attack logic
            // Only counter if source is adjacent and it wasn't a counter-attack itself
            const dist = this.actor.gridPos.distance(source.gridPos);
            if (dist <= 1.5) {
                Logger.debug(`[CombatComponent] ${this.actor.name} counter-attacking ${source.name}`);
                this.attack(source.entityId, true);
            }
        }
    }
    
    private handleDeath(): void {
        Logger.info(`[CombatComponent] Handling death for ${this.actor.name}`);
        
        // Visual cleanup
        this.actor.actions.clearActions();
        this.actor.graphics.opacity = 0.5; // Fade out effect
        
        // Remove actor after brief delay
        setTimeout(() => {
            this.actor.kill();
            Logger.info(`[CombatComponent] Killed ${this.actor.name}`);
        }, 500);
    }
    
    getTotalDamage(): number {
        const statsComponent = this.actor.getGameComponent<StatsComponent>('stats');
        if (!statsComponent) return 0;
        
        let damage = statsComponent.getStat('strength');
        
        // Add weapon damage
        const equipmentComp = this.actor.getGameComponent<EquipmentComponent>('equipment');
        if (equipmentComp) {
            const weapon = equipmentComp.getEquipment('weapon');
            if (weapon && weapon.definition.stats?.damage) {
                damage += weapon.definition.stats.damage;
            }
        }
        
        // TODO: Add effect modifiers
        return Math.max(0, damage);
    }
    
    getTotalDefense(): number {
        const statsComponent = this.actor.getGameComponent<StatsComponent>('stats');
        if (!statsComponent) return 0;
        
        let defense = statsComponent.getStat('defense');
        
        // Add armor defense
        const equipmentComp = this.actor.getGameComponent<EquipmentComponent>('equipment');
        if (equipmentComp) {
            const armor = equipmentComp.getEquipment('armor');
            if (armor && armor.definition.stats?.defense) {
                defense += armor.definition.stats.defense;
            }
        }
        
        return Math.max(0, defense);
    }
}