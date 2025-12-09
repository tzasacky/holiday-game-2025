import { EventBus } from '../core/EventBus';
import { GameEventNames, ItemUseEvent, AbilityCastEvent, StatChangeEvent, StatModifyEvent, DamageDealtEvent, BuffApplyEvent, ConditionApplyEvent, PermanentEffectApplyEvent, WarmthChangeEvent, LogEvent, ItemDestroyedEvent } from '../core/GameEvents';
import { ItemEffect } from '../data/items';
import { AbilityID } from '../constants';
import { EffectID } from '../constants';
import { Logger } from '../core/Logger';
import { GameActor } from '../components/GameActor';
import { DataManager } from '../core/DataManager';
import { AbilityDefinition, AbilityEffect } from '../data/abilities';
import { DamageType } from '../data/mechanics';

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
        
        // Handle special items first
        if (this.handleSpecialItem(item, actor)) {
            return;
        }
        
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
        
        abilityDef.effects.forEach((effect: AbilityEffect) => { 
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
                
            case AbilityID.Identify:
                this.handleIdentify(target);
                break;
                
            case 'unwrap_gift':
                // This is handled in handleSpecialItem, but we need this case to prevent warnings
                break;
                
            default:
                Logger.warn(`[EffectExecutor] Unknown effect type: ${effect.type}`);
        }
    }
    
    private applyHeal(target: GameActor, amount: number, source?: GameActor): void {
        EventBus.instance.emit(GameEventNames.StatModify, new StatModifyEvent(
            target,
            'hp',
            amount, 
            'flat'
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
            DamageType.Physical
        ));
    }
    
    private applyWarmth(target: GameActor, amount: number): void {
        EventBus.instance.emit(GameEventNames.StatModify, new StatModifyEvent(
            target,
            'warmth',
            amount, 
            'flat'
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
    
    /**
     * Handle special items that require custom logic
     */
    private handleSpecialItem(item: any, actor: GameActor): boolean {
        switch (item.id) {
            // Gifts
            case 'wrapped_gift':
                return this.handleWrappedGift(item, actor);
                
            // Basic scrolls
            case 'scroll_of_identify':
                return this.handleScrollOfIdentify(item, actor);
            case 'scroll_of_enchantment':
                return this.handleScrollOfEnchantment(item, actor);
            case 'scroll_of_mapping':
                return this.handleScrollOfMapping(item, actor);
            case 'scroll_of_remove_curse':
                return this.handleScrollOfRemoveCurse(item, actor);
            case 'scroll_of_teleport':
                return this.handleScrollOfTeleport(item, actor);
                
            // Christmas scrolls
            case 'scroll_of_winter_warmth':
                return this.handleScrollOfWinterWarmth(item, actor);
            case 'scroll_of_christmas_spirit':
                return this.handleScrollOfChristmasSpirit(item, actor);
            case 'scroll_of_santas_blessing':
                return this.handleScrollOfSantasBlessing(item, actor);
                
            // Utility scrolls
            case 'scroll_of_nice_list':
                return this.handleScrollOfNiceList(item, actor);
            case 'scroll_of_naughty_list':
                return this.handleScrollOfNaughtyList(item, actor);
            case 'scroll_of_santas_sight':
                return this.handleScrollOfSantasSight(item, actor);
            case 'scroll_of_elven_blessing':
                return this.handleScrollOfElvenBlessing(item, actor);
            case 'scroll_of_frost':
                return this.handleScrollOfFrost(item, actor);
                
            // Advanced scrolls
            case 'scroll_of_reindeer_call':
                return this.handleScrollOfReindeerCall(item, actor);
            case 'scroll_of_jingle_all':
                return this.handleScrollOfJingleAll(item, actor);
            case 'scroll_of_mistletoe_portal':
                return this.handleScrollOfMistletoePortal(item, actor);
            case 'scroll_of_snow_storm':
                return this.handleScrollOfSnowStorm(item, actor);
            case 'scroll_of_elven_craftsmanship':
                return this.handleScrollOfElvenCraftsmanship(item, actor);
                
            // Thrown items and grenades
            case 'snowball':
            case 'packed_snowball':
            case 'iceball':
            case 'yellow_snowball':
            case 'coal_snowball':
                return this.handleThrownItem(item, actor);
            case 'cracked_ornament_grenade':
            case 'glass_ornament_grenade':
            case 'silver_ornament_grenade':
            case 'gold_ornament_grenade':
            case 'platinum_ornament_grenade':
                return this.handleOrnamentGrenade(item, actor);
                
            // Special consumables
            case 'unlabeled_potion':
                return this.handleUnlabeledPotion(item, actor);
            case 'champagne_flute':
                return this.handleChampagneFlute(item, actor);
            case 'christmas_wish_bone':
                return this.handleChristmasWishBone(item, actor);
            case 'angel_feather_revive':
                return this.handleAngelFeatherRevive(item, actor);
            case 'potion_of_cure_disease':
                return this.handlePotionOfCureDisease(item, actor);
                
            // Permanent progression
            case 'star_cookie':
                return this.handleStarCookie(item, actor);
            case 'liquid_courage':
                return this.handleLiquidCourage(item, actor);
            case 'santas_cookie':
                return this.handleSantasCookie(item, actor);
                
            default:
                return false;
        }
    }
    
    /**
     * Handle wrapped gift - transform into random item
     */
    private handleWrappedGift(item: any, actor: GameActor): boolean {
        // Import ItemFactory to create new item
        import('../factories/ItemFactory').then(({ ItemFactory }) => {
            // Define possible gift contents
            const giftItems = [
                'health_potion', 'mana_potion', 'coal', 'gold_coin',
                'scroll_of_winter_warmth', 'candy_cane', 'hot_chocolate'
            ];
            
            const randomItem = giftItems[Math.floor(Math.random() * giftItems.length)];
            const newItem = ItemFactory.instance.create(randomItem);
            
            if (newItem) {
                // Add to inventory
                const inventoryComponent = actor.getGameComponent('inventory');
                if (inventoryComponent && (inventoryComponent as any).addItemEntity) {
                    const success = (inventoryComponent as any).addItemEntity(newItem);
                    if (success) {
                        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
                            `The gift contains a ${newItem.getDisplayName()}!`,
                            'Items',
                            '#f59e0b'
                        ));
                    }
                }
            }
        });
        
        // Consume the wrapped gift
        item.count--;
        if (item.count <= 0) {
            EventBus.instance.emit(GameEventNames.ItemDestroyed, new ItemDestroyedEvent(item));
        }
        
        return true;
    }
    
    /**
     * Handle scroll of identify - needs target selection
     */
    private handleScrollOfIdentify(item: any, actor: GameActor): boolean {
        const inventoryComponent = actor.getGameComponent('inventory');
        if (!inventoryComponent) return false;
        
        // Find unidentified items
        const unidentifiedItems = (inventoryComponent as any).items.filter((i: any) => !i.identified);
        
        if (unidentifiedItems.length === 0) {
            EventBus.instance.emit(GameEventNames.Log, new LogEvent(
                'You have no unidentified items.',
                'System',
                '#888'
            ));
            return false;
        }
        
        // For now, identify the first unidentified item
        // TODO: Add UI for target selection
        const targetItem = unidentifiedItems[0];
        targetItem.identified = true;
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            `Identified: ${targetItem.getDisplayName()}`,
            'Magic',
            '#a78bfa'
        ));
        
        // Consume the scroll
        item.count--;
        if (item.count <= 0) {
            EventBus.instance.emit(GameEventNames.ItemDestroyed, new ItemDestroyedEvent(item));
        }
        
        return true;
    }
    
    /**
     * Handle identify ability - shows UI for target selection
     */
    private handleIdentify(target: GameActor): void {
        // This would typically open a targeting UI
        // For now, just provide a message
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            'Select an item to identify.',
            'Magic', 
            '#a78bfa'
        ));
    }

    /**
     * Handle scroll of enchantment - randomly enchants an item
     */
    private handleScrollOfEnchantment(item: any, actor: GameActor): boolean {
        const inventoryComponent = actor.getGameComponent('inventory');
        if (!inventoryComponent) return false;
        
        // Find items that can be enchanted (weapons, armor)
        const enchantableItems = (inventoryComponent as any).items.filter((i: any) => 
            i.definition.type === 'weapon' || i.definition.type === 'armor'
        );
        
        if (enchantableItems.length === 0) {
            EventBus.instance.emit(GameEventNames.Log, new LogEvent(
                'You have no items that can be enchanted.',
                'System',
                '#888'
            ));
            return false;
        }
        
        // Enchant random item
        const targetItem = enchantableItems[Math.floor(Math.random() * enchantableItems.length)];
        const enchantments = ['Sharp', 'Frost', 'Swift', 'Protective', 'Lucky'];
        const enchantment = enchantments[Math.floor(Math.random() * enchantments.length)];
        
        targetItem.enchantments.push(enchantment);
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            `${targetItem.getDisplayName()} has been enchanted with ${enchantment}!`,
            'Magic',
            '#a78bfa'
        ));
        
        // Consume the scroll
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle scroll of mapping - reveals entire level
     */
    private handleScrollOfMapping(item: any, actor: GameActor): boolean {
        // Emit event to reveal entire map
        EventBus.instance.emit('level:reveal_all', {});
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            'The scroll reveals the layout of the entire level!',
            'Magic',
            '#a78bfa'
        ));
        
        // Consume the scroll
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle scroll of remove curse - removes curses from items
     */
    private handleScrollOfRemoveCurse(item: any, actor: GameActor): boolean {
        const inventoryComponent = actor.getGameComponent('inventory');
        if (!inventoryComponent) return false;
        
        // Find cursed items
        const cursedItems = (inventoryComponent as any).items.filter((i: any) => 
            i.curses && i.curses.length > 0
        );
        
        if (cursedItems.length === 0) {
            EventBus.instance.emit(GameEventNames.Log, new LogEvent(
                'You have no cursed items.',
                'System',
                '#888'
            ));
            return false;
        }
        
        // Remove curses from all cursed items
        cursedItems.forEach((cursedItem: any) => {
            cursedItem.curses = [];
        });
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            `Removed curses from ${cursedItems.length} item(s)!`,
            'Magic',
            '#a78bfa'
        ));
        
        // Consume the scroll
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle scroll of teleport - teleports player to random location
     */
    private handleScrollOfTeleport(item: any, actor: GameActor): boolean {
        // Emit teleport event
        EventBus.instance.emit('actor:teleport_random', { actor });
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            'You are whisked away to another location!',
            'Magic',
            '#a78bfa'
        ));
        
        // Consume the scroll
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle thrown items - requires targeting
     */
    private handleThrownItem(item: any, actor: GameActor): boolean {
        // For now, we'll implement basic thrown item logic
        // TODO: Add proper targeting UI
        
        let damage = 0;
        let effect = '';
        
        switch (item.id) {
            case 'snowball':
                damage = 5;
                effect = 'slows target';
                break;
            case 'packed_snowball':
                damage = 8;
                effect = 'stuns target briefly';
                break;
            case 'iceball':
                damage = 12;
                effect = 'freezes target';
                break;
            case 'yellow_snowball':
                damage = 4;
                effect = 'poisons target';
                break;
            case 'coal_snowball':
                damage = 6;
                effect = 'blinds target';
                break;
        }
        
        // Find nearest enemy to target
        const level = actor.scene?.world?.queryManager?.getComponentsByType?.('GameActor');
        if (level) {
            const enemies = Array.from(level).filter((entity: any) => {
                const gameActor = entity as GameActor;
                return gameActor !== actor && 
                       !gameActor.isDead && 
                       gameActor.getGameComponent?.('combat');
            });
            
            if (enemies.length > 0) {
                const target = enemies[0] as GameActor;
                
                // Apply damage
                EventBus.instance.emit(GameEventNames.DamageDealt, new DamageDealtEvent(
                    target,
                    damage,
                    actor,
                    DamageType.Physical
                ));
                
                // Apply effect
                if (item.id === 'snowball') {
                    this.applyCondition(target, EffectID.Slow, 1, 3);
                } else if (item.id === 'packed_snowball') {
                    this.applyCondition(target, EffectID.Stun, 1, 2);
                } else if (item.id === 'iceball') {
                    this.applyCondition(target, EffectID.Freeze, 1, 4);
                } else if (item.id === 'yellow_snowball') {
                    this.applyCondition(target, EffectID.Poison, 2, 5);
                } else if (item.id === 'coal_snowball') {
                    this.applyCondition(target, EffectID.Blind, 1, 3);
                }
                
                EventBus.instance.emit(GameEventNames.Log, new LogEvent(
                    `Threw ${item.definition.name} at ${target.name} for ${damage} damage!`,
                    'Combat',
                    '#ff6b6b'
                ));
            } else {
                EventBus.instance.emit(GameEventNames.Log, new LogEvent(
                    'No valid target found.',
                    'System',
                    '#888'
                ));
                return false;
            }
        }
        
        // Consume the thrown item
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Helper to consume an item
     */
    private consumeItem(item: any): void {
        item.count--;
        if (item.count <= 0) {
            EventBus.instance.emit(GameEventNames.ItemDestroyed, new ItemDestroyedEvent(item));
        }
    }

    // === Christmas Scrolls ===
    
    /**
     * Handle scroll of winter warmth - provides major warmth restoration
     */
    private handleScrollOfWinterWarmth(item: any, actor: GameActor): boolean {
        this.applyWarmth(actor, 100);
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            'A wave of warming magic surrounds you!',
            'Magic',
            '#a78bfa'
        ));
        
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle scroll of christmas spirit - major spirit boost
     */
    private handleScrollOfChristmasSpirit(item: any, actor: GameActor): boolean {
        this.applyPermanentEffect(actor, 'christmas_spirit', 50);
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            'The joy of Christmas fills your heart!',
            'Magic',
            '#a78bfa'
        ));
        
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle scroll of santa's blessing - ultimate buff
     */
    private handleScrollOfSantasBlessing(item: any, actor: GameActor): boolean {
        // Full heal
        const healthComp = actor.getGameComponent('health');
        if (healthComp) {
            (healthComp as any).currentHP = (healthComp as any).maxHP;
        }
        
        // Buff all stats
        this.applyStatBoost(actor, 'strength', 5, 100);
        this.applyStatBoost(actor, 'defense', 5, 100);
        this.applyStatBoost(actor, 'speed', 5, 100);
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            'Santa\'s blessing empowers you with incredible strength!',
            'Magic',
            '#ffd700'
        ));
        
        this.consumeItem(item);
        return true;
    }
    
    // === Utility Scrolls ===
    
    /**
     * Handle scroll of nice list - luck and spirit boost
     */
    private handleScrollOfNiceList(item: any, actor: GameActor): boolean {
        this.applyStatBoost(actor, 'luck', 10, 50);
        this.applyPermanentEffect(actor, 'christmas_spirit', 25);
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            'You feel Santa\'s favor upon you!',
            'Magic',
            '#a78bfa'
        ));
        
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle scroll of naughty list - curse enemies
     */
    private handleScrollOfNaughtyList(item: any, actor: GameActor): boolean {
        // Find all enemies and curse them
        const level = actor.scene?.world?.queryManager?.getComponentsByType?.('GameActor');
        if (level) {
            const enemies = Array.from(level).filter((entity: any) => {
                const gameActor = entity as GameActor;
                return gameActor !== actor && 
                       !gameActor.isDead && 
                       gameActor.getGameComponent?.('combat');
            });
            
            enemies.forEach((enemy: any) => {
                this.applyCondition(enemy as GameActor, EffectID.Slow, 1, 20);
                this.applyCondition(enemy as GameActor, 'cursed', 1, 20);
            });
            
            EventBus.instance.emit(GameEventNames.Log, new LogEvent(
                `Cursed ${enemies.length} enemies with Santa's displeasure!`,
                'Magic',
                '#a78bfa'
            ));
        }
        
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle scroll of santa's sight - reveal secrets
     */
    private handleScrollOfSantasSight(item: any, actor: GameActor): boolean {
        // Reveal hidden items, secrets, and map
        EventBus.instance.emit('level:reveal_all', {});
        EventBus.instance.emit('level:reveal_secrets', {});
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            'Santa\'s all-seeing eyes reveal all secrets!',
            'Magic',
            '#a78bfa'
        ));
        
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle scroll of elven blessing - dexterity and stealth
     */
    private handleScrollOfElvenBlessing(item: any, actor: GameActor): boolean {
        this.applyStatBoost(actor, 'dexterity', 5, 50);
        this.applyPermanentEffect(actor, 'stealth', 15);
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            'Elven grace flows through you!',
            'Magic',
            '#a78bfa'
        ));
        
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle scroll of frost - freeze area effect
     */
    private handleScrollOfFrost(item: any, actor: GameActor): boolean {
        // Find all nearby enemies and freeze them
        const level = actor.scene?.world?.queryManager?.getComponentsByType?.('GameActor');
        if (level) {
            const enemies = Array.from(level).filter((entity: any) => {
                const gameActor = entity as GameActor;
                return gameActor !== actor && 
                       !gameActor.isDead && 
                       gameActor.getGameComponent?.('combat');
            });
            
            enemies.forEach((enemy: any) => {
                this.applyCondition(enemy as GameActor, EffectID.Freeze, 1, 6);
            });
            
            EventBus.instance.emit(GameEventNames.Log, new LogEvent(
                `Frost spreads, freezing ${enemies.length} enemies!`,
                'Magic',
                '#87ceeb'
            ));
        }
        
        this.consumeItem(item);
        return true;
    }
    
    // === Advanced Scrolls ===
    
    /**
     * Handle scroll of reindeer call - summon mount
     */
    private handleScrollOfReindeerCall(item: any, actor: GameActor): boolean {
        // Apply temporary mount effects
        this.applyStatBoost(actor, 'speed', 15, 100);
        this.applyPermanentEffect(actor, 'flying', 1);
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            'A magical reindeer arrives to carry you!',
            'Magic',
            '#a78bfa'
        ));
        
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle scroll of jingle all - stun all enemies
     */
    private handleScrollOfJingleAll(item: any, actor: GameActor): boolean {
        const level = actor.scene?.world?.queryManager?.getComponentsByType?.('GameActor');
        if (level) {
            const enemies = Array.from(level).filter((entity: any) => {
                const gameActor = entity as GameActor;
                return gameActor !== actor && 
                       !gameActor.isDead && 
                       gameActor.getGameComponent?.('combat');
            });
            
            enemies.forEach((enemy: any) => {
                this.applyCondition(enemy as GameActor, EffectID.Stun, 1, 3);
            });
            
            EventBus.instance.emit(GameEventNames.Log, new LogEvent(
                `The joyful jingle stuns ${enemies.length} enemies!`,
                'Magic',
                '#ffd700'
            ));
        }
        
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle scroll of mistletoe portal - create stairs
     */
    private handleScrollOfMistletoePortal(item: any, actor: GameActor): boolean {
        // Create stairs at player location
        EventBus.instance.emit('level:create_stairs', { position: actor.pos });
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            'A magical portal opens beneath a sprig of mistletoe!',
            'Magic',
            '#a78bfa'
        ));
        
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle scroll of snow storm - AoE damage and slow
     */
    private handleScrollOfSnowStorm(item: any, actor: GameActor): boolean {
        const level = actor.scene?.world?.queryManager?.getComponentsByType?.('GameActor');
        if (level) {
            const enemies = Array.from(level).filter((entity: any) => {
                const gameActor = entity as GameActor;
                return gameActor !== actor && 
                       !gameActor.isDead && 
                       gameActor.getGameComponent?.('combat');
            });
            
            enemies.forEach((enemy: any) => {
                this.applyDamage(enemy as GameActor, 12, actor);
                this.applyCondition(enemy as GameActor, EffectID.Slow, 1, 10);
            });
            
            EventBus.instance.emit(GameEventNames.Log, new LogEvent(
                `A fierce blizzard engulfs ${enemies.length} enemies!`,
                'Magic',
                '#87ceeb'
            ));
        }
        
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle scroll of elven craftsmanship - upgrade item
     */
    private handleScrollOfElvenCraftsmanship(item: any, actor: GameActor): boolean {
        const inventoryComponent = actor.getGameComponent('inventory');
        if (!inventoryComponent) return false;
        
        // Find upgradeable items (weapons, armor)
        const upgradeableItems = (inventoryComponent as any).items.filter((i: any) => 
            i.definition.type === 'weapon' || i.definition.type === 'armor'
        );
        
        if (upgradeableItems.length === 0) {
            EventBus.instance.emit(GameEventNames.Log, new LogEvent(
                'You have no items that can be upgraded.',
                'System',
                '#888'
            ));
            return false;
        }
        
        // Upgrade random item
        const targetItem = upgradeableItems[Math.floor(Math.random() * upgradeableItems.length)];
        targetItem.tier = (targetItem.tier || 1) + 1;
        
        if (targetItem.definition.stats) {
            if (targetItem.definition.stats.damage) {
                targetItem.definition.stats.damage += 2;
            }
            if (targetItem.definition.stats.defense) {
                targetItem.definition.stats.defense += 1;
            }
        }
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            `${targetItem.getDisplayName()} has been upgraded by elven magic!`,
            'Magic',
            '#a78bfa'
        ));
        
        this.consumeItem(item);
        return true;
    }
    
    // === Ornament Grenades ===
    
    /**
     * Handle ornament grenades - AoE explosive damage
     */
    private handleOrnamentGrenade(item: any, actor: GameActor): boolean {
        let damage = 6;
        let stunDuration = 0;
        
        switch (item.id) {
            case 'cracked_ornament_grenade':
                damage = 6;
                break;
            case 'glass_ornament_grenade':
                damage = 10;
                break;
            case 'silver_ornament_grenade':
                damage = 15;
                break;
            case 'gold_ornament_grenade':
                damage = 20;
                break;
            case 'platinum_ornament_grenade':
                damage = 30;
                stunDuration = 2;
                break;
        }
        
        // Apply AoE damage to all enemies
        const level = actor.scene?.world?.queryManager?.getComponentsByType?.('GameActor');
        if (level) {
            const enemies = Array.from(level).filter((entity: any) => {
                const gameActor = entity as GameActor;
                return gameActor !== actor && 
                       !gameActor.isDead && 
                       gameActor.getGameComponent?.('combat');
            });
            
            enemies.forEach((enemy: any) => {
                this.applyDamage(enemy as GameActor, damage, actor);
                if (stunDuration > 0) {
                    this.applyCondition(enemy as GameActor, EffectID.Stun, 1, stunDuration);
                }
            });
            
            EventBus.instance.emit(GameEventNames.Log, new LogEvent(
                `${item.definition.name} explodes, dealing ${damage} damage to ${enemies.length} enemies!`,
                'Combat',
                '#ff6b6b'
            ));
        }
        
        this.consumeItem(item);
        return true;
    }
    
    // === Special Consumables ===
    
    /**
     * Handle unlabeled potion - random effect
     */
    private handleUnlabeledPotion(item: any, actor: GameActor): boolean {
        const effects = [
            () => this.applyHeal(actor, 20),
            () => this.applyWarmth(actor, 30),
            () => this.applyStatBoost(actor, 'strength', 3, 20),
            () => this.applyCondition(actor, EffectID.Poison, 1, 5),
            () => this.applyCondition(actor, EffectID.Confusion, 1, 8),
            () => this.applyPermanentEffect(actor, 'luck', 5)
        ];
        
        const randomEffect = effects[Math.floor(Math.random() * effects.length)];
        randomEffect();
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            'The mysterious potion takes effect!',
            'Magic',
            '#a78bfa'
        ));
        
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle champagne flute - heal with confusion
     */
    private handleChampagneFlute(item: any, actor: GameActor): boolean {
        this.applyHeal(actor, 10);
        this.applyCondition(actor, EffectID.Confusion, 1, 5);
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            'The bubbly drink restores health but makes you dizzy!',
            'Effect',
            '#ffd700'
        ));
        
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle christmas wish bone - luck boost
     */
    private handleChristmasWishBone(item: any, actor: GameActor): boolean {
        this.applyStatBoost(actor, 'luck', 50, 100);
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            'You make a wish on the bone... luck flows through you!',
            'Magic',
            '#ffd700'
        ));
        
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle angel feather revive - auto-resurrection
     */
    private handleAngelFeatherRevive(item: any, actor: GameActor): boolean {
        // Add auto-revive effect to player
        this.applyPermanentEffect(actor, 'auto_revive', 1);
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            'Divine protection surrounds you - you will be revived upon death!',
            'Holy',
            '#ffffff'
        ));
        
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle potion of cure disease - remove all conditions
     */
    private handlePotionOfCureDisease(item: any, actor: GameActor): boolean {
        // Remove all negative conditions
        EventBus.instance.emit('actor:cure_all_conditions', { actor });
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            'All ailments and conditions are cured!',
            'Healing',
            '#00ff00'
        ));
        
        this.consumeItem(item);
        return true;
    }
    
    // === Permanent Progression Items ===
    
    /**
     * Handle star cookie - permanent max HP increase
     */
    private handleStarCookie(item: any, actor: GameActor): boolean {
        const healthComp = actor.getGameComponent('health');
        if (healthComp) {
            (healthComp as any).maxHP += 5;
            (healthComp as any).currentHP += 5;
        }
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            'Your maximum health permanently increases by 5!',
            'Progression',
            '#ffd700'
        ));
        
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle liquid courage - permanent strength increase
     */
    private handleLiquidCourage(item: any, actor: GameActor): boolean {
        this.applyPermanentEffect(actor, 'strength', 1);
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            'Your strength permanently increases!',
            'Progression',
            '#ffd700'
        ));
        
        this.consumeItem(item);
        return true;
    }
    
    /**
     * Handle santa's cookie - ultimate permanent upgrade
     */
    private handleSantasCookie(item: any, actor: GameActor): boolean {
        // Major heal
        this.applyHeal(actor, 50);
        
        // Permanent max HP increase
        const healthComp = actor.getGameComponent('health');
        if (healthComp) {
            (healthComp as any).maxHP += 10;
        }
        
        // Christmas spirit boost
        this.applyPermanentEffect(actor, 'christmas_spirit', 100);
        
        EventBus.instance.emit(GameEventNames.Log, new LogEvent(
            'Santa\'s blessed cookie grants incredible power!',
            'Legendary',
            '#ffd700'
        ));
        
        this.consumeItem(item);
        return true;
    }
}
