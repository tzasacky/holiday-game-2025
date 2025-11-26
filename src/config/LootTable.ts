import * as ex from 'excalibur';
import { Item } from '../items/Item';

export interface LootEntry {
    itemClass: new () => Item;
    weight: number;
    minCount?: number;
    maxCount?: number;
}

export class LootTable {
    private entries: LootEntry[] = [];
    private totalWeight: number = 0;

    public add(itemClass: new () => Item, weight: number, minCount: number = 1, maxCount: number = 1) {
        this.entries.push({ itemClass, weight, minCount, maxCount });
        this.totalWeight += weight;
    }

    public roll(rng: ex.Random): Item | null {
        if (this.entries.length === 0) return null;

        let roll = rng.integer(0, this.totalWeight);
        
        for (const entry of this.entries) {
            if (roll < entry.weight) {
                const item = new entry.itemClass();
                if (item.stackable) {
                    item.count = rng.integer(entry.minCount || 1, entry.maxCount || 1);
                }
                return item;
            }
            roll -= entry.weight;
        }

        return null;
    }
}
