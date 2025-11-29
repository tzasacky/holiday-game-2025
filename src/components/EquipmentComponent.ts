import { ActorComponent } from './ActorComponent';
import { ItemType } from '../data/items';
import { ItemEntity, ItemFactory } from '../factories/ItemFactory';
import { InventoryComponent } from './InventoryComponent';
import { GameActor } from './GameActor';
import { GameEventNames, ItemEquipEvent, ItemUnequipEvent, StatsRecalculateEvent, EquipmentUnequipRequestEvent } from '../core/GameEvents';
import { Logger } from '../core/Logger';

export class EquipmentComponent extends ActorComponent {
    private slots: Map<string, ItemEntity | null> = new Map([
        ['weapon', null],
        ['armor', null],
        ['accessory', null]
    ]);

    constructor(actor: GameActor) {
        super(actor);
    }

    protected setupEventListeners(): void {
        // Removed EquipmentEquipped listener to prevent infinite loop
        // The equip() method emits this event, so listening to it and calling equip() causes recursion.

        this.listen(GameEventNames.EquipmentUnequipRequest, (event: EquipmentUnequipRequestEvent) => {
            if (this.isForThisActor(event)) {
                this.unequip(event.slot);
            }
        });
    }

    public equip(item: ItemEntity): boolean {
        const slot = this.getSlotForItem(item);
        if (!slot) return false;

        const currentItem = this.slots.get(slot);
        
        // If equipping the exact same item instance, do nothing
        if (currentItem === item) return true;

        if (currentItem) {
            // Check if item is cursed and can't be unequipped
            if (currentItem.definition.cursed) {
                Logger.warn(`Cannot unequip ${currentItem.getDisplayName()} - it's cursed!`);
                return false;
            }
            
            // Unequip current item
            // unequip() now handles adding back to inventory
            this.unequip(slot);
        }

        this.slots.set(slot, item);
        
        // Remove from inventory since it's now equipped
        const inventoryComp = this.actor.getGameComponent('inventory') as InventoryComponent;
        if (inventoryComp) {
            inventoryComp.removeItemEntity(item);
        }
        
        // Emit equipped event
        this.emit(GameEventNames.EquipmentEquipped, new ItemEquipEvent(
            this.actor,
            item,
            slot
        ));
        
        // Trigger stat recalculation
        this.emit(GameEventNames.StatsRecalculate, new StatsRecalculateEvent(
            this.actor.entityId,
            'equipment_equipped'
        ));

        return true;
    }

    public unequip(slot: string): ItemEntity | null {
        const item = this.slots.get(slot);
        if (!item) return null;

        this.slots.set(slot, null);
        
        // Add back to inventory
        const inventoryComp = this.actor.getGameComponent('inventory') as InventoryComponent;
        if (inventoryComp) {
            const added = inventoryComp.addItemEntity(item);
            if (!added) {
                Logger.warn(`Inventory full! Dropping ${item.definition.name} on ground.`);
                // Logic to drop on ground
            }
        }
        
        // Emit unequipped event (no direct method call)
        this.emit(GameEventNames.EquipmentUnequipped, new ItemUnequipEvent(
            this.actor,
            item,
            slot
        ));
        
        // Trigger stat recalculation
        this.emit(GameEventNames.StatsRecalculate, new StatsRecalculateEvent(
            this.actor.entityId,
            'equipment_unequipped'
        ));

        return item;
    }

    public getEquipment(slot: string): ItemEntity | null {
        return this.slots.get(slot) || null;
    }

    private getSlotForItem(item: ItemEntity): string | null {
        // Get slot from ItemEntity definition (data-driven approach)
        const itemType = item.definition.type;
        switch (itemType) {
            case ItemType.WEAPON:
                return 'weapon';
            case ItemType.ARMOR:
                return 'armor';
            case ItemType.ARTIFACT:
                return 'accessory';
            default:
                return null; // Item not equippable
        }
    }

    saveState(): any {
        const slotsData: Record<string, any> = {};
        this.slots.forEach((item, slot) => {
            if (item) {
                slotsData[slot] = {
                    id: item.id,
                    count: item.count,
                    identified: item.identified,
                    enchantments: item.enchantments,
                    curses: item.curses
                };
            }
        });
        return { slots: slotsData };
    }

    loadState(data: any): void {
        if (data && data.slots) {
            Object.entries(data.slots).forEach(([slot, itemData]: [string, any]) => {
                const item = ItemFactory.instance.create(itemData.id, itemData.count);
                if (item) {
                    item.identified = itemData.identified ?? true;
                    item.enchantments = itemData.enchantments || [];
                    item.curses = itemData.curses || [];
                    this.slots.set(slot, item);
                    
                    // Emit equipped event to update stats/UI
                    this.emit(GameEventNames.EquipmentEquipped, new ItemEquipEvent(
                        this.actor,
                        item,
                        slot
                    ));
                }
            });
            
            // Trigger stat recalculation
            this.emit(GameEventNames.StatsRecalculate, new StatsRecalculateEvent(
                this.actor.entityId,
                'equipment_loaded'
            ));
        }
    }
}
