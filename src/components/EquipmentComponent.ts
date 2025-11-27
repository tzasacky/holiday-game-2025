import { ActorComponent } from './ActorComponent';
import { ItemType } from '../data/items';
import { ItemEntity } from '../factories/ItemFactory';
import { GameEventNames, ItemEquipEvent, ItemUnequipEvent, StatsRecalculateEvent, EquipmentUnequipRequestEvent } from '../core/GameEvents';
import { Logger } from '../core/Logger';

export class EquipmentComponent extends ActorComponent {
    private slots: Map<string, ItemEntity | null> = new Map([
        ['weapon', null],
        ['armor', null],
        ['accessory', null]
    ]);

    constructor(actor: any) {
        super(actor);
    }

    protected setupEventListeners(): void {
        this.listen(GameEventNames.EquipmentEquipped, (event: ItemEquipEvent) => {
            if (this.isForThisActor(event)) {
                this.equip(event.item);
            }
        });

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
        if (currentItem) {
            // Check if item is cursed and can't be unequipped
            if (currentItem.definition.cursed) {
                Logger.warn(`Cannot unequip ${currentItem.getDisplayName()} - it's cursed!`);
                return false;
            }
            this.unequip(slot);
        }

        this.slots.set(slot, item);
        
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
}
