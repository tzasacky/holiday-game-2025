import { Item } from './Item';
import { EnhancedEquipment } from '../mechanics/EquipmentSystem';
import { WeakSword } from '../content/items/weapons/WeakSword';
import { CandyCaneSpear } from '../content/items/weapons/CandyCaneSpear';
import { HotCocoa } from '../content/items/consumables/HotCocoa';
import { SerializedItem } from '../core/GameState';

export class ItemFactory {
    // Registry of item classes
    private static itemRegistry: { [key: string]: new () => Item } = {
        'Weak Sword': WeakSword,
        'Candy Cane Spear': CandyCaneSpear,
        'Hot Cocoa': HotCocoa
        // Add other items here
    };

    public static createItem(serialized: SerializedItem): Item | null {
        const ItemClass = this.itemRegistry[serialized.name];
        
        if (!ItemClass) {
            console.warn(`[ItemFactory] Unknown item type: ${serialized.name}`);
            // Fallback for generic items if needed, or return null
            return null;
        }

        const item = new ItemClass();
        
        // Restore base properties
        item.count = serialized.count;
        
        // Restore EnhancedEquipment properties
        if (item instanceof EnhancedEquipment && serialized.stats) {
            // Re-apply stats, enchantments, etc.
            // Note: EnhancedEquipment might need methods to set these directly
            // For now, we assume the base class constructor sets defaults, 
            // and we might need to override if they were modified.
            
            if (serialized.identified !== undefined) item.identified = serialized.identified;
            if (serialized.enchantments) item.enchantments = serialized.enchantments;
            if (serialized.curses) item.curses = serialized.curses;
            
            // If stats were dynamic (e.g. upgrades), we'd need to apply them here.
            // For MVP, we assume base stats from class are sufficient unless modified.
        }

        return item;
    }
    
    public static registerItem(name: string, itemClass: new () => Item) {
        this.itemRegistry[name] = itemClass;
    }
}
