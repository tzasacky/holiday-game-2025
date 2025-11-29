import { ItemDefinition, ItemDefinitions, ItemType } from '../data/items';
import { DataManager } from '../core/DataManager';
import { EventBus } from '../core/EventBus';
import * as ex from 'excalibur';
import { GraphicsManager } from '../data/graphics';
import { Logger } from '../core/Logger';
import { RegistryKey } from '../constants/RegistryKeys';
import { GameEventNames, ItemUseEvent, ItemDestroyedEvent, ItemCreatedEvent } from '../core/GameEvents';
import { GameActor } from '../components/GameActor';

/**
 * ItemEntity - Data container for items (no logic)
 * All item behavior is event-driven via EventBus
 */
export class ItemEntity {
    public id: string;
    public definition: ItemDefinition;
    public count: number = 1;
    public identified: boolean = true;
    public enchantments: any[] = [];
    public curses: any[] = [];
    public gridPos?: ex.Vector;
    public bonusStats?: Record<string, number>;
    public tier: number = 1;
    
    constructor(defId: string, count: number = 1) {
        const def = DataManager.instance.query<ItemDefinition>(RegistryKey.ITEM, defId);
        if (!def) {
            throw new Error(`[ItemEntity] Unknown item definition: ${defId}`);
        }
        
        this.id = defId;
        this.definition = def;
        this.count = count;
        
        // Artifacts and rare items start unidentified
        if (def.rarity === 'rare' || def.rarity === 'epic' || def.rarity === 'legendary') {
            this.identified = false;
        }
    }
    
    /**
     * Use the item - emits event for EffectExecutor to handle
     */
    use(user: GameActor): void {
        console.log(`[ItemEntity] use() called for ${this.definition.name} (type: ${this.definition.type})`);
        Logger.debug(`[ItemEntity] Using ${this.definition.name}`);
        
        // Weapons and equipment should be equipped
        if (this.definition.type === ItemType.WEAPON || this.definition.type === ItemType.ARMOR) {
            console.log(`[ItemEntity] Equipping ${this.definition.name}`);
            
            const equipmentComp = user.getGameComponent('equipment');
            const inventoryComp = user.getGameComponent('inventory');
            
            if (!equipmentComp || !inventoryComp) {
                console.warn(`[ItemEntity] User missing equipment or inventory component`);
                return;
            }
            
            // Equip the item - EquipmentComponent.equip() will auto-determine slot and handle swapping
            const success = (equipmentComp as any).equip?.(this);
            
            if (success) {
                console.log(`[ItemEntity] Successfully equipped ${this.definition.name}`);
                // Don't remove from inventory here - let the equipment system handle it
            } else {
                console.warn(`[ItemEntity] Failed to equip ${this.definition.name}`);
            }
            return;
        }
        
        // Only consumables are destroyed on use
        if (this.definition.type === ItemType.CONSUMABLE) {
            console.log(`[ItemEntity] Consumable item, reducing count from ${this.count}`);
            this.count--;
            if (this.count <= 0) {
                console.log(`[ItemEntity] Item depleted, emitting ItemDestroyed event`);
                EventBus.instance.emit(GameEventNames.ItemDestroyed, new ItemDestroyedEvent(this));
            }
        }

        // Emit use event for effects (after count update so UI reflects it)
        Logger.info(`[ItemEntity] Emitting ItemUse event for ${this.definition.name}, new count: ${this.count}`);
        EventBus.instance.emit(GameEventNames.ItemUse, new ItemUseEvent(user, this));
    }
    
    /**
     * Get sprite for rendering
     */
    getSprite(): ex.Graphic | null {
        return GraphicsManager.instance.getItemSprite(this.id);
    }
    
    /**
     * Get display name (with enchantments/curses if identified)
     */
    getDisplayName(): string {
        if (!this.identified) {
            return `Unidentified ${this.definition.type}`;
        }
        
        let name = this.definition.name;
        
        if (this.enchantments.length > 0) {
            const enchantment = this.enchantments[0];
            name = `${enchantment.name || enchantment} ${name}`;
        }
        
        if (this.curses.length > 0) {
            name = `Cursed ${name}`;
        }
        
        return name;
    }
    
    /**
     * Clone this item (for splitting stacks)
     */
    clone(count: number = this.count): ItemEntity {
        const item = new ItemEntity(this.id, count);
        item.identified = this.identified;
        item.enchantments = [...this.enchantments];
        item.curses = [...this.curses];
        item.bonusStats = this.bonusStats ? { ...this.bonusStats } : undefined;
        item.tier = this.tier;
        return item;
    }
}

/**
 * ItemFactory - Creates items from definitions
 * Clean public API for game code
 */
export class ItemFactory {
    private static _instance: ItemFactory;
    
    private constructor() {}
    
    public static get instance(): ItemFactory {
        if (!this._instance) {
            this._instance = new ItemFactory();
        }
        return this._instance;
    }
    
    /**
     * Create an item from a definition ID
     */
    create(defId: string, count: number = 1): ItemEntity | null {
        try {
            const item = new ItemEntity(defId, count);
            Logger.debug(`[ItemFactory] Created ${item.definition.name} x${count}`);
            
            EventBus.instance.emit(GameEventNames.ItemCreated, new ItemCreatedEvent(item));
            
            return item;
        } catch (error) {
            Logger.error(`[ItemFactory] Failed to create item ${defId}:`, error);
            return null;
        }
    }

    /**
     * Create an item from GeneratedLoot data
     */
    createFromLoot(loot: any): ItemEntity | null {
        const item = this.create(loot.itemId, loot.quantity);
        if (item) {
            item.identified = loot.identified;
            item.enchantments = loot.enchantments || [];
            item.curses = loot.curses || [];
            item.bonusStats = loot.bonusStats;
            item.tier = loot.tier || 1;
        }
        return item;
    }
    
    /**
     * Create item at a specific position (for world drops)
     */
    createAt(defId: string, pos: ex.Vector, count: number = 1): ItemEntity | null {
        const item = this.create(defId, count);
        if (item) {
            item.gridPos = pos;
        }
        return item;
    }
    
    /**
     * Deserialize item from save data
     */
    fromSaveData(data: any): ItemEntity | null {
        const item = this.create(data.id, data.count);
        if (item) {
            item.identified = data.identified ?? true;
            item.enchantments = data.enchantments ?? [];
            item.curses = data.curses ?? [];
            item.bonusStats = data.bonusStats;
            item.tier = data.tier || 1;
            if (data.gridPos) {
                item.gridPos = ex.vec(data.gridPos.x, data.gridPos.y);
            }
        }
        return item;
    }
    
    /**
     * Get all item definitions of a specific type
     */
    getItemsByType(type: ItemType): ItemDefinition[] {
        return Object.values(ItemDefinitions).filter(def => def.type === type);
    }
    
    /**
     * Get random item by rarity
     */
    getRandomByRarity(rarity: string): ItemEntity | null {
        const items = Object.values(ItemDefinitions).filter(def => def.rarity === rarity);
        if (items.length === 0) return null;
        
        const randomDef = items[Math.floor(Math.random() * items.length)];
        return this.create(randomDef.id);
    }
}
