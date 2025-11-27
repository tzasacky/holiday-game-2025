import { ActorComponent } from './ActorComponent';
import { Inventory } from '../items/Inventory';
import { Item } from '../items/Item';
import { GameEventNames, InventoryChangeEvent } from '../core/GameEvents';

export class InventoryComponent extends ActorComponent {
    public inventory: Inventory;
    
    constructor(actor: any, config: { size?: number } = {}) {
        super(actor);
        this.inventory = new Inventory(config.size || 20);
    }
    
    protected setupEventListeners(): void {
        // Listen for inventory commands
        this.listen('inventory:add_item', (event) => {
            if (this.isForThisActor(event)) {
                this.addItem(event.item, event.quantity);
            }
        });
        
        this.listen('inventory:remove_item', (event) => {
            if (this.isForThisActor(event)) {
                this.removeItem(event.itemId, event.quantity);
            }
        });
        
        this.listen('inventory:use_item', (event) => {
            if (this.isForThisActor(event)) {
                this.useItem(event.itemId || event.index);
            }
        });
        
        this.listen('inventory:get', (event) => {
            if (this.isForThisActor(event)) {
                this.emit('inventory:response', {
                    actorId: this.actor.entityId,
                    inventory: this.inventory,
                    items: this.inventory.items
                });
            }
        });
    }
    
    private addItem(item: Item, quantity: number = 1): boolean {
        const success = this.inventory.addItem(item, quantity);
        
        if (success) {
            this.emit(GameEventNames.InventoryChange, new InventoryChangeEvent(
                this.inventory,
                'add',
                item
            ));
            
            this.emit('inventory:item_added', {
                actorId: this.actor.entityId,
                item: item,
                quantity: quantity
            });
        }
        
        return success;
    }
    
    private removeItem(itemIdOrIndex: string | number, quantity: number = 1): Item | null {
        let item: Item | null = null;
        
        if (typeof itemIdOrIndex === 'number') {
            item = this.inventory.removeItemAt(itemIdOrIndex, quantity);
        } else {
            // Find by ID and remove
            const index = this.inventory.items.findIndex(i => i?.id === itemIdOrIndex);
            if (index >= 0) {
                item = this.inventory.removeItemAt(index, quantity);
            }
        }
        
        if (item) {
            this.emit(GameEventNames.InventoryChange, new InventoryChangeEvent(
                this.inventory,
                'remove',
                item
            ));
            
            this.emit('inventory:item_removed', {
                actorId: this.actor.entityId,
                item: item,
                quantity: quantity
            });
        }
        
        return item;
    }
    
    private useItem(itemIdOrIndex: string | number): void {
        let item: Item | null = null;
        
        if (typeof itemIdOrIndex === 'number') {
            item = this.inventory.items[itemIdOrIndex];
        } else {
            item = this.inventory.items.find(i => i?.id === itemIdOrIndex) || null;
        }
        
        if (!item) return;
        
        this.emit('item:use', {
            actorId: this.actor.entityId,
            item: item,
            user: this.actor
        });
        
        // If consumable, remove from inventory
        if (item.isConsumable) {
            this.removeItem(typeof itemIdOrIndex === 'number' ? itemIdOrIndex : item.id, 1);
        }
    }
}