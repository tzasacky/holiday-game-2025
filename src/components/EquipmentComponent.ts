import { ActorComponent } from './ActorComponent';
import { EnhancedEquipment } from '../mechanics/EquipmentSystem';
import { ItemType } from '../data/items';

export class EquipmentComponent extends ActorComponent {
    private slots: Map<string, EnhancedEquipment | null> = new Map([
        ['weapon', null],
        ['armor', null],
        ['accessory', null]
    ]);

    constructor(actor: any) {
        super(actor);
    }

    protected setupEventListeners(): void {
        this.listen('equipment:equip', (event) => {
            if (this.isForThisActor(event)) {
                this.equip(event.item);
            }
        });

        this.listen('equipment:unequip', (event) => {
            if (this.isForThisActor(event)) {
                this.unequip(event.slot);
            }
        });
    }

    public equip(item: EnhancedEquipment): boolean {
        const slot = this.getSlotForItem(item);
        if (!slot) return false;

        const currentItem = this.slots.get(slot);
        if (currentItem) {
            if (!currentItem.canUnequip()) {
                console.log(`Cannot unequip ${currentItem.name}!`);
                return false;
            }
            this.unequip(slot);
        }

        this.slots.set(slot, item);
        
        // Notify system
        this.emit('equipment:equipped', {
            actorId: this.actor.entityId,
            item: item,
            slot: slot
        });

        return true;
    }

    public unequip(slot: string): EnhancedEquipment | null {
        const item = this.slots.get(slot);
        if (!item) return null;

        this.slots.set(slot, null);
        item.unequip(this.actor);

        // Notify system
        this.emit('equipment:unequipped', {
            actorId: this.actor.entityId,
            item: item,
            slot: slot
        });

        return item;
    }

    public getEquipment(slot: string): EnhancedEquipment | null {
        return this.slots.get(slot) || null;
    }

    private getSlotForItem(item: EnhancedEquipment): string | null {
        // We need to determine slot from item type.
        // EnhancedEquipment doesn't store type directly, but we can infer or look it up.
        // Ideally EnhancedEquipment should have 'type' or 'slot' property.
        // For now, we'll try to determine it.
        
        // This is a temporary solution until EnhancedEquipment has proper type info
        // We can use the DataManager lookup if we had access to it here, or rely on item properties.
        
        // Since we are refactoring EnhancedEquipment to use ItemType, we can assume it will be available or we can look it up.
        // But EnhancedEquipment is in mechanics/EquipmentSystem.ts.
        
        // Let's assume we can check the item definition or some property.
        // For now, let's use the same logic as getUnidentifiedName in EnhancedEquipment, or better, fix EnhancedEquipment first.
        
        // Actually, let's rely on a helper or just check the item ID/name/tags if available.
        // But wait, EnhancedEquipment extends Item.
        
        // Let's defer the slot logic to a helper or assume the item has a 'type' property if we update it.
        // I will update EnhancedEquipment to have a 'type' property.
        return (item as any).type === ItemType.WEAPON ? 'weapon' :
               (item as any).type === ItemType.ARMOR ? 'armor' :
               (item as any).type === ItemType.ARTIFACT ? 'accessory' : null;
    }
}
