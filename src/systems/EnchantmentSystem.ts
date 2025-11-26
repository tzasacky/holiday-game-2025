import { DataManager } from '../core/DataManager';
import { 
    EnchantmentType, 
    CurseType, 
    Enchantment, 
    Curse 
} from '../data/enchantments';

export class EnchantmentSystem {
    
    static generateEnchantment(itemTier: number, isWeapon: boolean): Enchantment | null {
        // Higher tier = more likely to have enchantments
        const enchantChance = Math.min(0.8, itemTier * 0.15);
        if (Math.random() > enchantChance) return null;

        const availableEnchantments = Object.values(EnchantmentType).filter(type => {
            if (isWeapon) {
                return ![EnchantmentType.PROTECTION, EnchantmentType.WARMTH, 
                        EnchantmentType.STEALTH, EnchantmentType.SPEED].includes(type);
            } else {
                return ![EnchantmentType.SHARPNESS, EnchantmentType.FROST, 
                        EnchantmentType.VAMPIRIC, EnchantmentType.PENETRATING].includes(type);
            }
        });

        const weights = availableEnchantments.map(type => {
            const data = DataManager.instance.query<any>('enchantment', type);
            return data ? data.rarityWeight : 0;
        });

        const selectedType = this.weightedRandom(availableEnchantments, weights);
        const data = DataManager.instance.query<any>('enchantment', selectedType);
        
        if (!data) return null;

        const power = Math.min(5, Math.floor(Math.random() * 3) + Math.max(1, itemTier - 2));
        
        return {
            type: selectedType,
            power,
            name: data.name,
            description: data.description(power)
        };
    }

    static generateCurse(itemTier: number): Curse | null {
        // Lower tier = more likely to be cursed, but high tier can have hidden curses
        let curseChance = Math.max(0.05, 0.4 - (itemTier * 0.08));
        if (itemTier >= 4) curseChance += 0.1; // Powerful items sometimes have hidden prices
        
        if (Math.random() > curseChance) return null;

        const availableCurses = Object.values(CurseType);
        const weights = availableCurses.map(type => {
            const data = DataManager.instance.query<any>('curse', type);
            return data ? data.rarityWeight : 0;
        });

        const selectedType = this.weightedRandom(availableCurses, weights);
        const data = DataManager.instance.query<any>('curse', selectedType);

        if (!data) return null;
        
        const severity = Math.floor(Math.random() * 3) + Math.max(1, 4 - itemTier);
        
        return {
            type: selectedType,
            severity,
            name: data.name,
            description: data.description(severity),
            hidden: data.hidden
        };
    }

    private static weightedRandom<T>(items: T[], weights: number[]): T {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        
        return items[items.length - 1];
    }

    static getEnchantmentEffect(enchantment: Enchantment, baseValue: number): number {
        switch (enchantment.type) {
            case EnchantmentType.SHARPNESS:
                return baseValue + (enchantment.power * 2);
            case EnchantmentType.PROTECTION:
                return baseValue + (enchantment.power * 2);
            case EnchantmentType.WARMTH:
                return baseValue + (enchantment.power * 5);
            default:
                return baseValue;
        }
    }

    static getCurseEffect(curse: Curse, baseValue: number): number {
        switch (curse.type) {
            case CurseType.DULL:
                return Math.max(1, baseValue - (curse.severity * 2));
            case CurseType.VULNERABILITY:
                return Math.max(0, baseValue - (curse.severity * 2));
            case CurseType.BAD_LUCK:
                return baseValue - (curse.severity * 3);
            default:
                return baseValue;
        }
    }
}
