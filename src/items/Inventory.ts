import * as ex from 'excalibur';
import { Item } from './Item';
import { EventBus } from '../core/EventBus';
import { GameEventNames, InventoryChangeEvent } from '../core/GameEvents';

export class Inventory extends ex.EventEmitter<any> { // Keeping generic emitter for local listeners if any, but main bus is global
    public items: (Item | null)[];
    public capacity: number;

    constructor(capacity: number = 20) {
        super();
        this.capacity = capacity;
        this.items = new Array(capacity).fill(null);
    }

    public addItem(item: Item): boolean {
        // Check for stacking
        if (item.stackable) {
            const existing = this.items.find(i => i !== null && i.name === item.name && i.stackable);
            if (existing) {
                existing.count += item.count;
                EventBus.instance.emit(GameEventNames.InventoryChange, new InventoryChangeEvent(this, 'change', item));
                return true;
            }
        }

        // Find first empty slot
        const index = this.items.indexOf(null);
        if (index === -1) return false; // Full

        this.items[index] = item;
        EventBus.instance.emit(GameEventNames.InventoryChange, new InventoryChangeEvent(this, 'add', item, index));
        return true;
    }

    public removeItem(item: Item): boolean {
        const index = this.items.indexOf(item);
        if (index === -1) return false;

        this.items[index] = null;
        EventBus.instance.emit(GameEventNames.InventoryChange, new InventoryChangeEvent(this, 'remove', item, index));
        return true;
    }

    public getItem(index: number): Item | null {
        if (index < 0 || index >= this.capacity) return null;
        return this.items[index];
    }

    public swap(index1: number, index2: number): boolean {
        if (index1 < 0 || index1 >= this.capacity || index2 < 0 || index2 >= this.capacity) return false;
        
        const temp = this.items[index1];
        this.items[index1] = this.items[index2];
        this.items[index2] = temp;
        
        EventBus.instance.emit(GameEventNames.InventoryChange, new InventoryChangeEvent(this, 'swap'));
        return true;
    }

    public drop(index: number): Item | null {
        const item = this.getItem(index);
        if (!item) return null;

        this.items[index] = null;
        EventBus.instance.emit(GameEventNames.InventoryChange, new InventoryChangeEvent(this, 'remove', item, index));
        return item;
    }

    public hasItem(itemId: string): boolean {
        return this.items.some(i => i !== null && (i.name === itemId || i.id === itemId));
    }

    public removeItemByName(name: string, count: number = 1): boolean {
        const item = this.items.find(i => i !== null && (i.name === name || i.id === name));
        if (!item) return false;

        if (item.stackable) {
            item.count -= count;
            if (item.count <= 0) {
                this.removeItem(item);
            } else {
                EventBus.instance.emit(GameEventNames.InventoryChange, new InventoryChangeEvent(this, 'change', item));
            }
            return true;
        } else {
            return this.removeItem(item);
        }
    }
}
