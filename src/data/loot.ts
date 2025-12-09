import { ItemRarity } from './items';
import { ItemID } from '../constants';
import { InteractableID } from '../constants';
import { LootTableID } from '../constants';

export interface LootTableEntry {
    itemId: string;
    rarity: ItemRarity;
    weight: number;
    minFloor?: number;
    maxFloor?: number;
    biomeRestriction?: string[];
    seasonRestriction?: string[];
    quantity?: {
        min: number;
        max: number;
    };
}

export interface LootTable {
    id: string;
    name: string;
    entries: LootTableEntry[];
    // Global modifiers for this table
    rarityBias?: number; // Positive = rarer items, negative = common items
    quantityMultiplier?: number;
}



// Define new LootTable IDs in constants if needed, for now using string keys
export const LootTableID_ProgressionItems = 'progression_items';
export const LootTableID_EquipmentCommon = 'equipment_common';
export const LootTableID_EquipmentRare = 'equipment_rare';
export const LootTableID_EquipmentEpic = 'equipment_epic';

// Unified data-first loot tables
export const LootTables: Record<string, LootTable> = {
    // === NEW PROGRESSION & TIER TABLES ===
    [LootTableID_ProgressionItems]: {
        id: LootTableID_ProgressionItems,
        name: 'Progression Items',
        entries: [
            { itemId: ItemID.LiquidCourage, rarity: ItemRarity.EPIC, weight: 10 }, // Str boost
            { itemId: ItemID.StarCookie, rarity: ItemRarity.EPIC, weight: 10 },    // HP boost
            { itemId: ItemID.ScrollOfEnchantment, rarity: ItemRarity.RARE, weight: 30 },
            { itemId: ItemID.ScrollOfIdentify, rarity: ItemRarity.UNCOMMON, weight: 40 },
            { itemId: ItemID.ScrollOfMapping, rarity: ItemRarity.UNCOMMON, weight: 40 },
            { itemId: ItemID.ScrollOfRemoveCurse, rarity: ItemRarity.RARE, weight: 20 },
            // Throwables
            { itemId: ItemID.Snowball, rarity: ItemRarity.COMMON, weight: 50, quantity: { min: 3, max: 8 } },
            { itemId: ItemID.Iceball, rarity: ItemRarity.UNCOMMON, weight: 30, quantity: { min: 2, max: 5 } },
            // Warmth
            { itemId: ItemID.HotCocoa, rarity: ItemRarity.COMMON, weight: 60 }
        ]
    },

    [LootTableID_EquipmentCommon]: {
        id: LootTableID_EquipmentCommon,
        name: 'Common Equipment',
        entries: [
            { itemId: ItemID.CandyCaneSpear, rarity: ItemRarity.COMMON, weight: 50 },
            { itemId: ItemID.WeakSword, rarity: ItemRarity.COMMON, weight: 50 },
            { itemId: ItemID.BrokenToyHammer, rarity: ItemRarity.COMMON, weight: 50 },
            { itemId: ItemID.CozySweater, rarity: ItemRarity.COMMON, weight: 50 },
            { itemId: ItemID.SparklerWand, rarity: ItemRarity.COMMON, weight: 40 }
        ]
    },

    [LootTableID_EquipmentRare]: {
        id: LootTableID_EquipmentRare,
        name: 'Rare Equipment',
        entries: [
            { itemId: ItemID.SharpIcicleDagger, rarity: ItemRarity.RARE, weight: 30 },
            { itemId: ItemID.FrostyIcicleDagger, rarity: ItemRarity.UNCOMMON, weight: 40 },
            { itemId: ItemID.WoodenToyHammer, rarity: ItemRarity.COMMON, weight: 50 },
            { itemId: ItemID.ChristmasTreeStaff, rarity: ItemRarity.RARE, weight: 30 },
            { itemId: ItemID.RingOfWarmth, rarity: ItemRarity.UNCOMMON, weight: 20 },
            { itemId: ItemID.HeavyPlateArmor, rarity: ItemRarity.RARE, weight: 25 }
        ]
    },

    [LootTableID_EquipmentEpic]: {
        id: LootTableID_EquipmentEpic,
        name: 'Epic Equipment',
        entries: [
            { itemId: ItemID.TitaniumToyHammer, rarity: ItemRarity.EPIC, weight: 30 },
            { itemId: ItemID.PerfectIcicleDagger, rarity: ItemRarity.EPIC, weight: 30 },
            { itemId: ItemID.NutcrackerHammer, rarity: ItemRarity.LEGENDARY, weight: 10 },
            { itemId: ItemID.GrandFinaleWand, rarity: ItemRarity.LEGENDARY, weight: 10 },
            { itemId: ItemID.RingOfFrost, rarity: ItemRarity.RARE, weight: 40 },
            { itemId: ItemID.SantaSuit, rarity: ItemRarity.LEGENDARY, weight: 15 }
        ]
    },

    // Container loot
    [InteractableID.PresentChest]: {
        id: InteractableID.PresentChest,
        name: 'Present Chest Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 80, quantity: { min: 5, max: 15 } },
            // Reference new tables? No, simple weights here for now, or mix
            { itemId: ItemID.LiquidCourage, rarity: ItemRarity.EPIC, weight: 5 },
            { itemId: ItemID.HotCocoa, rarity: ItemRarity.COMMON, weight: 60, quantity: { min: 1, max: 3 } },
            { itemId: ItemID.WrappedGift, rarity: ItemRarity.COMMON, weight: 30 },
            { itemId: ItemID.ScrollOfIdentify, rarity: ItemRarity.UNCOMMON, weight: 20 }
        ],
        rarityBias: 1 // Slightly better loot
    },

    [InteractableID.Stocking]: {
        id: InteractableID.Stocking,
        name: 'Christmas Stocking Loot',
        entries: [
            { itemId: ItemID.Coal, rarity: ItemRarity.COMMON, weight: 40, quantity: { min: 1, max: 3 } },
            { itemId: ItemID.CandyCane, rarity: ItemRarity.COMMON, weight: 30 },
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 60, quantity: { min: 2, max: 8 } },
            { itemId: ItemID.MagicStocking, rarity: ItemRarity.EPIC, weight: 1 } // Very rare self-reference
        ]
    },

    // Standard Chest - Mixed common loot + chance for rare
    [LootTableID.CHEST]: {
        id: LootTableID.CHEST,
        name: 'Chest Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 70, quantity: { min: 3, max: 10 } },
            { itemId: ItemID.HotCocoa, rarity: ItemRarity.COMMON, weight: 50 },
            // Equipment from Chests
            { itemId: ItemID.WoodenToyHammer, rarity: ItemRarity.COMMON, weight: 20 },
            { itemId: ItemID.IcicleDagger, rarity: ItemRarity.UNCOMMON, weight: 15 },
            { itemId: ItemID.ScrollOfEnchantment, rarity: ItemRarity.RARE, weight: 10 }
        ]
    },

    // Treasure Chest - GOOD items (Rare/Epic)
    [LootTableID.TREASURE_CHEST]: {
        id: LootTableID.TREASURE_CHEST,
        name: 'Treasure Chest Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 90, quantity: { min: 10, max: 25 } },
            { itemId: ItemID.ChristmasKey, rarity: ItemRarity.RARE, weight: 60 },
            // High tier equipment
            { itemId: ItemID.TitaniumToyHammer, rarity: ItemRarity.EPIC, weight: 20 },
            { itemId: ItemID.HeavyPlateArmor, rarity: ItemRarity.RARE, weight: 20 },
            { itemId: ItemID.SantaSuit, rarity: ItemRarity.LEGENDARY, weight: 5 },
            { itemId: ItemID.LiquidCourage, rarity: ItemRarity.EPIC, weight: 15 }
        ],
        rarityBias: 1
    },

    // Barrel - Consumables only
    [LootTableID.BARREL]: {
        id: LootTableID.BARREL,
        name: 'Barrel Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 50, quantity: { min: 1, max: 5 } },
            { itemId: ItemID.HotCocoa, rarity: ItemRarity.COMMON, weight: 40 },
            { itemId: ItemID.Snowball, rarity: ItemRarity.COMMON, weight: 30, quantity: { min: 3, max: 6 } }
        ]
    },

    // Puzzle Chest - reward for solving puzzles
    [LootTableID.PUZZLE_CHEST]: {
        id: LootTableID.PUZZLE_CHEST,
        name: 'Puzzle Chest Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 80, quantity: { min: 15, max: 30 } },
            { itemId: ItemID.ScrollOfEnchantment, rarity: ItemRarity.RARE, weight: 50 },
            { itemId: ItemID.ScrollOfMapping, rarity: ItemRarity.RARE, weight: 40 },
            { itemId: ItemID.ChristmasKey, rarity: ItemRarity.RARE, weight: 35 },
            { itemId: ItemID.StarCookie, rarity: ItemRarity.EPIC, weight: 20 }
        ],
        rarityBias: 2
    },

    // Enemy loot - Mainly resources, small chance of progression
    [LootTableID.SnowmanLoot]: {
        id: LootTableID.SnowmanLoot,
        name: 'Snowman Enemy Loot',
        entries: [
            { itemId: ItemID.Coal, rarity: ItemRarity.COMMON, weight: 60, quantity: { min: 1, max: 2 } },
            { itemId: ItemID.Snowball, rarity: ItemRarity.COMMON, weight: 40, quantity: { min: 2, max: 4 } },
            { itemId: ItemID.LiquidCourage, rarity: ItemRarity.EPIC, weight: 1 } // Very rare
        ]
    },

    [LootTableID.SnowSpriteLoot]: {
        id: LootTableID.SnowSpriteLoot,
        name: 'Snow Sprite Enemy Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 50, quantity: { min: 1, max: 3 } },
            { itemId: ItemID.Iceball, rarity: ItemRarity.UNCOMMON, weight: 25 },
            { itemId: ItemID.ScrollOfFrost, rarity: ItemRarity.UNCOMMON, weight: 20 }
        ]
    },

    [LootTableID.KrampusLoot]: {
        id: LootTableID.KrampusLoot,
        name: 'Krampus Boss Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 90, quantity: { min: 10, max: 25 } },
            { itemId: ItemID.SantaSuit, rarity: ItemRarity.LEGENDARY, weight: 40 },
            { itemId: ItemID.ChristmasStar, rarity: ItemRarity.UNIQUE, weight: 20 },
            { itemId: ItemID.KrampusHorn, rarity: ItemRarity.EPIC, weight: 100 } // Guaranteed?
        ],
        rarityBias: 3 // Much better loot
    },

    [LootTableID.TREASURE_ROOM_LOOT]: {
        id: LootTableID.TREASURE_ROOM_LOOT,
        name: 'Treasure Room Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 100, quantity: { min: 20, max: 50 } },
            { itemId: ItemID.ChristmasKey, rarity: ItemRarity.RARE, weight: 50 },
            { itemId: ItemID.TitaniumToyHammer, rarity: ItemRarity.EPIC, weight: 30 },
            { itemId: ItemID.HeavyPlateArmor, rarity: ItemRarity.RARE, weight: 30 },
            { itemId: ItemID.SantaSuit, rarity: ItemRarity.LEGENDARY, weight: 5 }
        ],
        rarityBias: 2
    },

    [LootTableID.MAGIC_LOOT]: {
        id: LootTableID.MAGIC_LOOT,
        name: 'Magic Loot',
        entries: [
            { itemId: ItemID.ScrollOfFrost, rarity: ItemRarity.UNCOMMON, weight: 40 },
            { itemId: ItemID.ScrollOfSnowStorm, rarity: ItemRarity.UNCOMMON, weight: 40 },
            { itemId: ItemID.ScrollOfMapping, rarity: ItemRarity.RARE, weight: 20 },
            { itemId: ItemID.ScrollOfEnchantment, rarity: ItemRarity.RARE, weight: 15 },
            { itemId: ItemID.HotCocoa, rarity: ItemRarity.COMMON, weight: 50 }
        ],
        rarityBias: 1
    },

    // Floor-based loot
    [LootTableID.FloorGeneral]: {
        id: LootTableID.FloorGeneral,
        name: 'General Floor Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 70, quantity: { min: 1, max: 5 } },
            { itemId: ItemID.HotCocoa, rarity: ItemRarity.COMMON, weight: 40 },
            { itemId: ItemID.Coal, rarity: ItemRarity.COMMON, weight: 30, quantity: { min: 1, max: 2 } },
            // Scrolls
            { itemId: ItemID.ScrollOfIdentify, rarity: ItemRarity.UNCOMMON, weight: 15 },
            { itemId: ItemID.ScrollOfMapping, rarity: ItemRarity.UNCOMMON, weight: 10 },
            // Misc
            { itemId: ItemID.Gem, rarity: ItemRarity.UNCOMMON, weight: 5 }
        ]
    }
};

// Loot generation weights by rarity
export const RarityWeights: Record<ItemRarity, number> = {
    [ItemRarity.COMMON]: 100,
    [ItemRarity.UNCOMMON]: 30,
    [ItemRarity.RARE]: 10,
    [ItemRarity.EPIC]: 3,
    [ItemRarity.LEGENDARY]: 1,
    [ItemRarity.UNIQUE]: 0.5
};

// Floor scaling for loot quality
export const FloorScaling = {
    // Base chance multipliers by floor
    rarityBonusPerFloor: 0.02, // +2% chance for higher rarity per floor
    quantityBonusPerFloor: 0.01, // +1% quantity per floor
    maxRarityBonus: 0.5, // Cap at 50% bonus
    
    // Floor thresholds for guaranteed minimum rarities
    guaranteedRareFloor: 10,
    guaranteedEpicFloor: 20,
    guaranteedLegendaryFloor: 25
};