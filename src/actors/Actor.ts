import * as ex from 'excalibur';
import { GameEntity } from '../core/GameEntity';
import { ActorStats } from './Stats';
import { Inventory } from '../items/Inventory';
import { Ability } from '../mechanics/Ability';
import { Effect, EffectType, StatusEffect } from '../mechanics/Effect';
import { EnhancedEquipment } from '../mechanics/EquipmentSystem';
import { Item } from '../items/Item';
import { IdentificationSystem } from '../mechanics/IdentificationSystem';
import { DamageType } from '../mechanics/DamageType';
import { Logger } from '../core/Logger';
import { Level } from '../dungeon/Level';
import { TerrainType, TerrainDefinitions } from '../dungeon/Terrain';
// import { GameScene } from '../scenes/GameScene'; // Break circular dependency
import { TurnManager } from '../core/TurnManager';
import { ItemEntity } from '../items/ItemEntity';
import { Pathfinding, PathfindingOptions } from '../core/Pathfinding';
import { EventBus } from '../core/EventBus';
import { 
    GameEventNames, 
    AttackEvent, 
    DamageEvent, 
    HealEvent, 
    DieEvent, 
    HealthChangeEvent, 
    WarmthChangeEvent, 
    XpGainEvent,
    ItemEquipEvent,
    ItemUnequipEvent
} from '../core/GameEvents';


export abstract class Actor extends GameEntity {
    public hp: number = 10;
    public maxHp: number = 10;
    public defense: number = 0;
    protected _warmth: number = 100;
    public maxWarmth: number = 100;
    public isPlayer: boolean = false;
    
    // Game world properties
    public currentLevel: any = null; // Will be properly typed when Level is available
    public alignment: string = 'neutral';
    public isEnemy: boolean = false;
    
    // Combat properties
    public type: string = 'actor';
    public entityTypes: string[] = []; // Renamed to avoid conflict with GameEntity.types
    
    // Special combat properties
    public damageModifier: ((target: Actor, damage: number) => number) | null = null;
    public warmthRegen: number = 0;
    public holyAura: any = null;
    public lootBonus: number = 1;
    public iceAttackBonus: number = 1;
    public gold: number = 0;
    public coldRegeneration: number = 0;
    public onAttack: ((target: Actor) => void) | null = null;
    // Character development
    public intelligence: number = 10;
    public strength: number = 10;
    public dexterity: number = 10;
    public perception: number = 10;
    public speed: number = 10;
    
    // Equipment slots (Weapon/Armor kept for stats)

    // Turn System
    public time: number = 0;
    public id: number = 0;
    
    // Priority Constants
    protected static readonly VFX_PRIO: number = 100;
    protected static readonly HERO_PRIO: number = 0;
    protected static readonly BLOB_PRIO: number = -10;
    protected static readonly MOB_PRIO: number = -20;
    protected static readonly BUFF_PRIO: number = -30;
    private static readonly DEFAULT: number = -100;

    public actPriority: number = Actor.DEFAULT;
    
    // Core Systems
    public stats: ActorStats;
    public effects: Effect[] = [];
    public abilities: Ability[] = [];

    public weapon: EnhancedEquipment | null = null;
    public armor: EnhancedEquipment | null = null;

    // Pathfinding properties
    protected currentPath: ex.Vector[] = [];
    protected currentPathIndex: number = 0;
    protected moving: boolean = false;
    
    // Attack cooldown to prevent spam
    public lastAttackTime: number = 0;

    constructor(gridPos: ex.Vector, maxHp: number, config?: ex.ActorArgs) {
        super(gridPos, config);
        this.maxHp = maxHp;
        this.hp = maxHp;
        this.stats = new ActorStats();
    }

    public get warmth(): number {
        return this._warmth;
    }

    public set warmth(value: number) {
        const old = this._warmth;
        this._warmth = value;
        if (old !== value) {
            EventBus.instance.emit(GameEventNames.WarmthChange, new WarmthChangeEvent(this, this._warmth, this.maxWarmth, value - old));
        }
    }

    // Equipment Management (Basic)
    public equip(item: EnhancedEquipment): boolean {
        // Base actor just sets the reference for stats
        // Hero overrides this for full logic
        if (item.id.toString().includes('Weapon') || item.id.toString().includes('Dagger') || item.id.toString().includes('Sword')) {
            this.weapon = item;
            EventBus.instance.emit(GameEventNames.ItemEquip, new ItemEquipEvent(this, item, 'weapon'));
            return true;
        } else if (item.id.toString().includes('Armor') || item.id.toString().includes('Suit') || item.id.toString().includes('Plate')) {
            this.armor = item;
            EventBus.instance.emit(GameEventNames.ItemEquip, new ItemEquipEvent(this, item, 'armor'));
            return true;
        }
        return false;
    }

    public unequip(item: EnhancedEquipment): boolean {
        if (this.weapon === item) {
            this.weapon = null;
            EventBus.instance.emit(GameEventNames.ItemUnequip, new ItemUnequipEvent(this, item, 'weapon'));
            return true;
        } else if (this.armor === item) {
            this.armor = null;
            EventBus.instance.emit(GameEventNames.ItemUnequip, new ItemUnequipEvent(this, item, 'armor'));
            return true;
        }
        return false;
    }

    // Effect Management
    public addTemporaryEffect(name: string, data: any, duration: number): void {
        // Create a dynamic status effect based on data
        const effect = new StatusEffect(
            name,
            data.description || name,
            duration,
            (target) => {
                // On Tick
                if (data.warmthDrain) {
                    target.warmth -= data.warmthDrain;
                }
                if (data.hpRegen) {
                    target.hp = Math.min(target.maxHp, target.hp + data.hpRegen);
                }
            },
            (target) => {
                // On Apply
                if (data.statModifiers) {
                    // Apply immediate stat mods if any
                }
            },
            (target) => {
                // On Remove
            }
        );
        
        this.effects.push(effect);
        effect.apply(this);
    }

    public addEffect(effect: Effect) {
        this.effects.push(effect);
        effect.apply(this);
    }

    public removeEffect(effect: Effect) {
        const index = this.effects.indexOf(effect);
        if (index > -1) {
            this.effects.splice(index, 1);
            if (effect.remove) effect.remove(this);
        }
    }

    public updateEffects(): void {
        // Process effects
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.update(this);
            if (effect.currentDuration <= 0 && effect.duration !== -1) { // -1 is permanent/indefinite
                this.removeEffect(effect);
            }
        }
        
        // Update Abilities (Cooldowns)
        this.abilities.forEach(ability => ability.update());
    }
    
    public gainExperience(amount: number): void {
        console.log(`${this.name} gained ${amount} XP`);
        EventBus.instance.emit(GameEventNames.XpGain, new XpGainEvent(this, amount));
    }

    public teleportToSafeLocation(): void {
        console.log(`${this.name} teleports to safety!`);
    }

    public teleportTo(x: number, y: number): void {
        // Update grid position and world position
        this.gridPos = ex.vec(x, y);
        this.syncToGrid();
        console.log(`${this.name} teleported to ${x}, ${y}`);
    }

    public removeAllNegativeEffects(): void {
        // Simple implementation: remove all effects for now
        // Ideally we check if effect is negative
        this.effects = [];
        console.log(`${this.name} was cleansed of all effects.`);
    }

    public removeCondition(name: string): void {
        this.effects = this.effects.filter(e => e.name !== name);
        console.log(`${this.name} removed condition: ${name}`);
    }

    public addPermanentBonus(stat: string, amount: number): void {
        switch (stat) {
            case 'strength': this.stats.strength += amount; break;
            case 'dexterity': this.stats.dexterity += amount; break;
            case 'intelligence': this.stats.intelligence += amount; break;
            case 'perception': this.stats.perception += amount; break;
            case 'speed': this.stats.speed += amount; break;
            case 'maxHP': this.maxHp += amount; this.hp += amount; break;
            case 'maxWarmth': this.maxWarmth += amount; this.warmth += amount; break;
            case 'charisma': 
                // Charisma is on Hero, but we can check if we are Hero
                if ('charisma' in this) (this as any).charisma += amount; 
                break;
            default: console.warn(`Unknown stat for bonus: ${stat}`);
        }
        console.log(`${this.name} gained permanent +${amount} to ${stat}`);
    }

    public addVisualEffect(name: string, duration: number): void {
        console.log(`${this.name} has visual effect: ${name} for ${duration} ticks`);
    }
    
    // Computed Stats
    public get totalDamage(): number {
        let dmg = this.stats.strength; 
        if (this.weapon) {
            const stats = this.weapon.getFinalStats();
            dmg += stats.damage || 0;
        }
        this.effects.forEach(e => {
            e.modifiers.forEach(m => {
                if (m.stat === 'damage') dmg += m.value;
            });
        });
        return Math.max(0, dmg);
    }

    public get totalDefense(): number {
        let def = this.defense + (this.stats.dexterity / 2);
        if (this.armor) {
            const stats = this.armor.getFinalStats();
            def += stats.defense || 0;
        }
        this.effects.forEach(e => {
            e.modifiers.forEach(m => {
                if (m.stat === 'defense') def += m.value;
            });
        });
        return Math.max(0, def);
    }
    // Time / Turn Management
    public async act(): Promise<boolean> {
        // Default behavior: do nothing, just spend a turn
        this.spend(10);
        return Promise.resolve(true);
    }

    public spend(time: number): void {
        this.time += time;
    }
    
    public postpone(time: number): void {
        // Used when an action is interrupted or delayed
        this.time += time;
    }

    public findPathTo(targetX: number, targetY: number, options?: PathfindingOptions): void {
        if (!this.scene || !(this.scene as any).level) {
            Logger.debug("[Actor] No scene/level for pathfinding");
            return;
        }
        
        const level = (this.scene as any).level!;
        const start = ex.vec(this.gridPos.x, this.gridPos.y);
        const end = ex.vec(targetX, targetY);
        
        Logger.debug(`[Actor] ${this.name} finding path from`, start, "to", end);
        
        // Use default options for mobs (avoid interactables)
        const pathOptions: PathfindingOptions = options || {
            avoidInteractables: true,
            allowItems: false,
            allowMobs: false
        };
        
        const path = Pathfinding.findPath(level, start, end, pathOptions);
        this.setPath(path);
    }

    public setPath(path: ex.Vector[]): void {
        this.currentPath = path;
        this.currentPathIndex = 0;
    }

    public clearPath(): void {
        this.currentPath = [];
        this.currentPathIndex = 0;
    }

    public hasPath(): boolean {
        return this.currentPath.length > 0 && this.currentPathIndex < this.currentPath.length;
    }

    public getNextPathStep(): ex.Vector | null {
        if (!this.hasPath()) return null;
        return this.currentPath[this.currentPathIndex];
    }
    

    public advancePath(): void {
        if (this.hasPath()) {
            this.currentPathIndex++;
            Logger.debug(`[Actor] ${this.name} advanced path, index now:`, this.currentPathIndex, "of", this.currentPath.length);
        }
    }
    
    // Lifecycle
    onInitialize(engine: ex.Engine) {
        super.onInitialize(engine);
        // Configure graphics via registry
        const { ActorRegistry } = require('../config/ActorRegistry');
        ActorRegistry.getInstance().configureActor(this);
    }

    onPreUpdate(engine: ex.Engine, delta: number) {
        super.onPreUpdate(engine, delta);
        // Update effects
        this.updateEffects();
    }

    onPostUpdate(engine: ex.Engine, delta: number) {
        super.onPostUpdate(engine, delta);
    }

    public immuneTo: string[] = [];

    // Combat
    public attack(target: Actor, type: DamageType = DamageType.Physical): void {
        const now = Date.now();
        if (now - this.lastAttackTime < 500) return; // 500ms cooldown
        this.lastAttackTime = now;

        // Calculate damage
        let damage = this.totalDamage;
        
        // Apply damage modifier if exists
        if (this.damageModifier) {
            damage = this.damageModifier(target, damage);
        }

        // Apply critical hit chance (based on dexterity/luck)
        const isCrit = Math.random() < 0.05;
        if (isCrit) {
            damage *= 1.5;
            console.log('Critical Hit!');
        }

        console.log(`${this.name} attacks ${target.name} for ${damage} damage!`);
        
        EventBus.instance.emit(GameEventNames.Attack, new AttackEvent(this, target, damage));
        
        target.takeDamage(damage, type, this);
    }

    public heal(amount: number): void {
        const oldHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        console.log(`${this.name} healed for ${amount}. HP: ${this.hp}/${this.maxHp}`);
        
        EventBus.instance.emit(GameEventNames.Heal, new HealEvent(this, amount));
        EventBus.instance.emit(GameEventNames.HealthChange, new HealthChangeEvent(this, this.hp, this.maxHp, this.hp - oldHp));
    }

    public takeDamage(amount: number, type: DamageType, source?: Actor): void {
        // Apply defense
        let finalDamage = amount;
        if (type === DamageType.Physical) {
            finalDamage = Math.max(0, amount - this.totalDefense);
        }

        const oldHp = this.hp;
        this.hp -= finalDamage;
        console.log(`${this.name} took ${finalDamage} damage. HP: ${this.hp}/${this.maxHp}`);
        
        EventBus.instance.emit(GameEventNames.Damage, new DamageEvent(this, finalDamage, type, source));
        EventBus.instance.emit(GameEventNames.HealthChange, new HealthChangeEvent(this, this.hp, this.maxHp, this.hp - oldHp));

        // Visual feedback (floating text)
        const damageLabel = new ex.Label({
            text: `-${Math.floor(finalDamage)}`,
            pos: ex.vec(0, -20),
            font: new ex.Font({
                family: 'Arial',
                size: 20,
                unit: ex.FontUnit.Px,
                color: ex.Color.Red
            })
        });
        this.addChild(damageLabel);
        damageLabel.actions.moveBy(0, -30, 50).fade(0, 1000).die();

        if (this.hp <= 0) {
            this.die();
        }
    }

    public die(): void {
        console.log(`${this.name} has died!`);
        EventBus.instance.emit(GameEventNames.Die, new DieEvent(this));
        
        // Delay removal slightly
        setTimeout(() => {
            this.kill(); 
        }, 100);
    }

    // Helper methods for direction (kept for now as they might be useful for logic)
    private getDirectionFromDiff(diff: ex.Vector): string {
        if (Math.abs(diff.x) > Math.abs(diff.y)) {
            return diff.x > 0 ? 'right' : 'left';
        } else {
            return diff.y > 0 ? 'down' : 'up';
        }
    }
    
    private getFacingDirection(): string {
        return 'down';
    }
