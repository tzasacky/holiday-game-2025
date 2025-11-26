import { ItemID } from '../content/items/ItemIDs';
import { LootTable } from '../config/LootTable';
import { EnchantmentSystem, EnchantmentType, CurseType } from './EnchantmentSystem';

export enum LootTier {
    JUNK = 0,      // Broken/Melting items
    COMMON = 1,    // Basic functional items
    UNCOMMON = 2,  // Decent quality
    RARE = 3,      // Good quality with potential enchantments
    EPIC = 4,      // High quality with likely enchantments
    LEGENDARY = 5  // Highest tier with guaranteed enchantments
}

export interface LootTableEntry {
    itemId: ItemID;
    tier: LootTier;
    weight: number;
    minFloor: number;
    maxFloor?: number;
    biomeRestriction?: string[];
    category: 'weapon' | 'armor' | 'consumable' | 'artifact' | 'misc';
}

export interface GeneratedItem {
    itemId: ItemID;
    tier: LootTier;
    identified: boolean;
    cursed: boolean;
    enchantments: any[];
    curses: any[];
    bonusStats?: Record<string, number>;
    displayName: string;
}

export class LootSystem {
    private static readonly LOOT_TABLE: LootTableEntry[] = [
        // WEAPONS - Junk Tier
        { itemId: ItemID.MeltingIcicleDagger, tier: LootTier.JUNK, weight: 10, minFloor: 1, maxFloor: 3, category: 'weapon' },
        { itemId: ItemID.BrokenToyHammer, tier: LootTier.JUNK, weight: 10, minFloor: 1, maxFloor: 4, category: 'weapon' },
        { itemId: ItemID.TangledChristmasLights, tier: LootTier.JUNK, weight: 8, minFloor: 1, maxFloor: 3, category: 'weapon' },
        
        // WEAPONS - Common Tier
        { itemId: ItemID.FrostyIcicleDagger, tier: LootTier.COMMON, weight: 15, minFloor: 2, maxFloor: 6, category: 'weapon' },
        { itemId: ItemID.WoodenToyHammer, tier: LootTier.COMMON, weight: 15, minFloor: 2, maxFloor: 6, category: 'weapon' },
        { itemId: ItemID.OldChristmasLights, tier: LootTier.COMMON, weight: 12, minFloor: 2, maxFloor: 5, category: 'weapon' },
        { itemId: ItemID.SparklerWand, tier: LootTier.COMMON, weight: 10, minFloor: 1, maxFloor: 5, category: 'weapon' },
        
        // WEAPONS - Uncommon Tier
        { itemId: ItemID.SharpIcicleDagger, tier: LootTier.UNCOMMON, weight: 12, minFloor: 4, maxFloor: 10, category: 'weapon' },
        { itemId: ItemID.SteelToyHammer, tier: LootTier.UNCOMMON, weight: 12, minFloor: 4, maxFloor: 10, category: 'weapon' },
        { itemId: ItemID.BrightChristmasLights, tier: LootTier.UNCOMMON, weight: 10, minFloor: 4, maxFloor: 8, category: 'weapon' },
        { itemId: ItemID.CandlestickWand, tier: LootTier.UNCOMMON, weight: 8, minFloor: 3, maxFloor: 8, category: 'weapon' },
        { itemId: ItemID.HollyWand, tier: LootTier.UNCOMMON, weight: 8, minFloor: 3, maxFloor: 8, category: 'weapon' },
        
        // WEAPONS - Rare Tier
        { itemId: ItemID.PerfectIcicleDagger, tier: LootTier.RARE, weight: 6, minFloor: 7, category: 'weapon' },
        { itemId: ItemID.EnchantedToyHammer, tier: LootTier.RARE, weight: 6, minFloor: 7, category: 'weapon' },
        { itemId: ItemID.LEDChristmasLights, tier: LootTier.RARE, weight: 5, minFloor: 6, category: 'weapon' },
        { itemId: ItemID.ChristmasTreeStaff, tier: LootTier.RARE, weight: 4, minFloor: 8, category: 'weapon' },
        { itemId: ItemID.FireworksWand, tier: LootTier.RARE, weight: 4, minFloor: 8, category: 'weapon' },
        
        // WEAPONS - Epic/Legendary Tier
        { itemId: ItemID.NutcrackerHammer, tier: LootTier.EPIC, weight: 2, minFloor: 12, category: 'weapon' },
        { itemId: ItemID.MagicalChristmasLights, tier: LootTier.EPIC, weight: 2, minFloor: 10, category: 'weapon' },
        { itemId: ItemID.GrandFinaleWand, tier: LootTier.LEGENDARY, weight: 1, minFloor: 15, category: 'weapon' },
        
        // ARMOR - Junk to Common
        { itemId: ItemID.TornSantaSuit, tier: LootTier.JUNK, weight: 10, minFloor: 1, maxFloor: 4, category: 'armor' },
        { itemId: ItemID.MeltingIcePlate, tier: LootTier.JUNK, weight: 8, minFloor: 1, maxFloor: 3, category: 'armor' },
        { itemId: ItemID.TatteredElfCloak, tier: LootTier.COMMON, weight: 12, minFloor: 2, maxFloor: 6, category: 'armor' },
        { itemId: ItemID.CozySweater, tier: LootTier.COMMON, weight: 15, minFloor: 1, maxFloor: 8, category: 'armor' },
        
        // ARMOR - Uncommon to Rare
        { itemId: ItemID.ClassicSantaSuit, tier: LootTier.UNCOMMON, weight: 10, minFloor: 5, maxFloor: 12, category: 'armor' },
        { itemId: ItemID.ThickIcePlate, tier: LootTier.UNCOMMON, weight: 8, minFloor: 6, maxFloor: 12, category: 'armor' },
        { itemId: ItemID.ElfCloak, tier: LootTier.UNCOMMON, weight: 8, minFloor: 5, maxFloor: 10, category: 'armor' },
        { itemId: ItemID.LuxurySantaSuit, tier: LootTier.RARE, weight: 5, minFloor: 10, category: 'armor' },
        { itemId: ItemID.EnchantedIcePlate, tier: LootTier.RARE, weight: 4, minFloor: 9, category: 'armor' },
        { itemId: ItemID.MasterElfCloak, tier: LootTier.RARE, weight: 4, minFloor: 8, category: 'armor' },
        
        // ARMOR - Epic/Legendary
        { itemId: ItemID.MagnificentSantaSuit, tier: LootTier.LEGENDARY, weight: 1, minFloor: 15, category: 'armor' },
        { itemId: ItemID.EternalIcePlate, tier: LootTier.LEGENDARY, weight: 1, minFloor: 18, category: 'armor' },
        { itemId: ItemID.ReindeerHideCloak, tier: LootTier.EPIC, weight: 2, minFloor: 12, category: 'armor' },
        
        // ARTIFACTS - Always rare or better
        { itemId: ItemID.RingOfFrost, tier: LootTier.RARE, weight: 3, minFloor: 8, category: 'artifact' },
        { itemId: ItemID.RingOfHaste, tier: LootTier.RARE, weight: 3, minFloor: 8, category: 'artifact' },
        { itemId: ItemID.RingOfWarmth, tier: LootTier.RARE, weight: 4, minFloor: 6, category: 'artifact' },
        { itemId: ItemID.ChristmasCandle, tier: LootTier.RARE, weight: 4, minFloor: 7, category: 'artifact' },
        { itemId: ItemID.SnowGlobe, tier: LootTier.EPIC, weight: 2, minFloor: 10, category: 'artifact' },
        { itemId: ItemID.ReindeerBell, tier: LootTier.EPIC, weight: 2, minFloor: 12, category: 'artifact' },
        { itemId: ItemID.ChristmasWish, tier: LootTier.LEGENDARY, weight: 1, minFloor: 20, category: 'artifact' },
        
        // CONSUMABLES - Various tiers
        { itemId: ItemID.Snowball, tier: LootTier.JUNK, weight: 20, minFloor: 1, maxFloor: 8, category: 'consumable' },
        { itemId: ItemID.HotCocoa, tier: LootTier.COMMON, weight: 15, minFloor: 1, category: 'consumable' },
        { itemId: ItemID.Fruitcake, tier: LootTier.COMMON, weight: 10, minFloor: 1, category: 'consumable' },
        { itemId: ItemID.Iceball, tier: LootTier.UNCOMMON, weight: 8, minFloor: 3, category: 'consumable' },
        { itemId: ItemID.ScrollOfMapping, tier: LootTier.UNCOMMON, weight: 6, minFloor: 4, category: 'consumable' },
        { itemId: ItemID.StarCookie, tier: LootTier.RARE, weight: 2, minFloor: 8, category: 'consumable' },
        { itemId: ItemID.LiquidCourage, tier: LootTier.RARE, weight: 2, minFloor: 10, category: 'consumable' },
        
        // MYSTERY ITEMS - Always need identification
        { itemId: ItemID.UnlabeledPotion, tier: LootTier.COMMON, weight: 8, minFloor: 2, category: 'consumable' },
        { itemId: ItemID.WrappedGift, tier: LootTier.UNCOMMON, weight: 5, minFloor: 3, category: 'consumable' }
    ];

    private static readonly FLOOR_TIER_WEIGHTS: Record<number, Record<LootTier, number>> = {
        // Early floors - mostly junk and common
        1: { [LootTier.JUNK]: 50, [LootTier.COMMON]: 40, [LootTier.UNCOMMON]: 8, [LootTier.RARE]: 2, [LootTier.EPIC]: 0, [LootTier.LEGENDARY]: 0 },
        3: { [LootTier.JUNK]: 30, [LootTier.COMMON]: 50, [LootTier.UNCOMMON]: 15, [LootTier.RARE]: 4, [LootTier.EPIC]: 1, [LootTier.LEGENDARY]: 0 },
        5: { [LootTier.JUNK]: 20, [LootTier.COMMON]: 40, [LootTier.UNCOMMON]: 25, [LootTier.RARE]: 12, [LootTier.EPIC]: 3, [LootTier.LEGENDARY]: 0 },
        8: { [LootTier.JUNK]: 10, [LootTier.COMMON]: 30, [LootTier.UNCOMMON]: 35, [LootTier.RARE]: 20, [LootTier.EPIC]: 5, [LootTier.LEGENDARY]: 0 },
        12: { [LootTier.JUNK]: 5, [LootTier.COMMON]: 20, [LootTier.UNCOMMON]: 30, [LootTier.RARE]: 30, [LootTier.EPIC]: 12, [LootTier.LEGENDARY]: 3 },
        15: { [LootTier.JUNK]: 2, [LootTier.COMMON]: 10, [LootTier.UNCOMMON]: 25, [LootTier.RARE]: 35, [LootTier.EPIC]: 20, [LootTier.LEGENDARY]: 8 },
        20: { [LootTier.JUNK]: 0, [LootTier.COMMON]: 5, [LootTier.UNCOMMON]: 15, [LootTier.RARE]: 35, [LootTier.EPIC]: 30, [LootTier.LEGENDARY]: 15 }
    };

    static generateLoot(floor: number, biome?: string, forceCategory?: string): GeneratedItem | null {
        const tierWeights = this.getTierWeightsForFloor(floor);
        const selectedTier = this.weightedRandomTier(tierWeights);
        
        // Filter valid items for this floor and tier
        const validItems = this.LOOT_TABLE.filter(entry => {
            return entry.tier === selectedTier &&
                   floor >= entry.minFloor &&
                   (!entry.maxFloor || floor <= entry.maxFloor) &&
                   (!biome || !entry.biomeRestriction || entry.biomeRestriction.includes(biome)) &&
                   (!forceCategory || entry.category === forceCategory);
        });

        if (validItems.length === 0) {
            console.warn(`No valid items found for floor ${floor}, tier ${selectedTier}`);
            return null;
        }

        const weights = validItems.map(item => item.weight);
        const selectedEntry = this.weightedRandom(validItems, weights);
        
        return this.createItemInstance(selectedEntry, floor);
    }

    static generateBossLoot(floor: number): GeneratedItem[] {
        const loot: GeneratedItem[] = [];
        
        // Bosses guarantee better loot
        const guaranteedTier = Math.min(LootTier.LEGENDARY, Math.floor(floor / 5) + LootTier.RARE);
        
        // 1-3 items depending on floor
        const itemCount = Math.min(3, Math.floor(floor / 5) + 1);
        
        for (let i = 0; i < itemCount; i++) {
            const item = this.generateLoot(floor + 2); // Boss loot is 2 floors ahead
            if (item) {
                // Bosses have higher chance for enchantments and less chance for curses
                item.enchantments = this.generateEnchantments(item.tier + 1, item.itemId);
                item.curses = Math.random() < 0.1 ? this.generateCurses(item.tier) : [];
                loot.push(item);
            }
        }
        
        return loot;
    }

    private static createItemInstance(entry: LootTableEntry, floor: number): GeneratedItem {
        const isEquipment = entry.category === 'weapon' || entry.category === 'armor';
        const isArtifact = entry.category === 'artifact';
        
        // Equipment and artifacts need identification (unless junk tier)
        const needsIdentification = (isEquipment || isArtifact) && entry.tier > LootTier.JUNK;
        
        // Generate enchantments and curses
        const enchantments = isEquipment ? this.generateEnchantments(entry.tier, entry.itemId) : [];
        const curses = isEquipment ? this.generateCurses(entry.tier) : [];
        
        // Generate bonus stats for equipment
        const bonusStats = isEquipment ? this.generateBonusStats(entry.tier) : undefined;
        
        return {
            itemId: entry.itemId,
            tier: entry.tier,
            identified: !needsIdentification,
            cursed: curses.length > 0,
            enchantments,
            curses,
            bonusStats,
            displayName: needsIdentification ? this.getUnidentifiedName(entry) : entry.itemId
        };
    }

    private static generateEnchantments(tier: LootTier, itemId: ItemID): any[] {
        const isWeapon = itemId.toString().includes('Dagger') || 
                        itemId.toString().includes('Hammer') || 
                        itemId.toString().includes('Wand') ||
                        itemId.toString().includes('Lights');
        
        const enchantments: any[] = [];
        const maxEnchantments = Math.min(3, Math.floor(tier / 2));
        
        for (let i = 0; i < maxEnchantments; i++) {
            const enchantment = EnchantmentSystem.generateEnchantment(tier, isWeapon);
            if (enchantment && !enchantments.some(e => e.type === enchantment.type)) {
                enchantments.push(enchantment);
            }
        }
        
        return enchantments;
    }

    private static generateCurses(tier: LootTier): any[] {
        // Lower tier items more likely to be cursed
        const curseChance = Math.max(0.05, 0.5 - (tier * 0.08));
        
        if (Math.random() > curseChance) return [];
        
        const curse = EnchantmentSystem.generateCurse(tier);
        return curse ? [curse] : [];
    }

    private static generateBonusStats(tier: LootTier): Record<string, number> {
        const bonusStats: Record<string, number> = {};
        
        // Higher tier items get more bonus stats
        const bonusCount = Math.floor(Math.random() * tier) + 1;
        const possibleStats = ['damage', 'defense', 'accuracy', 'critChance', 'durability'];
        
        for (let i = 0; i < Math.min(bonusCount, 3); i++) {
            const stat = possibleStats[Math.floor(Math.random() * possibleStats.length)];
            const bonus = Math.floor(Math.random() * tier) + 1;
            bonusStats[stat] = (bonusStats[stat] || 0) + bonus;
        }
        
        return bonusStats;
    }

    private static getUnidentifiedName(entry: LootTableEntry): string {
        const tierNames = {
            [LootTier.JUNK]: 'Worn',
            [LootTier.COMMON]: 'Plain',
            [LootTier.UNCOMMON]: 'Quality',
            [LootTier.RARE]: 'Fine',
            [LootTier.EPIC]: 'Ornate',
            [LootTier.LEGENDARY]: 'Magnificent'
        };

        const categoryNames: Record<string, string> = {
            'weapon': 'Weapon',
            'armor': 'Armor',
            'artifact': 'Trinket',
            'consumable': 'Item',
            'misc': 'Item'
        };

        return `${tierNames[entry.tier]} ${categoryNames[entry.category]}`;
    }

    private static getTierWeightsForFloor(floor: number): Record<LootTier, number> {
        // Find the closest defined floor
        const definedFloors = Object.keys(this.FLOOR_TIER_WEIGHTS).map(Number).sort((a, b) => a - b);
        
        let targetFloor = definedFloors[0];
        for (const f of definedFloors) {
            if (floor >= f) targetFloor = f;
        }
        
        return this.FLOOR_TIER_WEIGHTS[targetFloor];
    }

    private static weightedRandomTier(tierWeights: Record<LootTier, number>): LootTier {
        const totalWeight = Object.values(tierWeights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [tier, weight] of Object.entries(tierWeights)) {
            random -= weight;
            if (random <= 0) {
                return parseInt(tier) as LootTier;
            }
        }
        
        return LootTier.COMMON; // Fallback
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

    // Specific loot generation methods
    static generateChestLoot(floor: number, chestType: 'wooden' | 'silver' | 'gold'): GeneratedItem[] {
        const itemCounts = { wooden: 1, silver: 2, gold: 3 };
        const tierBonus = { wooden: 0, silver: 1, gold: 2 };
        
        const loot: GeneratedItem[] = [];
        for (let i = 0; i < itemCounts[chestType]; i++) {
            const item = this.generateLoot(floor + tierBonus[chestType]);
            if (item) loot.push(item);
        }
        
        return loot;
    }

    static generateEnemyDrop(floor: number, enemyType: string): GeneratedItem | null {
        // Most enemies don't drop loot to keep it rare and valuable
        const dropChance = 0.15; // 15% base drop chance
        
        if (Math.random() > dropChance) return null;
        
        // Enemy-specific loot preferences
        const preferences: Record<string, string> = {
            'elf': 'weapon',
            'yeti': 'armor',
            'snowman': 'consumable'
        };
        
        return this.generateLoot(floor, undefined, preferences[enemyType]);
    }
}