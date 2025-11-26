import { Item } from '../items/Item';
import { Actor } from '../actors/Actor';
import { GeneratedItem } from './LootSystem';
import { EnchantmentSystem, EnchantmentType, CurseType } from './EnchantmentSystem';

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
    public tier: number;
    public unremovableWhenCursed: boolean;

    constructor(generatedItem: GeneratedItem, baseItem: Item) {
        super(generatedItem.itemId, baseItem.name, baseItem.description);
        
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
        if (this.identified) return;
        
        this.identified = true;
        console.log(`${this.name} has been identified!`);
        
        if (this.enchantments.length > 0) {
            console.log('Enchantments discovered:');
            this.enchantments.forEach(ench => {
                console.log(`- ${ench.name}: ${ench.description}`);
            });
        }
        
        if (this.curses.length > 0) {
            console.log('CURSES revealed:');
            this.curses.forEach(curse => {
                console.log(`- ${curse.name}: ${curse.description}`);
                if (curse.hidden) {
                    console.log('  (This curse was hidden!)');
                }
            });
            
            if (this.isEquipped()) {
                this.unremovableWhenCursed = true;
                console.log('WARNING: This cursed item cannot be removed until cleansed!');
            }
        }
        
        this.updateDisplayName();
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
        const finalStats: EquipmentStats = { ...this.baseStats };
        
        // Apply bonus stats
        Object.keys(this.bonusStats).forEach(stat => {
            finalStats[stat] = (finalStats[stat] || 0) + (this.bonusStats[stat] || 0);
        });
        
        // Apply enchantments (only if identified or not hidden)
        this.enchantments.forEach(enchantment => {
            if (this.identified || !enchantment.hidden) {
                Object.keys(finalStats).forEach(stat => {
                    const baseValue = finalStats[stat] || 0;
                    finalStats[stat] = EnchantmentSystem.getEnchantmentEffect(enchantment, baseValue);
                });
            }
        });
        
        // Apply curses (only if identified or not hidden)
        this.curses.forEach(curse => {
            if (this.identified || !curse.hidden) {
                Object.keys(finalStats).forEach(stat => {
                    const baseValue = finalStats[stat] || 0;
                    finalStats[stat] = EnchantmentSystem.getCurseEffect(curse, baseValue);
                });
            }
        });
        
        return finalStats;
    }

    public getDisplayName(): string {
        if (!this.identified) {
            return this.getUnidentifiedName();
        }
        
        let displayName = this.name;
        
        // Add enchantment prefixes/suffixes
        if (this.enchantments.length > 0) {
            const primaryEnchant = this.enchantments[0];
            switch (primaryEnchant.type) {
                case EnchantmentType.SHARPNESS:
                    displayName = `Sharp ${displayName}`;
                    break;
                case EnchantmentType.FROST:
                    displayName = `Frost ${displayName}`;
                    break;
                case EnchantmentType.FIRE:
                    displayName = `Flaming ${displayName}`;
                    break;
                case EnchantmentType.HOLY:
                    displayName = `Blessed ${displayName}`;
                    break;
                case EnchantmentType.PROTECTION:
                    displayName = `${displayName} of Protection`;
                    break;
                case EnchantmentType.WARMTH:
                    displayName = `${displayName} of Warmth`;
                    break;
                case EnchantmentType.REGENERATION:
                    displayName = `${displayName} of Regeneration`;
                    break;
                case EnchantmentType.CHRISTMAS_SPIRIT:
                    displayName = `Festive ${displayName}`;
                    break;
                case EnchantmentType.SANTA_BLESSED:
                    displayName = `Santa's ${displayName}`;
                    break;
            }
        }
        
        // Add curse indicators
        if (this.curses.length > 0) {
            const primaryCurse = this.curses[0];
            switch (primaryCurse.type) {
                case CurseType.DULL:
                    displayName = `Dull ${displayName}`;
                    break;
                case CurseType.VULNERABILITY:
                    displayName = `Vulnerable ${displayName}`;
                    break;
                case CurseType.BLOODTHIRSTY:
                    displayName = `Bloodthirsty ${displayName}`;
                    break;
                case CurseType.NAUGHTY_LIST:
                    displayName = `Naughty ${displayName}`;
                    break;
                case CurseType.MELTING:
                    displayName = `Melting ${displayName}`;
                    break;
                default:
                    displayName = `Cursed ${displayName}`;
            }
        }
        
        return displayName;
    }

    private getUnidentifiedName(): string {
        const tierDescriptors: Record<number, string> = {
            0: 'Worn',
            1: 'Plain', 
            2: 'Quality',
            3: 'Fine',
            4: 'Ornate',
            5: 'Magnificent'
        };
        
        const categoryNames = {
            'weapon': 'Weapon',
            'armor': 'Armor'
        };
        
        // Determine category from item type
        let category = 'Item';
        if (this.id.toString().includes('Dagger') || 
            this.id.toString().includes('Hammer') || 
            this.id.toString().includes('Wand') ||
            this.id.toString().includes('Lights')) {
            category = 'Weapon';
        } else if (this.id.toString().includes('Suit') || 
                   this.id.toString().includes('Plate') || 
                   this.id.toString().includes('Cloak') ||
                   this.id.toString().includes('Sweater')) {
            category = 'Armor';
        }
        
        return `${tierDescriptors[this.tier] || 'Unknown'} ${category}`;
    }

    private updateDisplayName(): void {
        // This will be called by the display system
    }

    private isEquipped(): boolean {
        // This would check if the item is currently equipped
        // Implementation depends on how equipment tracking is handled
        return false;
    }

    public use(actor: Actor): boolean {
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
    
    public unequip(actor: Actor): void {
        console.log(`${actor.name} unequips ${this.getDisplayName()}`);
    }
    


    public getTooltipText(): string {
        let tooltip = this.getDisplayName();
        
        if (this.identified) {
            tooltip += '\n\nStats:';
            const finalStats = this.getFinalStats();
            Object.entries(finalStats).forEach(([stat, value]) => {
                if (value !== undefined && value !== 0) {
                    tooltip += `\n${stat}: ${value}`;
                }
            });
            
            if (this.enchantments.length > 0) {
                tooltip += '\n\nEnchantments:';
                this.enchantments.forEach(ench => {
                    tooltip += `\n• ${ench.name}: ${ench.description}`;
                });
            }
            
            if (this.curses.length > 0) {
                tooltip += '\n\nCurses:';
                this.curses.forEach(curse => {
                    tooltip += `\n• ${curse.name}: ${curse.description}`;
                });
                
                if (this.unremovableWhenCursed) {
                    tooltip += '\n\n⚠️ CURSED - Cannot be removed until cleansed!';
                }
            }
        } else {
            tooltip += '\n\nThis item needs to be identified to see its properties.';
            
            if (this.cursed && this.curses.some(c => !c.hidden)) {
                tooltip += '\n\n⚠️ This item radiates dark energy...';
            }
        }
        
        return tooltip;
    }
}