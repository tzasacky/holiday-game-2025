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
export const LootTableID_OrnamentGrenades = 'ornament_grenades';
export const LootTableID_AdvancedScrolls = 'advanced_scrolls';
export const LootTableID_SpecialConsumables = 'special_consumables';
export const LootTableID_UtilityScrolls = 'utility_scrolls';
export const LootTableID_ChestEquipment = 'chest_equipment_guaranteed';
export const LootTableID_ChestSustain = 'chest_sustain_guaranteed';
export const LootTableID_ChestRandom = 'chest_random_loot';

// Unified data-first loot tables
export const LootTables: Record<string, LootTable> = {
    // === NEW PROGRESSION & TIER TABLES ===
    [LootTableID_ProgressionItems]: {
        id: LootTableID_ProgressionItems,
        name: 'Progression Items',
        entries: [
            // Permanent progression items (rare)
            { itemId: ItemID.LiquidCourage, rarity: ItemRarity.EPIC, weight: 8 },
            { itemId: ItemID.StarCookie, rarity: ItemRarity.EPIC, weight: 8 },
            { itemId: ItemID.SantasCookie, rarity: ItemRarity.LEGENDARY, weight: 2 },
            
            // Basic scrolls (more common)
            { itemId: ItemID.ScrollOfEnchantment, rarity: ItemRarity.RARE, weight: 25 },
            { itemId: ItemID.ScrollOfIdentify, rarity: ItemRarity.UNCOMMON, weight: 35 },
            { itemId: ItemID.ScrollOfMapping, rarity: ItemRarity.UNCOMMON, weight: 35 },
            { itemId: ItemID.ScrollOfRemoveCurse, rarity: ItemRarity.RARE, weight: 18 },
            { itemId: ItemID.ScrollOfTeleport, rarity: ItemRarity.UNCOMMON, weight: 20 },
            
            // Christmas scrolls (moderate rarity)
            { itemId: ItemID.ScrollOfWinterWarmth, rarity: ItemRarity.UNCOMMON, weight: 25 },
            { itemId: ItemID.ScrollOfChristmasSpirit, rarity: ItemRarity.RARE, weight: 15 },
            { itemId: ItemID.ScrollOfSantasBlessing, rarity: ItemRarity.LEGENDARY, weight: 3 },
            
            // Throwables
            { itemId: ItemID.Snowball, rarity: ItemRarity.COMMON, weight: 45, quantity: { min: 3, max: 8 } },
            { itemId: ItemID.PackedSnowball, rarity: ItemRarity.COMMON, weight: 35, quantity: { min: 2, max: 6 } },
            { itemId: ItemID.Iceball, rarity: ItemRarity.UNCOMMON, weight: 25, quantity: { min: 2, max: 5 } },
            { itemId: ItemID.YellowSnowball, rarity: ItemRarity.UNCOMMON, weight: 15, quantity: { min: 1, max: 4 } },
            { itemId: ItemID.YellowSnowball, rarity: ItemRarity.UNCOMMON, weight: 15, quantity: { min: 1, max: 4 } },
            
            // Basic healing
            { itemId: ItemID.HotCocoa, rarity: ItemRarity.COMMON, weight: 50 },
            { itemId: ItemID.Fruitcake, rarity: ItemRarity.UNCOMMON, weight: 25 },
            { itemId: ItemID.Marshmallow, rarity: ItemRarity.COMMON, weight: 30, quantity: { min: 2, max: 6 } }
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

    // === NEW SPECIALIZED CONSUMABLE TABLES ===
    
    [LootTableID_OrnamentGrenades]: {
        id: LootTableID_OrnamentGrenades,
        name: 'Ornament Grenades',
        entries: [
            { itemId: ItemID.CrackedOrnamentGrenade, rarity: ItemRarity.COMMON, weight: 40, quantity: { min: 1, max: 3 } },
            { itemId: ItemID.GlassOrnamentGrenade, rarity: ItemRarity.UNCOMMON, weight: 30, quantity: { min: 1, max: 2 } },
            { itemId: ItemID.SilverOrnamentGrenade, rarity: ItemRarity.RARE, weight: 20, quantity: { min: 1, max: 2 } },
            { itemId: ItemID.GoldOrnamentGrenade, rarity: ItemRarity.EPIC, weight: 8, quantity: { min: 1, max: 1 } },
            { itemId: ItemID.PlatinumOrnamentGrenade, rarity: ItemRarity.LEGENDARY, weight: 2, quantity: { min: 1, max: 1 } }
        ]
    },

    [LootTableID_AdvancedScrolls]: {
        id: LootTableID_AdvancedScrolls,
        name: 'Advanced Scrolls',
        entries: [
            { itemId: ItemID.ScrollOfReindeerCall, rarity: ItemRarity.EPIC, weight: 15 },
            { itemId: ItemID.ScrollOfJingleAll, rarity: ItemRarity.RARE, weight: 20 },
            { itemId: ItemID.ScrollOfMistletoePortal, rarity: ItemRarity.EPIC, weight: 12 },
            { itemId: ItemID.ScrollOfSnowStorm, rarity: ItemRarity.RARE, weight: 25 },
            { itemId: ItemID.ScrollOfElvenCraftsmanship, rarity: ItemRarity.EPIC, weight: 10 },
            { itemId: ItemID.ScrollOfFrost, rarity: ItemRarity.UNCOMMON, weight: 30 }
        ]
    },

    [LootTableID_UtilityScrolls]: {
        id: LootTableID_UtilityScrolls,
        name: 'Utility Scrolls',
        entries: [
            { itemId: ItemID.ScrollOfNiceList, rarity: ItemRarity.RARE, weight: 25 },
            { itemId: ItemID.ScrollOfNaughtyList, rarity: ItemRarity.RARE, weight: 25 },
            { itemId: ItemID.ScrollOfSantasSight, rarity: ItemRarity.UNCOMMON, weight: 35 },
            { itemId: ItemID.ScrollOfElvenBlessing, rarity: ItemRarity.RARE, weight: 20 }
        ]
    },

    [LootTableID_SpecialConsumables]: {
        id: LootTableID_SpecialConsumables,
        name: 'Special Consumables',
        entries: [
            { itemId: ItemID.UnlabeledPotion, rarity: ItemRarity.UNCOMMON, weight: 30 },
            { itemId: ItemID.ChampagneFlute, rarity: ItemRarity.UNCOMMON, weight: 25 },
            { itemId: ItemID.ChristmasWishBone, rarity: ItemRarity.RARE, weight: 20 },
            { itemId: ItemID.AngelFeatherRevive, rarity: ItemRarity.LEGENDARY, weight: 3 },
            { itemId: ItemID.PotionOfCureDisease, rarity: ItemRarity.RARE, weight: 15 },
            { itemId: ItemID.CandyCane, rarity: ItemRarity.COMMON, weight: 40, quantity: { min: 2, max: 8 } }
        ]
    },

    // Container loot
    [InteractableID.PresentChest]: {
        id: InteractableID.PresentChest,
        name: 'Present Chest Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 70, quantity: { min: 5, max: 15 } },
            
            // Progression items
            { itemId: ItemID.LiquidCourage, rarity: ItemRarity.EPIC, weight: 4 },
            { itemId: ItemID.StarCookie, rarity: ItemRarity.EPIC, weight: 4 },
            { itemId: ItemID.SantasCookie, rarity: ItemRarity.LEGENDARY, weight: 1 },
            
            // Christmas consumables
            { itemId: ItemID.HotCocoa, rarity: ItemRarity.COMMON, weight: 50, quantity: { min: 1, max: 3 } },
            { itemId: ItemID.WrappedGift, rarity: ItemRarity.COMMON, weight: 25 },
            { itemId: ItemID.Fruitcake, rarity: ItemRarity.UNCOMMON, weight: 15 },
            { itemId: ItemID.CandyCane, rarity: ItemRarity.COMMON, weight: 20, quantity: { min: 2, max: 6 } },
            
            // Christmas scrolls
            { itemId: ItemID.ScrollOfWinterWarmth, rarity: ItemRarity.UNCOMMON, weight: 15 },
            { itemId: ItemID.ScrollOfChristmasSpirit, rarity: ItemRarity.RARE, weight: 8 },
            { itemId: ItemID.ScrollOfSantasBlessing, rarity: ItemRarity.LEGENDARY, weight: 2 },
            
            // Basic scrolls
            { itemId: ItemID.ScrollOfIdentify, rarity: ItemRarity.UNCOMMON, weight: 18 },
            { itemId: ItemID.ScrollOfMapping, rarity: ItemRarity.UNCOMMON, weight: 15 },
            
            // Ornament grenades (Christmas themed!)
            { itemId: ItemID.CrackedOrnamentGrenade, rarity: ItemRarity.COMMON, weight: 12, quantity: { min: 1, max: 2 } },
            { itemId: ItemID.GlassOrnamentGrenade, rarity: ItemRarity.UNCOMMON, weight: 8 },
            { itemId: ItemID.SilverOrnamentGrenade, rarity: ItemRarity.RARE, weight: 4 }
        ],
        rarityBias: 1 // Slightly better loot
    },

    [InteractableID.Stocking]: {
        id: InteractableID.Stocking,
        name: 'Christmas Stocking Loot',
        entries: [
            { itemId: ItemID.CandyCane, rarity: ItemRarity.COMMON, weight: 35, quantity: { min: 1, max: 4 } },
            { itemId: ItemID.CandyCane, rarity: ItemRarity.COMMON, weight: 35, quantity: { min: 1, max: 4 } },
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 50, quantity: { min: 2, max: 8 } },
            
            // Christmas treats
            { itemId: ItemID.Marshmallow, rarity: ItemRarity.COMMON, weight: 25, quantity: { min: 2, max: 5 } },
            { itemId: ItemID.HotCocoa, rarity: ItemRarity.COMMON, weight: 20 },
            
            // Small throwables
            { itemId: ItemID.Snowball, rarity: ItemRarity.COMMON, weight: 15, quantity: { min: 2, max: 5 } },
            { itemId: ItemID.CoalSnowball, rarity: ItemRarity.UNCOMMON, weight: 8, quantity: { min: 1, max: 3 } },
            
            // Christmas scrolls (small chance)
            { itemId: ItemID.ScrollOfNiceList, rarity: ItemRarity.RARE, weight: 3 },
            { itemId: ItemID.ScrollOfNaughtyList, rarity: ItemRarity.RARE, weight: 2 },
            
            { itemId: ItemID.MagicStocking, rarity: ItemRarity.EPIC, weight: 1 } // Very rare self-reference
        ]
    },

    // Standard Chest - Mixed common loot + chance for rare
    [LootTableID.CHEST]: {
        id: LootTableID.CHEST,
        name: 'Chest Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 65, quantity: { min: 3, max: 10 } },
            
            // Basic consumables
            { itemId: ItemID.HotCocoa, rarity: ItemRarity.COMMON, weight: 45 },
            { itemId: ItemID.Marshmallow, rarity: ItemRarity.COMMON, weight: 25, quantity: { min: 1, max: 4 } },
            { itemId: ItemID.Fruitcake, rarity: ItemRarity.UNCOMMON, weight: 15 },
            
            // Throwables
            { itemId: ItemID.Snowball, rarity: ItemRarity.COMMON, weight: 30, quantity: { min: 2, max: 6 } },
            { itemId: ItemID.PackedSnowball, rarity: ItemRarity.COMMON, weight: 20, quantity: { min: 1, max: 4 } },
            { itemId: ItemID.Iceball, rarity: ItemRarity.UNCOMMON, weight: 15, quantity: { min: 1, max: 3 } },
            
            // Equipment from Chests
            { itemId: ItemID.WoodenToyHammer, rarity: ItemRarity.COMMON, weight: 18 },
            { itemId: ItemID.IcicleDagger, rarity: ItemRarity.UNCOMMON, weight: 14 },
            
            // Basic scrolls
            { itemId: ItemID.ScrollOfIdentify, rarity: ItemRarity.UNCOMMON, weight: 12 },
            { itemId: ItemID.ScrollOfMapping, rarity: ItemRarity.UNCOMMON, weight: 10 },
            { itemId: ItemID.ScrollOfEnchantment, rarity: ItemRarity.RARE, weight: 8 },
            
            // Frequent progression items - essential for survival
            { itemId: ItemID.LiquidCourage, rarity: ItemRarity.EPIC, weight: 12 },
            { itemId: ItemID.StarCookie, rarity: ItemRarity.EPIC, weight: 12 }
        ]
    },
    
    // === NEW CHEST COMPONENT TABLES ===
    
    [LootTableID_ChestEquipment]: {
        id: LootTableID_ChestEquipment,
        name: 'Chest Equipment (Guaranteed)',
        entries: [
            // Weapons
            { itemId: ItemID.CandyCaneSpear, rarity: ItemRarity.COMMON, weight: 20 },
            { itemId: ItemID.WeakSword, rarity: ItemRarity.COMMON, weight: 20 },
            { itemId: ItemID.WoodenToyHammer, rarity: ItemRarity.COMMON, weight: 15 },
            { itemId: ItemID.SparklerWand, rarity: ItemRarity.COMMON, weight: 15 },
            { itemId: ItemID.IcicleDagger, rarity: ItemRarity.UNCOMMON, weight: 10 },
            
            // Armor
            { itemId: ItemID.CozySweater, rarity: ItemRarity.COMMON, weight: 20 },
            { itemId: ItemID.HeavyPlateArmor, rarity: ItemRarity.RARE, weight: 5 },
            
            // Accessories
            { itemId: ItemID.RingOfWarmth, rarity: ItemRarity.UNCOMMON, weight: 8 },
            { itemId: ItemID.RingOfHaste, rarity: ItemRarity.RARE, weight: 5 }
        ]
    },
    
    [LootTableID_ChestSustain]: {
        id: LootTableID_ChestSustain,
        name: 'Chest Sustain (Guaranteed)',
        entries: [
            // Healing
            { itemId: ItemID.HotCocoa, rarity: ItemRarity.COMMON, weight: 40 },
            { itemId: ItemID.Marshmallow, rarity: ItemRarity.COMMON, weight: 25, quantity: { min: 2, max: 4 } },
            { itemId: ItemID.Fruitcake, rarity: ItemRarity.UNCOMMON, weight: 15 },
            
            // Utility Scrolls
            { itemId: ItemID.ScrollOfIdentify, rarity: ItemRarity.UNCOMMON, weight: 15 },
            { itemId: ItemID.ScrollOfMapping, rarity: ItemRarity.UNCOMMON, weight: 15 },
            { itemId: ItemID.ScrollOfWinterWarmth, rarity: ItemRarity.UNCOMMON, weight: 20 },
            
            // Progression (Small chance as extra sustain)
            { itemId: ItemID.LiquidCourage, rarity: ItemRarity.EPIC, weight: 5 },
            { itemId: ItemID.StarCookie, rarity: ItemRarity.EPIC, weight: 5 }
        ]
    },
    
    [LootTableID_ChestRandom]: {
        id: LootTableID_ChestRandom,
        name: 'Chest Random Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 60, quantity: { min: 5, max: 15 } },
            { itemId: ItemID.Snowball, rarity: ItemRarity.COMMON, weight: 15, quantity: { min: 1, max: 3 } },
            { itemId: ItemID.Gem, rarity: ItemRarity.UNCOMMON, weight: 10 },
            { itemId: ItemID.CandyCane, rarity: ItemRarity.COMMON, weight: 15, quantity: { min: 1, max: 3 } }
        ]
    },

    // Treasure Chest - GOOD items (Rare/Epic)
    [LootTableID.TREASURE_CHEST]: {
        id: LootTableID.TREASURE_CHEST,
        name: 'Treasure Chest Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 80, quantity: { min: 10, max: 25 } },
            { itemId: ItemID.ChristmasKey, rarity: ItemRarity.RARE, weight: 50 },
            
            // High tier equipment
            { itemId: ItemID.TitaniumToyHammer, rarity: ItemRarity.EPIC, weight: 18 },
            { itemId: ItemID.HeavyPlateArmor, rarity: ItemRarity.RARE, weight: 18 },
            { itemId: ItemID.SantaSuit, rarity: ItemRarity.LEGENDARY, weight: 4 },
            
            // Progression items (better chance in treasure)
            { itemId: ItemID.LiquidCourage, rarity: ItemRarity.EPIC, weight: 12 },
            { itemId: ItemID.StarCookie, rarity: ItemRarity.EPIC, weight: 12 },
            { itemId: ItemID.SantasCookie, rarity: ItemRarity.LEGENDARY, weight: 3 },
            
            // Advanced scrolls
            { itemId: ItemID.ScrollOfElvenCraftsmanship, rarity: ItemRarity.EPIC, weight: 8 },
            { itemId: ItemID.ScrollOfReindeerCall, rarity: ItemRarity.EPIC, weight: 10 },
            { itemId: ItemID.ScrollOfSnowStorm, rarity: ItemRarity.RARE, weight: 15 },
            
            // High-tier ornament grenades
            { itemId: ItemID.SilverOrnamentGrenade, rarity: ItemRarity.RARE, weight: 12 },
            { itemId: ItemID.GoldOrnamentGrenade, rarity: ItemRarity.EPIC, weight: 6 },
            { itemId: ItemID.PlatinumOrnamentGrenade, rarity: ItemRarity.LEGENDARY, weight: 2 },
            
            // Special consumables
            { itemId: ItemID.AngelFeatherRevive, rarity: ItemRarity.LEGENDARY, weight: 2 },
            { itemId: ItemID.PotionOfCureDisease, rarity: ItemRarity.RARE, weight: 8 }
        ],
        rarityBias: 1
    },

    // Barrel - Consumables only
    [LootTableID.BARREL]: {
        id: LootTableID.BARREL,
        name: 'Barrel Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 45, quantity: { min: 1, max: 5 } },
            { itemId: ItemID.HotCocoa, rarity: ItemRarity.COMMON, weight: 35 },
            { itemId: ItemID.Marshmallow, rarity: ItemRarity.COMMON, weight: 25, quantity: { min: 2, max: 5 } },
            
            // Various throwables
            { itemId: ItemID.Snowball, rarity: ItemRarity.COMMON, weight: 30, quantity: { min: 3, max: 6 } },
            { itemId: ItemID.PackedSnowball, rarity: ItemRarity.COMMON, weight: 20, quantity: { min: 2, max: 4 } },
            { itemId: ItemID.YellowSnowball, rarity: ItemRarity.UNCOMMON, weight: 10, quantity: { min: 1, max: 3 } },
            { itemId: ItemID.YellowSnowball, rarity: ItemRarity.UNCOMMON, weight: 10, quantity: { min: 1, max: 3 } },
            
            // Lower-tier ornament grenades
            { itemId: ItemID.CrackedOrnamentGrenade, rarity: ItemRarity.COMMON, weight: 8, quantity: { min: 1, max: 2 } },
            
            // Special consumables (small chance)
            { itemId: ItemID.UnlabeledPotion, rarity: ItemRarity.UNCOMMON, weight: 5 },
            { itemId: ItemID.ChampagneFlute, rarity: ItemRarity.UNCOMMON, weight: 3 }
        ]
    },

    // Puzzle Chest - reward for solving puzzles
    [LootTableID.PUZZLE_CHEST]: {
        id: LootTableID.PUZZLE_CHEST,
        name: 'Puzzle Chest Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 70, quantity: { min: 15, max: 30 } },
            
            // Guaranteed progression reward for solving puzzles
            { itemId: ItemID.StarCookie, rarity: ItemRarity.EPIC, weight: 25 },
            { itemId: ItemID.LiquidCourage, rarity: ItemRarity.EPIC, weight: 20 },
            { itemId: ItemID.SantasCookie, rarity: ItemRarity.LEGENDARY, weight: 5 },
            
            // Excellent scrolls
            { itemId: ItemID.ScrollOfEnchantment, rarity: ItemRarity.RARE, weight: 40 },
            { itemId: ItemID.ScrollOfElvenCraftsmanship, rarity: ItemRarity.EPIC, weight: 15 },
            { itemId: ItemID.ScrollOfMapping, rarity: ItemRarity.RARE, weight: 35 },
            { itemId: ItemID.ScrollOfMistletoePortal, rarity: ItemRarity.EPIC, weight: 12 },
            
            // Utility scrolls
            { itemId: ItemID.ScrollOfSantasSight, rarity: ItemRarity.UNCOMMON, weight: 20 },
            { itemId: ItemID.ScrollOfElvenBlessing, rarity: ItemRarity.RARE, weight: 15 },
            
            // Keys and special items
            { itemId: ItemID.ChristmasKey, rarity: ItemRarity.RARE, weight: 30 },
            { itemId: ItemID.ChristmasWishBone, rarity: ItemRarity.RARE, weight: 12 },
            { itemId: ItemID.PotionOfCureDisease, rarity: ItemRarity.RARE, weight: 10 }
        ],
        rarityBias: 2
    },

    // Enemy loot - Mainly resources, small chance of progression
    [LootTableID.SnowmanLoot]: {
        id: LootTableID.SnowmanLoot,
        name: 'Snowman Enemy Loot',
        entries: [
            { itemId: ItemID.Snowball, rarity: ItemRarity.COMMON, weight: 35, quantity: { min: 2, max: 4 } },
            { itemId: ItemID.YellowSnowball, rarity: ItemRarity.UNCOMMON, weight: 15, quantity: { min: 1, max: 2 } },
            { itemId: ItemID.PackedSnowball, rarity: ItemRarity.COMMON, weight: 20, quantity: { min: 1, max: 3 } },
            
            // Small chance of consumables
            { itemId: ItemID.HotCocoa, rarity: ItemRarity.COMMON, weight: 10 },
            { itemId: ItemID.ScrollOfWinterWarmth, rarity: ItemRarity.UNCOMMON, weight: 3 },
            
            { itemId: ItemID.LiquidCourage, rarity: ItemRarity.EPIC, weight: 1 } // Very rare
        ]
    },

    [LootTableID.SnowSpriteLoot]: {
        id: LootTableID.SnowSpriteLoot,
        name: 'Snow Sprite Enemy Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 45, quantity: { min: 1, max: 3 } },
            { itemId: ItemID.Iceball, rarity: ItemRarity.UNCOMMON, weight: 25, quantity: { min: 1, max: 2 } },
            { itemId: ItemID.YellowSnowball, rarity: ItemRarity.UNCOMMON, weight: 12, quantity: { min: 1, max: 2 } },
            
            // Sprite-specific magic drops
            { itemId: ItemID.ScrollOfFrost, rarity: ItemRarity.UNCOMMON, weight: 18 },
            { itemId: ItemID.ScrollOfSnowStorm, rarity: ItemRarity.RARE, weight: 8 },
            { itemId: ItemID.ScrollOfElvenBlessing, rarity: ItemRarity.RARE, weight: 5 },
            
            // Small chance of progression
            { itemId: ItemID.StarCookie, rarity: ItemRarity.EPIC, weight: 1 }
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
            // Basic magic scrolls
            { itemId: ItemID.ScrollOfFrost, rarity: ItemRarity.UNCOMMON, weight: 35 },
            { itemId: ItemID.ScrollOfSnowStorm, rarity: ItemRarity.RARE, weight: 25 },
            { itemId: ItemID.ScrollOfMapping, rarity: ItemRarity.RARE, weight: 18 },
            { itemId: ItemID.ScrollOfEnchantment, rarity: ItemRarity.RARE, weight: 15 },
            { itemId: ItemID.ScrollOfTeleport, rarity: ItemRarity.UNCOMMON, weight: 20 },
            
            // Christmas magic
            { itemId: ItemID.ScrollOfChristmasSpirit, rarity: ItemRarity.RARE, weight: 12 },
            { itemId: ItemID.ScrollOfSantasBlessing, rarity: ItemRarity.LEGENDARY, weight: 3 },
            
            // Utility magic
            { itemId: ItemID.ScrollOfSantasSight, rarity: ItemRarity.UNCOMMON, weight: 15 },
            { itemId: ItemID.ScrollOfElvenBlessing, rarity: ItemRarity.RARE, weight: 10 },
            
            // Advanced magic
            { itemId: ItemID.ScrollOfJingleAll, rarity: ItemRarity.RARE, weight: 8 },
            { itemId: ItemID.ScrollOfMistletoePortal, rarity: ItemRarity.EPIC, weight: 5 },
            { itemId: ItemID.ScrollOfElvenCraftsmanship, rarity: ItemRarity.EPIC, weight: 4 },
            
            // Basic consumable
            { itemId: ItemID.HotCocoa, rarity: ItemRarity.COMMON, weight: 40 },
            { itemId: ItemID.UnlabeledPotion, rarity: ItemRarity.UNCOMMON, weight: 8 }
        ],
        rarityBias: 1
    },

    // Floor-based loot
    [LootTableID.FloorGeneral]: {
        id: LootTableID.FloorGeneral,
        name: 'General Floor Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 60, quantity: { min: 1, max: 5 } },
            { itemId: ItemID.HotCocoa, rarity: ItemRarity.COMMON, weight: 35 },
            { itemId: ItemID.Marshmallow, rarity: ItemRarity.COMMON, weight: 20, quantity: { min: 1, max: 3 } },
            { itemId: ItemID.CandyCane, rarity: ItemRarity.COMMON, weight: 15, quantity: { min: 1, max: 3 } },
            
            // Equipment (Small chance on floor)
            { itemId: ItemID.CandyCaneSpear, rarity: ItemRarity.COMMON, weight: 8 },
            { itemId: ItemID.CozySweater, rarity: ItemRarity.COMMON, weight: 8 },
            { itemId: ItemID.WeakSword, rarity: ItemRarity.COMMON, weight: 8 },
            { itemId: ItemID.SparklerWand, rarity: ItemRarity.COMMON, weight: 5 },
            
            // Throwables
            { itemId: ItemID.Snowball, rarity: ItemRarity.COMMON, weight: 25, quantity: { min: 1, max: 4 } },
            { itemId: ItemID.PackedSnowball, rarity: ItemRarity.COMMON, weight: 15, quantity: { min: 1, max: 3 } },
            { itemId: ItemID.Iceball, rarity: ItemRarity.UNCOMMON, weight: 8, quantity: { min: 1, max: 2 } },
            
            // Basic scrolls
            { itemId: ItemID.ScrollOfIdentify, rarity: ItemRarity.UNCOMMON, weight: 12 },
            { itemId: ItemID.ScrollOfMapping, rarity: ItemRarity.UNCOMMON, weight: 8 },
            { itemId: ItemID.ScrollOfWinterWarmth, rarity: ItemRarity.UNCOMMON, weight: 6 },
            
            // Essential progression items - appear every level or so
            { itemId: ItemID.LiquidCourage, rarity: ItemRarity.EPIC, weight: 8 },
            { itemId: ItemID.StarCookie, rarity: ItemRarity.EPIC, weight: 8 },
            
            // Misc
            { itemId: ItemID.Gem, rarity: ItemRarity.UNCOMMON, weight: 4 },
            { itemId: ItemID.ChristmasCandle, rarity: ItemRarity.COMMON, weight: 8 }
        ]
    },

    // === NEW MOB LOOT TABLES ===
    
    [LootTableID.FrostGiantLoot]: {
        id: LootTableID.FrostGiantLoot,
        name: 'Frost Giant Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 100, quantity: { min: 10, max: 30 } },
            { itemId: ItemID.TitaniumToyHammer, rarity: ItemRarity.EPIC, weight: 15 },
            { itemId: ItemID.HeavyPlateArmor, rarity: ItemRarity.RARE, weight: 15 },
            { itemId: ItemID.Iceball, rarity: ItemRarity.UNCOMMON, weight: 40, quantity: { min: 3, max: 6 } }
        ]
    },

    [LootTableID.EvilElfLoot]: {
        id: LootTableID.EvilElfLoot,
        name: 'Evil Elf Loot',
        entries: [
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 40, quantity: { min: 2, max: 8 } },
            { itemId: ItemID.CandyCaneSpear, rarity: ItemRarity.COMMON, weight: 25 },
            { itemId: ItemID.ScrollOfMistletoePortal, rarity: ItemRarity.EPIC, weight: 2 },
            { itemId: ItemID.PackedSnowball, rarity: ItemRarity.COMMON, weight: 30 }
        ]
    },

    [LootTableID.GingerbreadGolemLoot]: {
        id: LootTableID.GingerbreadGolemLoot,
        name: 'Gingerbread Golem Loot',
        entries: [
            { itemId: ItemID.StarCookie, rarity: ItemRarity.EPIC, weight: 10 },
            { itemId: ItemID.Marshmallow, rarity: ItemRarity.COMMON, weight: 50, quantity: { min: 1, max: 3 } },
            { itemId: ItemID.HotCocoa, rarity: ItemRarity.COMMON, weight: 30 }
        ]
    },

    [LootTableID.NutcrackerSoldierLoot]: {
        id: LootTableID.NutcrackerSoldierLoot,
        name: 'Nutcracker Soldier Loot',
        entries: [
            { itemId: ItemID.NutcrackerHammer, rarity: ItemRarity.LEGENDARY, weight: 5 },
            { itemId: ItemID.WoodenToyHammer, rarity: ItemRarity.COMMON, weight: 40 },
            { itemId: ItemID.GoldCoin, rarity: ItemRarity.COMMON, weight: 60 }
        ]
    },

    [LootTableID.IceSpiderLoot]: {
        id: LootTableID.IceSpiderLoot,
        name: 'Ice Spider Loot',
        entries: [
            { itemId: ItemID.SharpIcicleDagger, rarity: ItemRarity.RARE, weight: 15 },
            { itemId: ItemID.IcicleDagger, rarity: ItemRarity.UNCOMMON, weight: 25 },
            { itemId: ItemID.Iceball, rarity: ItemRarity.UNCOMMON, weight: 30 }
        ]
    },

    [LootTableID.IceWraithLoot]: {
        id: LootTableID.IceWraithLoot,
        name: 'Ice Wraith Loot',
        entries: [
            { itemId: ItemID.ScrollOfFrost, rarity: ItemRarity.UNCOMMON, weight: 25 },
            { itemId: ItemID.ScrollOfSnowStorm, rarity: ItemRarity.RARE, weight: 10 },
            { itemId: ItemID.RingOfFrost, rarity: ItemRarity.RARE, weight: 5 }
        ]
    },

    [LootTableID.CorruptedSantaLoot]: {
        id: LootTableID.CorruptedSantaLoot,
        name: 'Corrupted Santa Loot',
        entries: [
            { itemId: ItemID.SantaSuit, rarity: ItemRarity.LEGENDARY, weight: 100 },
            { itemId: ItemID.ChristmasStar, rarity: ItemRarity.UNIQUE, weight: 50 },
            { itemId: ItemID.GrandFinaleWand, rarity: ItemRarity.LEGENDARY, weight: 50 },
            { itemId: ItemID.SantasCookie, rarity: ItemRarity.LEGENDARY, weight: 100 },
            { itemId: ItemID.AngelFeatherRevive, rarity: ItemRarity.LEGENDARY, weight: 50 }
        ],
        rarityBias: 5
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