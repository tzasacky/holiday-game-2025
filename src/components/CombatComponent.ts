import { ActorComponent } from './ActorComponent';
import { GameEventNames, AttackEvent, DamageEvent } from '../core/GameEvents';
import { DamageType } from '../mechanics/DamageType';

export class CombatComponent extends ActorComponent {
    private lastAttackTime = 0;
    
    protected setupEventListeners(): void {
        // Listen for combat commands
        this.listen('combat:attack', (event) => {
            if (event.attackerId === this.actor.entityId) {
                this.handleAttack(event.targetId);
            }
        });
        
        this.listen('combat:take_damage', (event) => {
            if (event.targetId === this.actor.entityId) {
                this.handleTakeDamage(event.damage, event.damageType || DamageType.Physical, event.sourceId);
            }
        });
        
        // Listen for death events
        this.listen('actor:death', (event) => {
            if (this.isForThisActor(event)) {
                this.handleDeath();
            }
        });
    }
    
    private handleAttack(targetId: string): void {
        const now = Date.now();
        if (now - this.lastAttackTime < 500) return; // Attack cooldown
        this.lastAttackTime = now;
        
        // Calculate damage
        const damage = this.calculateDamage();
        
        // Emit attack event
        this.emit(GameEventNames.Attack, new AttackEvent(
            this.actor,
            { entityId: targetId } as any, // Target will be resolved by the system
            damage
        ));
        
        // Send damage to target
        this.emit('combat:take_damage', {
            targetId: targetId,
            damage: damage,
            damageType: DamageType.Physical,
            sourceId: this.actor.entityId
        });
    }
    
    private handleTakeDamage(amount: number, type: DamageType, sourceId?: string): void {
        // Calculate final damage with defense
        let finalDamage = amount;
        if (type === DamageType.Physical) {
            const defense = this.getTotalDefense();
            finalDamage = Math.max(0, amount - defense);
        }
        
        // Apply damage to HP
        this.emit('stat:modify', {
            actorId: this.actor.entityId,
            stat: 'hp',
            delta: -finalDamage
        });
        
        // Emit damage event for UI/effects
        this.emit(GameEventNames.Damage, new DamageEvent(
            this.actor,
            finalDamage,
            type,
            sourceId ? { entityId: sourceId } as any : undefined
        ));
        
        // Show damage visual effect
        this.emit('vfx:damage_number', {
            actorId: this.actor.entityId,
            damage: finalDamage,
            type: type
        });
        
        // Check for death
        const hp = this.actor.getComponent('stats')?.getStat('hp') ?? 0;
        if (hp <= 0) {
            this.emit('actor:death', {
                actorId: this.actor.entityId,
                killerId: sourceId
            });
        }
    }
    
    private handleDeath(): void {
        this.emit(GameEventNames.Die, {
            actor: this.actor,
            killer: undefined // TODO: resolve killer
        });
        
        // Remove actor after brief delay
        setTimeout(() => {
            this.actor.kill();
        }, 100);
    }
    
    getTotalDamage(): number {
        const statsComponent = this.actor.getComponent('stats');
        if (!statsComponent) return 0;
        
        let damage = statsComponent.getStat('strength');
        
        // Add weapon damage
        const weapon = this.actor.weapon; // Compatibility getter
        if (weapon && weapon.getFinalStats) {
            damage += weapon.getFinalStats().damage || 0;
        }
        
        // TODO: Add effect modifiers
        return Math.max(0, damage);
    }
    
    getTotalDefense(): number {
        const statsComponent = this.actor.getComponent('stats');
        if (!statsComponent) return 0;
        
        let defense = statsComponent.getStat('defense');
        defense += statsComponent.getStat('dexterity') / 2;
        
        // Add armor defense
        const armor = this.actor.armor; // Compatibility getter
        if (armor && armor.getFinalStats) {
            defense += armor.getFinalStats().defense || 0;
        }
        
        return Math.max(0, defense);
    }
}