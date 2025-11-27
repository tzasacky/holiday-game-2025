import { EventBus } from '../core/EventBus';
import { GameEventNames } from '../core/GameEvents';
import { ItemEntity } from '../factories/ItemFactory';
import { GameActor } from '../components/GameActor';
import { EnchantmentSystem } from './EnchantmentSystem';
import { Logger } from '../core/Logger';

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
    
    public static calculateFinalStats(item: ItemEntity): any {
        const finalStats: any = { ...item.definition.stats };
        
        // Apply enchantments (only if identified)
        if (item.identified && item.enchantments.length > 0) {
            item.enchantments.forEach((enchantment: any) => {
                Object.keys(finalStats).forEach(stat => {
                    const baseValue = finalStats[stat] || 0;
                    finalStats[stat] = EnchantmentSystem.getEnchantmentEffect(enchantment, baseValue);
                });
            });
        }
        
        // Apply curses (only if identified)
        if (item.identified && item.curses.length > 0) {
            item.curses.forEach((curse: any) => {
                Object.keys(finalStats).forEach(stat => {
                    const baseValue = finalStats[stat] || 0;
                    finalStats[stat] = EnchantmentSystem.getCurseEffect(curse, baseValue);
                });
            });
        }
        
        return finalStats;
    }

    public static identifyItem(item: ItemEntity): void {
        if (item.identified) return;
        
        item.identified = true;
        Logger.info(`${item.definition.name} has been identified!`);
        
        if (item.enchantments.length > 0) {
            Logger.info('Enchantments discovered:');
            item.enchantments.forEach((ench: any) => {
                Logger.info(`- ${ench.name}: ${ench.description}`);
            });
        }
        
        if (item.curses.length > 0) {
            Logger.info('CURSES revealed:');
            item.curses.forEach((curse: any) => {
                Logger.info(`- ${curse.name}: ${curse.description}`);
            });
            Logger.warn('WARNING: This cursed item may have negative effects!');
        }
    }

    public static getItemDisplayName(item: ItemEntity): string {
        if (!item.identified) {
            return this.getUnidentifiedItemName(item);
        }
        
        let displayName = item.definition.name;
        
        // Add enchantment prefixes/suffixes
        if (item.enchantments.length > 0) {
            const primaryEnchant = item.enchantments[0] as any;
            displayName = `${primaryEnchant.name} ${displayName}`;
        }
        
        // Add curse indicators
        if (item.curses.length > 0) {
             displayName = `Cursed ${displayName}`;
        }
        
        return displayName;
    }

    public static getUnidentifiedItemName(item: ItemEntity): string {
        const rarityDescriptors: Record<string, string> = {
            'common': 'Plain',
            'uncommon': 'Quality', 
            'rare': 'Fine',
            'epic': 'Ornate',
            'legendary': 'Magnificent',
            'unique': 'Mysterious'
        };
        
        const category = item.definition.type ? item.definition.type.charAt(0).toUpperCase() + item.definition.type.slice(1) : 'Item';
        
        return `${rarityDescriptors[item.definition.rarity] || 'Unknown'} ${category}`;
    }

    public static getItemTooltip(item: ItemEntity): string {
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
                item.enchantments.forEach((ench: any) => {
                    tooltip += `\n• ${ench.name}: ${ench.description}`;
                });
            }
            
            if (item.curses.length > 0) {
                tooltip += '\n\nCurses:';
                item.curses.forEach((curse: any) => {
                    tooltip += `\n• ${curse.name}: ${curse.description}`;
                });
                tooltip += '\n\n⚠️ CURSED - May have negative effects!';
            }
        } else {
            tooltip += '\n\nThis item needs to be identified to see its properties.';
            
            if (item.curses.length > 0) {
                tooltip += '\n\n⚠️ This item radiates dark energy...';
            }
        }
        
        return tooltip;
    }
}
