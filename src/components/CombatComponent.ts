import * as ex from 'excalibur';
import { ActorComponent } from './ActorComponent';
import { GameEventNames, AttackEvent, DamageEvent, DamageDealtEvent, StatModifyEvent, DieEvent, LogEvent, ConditionApplyEvent } from '../core/GameEvents';
import { DamageType } from '../data/mechanics';
import { StatsComponent } from './StatsComponent';
import { EquipmentComponent } from './EquipmentComponent';
import { GameActor } from './GameActor';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { TurnManager } from '../core/TurnManager';
import { LevelManager } from '../core/LevelManager';
import { StatusEffectComponent } from './StatusEffectComponent';
import { EffectID } from '../constants/EffectIDs';

export class CombatComponent extends ActorComponent {
    private isAttacking = false;
    
    protected setupEventListeners(): void {
        // Listen for combat commands
        this.listen(GameEventNames.Attack, (event: AttackEvent) => {
            // Check if we are the attacker (event.attacker is GameActor)
            if (event.attacker === this.actor) {
                // If event.target is set, we're good.
            }
        });
        
        // Listen for damage requests
        this.listen(GameEventNames.Damage, (event: DamageEvent) => {
            if (event.target === this.actor) {
                this.takeDamage(event.damage, event.type, event.source);
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

        // Add Status Effect Bonuses
        const statusComp = this.actor.getGameComponent<StatusEffectComponent>('status_effect');
        if (statusComp) {
            // General damage boost (if any)
            baseDamage += statusComp.getEffectValue(EffectID.DamageBoost);
            
            // Frost Damage Bonus
            baseDamage += statusComp.getEffectValue(EffectID.FrostDamageBonus);
            
            // Fire Damage Bonus
            baseDamage += statusComp.getEffectValue(EffectID.FireDamageBonus); // Assuming FireDamageBonus exists or used FireDamage?
            // Actually I added FireDamageBonus in previous step.
        }
        
        // Check for critical hit (including equipment bonuses)
        let critRate = statsComp?.getStat('critRate') || 0;
        
        // Add crit rate from status effects (items)
        if (statusComp) {
            critRate += statusComp.getEffectValue(EffectID.CritRateBoost);
        }
        
        // Apply weapon enchantments to crit rate 
        // NOTE: Older enchantment logic might duplicate Status effects.
        // Assuming EffectExecutor handles applying status effect bonuses for enchantments,
        // we might not need this if Enchantments are converted to Status Effects.
        // But logic below specifically looks at 'weapon.enchantments'.
        // If we want to keep it:
        if (equipmentComp) {
             const weapon = equipmentComp.getEquipment('weapon');
             if (weapon?.enchantments) {
                 weapon.enchantments.forEach(enchantment => {
                     if (enchantment.type === 'vampiric' || enchantment.type === 'frost') {
                         critRate += enchantment.power * 2; // These enhance crit chance
                     }
                 });
             }
        }
        
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
    public attack(targetId: string): void {
        this.handleAttack(targetId);
    }
    
    private handleAttack(targetId: string): void {
        // Prevent multiple simultaneous attacks (including counter-attacks)
        if (this.isAttacking) {
            Logger.debug(`[CombatComponent] ${this.actor.name} is already attacking, skipping`);
            return;
        }
        
        this.isAttacking = true;
        
        // Resolve target
        const target = this.getActorById(targetId);
        if (!target) {
            console.warn(`[CombatComponent] Could not find target ${targetId}`);
            this.isAttacking = false;
            return;
        }
        
        // Check accuracy (including equipment bonuses)
        const statsComp = this.actor.getGameComponent<StatsComponent>('stats');
        let accuracy = statsComp?.getStat('accuracy') || 100;

        // Status component for additional effects
        const statusComp = this.actor.getGameComponent<StatusEffectComponent>('status_effect');
        if (statusComp) {
            accuracy += statusComp.getEffectValue(EffectID.AccuracyBoost);
        }
        
        // Apply equipment accuracy modifiers (legacy/specific)
        const equipmentComp = this.actor.getGameComponent<EquipmentComponent>('equipment');
        if (equipmentComp) {
            const weapon = equipmentComp.getEquipment('weapon');
            if (weapon?.curses) {
                weapon.curses.forEach(curse => {
                    if (curse.type === 'bad_luck') {
                        accuracy = Math.max(5, accuracy - (curse.severity * 5));
                    }
                });
            }
        }
        
        const hitRoll = Math.random() * 100;
        
        if (hitRoll > accuracy) {
            Logger.debug(`[CombatComponent] ${this.actor.name} MISSED ${target.name}! (${hitRoll.toFixed(1)} > ${accuracy})`);
            this.isAttacking = false;
            
            // Show "MISS" text
            // this.showDamageText("MISS"); // Need to change signature or handle string
            return;
        }
        
        // Calculate damage
        const damage = this.calculateDamage();
        
        // Determine Damage Type
        let damageType = DamageType.Physical;
        if (equipmentComp) {
            const weapon = equipmentComp.getEquipment('weapon');
            if (weapon) {
                if (weapon.definition.tags.includes(EffectID.Ice)) damageType = DamageType.Ice;
                if (weapon.definition.tags.includes(EffectID.Fire)) damageType = DamageType.Fire;
            }
        }
        
        // Clear any existing damage label before showing attack animation
        if (this.actor.currentDamageLabel) {
            this.actor.currentDamageLabel.kill();
            this.actor.currentDamageLabel = null;
        }
        
        // Play attack animation (4 frames @ 200ms = 800ms)
        const attackAnim = this.actor.getAttackAnimationName(target.gridPos);
        if (this.actor.graphics.getGraphic(attackAnim)) {
            this.actor.graphics.use(attackAnim);
        }
        
        // Emit attack event
        EventBus.instance.emit(GameEventNames.Attack, new AttackEvent(
            this.actor,
            target,
            damage,
            false
        ));
        
        // Delay damage application to show attack animation first (400ms for half animation)
        setTimeout(() => {
            // Send damage to target
            EventBus.instance.emit(GameEventNames.Damage, new DamageEvent(
                target,
                damage,
                damageType,
                this.actor,
                false
            ));
            
            // Apply On-Hit Effects
            if (statusComp) {
                // Stun Chance
                const stunChance = statusComp.getEffectValue(EffectID.StunChance);
                if (stunChance > 0 && Math.random() * 100 < stunChance) {
                    EventBus.instance.emit(GameEventNames.ConditionApply, new ConditionApplyEvent(target, EffectID.Stun, 1));
                }
                
                // Frost Chance (Freeze)
                const frostChance = statusComp.getEffectValue(EffectID.FrostChance);
                if (frostChance > 0 && Math.random() * 100 < frostChance) {
                     EventBus.instance.emit(GameEventNames.ConditionApply, new ConditionApplyEvent(target, EffectID.Freeze, 1));
                }
                
                // Slow Chance
                const slowChance = statusComp.getEffectValue(EffectID.SlowChance);
                if (slowChance > 0 && Math.random() * 100 < slowChance) {
                     EventBus.instance.emit(GameEventNames.ConditionApply, new ConditionApplyEvent(target, EffectID.Slow, 3));
                }
            }
            
            // After hurt animation completes, return to idle (another 400ms)
            setTimeout(() => {
                this.isAttacking = false;
                
                // Return to idle animation
                const idleAnim = this.getIdleAnimation();
                if (this.actor.graphics.getGraphic(idleAnim)) {
                    this.actor.graphics.use(idleAnim);
                }
            }, 400);
        }, 400);
    }
    
    public takeDamage(amount: number, type: DamageType, source?: GameActor): void {
        // Calculate final damage with defense and resistances
        let finalDamage = amount;
        
        // 1. Apply Defense (Armor) - Mostly for Physical, but helps generally
        const defense = this.getTotalDefense();
        finalDamage = Math.max(0, finalDamage - defense);
        
        // 2. Apply Resistances from StatusEffectComponent
        const statusComp = this.actor.getGameComponent<StatusEffectComponent>('status_effect');
        if (statusComp) {
            let resistance = 0;
            
            if (type === DamageType.Ice) {
                 resistance += statusComp.getEffectValue(EffectID.ColdResistance);
            } else if (type === DamageType.Fire) {
                 resistance += statusComp.getEffectValue(EffectID.FireResistance);
            }
            
            // Additional check for immunity
            if (type === DamageType.Ice && statusComp.getEffectValue(EffectID.ColdImmunity) > 0) {
                 resistance = 100;
            }

            if (resistance > 0) {
                finalDamage = Math.floor(finalDamage * (1 - Math.min(100, resistance) / 100));
            }
        }

        Logger.debug(`[CombatComponent] ${this.actor.name} taking ${finalDamage} damage (${amount} - ${defense} defense, type: ${type})`);
        
        // Play hurt animation (4 frames @ 200ms = 800ms)
        if (source) {
            const hurtAnim = this.actor.getHurtAnimationName(source.gridPos);
            if (this.actor.graphics.getGraphic(hurtAnim)) {
                this.actor.graphics.use(hurtAnim);
                
                // Return to idle after hurt animation (400ms)
                setTimeout(() => {
                    if (!this.actor.isDead) {
                        const idleAnim = this.getIdleAnimation();
                        if (this.actor.graphics.getGraphic(idleAnim)) {
                            this.actor.graphics.use(idleAnim);
                        }
                    }
                }, 400);
            }
        }
        
        // Get HP before damage to calculate actual damage dealt
        const statsComp = this.actor.getGameComponent<StatsComponent>('stats');
        const hpBefore = statsComp?.getStat('hp') ?? 0;
        
        // Calculate actual damage that will be dealt (don't count overkill)
        const actualDamage = Math.min(finalDamage, hpBefore);
        
        // Apply damage to HP
        EventBus.instance.emit(GameEventNames.StatModify, new StatModifyEvent(
            this.actor,
            'hp',
            -finalDamage,
            'flat'
        ));
        
        // Show damage number (actual damage, not overkill)
        this.showDamageText(actualDamage);
        
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
        }
        // No counter-attack logic - turn system handles retaliation naturally
    }
    
    private handleDeath(): void {
        Logger.info(`[CombatComponent] Handling death for ${this.actor.name}`);
        
        // Mark as dead immediately for gameplay (prevents interaction)
        this.actor.isDead = true;
        
        // Play death animation if available
        if (this.actor.graphics.getGraphic('death')) {
            this.actor.graphics.use('death');
        }
        
        // Clean death - no opacity fade
        this.actor.actions.clearActions();
        
        // Delay kill() to match death animation duration (4 frames @ 200ms = 800ms)
        // Actor is marked dead so it can't be interacted with
        setTimeout(() => {
            // Clear damage label before removing from scene
            if (this.actor.currentDamageLabel) {
                this.actor.currentDamageLabel.kill();
                this.actor.currentDamageLabel = null;
            }
            this.actor.kill();
            Logger.info(`[CombatComponent] Killed ${this.actor.name}`);
        }, 800);  // Match death animation duration
    }
    
    private showDamageText(damage: number): void {
        if (!this.actor.scene || damage <= 0) return;
        
        // Clear previous damage label if it exists
        if (this.actor.currentDamageLabel) {
            this.actor.currentDamageLabel.kill();
        }
        
        // Create a label for damage text
        const damageLabel = new ex.Label({
            text: damage.toString(),
            pos: this.actor.pos.add(ex.vec(0, -30)),
            font: new ex.Font({
                size: 24,
                color: ex.Color.Red,
                bold: true,
                strokeColor: ex.Color.Black,
                lineWidth: 1.5  // Thinner outline for better readability
            }),
            z: 100
        });
        
        this.actor.scene.add(damageLabel);
        this.actor.currentDamageLabel = damageLabel;
        
        // Auto-clear damage label after 3 seconds
        setTimeout(() => {
            if (this.actor.currentDamageLabel === damageLabel) {
                damageLabel.kill();
                this.actor.currentDamageLabel = null;
            }
        }, 3000);
    }
    
    private getIdleAnimation(): string {
        // Default to idle-down if we can't determine direction
        return 'idle-down';
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
        
        // Add Status Bonuses
        const statusComp = this.actor.getGameComponent<StatusEffectComponent>('status_effect');
        if (statusComp) {
            damage += statusComp.getEffectValue(EffectID.DamageBoost);
            damage += statusComp.getEffectValue(EffectID.FrostDamageBonus);
        }
        
        if (equipmentComp) {
            const weapon = equipmentComp.getEquipment('weapon');
            if (weapon?.enchantments) {
                weapon.enchantments.forEach(enchantment => {
                    if (enchantment.type === 'sharpness') {
                        damage += enchantment.power * 2;
                    }
                });
            }
            
            // Apply weapon curses
            if (weapon?.curses) {
                weapon.curses.forEach(curse => {
                    if (curse.type === 'dull') {
                        damage = Math.max(1, damage - (curse.severity * 2));
                    }
                });
            }
        }
        
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
        
        // Add armor enchantments and curses
        // Note: Re-fetching equipmentComp isn't needed if we reuse, but here scopes are separate
        if (equipmentComp) {
            const armor = equipmentComp.getEquipment('armor');
            if (armor?.enchantments) {
                armor.enchantments.forEach(enchantment => {
                    if (enchantment.type === 'protection') {
                        defense += enchantment.power * 2;
                    }
                });
            }
            
            // Apply armor curses
            if (armor?.curses) {
                armor.curses.forEach(curse => {
                    if (curse.type === 'vulnerability') {
                        defense = Math.max(0, defense - (curse.severity * 2));
                    }
                });
            }
        }

        return Math.max(0, defense);
    }
}