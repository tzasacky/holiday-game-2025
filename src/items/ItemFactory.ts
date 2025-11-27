import { ItemDefinition, ItemDefinitions, ItemType } from '../data/items';
import { DataManager } from '../core/DataManager';
import { EventBus } from '../core/EventBus';
import * as ex from 'excalibur';

/**
 * ItemEntity - Data container for items (no logic)
 * All item behavior is event-driven via EventBus
 */
export class ItemEntity {
    public id: string;
    public definition: ItemDefinition;
    public count: number = 1;
    public identified: boolean = true;
    public enchantments: string[] = [];
    public curses: string[] = [];
    public gridPos?: ex.Vector;
    
    constructor(defId: string, count: number = 1) {
        const def = DataManager.instance.query<ItemDefinition>('item', defId);
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
    use(userId: string): void {
        console.log(`[ItemEntity] Using ${this.definition.name}`);
        
        EventBus.instance.emit('item:use' as any, {
            itemId: this.id,
            userId: userId,
            effects: this.definition.effects,
            definition: this.definition
        });
        
        // Consumables are destroyed on use
        if (this.definition.type === ItemType.CONSUMABLE) {
            this.count--;
            if (this.count <= 0) {
                EventBus.instance.emit('item:destroyed' as any, {
                    itemId: this.id
                });
            }
        }
    }
    
    /**
     * Get sprite for rendering
     */
    getSprite(): ex.Graphic | null {
        const { GraphicsManager } = require('../data/graphics');
        return GraphicsManager.instance.getItemSprite(this.definition.graphics.spriteIndex);
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
            name = `${this.enchantments[0]} ${name}`;
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
            console.log(`[ItemFactory] Created ${item.definition.name} x${count}`);
            
            EventBus.instance.emit('item:created' as any, {
                itemId: defId,
                count: count
            });
            
            return item;
        } catch (error) {
            console.error(`[ItemFactory] Failed to create item ${defId}:`, error);
            return null;
        }
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
