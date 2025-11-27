import { Item } from './Item';
import { GameActor } from '../components/GameActor';
import { GeneratedLoot } from '../systems/LootSystem';
import { EquipmentSystem } from '../systems/EquipmentSystem';
import { EnchantmentType, CurseType } from '../data/enchantments';
import { DataManager } from '../core/DataManager';
import { ItemDefinition, ItemType, ItemRarity } from '../data/items';

export interface EquipmentStats {
    damage?: number;
    defense?: number;
    accuracy?: number;
    critChance?: number;
    speed?: number;
    warmth?: number;
    coldResist?: number;
    range?: number;
    [key: string]: number | undefined;
}

export class EnhancedEquipment extends Item {
    public baseStats: EquipmentStats;
    public bonusStats: EquipmentStats;
    public enchantments: any[];
    public curses: any[];
    public identified: boolean;
    public cursed: boolean;
    public type: ItemType;
    public tier: number;
    public unremovableWhenCursed: boolean;

    constructor(generatedItem: GeneratedLoot, baseItem: Item) {
        super(generatedItem.itemId, baseItem.name, baseItem.description);
        
        // Look up item definition to get type
        const itemDef = DataManager.instance.query<ItemDefinition>('item', generatedItem.itemId);
        this.type = itemDef?.type || ItemType.MISC;

        this.baseStats = this.extractBaseStats(baseItem);
        this.bonusStats = generatedItem.bonusStats || {};
        this.enchantments = generatedItem.enchantments || [];
        this.curses = generatedItem.curses || [];
        this.identified = generatedItem.identified;
        this.cursed = generatedItem.cursed;
        this.tier = generatedItem.tier;
        this.unremovableWhenCursed = false;
        
        this.updateDisplayName();
    }

    private extractBaseStats(baseItem: any): EquipmentStats {
        return {
            damage: baseItem.minDamage || baseItem.maxDamage || undefined,
            defense: baseItem.defense || undefined,
            accuracy: baseItem.accuracy || undefined,
            critChance: baseItem.critChance || undefined,
            speed: baseItem.speed || undefined,
            warmth: baseItem.warmth || undefined,
            coldResist: baseItem.coldResist || undefined,
            range: baseItem.range || undefined
        };
    }

    public identify(): void {
        EquipmentSystem.identifyItem(this);
    }

    public removeCurse(curseType: CurseType): boolean {
        const curseIndex = this.curses.findIndex(curse => curse.type === curseType);
        if (curseIndex === -1) return false;
        
        this.curses.splice(curseIndex, 1);
        
        if (this.curses.length === 0) {
            this.cursed = false;
            this.unremovableWhenCursed = false;
            console.log(`All curses have been removed from ${this.name}!`);
        }
        
        this.updateDisplayName();
        return true;
    }

    public removeAllCurses(): void {
        if (this.curses.length === 0) return;
        
        this.curses = [];
        this.cursed = false;
        this.unremovableWhenCursed = false;
        console.log(`All curses have been cleansed from ${this.name}!`);
        this.updateDisplayName();
    }

    public getFinalStats(): EquipmentStats {
        return EquipmentSystem.calculateFinalStats(this);
    }

    public getDisplayName(): string {
        return EquipmentSystem.getItemDisplayName(this);
    }

    private getUnidentifiedName(): string {
        return EquipmentSystem.getUnidentifiedItemName(this);
    }

    private updateDisplayName(): void {
        // This will be called by the display system
    }

    private isEquipped(): boolean {
        // This would check if the item is currently equipped
        // Implementation depends on how equipment tracking is handled
        return false;
    }

    public use(actor: GameActor): boolean {
        if (!this.identified && this.cursed && this.curses.some(c => c.hidden)) {
            // Equipping unidentified cursed items triggers identification
            this.identify();
            
            if (this.cursed) {
                this.unremovableWhenCursed = true;
                console.log('You feel a dark energy bind this item to you...');
            }
        }
        
        // Handle equipment logic here instead of calling abstract super.use()
        if (actor.equip(this)) {
            console.log(`${actor.name} equipped ${this.getDisplayName()}`);
            return true;
        }
        return false;
    }

    public canUnequip(): boolean {
        return !this.unremovableWhenCursed;
    }
    
    public unequip(actor: GameActor): void {
        console.log(`${actor.name} unequips ${this.getDisplayName()}`);
    }
    
    public getTooltipText(): string {
        return EquipmentSystem.getItemTooltip(this);
    }
}
