import { EventBus } from '../core/EventBus';
import { GameEventNames } from '../core/GameEvents';
import { ItemEntity } from '../factories/ItemFactory';
import { GameActor } from '../components/GameActor';
import { EnchantmentSystem } from './EnchantmentSystem';

export class EquipmentSystem {
    private static _instance: EquipmentSystem;
    private eventBus = EventBus.instance;

    public static get instance(): EquipmentSystem {
        if (!this._instance) {
            this._instance = new EquipmentSystem();
        }
        return this._instance;
    }

    constructor() {
        this.initialize();
    }

    private initialize() {
        this.eventBus.on('equipment:equip', (event: any) => {
            // Logic handled in EquipmentComponent for now, but we could centralize here
        });
    }

    // Centralized logic for equipment stats and effects
    // This replaces the logic that was in EnhancedEquipment class
    
    // Centralized logic for equipment stats and effects
    
    public static calculateFinalStats(item: EnhancedEquipment): any {
        const finalStats: any = { ...item.baseStats };
        
        // Apply bonus stats
        Object.keys(item.bonusStats).forEach(stat => {
            finalStats[stat] = (finalStats[stat] || 0) + (item.bonusStats[stat] || 0);
        });
        
        // Apply enchantments (only if identified or not hidden)
        item.enchantments.forEach(enchantment => {
            if (item.identified || !enchantment.hidden) {
                Object.keys(finalStats).forEach(stat => {
                    const baseValue = finalStats[stat] || 0;
                    finalStats[stat] = EnchantmentSystem.getEnchantmentEffect(enchantment, baseValue);
                });
            }
        });
        
        // Apply curses (only if identified or not hidden)
        item.curses.forEach(curse => {
            if (item.identified || !curse.hidden) {
                Object.keys(finalStats).forEach(stat => {
                    const baseValue = finalStats[stat] || 0;
                    finalStats[stat] = EnchantmentSystem.getCurseEffect(curse, baseValue);
                });
            }
        });
        
        return finalStats;
    }

    public static identifyItem(item: EnhancedEquipment): void {
        if (item.identified) return;
        
        item.identified = true;
        console.log(`${item.name} has been identified!`);
        
        if (item.enchantments.length > 0) {
            console.log('Enchantments discovered:');
            item.enchantments.forEach(ench => {
                console.log(`- ${ench.name}: ${ench.description}`);
            });
        }
        
        if (item.curses.length > 0) {
            console.log('CURSES revealed:');
            item.curses.forEach(curse => {
                console.log(`- ${curse.name}: ${curse.description}`);
                if (curse.hidden) {
                    console.log('  (This curse was hidden!)');
                }
            });
            
            // Logic for unremovable check should probably be here or in the component
            if (item.cursed) {
                item.unremovableWhenCursed = true;
                console.log('WARNING: This cursed item cannot be removed until cleansed!');
            }
        }
    }

    public static getItemDisplayName(item: EnhancedEquipment): string {
        if (!item.identified) {
            return this.getUnidentifiedItemName(item);
        }
        
        let displayName = item.name;
        
        // Add enchantment prefixes/suffixes
        if (item.enchantments.length > 0) {
            const primaryEnchant = item.enchantments[0];
            // Ideally we'd look up the enchantment definition to get the prefix/suffix
            // For now, we'll use the name as a prefix if no specific logic exists
             displayName = `${primaryEnchant.name} ${displayName}`;
        }
        
        // Add curse indicators
        if (item.curses.length > 0) {
             displayName = `Cursed ${displayName}`;
        }
        
        return displayName;
    }

    public static getUnidentifiedItemName(item: EnhancedEquipment): string {
        const tierDescriptors: Record<number, string> = {
            0: 'Worn',
            1: 'Plain', 
            2: 'Quality',
            3: 'Fine',
            4: 'Ornate',
            5: 'Magnificent'
        };
        
        // We might want to move these category names to a constant or data file
        const category = item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Item';
        
        return `${tierDescriptors[item.tier] || 'Unknown'} ${category}`;
    }

    public static getItemTooltip(item: EnhancedEquipment): string {
        let tooltip = this.getItemDisplayName(item);
        
        if (item.identified) {
            tooltip += '\n\nStats:';
            const finalStats = this.calculateFinalStats(item);
            Object.entries(finalStats).forEach(([stat, value]) => {
                if (value !== undefined && value !== 0) {
                    tooltip += `\n${stat}: ${value}`;
                }
            });
            
            if (item.enchantments.length > 0) {
                tooltip += '\n\nEnchantments:';
                item.enchantments.forEach(ench => {
                    tooltip += `\n• ${ench.name}: ${ench.description}`;
                });
            }
            
            if (item.curses.length > 0) {
                tooltip += '\n\nCurses:';
                item.curses.forEach(curse => {
                    tooltip += `\n• ${curse.name}: ${curse.description}`;
                });
                
                if (item.unremovableWhenCursed) {
                    tooltip += '\n\n⚠️ CURSED - Cannot be removed until cleansed!';
                }
            }
        } else {
            tooltip += '\n\nThis item needs to be identified to see its properties.';
            
            if (item.cursed && item.curses.some(c => !c.hidden)) {
                tooltip += '\n\n⚠️ This item radiates dark energy...';
            }
        }
        
        return tooltip;
    }
}
