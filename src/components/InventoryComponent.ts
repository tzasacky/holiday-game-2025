import { ActorComponent } from './ActorComponent';
import { ItemEntity, ItemFactory } from '../factories/ItemFactory';
import { GameEventNames, InventoryAddStartingItemsEvent, ItemPickupAttemptEvent, ItemPickupResultEvent, InventoryChangeEvent } from '../core/GameEvents';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { GameActor } from './GameActor';
import { ItemDestroyedEvent } from '../core/GameEvents';

export class InventoryComponent extends ActorComponent {
    public items: ItemEntity[] = [];
    public maxSize: number;
    
    constructor(actor: GameActor, config: { size?: number } = {}) {
        super(actor);
        this.maxSize = config.size || 20;
    }
    
    protected setupEventListeners(): void {
        // Listen for starting items
        this.listen(GameEventNames.InventoryAddStartingItems, (event: InventoryAddStartingItemsEvent) => {
            if (this.isForThisActor(event)) {
                this.addStartingItems(event.items);
            }
        });

        // Listen for item pickup attempts
        this.listen(GameEventNames.ItemPickupAttempt, (event: ItemPickupAttemptEvent) => {
            Logger.info(`[InventoryComponent] Received ItemPickupAttempt for ${event.item.getDisplayName()} by ${event.actor.name}`);
            if (this.isForThisActor(event)) {
                Logger.info(`[InventoryComponent] Event is for this actor (${this.actor.name}), handling pickup`);
                this.handlePickupAttempt(event.item, event.actor.pos); // Assuming actor pos is close enough to worldPosition
            } else {
                Logger.info(`[InventoryComponent] Event not for this actor (${this.actor.name} vs ${event.actor.name})`);
            }
        });

        // Listen for item destruction (when consumables are used up)
        this.listen(GameEventNames.ItemDestroyed, (event: ItemDestroyedEvent) => {
            Logger.info(`[InventoryComponent] Received ItemDestroyed for ${event.item?.getDisplayName()}`);
            this.removeItemEntity(event.item);
        });
        
        // Listen for inventory commands
        // TODO: Add these events to GameEvents.ts if they are needed externally
        // For now, commenting out or we need to define them.
        /*
        this.listen('inventory:add_item', (event) => {
            if (this.isForThisActor(event)) {
                this.addItem(event.itemId, event.quantity || 1);
            }
        });
        
        this.listen('inventory:remove_item', (event) => {
            if (this.isForThisActor(event)) {
                this.removeItem(event.itemId, event.quantity || 1);
            }
        });
        
        this.listen('inventory:use_item', (event) => {
            if (this.isForThisActor(event)) {
                this.useItem(event.itemId || event.index);
            }
        });
        */
    }

    public addStartingItems(itemIds: string[]): void {
        Logger.info(`[InventoryComponent] Adding starting items to ${this.actor.name}:`, itemIds);
        
        for (const itemId of itemIds) {
            const item = ItemFactory.instance.create(itemId);
            if (item) {
                const added = this.addItemEntity(item);
                if (added) {
                    Logger.debug(`[InventoryComponent] Added starting item: ${item.getDisplayName()}`);
                } else {
                    Logger.warn(`[InventoryComponent] Failed to add starting item: ${item.getDisplayName()} (inventory full?)`);
                }
            } else {
                Logger.error(`[InventoryComponent] Failed to create starting item: ${itemId}`);
            }
        }

        this.emitInventoryChanged();
    }

    public handlePickupAttempt(itemEntity: ItemEntity, worldPosition: any): void {
        Logger.info(`[InventoryComponent] Attempting to add ${itemEntity.getDisplayName()} to ${this.actor.name}'s inventory`);
        const success = this.addItemEntity(itemEntity);
        
        Logger.info(`[InventoryComponent] Pickup ${success ? 'successful' : 'failed'} - emitting ItemPickupResult`);
        // Emit on global EventBus so WorldItemEntity can hear it
        EventBus.instance.emit(GameEventNames.ItemPickupResult, new ItemPickupResultEvent(
            this.actor,
            itemEntity,
            success,
            success ? 'Success' : 'Inventory full'
        ));

        if (success) {
            this.emitInventoryChanged();
        }
    }
    
    public addItem(itemId: string, quantity: number = 1): boolean {
        const item = ItemFactory.instance.create(itemId, quantity);
        if (!item) {
            Logger.error(`[InventoryComponent] Failed to create item: ${itemId}`);
            return false;
        }
        
        const success = this.addItemEntity(item);
        if (success) {
            this.emitInventoryChanged();
        }
        
        return success;
    }

    public addItemEntity(item: ItemEntity): boolean {
        // Check if inventory is full
        if (this.items.length >= this.maxSize) {
            return false;
        }

        // Try to stack with existing items if stackable
        if (item.definition.stackable) {
            const existingItem = this.items.find(i => 
                i.id === item.id && 
                i.count < (item.definition.maxStack || 1)
            );
            
            if (existingItem) {
                const maxCanAdd = (item.definition.maxStack || 1) - existingItem.count;
                const amountToAdd = Math.min(item.count, maxCanAdd);
                
                existingItem.count += amountToAdd;
                item.count -= amountToAdd;
                
                // If we added all, we're done
                if (item.count <= 0) {
                    return true;
                }
                // Otherwise, fall through to add a new stack
            }
        }

        // Add as new item
        this.items.push(item);
        return true;
    }
    
    public removeItem(itemId: string, quantity: number = 1): boolean {
        const itemIndex = this.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return false;
        
        const item = this.items[itemIndex];
        
        if (item.count <= quantity) {
            // Remove entire stack
            this.items.splice(itemIndex, 1);
        } else {
            // Reduce count
            item.count -= quantity;
        }
        
        this.emitInventoryChanged();
        return true;
    }

    public removeItemEntity(itemEntity: ItemEntity): boolean {
        const itemIndex = this.items.findIndex(item => item === itemEntity);
        if (itemIndex === -1) {
            Logger.warn(`[InventoryComponent] Attempted to remove item entity not in inventory: ${itemEntity?.getDisplayName()}`);
            return false;
        }
        
        Logger.info(`[InventoryComponent] Removing ${itemEntity.getDisplayName()} from ${this.actor.name}'s inventory`);
        this.items.splice(itemIndex, 1);
        this.emitInventoryChanged();
        return true;
    }
    
    public useItem(itemIdOrIndex: string | number): boolean {
        let item: ItemEntity | undefined;
        
        if (typeof itemIdOrIndex === 'string') {
            item = this.items.find(i => i.id === itemIdOrIndex);
        } else {
            item = this.items[itemIdOrIndex];
        }
        
        if (!item) {
            Logger.warn(`[InventoryComponent] Item not found for use: ${itemIdOrIndex}`);
            return false;
        }
        
        // Use the item (this will emit events for EffectExecutor)
        item.use(this.actor);
        
        // Remove consumed items
        if (item.count <= 0) {
            const index = this.items.indexOf(item);
            if (index !== -1) {
                this.items.splice(index, 1);
            }
        }
        
        this.emitInventoryChanged();
        return true;
    }

    public getItems(): ItemEntity[] {
        return [...this.items]; // Return copy to prevent external modification
    }

    public getItemCount(itemId: string): number {
        return this.items
            .filter(item => item.id === itemId)
            .reduce((total, item) => total + item.count, 0);
    }

    public hasItem(itemId: string): boolean {
        return this.items.some(item => item.id === itemId);
    }

    public getItemByIndex(index: number): ItemEntity | null {
        return this.items[index] || null;
    }

    public removeItemAtIndex(index: number): ItemEntity | null {
        if (index >= 0 && index < this.items.length) {
            const item = this.items.splice(index, 1)[0];
            this.emitInventoryChanged();
            return item;
        }
        return null;
    }

    public setItemAtIndex(index: number, item: ItemEntity): void {
        if (index >= 0 && index < this.maxSize) {
            // Extend array if necessary
            while (this.items.length <= index) {
                this.items.push(null as unknown as ItemEntity); // TODO: Fix nullability in items array
            }
            this.items[index] = item;
            this.emitInventoryChanged();
        }
    }

    public getSize(): number {
        return this.items.length;
    }

    public getMaxSize(): number {
        return this.maxSize;
    }

    public isFull(): boolean {
        return this.items.length >= this.maxSize;
    }

    private emitInventoryChanged(): void {
        this.emit(GameEventNames.InventoryChange, new InventoryChangeEvent(
            this, // Inventory object (this component acts as inventory)
            'change'
        ));
    }

    saveState(): any {
        return {
            maxSize: this.maxSize,
            items: this.items.map(item => ({
                id: item.id,
                count: item.count,
                identified: item.identified,
                enchantments: item.enchantments,
                curses: item.curses
            }))
        };
    }

    loadState(data: any): void {
        if (data) {
            this.maxSize = data.maxSize || this.maxSize;
            this.items = []; // Clear existing items
            
            if (data.items && Array.isArray(data.items)) {
                data.items.forEach((itemData: any) => {
                    const item = ItemFactory.instance.create(itemData.id, itemData.count);
                    if (item) {
                        item.identified = itemData.identified ?? true;
                        item.enchantments = itemData.enchantments || [];
                        item.curses = itemData.curses || [];
                        this.items.push(item);
                    }
                });
            }
            this.emitInventoryChanged();
        }
    }
}