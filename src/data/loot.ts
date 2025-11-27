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

// Unified data-first loot tables
export const LootTables: Record<string, LootTable> = {
    // Container loot
    [InteractableID.PresentChest]: {
        id: InteractableID.PresentChest,
        name: 'Present Chest Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 80, quantity: { min: 5, max: 15 } },
            { itemId: ItemID.CandyCaneSpear, rarity: ItemRarity.COMMON, weight: 30 },
            { itemId: ItemID.HotCocoa, rarity: ItemRarity.COMMON, weight: 60, quantity: { min: 1, max: 3 } },
            { itemId: ItemID.CozySweater, rarity: ItemRarity.COMMON, weight: 25 },
            { itemId: ItemID.ChristmasStar, rarity: ItemRarity.UNIQUE, weight: 2 }
        ],
        rarityBias: 1 // Slightly better loot
    },

    [InteractableID.Stocking]: {
        id: InteractableID.Stocking,
        name: 'Christmas Stocking Loot',
        entries: [
            { itemId: ItemID.Coal, rarity: ItemRarity.COMMON, weight: 40, quantity: { min: 1, max: 3 } },
            { itemId: ItemID.CandyCaneSpear, rarity: ItemRarity.COMMON, weight: 20 },
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 60, quantity: { min: 2, max: 8 } },
            { itemId: ItemID.HotCocoa, rarity: ItemRarity.COMMON, weight: 45 },
            { itemId: ItemID.Fruitcake, rarity: ItemRarity.UNCOMMON, weight: 15 }
        ]
    },

    // Enemy loot
    [LootTableID.SnowmanLoot]: {
        id: LootTableID.SnowmanLoot,
        name: 'Snowman Enemy Loot',
        entries: [
            { itemId: ItemID.Coal, rarity: ItemRarity.COMMON, weight: 60, quantity: { min: 1, max: 2 } },
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 40, quantity: { min: 1, max: 4 } },
            { itemId: ItemID.IcicleDagger, rarity: ItemRarity.UNCOMMON, weight: 15 }
        ]
    },

    [LootTableID.SnowSpriteLoot]: {
        id: LootTableID.SnowSpriteLoot,
        name: 'Snow Sprite Enemy Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 50, quantity: { min: 1, max: 3 } },
            { itemId: ItemID.IcicleDagger, rarity: ItemRarity.UNCOMMON, weight: 25 },
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
            { itemId: ItemID.KrampusHorn, rarity: ItemRarity.EPIC, weight: 60 }
        ],
        rarityBias: 3 // Much better loot
    },

    // Floor-based loot
    [LootTableID.FloorGeneral]: {
        id: LootTableID.FloorGeneral,
        name: 'General Floor Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 70, quantity: { min: 1, max: 5 } },
            { itemId: ItemID.HotCocoa, rarity: ItemRarity.COMMON, weight: 40 },
            { itemId: ItemID.Coal, rarity: ItemRarity.COMMON, weight: 30, quantity: { min: 1, max: 2 } },
            { itemId: ItemID.CandyCaneSpear, rarity: ItemRarity.COMMON, weight: 20, maxFloor: 5 },
            { itemId: ItemID.IcicleDagger, rarity: ItemRarity.UNCOMMON, weight: 25, minFloor: 3 },
            { itemId: ItemID.CozySweater, rarity: ItemRarity.COMMON, weight: 25, maxFloor: 10 },
            { itemId: ItemID.SantaSuit, rarity: ItemRarity.LEGENDARY, weight: 2, minFloor: 15 }
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