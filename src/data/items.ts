import * as ex from 'excalibur';
import { Resources } from '../config/resources';
import { EnchantmentType, CurseType } from './enchantments';
import { ItemID } from '../constants/ItemIDs';
import { AbilityID } from '../constants/AbilityIDs';
import { EffectID } from '../constants/EffectIDs';

export enum ItemType {
    WEAPON = 'weapon',
    ARMOR = 'armor',
    CONSUMABLE = 'consumable',
    ARTIFACT = 'artifact',
    MISC = 'misc'
}

export enum ItemRarity {
    COMMON = 'common',
    UNCOMMON = 'uncommon', 
    RARE = 'rare',
    EPIC = 'epic',
    LEGENDARY = 'legendary',
    UNIQUE = 'unique'
}

export enum EquipmentSlotType {
    MainHand = 'mainHand',
    Body = 'body',
    Accessory = 'accessory'
}

export interface ItemGraphics {
    col?: number; // 2D coordinate column
    row?: number; // 2D coordinate row
    resource?: ex.ImageSource; // Required for rendering
}

export interface ItemStats {
    damage?: number;
    defense?: number;
    warmth?: number;
    weight?: number;
    durability?: number;
    accuracy?: number;
    strengthRequirement?: number;
}

export interface ItemEffect {
    type: string;
    value: number;
    duration?: number;
    condition?: string;
    chance?: number;
}

export interface ItemDefinition {
    id: string;
    name: string;
    type: ItemType;
    rarity: ItemRarity;
    graphics: ItemGraphics;
    description: string;
    stats?: ItemStats;
    effects?: ItemEffect[];
    stackable?: boolean;
    maxStack?: number;
    sellValue?: number;
    craftingMaterial?: boolean;
    requiredLevel?: number;
    allowedEnchantments?: EnchantmentType[];
    possibleCurses?: CurseType[];
    cursed?: boolean;
    tags: string[];
}

// Standard graphics configuration for items - DEPRECATED in favor of per-item resource
export const ItemGraphicsConfig = {
    // kept for backward compatibility if needed, but should be unused
    spriteSheet: {
        resource: Resources.ItemsWeaponsPng, // Default to weapons
        grid: {
            rows: 8,
            columns: 8,
            spriteWidth: 32,
            spriteHeight: 32
        }
    }
};

// Clean data-first item definitions using ItemID enum as keys
export const ItemDefinitions: Record<ItemID, ItemDefinition> = {
    // === WEAPONS ===
    [ItemID.CandyCaneSpear]: {
        id: ItemID.CandyCaneSpear,
        name: 'Candy Cane Spear',
        type: ItemType.WEAPON,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 0, row: 0 },
        description: 'A festive spear made from an oversized candy cane',
        stats: {
            damage: 6,
            accuracy: 85,
            weight: 3,
            durability: 100,
            strengthRequirement: 11
        },
        allowedEnchantments: [EnchantmentType.SHARPNESS, EnchantmentType.FROST],
        possibleCurses: [CurseType.BRITTLE],
        tags: ['weapon', 'spear', 'festive']
    },

    [ItemID.IcicleDagger]: {
        id: ItemID.IcicleDagger,
        name: 'Icicle Dagger',
        type: ItemType.WEAPON,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 4, row: 0 },
        description: 'A razor-sharp dagger formed from ice magic',
        stats: {
            damage: 4,
            accuracy: 95,
            weight: 1,
            durability: 60
        },
        effects: [
            { type: EffectID.FrostChance, value: 15 }
        ],
        allowedEnchantments: [EnchantmentType.FROST, EnchantmentType.SHARPNESS],
        possibleCurses: [CurseType.MELTING, CurseType.BRITTLE],
        tags: ['weapon', 'dagger', EffectID.Ice, 'magic']
    },

    // Armor
    [ItemID.CozySweater]: {
        id: ItemID.CozySweater,
        name: 'Cozy Sweater',
        type: ItemType.ARMOR,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 3, row: 1 },
        description: 'A warm, hand-knitted sweater perfect for winter',
        stats: {
            defense: 2,
            warmth: 15,
            weight: 2,
            durability: 80
        },
        allowedEnchantments: [EnchantmentType.WARMTH, EnchantmentType.PROTECTION],
        possibleCurses: [CurseType.COLDNESS, CurseType.WEIGHT],
        tags: ['armor', 'clothing', 'warmth']
    },

    [ItemID.SantaSuit]: {
        id: ItemID.SantaSuit,
        name: 'Santa Suit',
        type: ItemType.ARMOR,
        rarity: ItemRarity.LEGENDARY,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 1, row: 0 },
        description: 'The legendary suit of Santa Claus himself',
        stats: {
            defense: 8,
            warmth: 50,
            weight: 3,
            durability: 200
        },
        effects: [
            { type: AbilityID.ChristmasSpirit, value: 25 },
            { type: EffectID.ColdImmunity, value: 100 }
        ],
        allowedEnchantments: [EnchantmentType.SANTA_BLESSED, EnchantmentType.CHRISTMAS_SPIRIT],
        tags: ['armor', 'legendary', 'santa', 'unique']
    },

    // Consumables
    [ItemID.HotCocoa]: {
        id: ItemID.HotCocoa,
        name: 'Hot Cocoa',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 0, row: 0 },
        description: 'A warm cup of cocoa that restores health and warmth',
        stackable: true,
        maxStack: 5,
        effects: [
            { type: AbilityID.Heal, value: 15 },
            { type: EffectID.WarmthRestore, value: 35 }
        ],
        sellValue: 5,
        tags: ['consumable', 'healing', 'warmth', 'drink']
    },

    [ItemID.Fruitcake]: {
        id: ItemID.Fruitcake,
        name: 'Fruitcake',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 1, row: 0 },
        description: 'Dense holiday cake. Provides sustenance but questionable taste',
        stackable: true,
        maxStack: 3,
        effects: [
            { type: AbilityID.Heal, value: 25 },
            { type: EffectID.StrengthBoost, value: 2, duration: 50 }
        ],
        sellValue: 12,
        tags: ['consumable', 'food', 'healing', 'holiday']
    },

    // Artifacts
    [ItemID.ChristmasStar]: {
        id: ItemID.ChristmasStar,
        name: 'Christmas Star',
        type: ItemType.ARTIFACT,
        rarity: ItemRarity.UNIQUE,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 3, row: 3 },
        description: 'A miraculous star that guides heroes through the darkest nights',
        effects: [
            { type: 'light_radius', value: 3 },
            { type: 'luck', value: 10 },
            { type: EffectID.WarmthGeneration, value: 5 }
        ],
        allowedEnchantments: [EnchantmentType.SANTA_BLESSED, EnchantmentType.LUCK],
        tags: ['artifact', 'light', 'unique', 'guidance']
    },

    // Misc
    [ItemID.GoldCoin]: {
        id: ItemID.GoldCoin,
        name: 'Gold Coin',
        type: ItemType.MISC,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsMiscPng, col: 4, row: 0 },
        description: 'Standard currency of the winter realm',
        stackable: true,
        maxStack: 999,
        sellValue: 1,
        tags: ['currency', 'valuable']
    },

    [ItemID.Coal]: {
        id: ItemID.Coal,
        name: ItemID.Coal,
        type: ItemType.MISC,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsMiscPng, col: 1, row: 1 },
        description: 'A lump of coal. Naughty children receive these instead of presents',
        stackable: true,
        maxStack: 50,
        craftingMaterial: true,
        effects: [
            { type: EffectID.Fuel, value: 10 }
        ],
        tags: ['fuel', 'naughty', 'crafting']
    },

    // === WEAPONS (Continue) ===
    // Weak Sword
    [ItemID.WeakSword]: {
        id: ItemID.WeakSword,
        name: 'Weak Sword',
        type: ItemType.WEAPON,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 5, row: 0 },
        description: 'A rusty old sword, better than nothing',
        stats: { damage: 3, accuracy: 70, weight: 4, durability: 50 },
        allowedEnchantments: [EnchantmentType.SHARPNESS],
        possibleCurses: [CurseType.BRITTLE, CurseType.WEIGHT],
        tags: ['weapon', 'sword', 'starter']
    },

    // Icicle Daggers (variations)
    [ItemID.MeltingIcicleDagger]: {
        id: ItemID.MeltingIcicleDagger,
        name: 'Melting Icicle Dagger',
        type: ItemType.WEAPON,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 1, row: 0 },
        description: 'An icicle dagger that\'s seen better days',
        stats: { damage: 3, accuracy: 90, weight: 1, durability: 30 },
        possibleCurses: [CurseType.MELTING],
        tags: ['weapon', 'dagger', EffectID.Ice]
    },

    [ItemID.FrostyIcicleDagger]: {
        id: ItemID.FrostyIcicleDagger,
        name: 'Frosty Icicle Dagger',
        type: ItemType.WEAPON,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 4, row: 0 },
        description: 'A well-formed icicle dagger',
        stats: { damage: 5, accuracy: 92, weight: 1, durability: 50 },
        effects: [{ type: EffectID.FrostChance, value: 10 }],
        tags: ['weapon', 'dagger', EffectID.Ice]
    },

    [ItemID.SharpIcicleDagger]: {
        id: ItemID.SharpIcicleDagger,
        name: 'Sharp Icicle Dagger',
        type: ItemType.WEAPON,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 2, row: 0 },
        description: 'An exceptionally sharp icicle dagger',
        stats: { damage: 7, accuracy: 95, weight: 1, durability: 70 },
        effects: [{ type: EffectID.FrostChance, value: 20 }],
        tags: ['weapon', 'dagger', EffectID.Ice]
    },

    [ItemID.PerfectIcicleDagger]: {
        id: ItemID.PerfectIcicleDagger,
        name: 'Perfect Icicle Dagger',
        type: ItemType.WEAPON,
        rarity: ItemRarity.EPIC,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 3, row: 0 },
        description: 'A flawless icicle dagger of legendary sharpness',
        stats: { damage: 10, accuracy: 98, weight: 1, durability: 100 },
        effects: [{ type: EffectID.FrostChance, value: 30 }],
        tags: ['weapon', 'dagger', EffectID.Ice, 'perfect']
    },

    // Toy Hammers
    [ItemID.BrokenToyHammer]: {
        id: ItemID.BrokenToyHammer,
        name: 'Broken Toy Hammer',
        type: ItemType.WEAPON,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 6, row: 0 },
        description: 'A toy hammer that\'s seen too much use',
        stats: { damage: 4, accuracy: 65, weight: 3, durability: 20 },
        tags: ['weapon', 'hammer', 'toy']
    },

    // New Heavy Weapons (Hammers - High Strength)
    [ItemID.TitaniumToyHammer]: {
        id: ItemID.TitaniumToyHammer, // Needs ID in constants
        name: 'Titanium Toy Hammer',
        type: ItemType.WEAPON,
        rarity: ItemRarity.EPIC,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 2, row: 1 }, // Steel Toy Hammer sprite
        description: 'Incredibly heavy toy hammer made of titanium',
        stats: { damage: 16, accuracy: 75, weight: 8, durability: 200, strengthRequirement: 16 },
        tags: ['weapon', 'hammer', 'heavy']
    },
    
    // === NEW ARMOR (High Str Req) ===
    [ItemID.HeavyPlateArmor]: {
        id: ItemID.HeavyPlateArmor, // Needs ID
        name: 'Heavy Plate Armor',
        type: ItemType.ARMOR,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 6, row: 0 }, // Thick Ice Plate sprite
        description: 'Thick plating for heavy protection',
        stats: { defense: 6, warmth: 20, weight: 8, durability: 150, strengthRequirement: 15 },
        tags: ['armor', 'heavy']
    },

    [ItemID.WoodenToyHammer]: {
        id: ItemID.WoodenToyHammer,
        name: 'Wooden Toy Hammer',
        type: ItemType.WEAPON,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 7, row: 0 },
        description: 'A sturdy wooden toy hammer',
        stats: { damage: 6, accuracy: 75, weight: 3, durability: 60 },
        tags: ['weapon', 'hammer', 'toy']
    },

    [ItemID.SteelToyHammer]: {
        id: ItemID.SteelToyHammer,
        name: 'Steel Toy Hammer',
        type: ItemType.WEAPON,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 2, row: 1 },
        description: 'A toy hammer reinforced with steel',
        stats: { damage: 9, accuracy: 80, weight: 4, durability: 100 },
        tags: ['weapon', 'hammer', 'toy']
    },

    [ItemID.EnchantedToyHammer]: {
        id: ItemID.EnchantedToyHammer,
        name: 'Enchanted Toy Hammer',
        type: ItemType.WEAPON,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 3, row: 1 },
        description: 'A toy hammer imbued with magic',
        stats: { damage: 12, accuracy: 85, weight: 3, durability: 120 },
        effects: [{ type: EffectID.StunChance, value: 15 }],
        tags: ['weapon', 'hammer', 'toy', 'magic']
    },

    [ItemID.NutcrackerHammer]: {
        id: ItemID.NutcrackerHammer,
        name: 'Nutcracker Hammer',
        type: ItemType.WEAPON,
        rarity: ItemRarity.LEGENDARY,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 2, row: 1 },
        description: 'The legendary hammer of the Nutcracker himself',
        stats: { damage: 18, accuracy: 90, weight: 3, durability: 200 },
        effects: [
            { type: EffectID.StunChance, value: 25 },
            { type: EffectID.ArmorBreak, value: 3 }
        ],
        tags: ['weapon', 'hammer', 'toy', 'legendary', 'nutcracker']
    },

    [ItemID.HolidayHammer]: {
        id: ItemID.HolidayHammer,
        name: 'Holiday Hammer',
        type: ItemType.WEAPON,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 3, row: 1 }, // Fallback to Enchanted
        description: 'A festive hammer that packs a punch',
        stats: { damage: 14, accuracy: 88, weight: 4, durability: 150 },
        effects: [
            { type: EffectID.Knockback, value: 2 }
        ],
        tags: ['weapon', 'hammer', 'holiday']
    },

    // === CONSUMABLES (Comprehensive) ===
    // Projectiles
    [ItemID.Snowball]: {
        id: ItemID.Snowball,
        name: 'Snowball',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 2, row: 2 },
        description: 'A simple snowball for throwing',
        stackable: true,
        maxStack: 20,
        effects: [{ type: EffectID.Damage, value: 3 }],
        tags: ['consumable', 'projectile', 'throwable']
    },

    [ItemID.PackedSnowball]: {
        id: ItemID.PackedSnowball,
        name: 'Packed Snowball',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 2, row: 2 },
        description: 'A densely packed snowball',
        stackable: true,
        maxStack: 15,
        effects: [{ type: EffectID.Damage, value: 5 }],
        tags: ['consumable', 'projectile', 'throwable']
    },

    [ItemID.Iceball]: {
        id: ItemID.Iceball,
        name: 'Iceball',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 3, row: 2 },
        description: 'A frozen ball of ice',
        stackable: true,
        maxStack: 10,
        effects: [
            { type: EffectID.Damage, value: 8 },
            { type: EffectID.SlowChance, value: 30 }
        ],
        tags: ['consumable', 'projectile', 'throwable', EffectID.Ice]
    },

    // Scrolls (massive collection)
    [ItemID.ScrollOfEnchantment]: {
        id: ItemID.ScrollOfEnchantment,
        name: 'Scroll of Enchantment',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 6, row: 2 },
        description: 'Adds a random enchantment to an item',
        stackable: false,
        effects: [{ type: EffectID.EnchantRandom, value: 1 }],
        tags: ['consumable', 'scroll', 'enchantment']
    },

    [ItemID.ScrollOfMapping]: {
        id: ItemID.ScrollOfMapping,
        name: 'Scroll of Mapping',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 7, row: 2 },
        description: 'Reveals the entire floor layout',
        stackable: true,
        maxStack: 5,
        effects: [{ type: EffectID.RevealMap, value: 1 }],
        tags: ['consumable', 'scroll', 'utility']
    },

    [ItemID.ScrollOfIdentify]: {
        id: ItemID.ScrollOfIdentify,
        name: 'Scroll of Identify',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 0, row: 3 },
        description: 'Identifies an unknown item',
        stackable: true,
        maxStack: 5,
        effects: [{ type: AbilityID.Identify, value: 1 }],
        tags: ['consumable', 'scroll', 'utility']
    },

    [ItemID.ScrollOfRemoveCurse]: {
        id: ItemID.ScrollOfRemoveCurse,
        name: 'Scroll of Remove Curse',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 1, row: 3 },
        description: 'Removes curses from an item',
        stackable: true,
        maxStack: 3,
        effects: [{ type: EffectID.RemoveCurse, value: 1 }],
        tags: ['consumable', 'scroll', 'utility', 'curse']
    },

    [ItemID.ScrollOfTeleport]: {
        id: ItemID.ScrollOfTeleport,
        name: 'Scroll of Teleport',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 2, row: 3 },
        description: 'Teleports you to a random location',
        stackable: true,
        maxStack: 5,
        effects: [{ type: EffectID.TeleportRandom, value: 1 }],
        tags: ['consumable', 'scroll', 'utility', 'escape']
    },

    // Permanent Progression
    [ItemID.StarCookie]: {
        id: ItemID.StarCookie,
        name: 'Star Cookie',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.EPIC,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 2, row: 0 },
        description: 'Permanently increases max HP',
        stackable: false,
        effects: [{ type: EffectID.MaxHpIncrease, value: 5 }],
        tags: ['consumable', 'permanent', 'progression']
    },

    [ItemID.LiquidCourage]: {
        id: ItemID.LiquidCourage,
        name: 'Liquid Courage',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.EPIC,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 5, row: 0 },
        description: 'Permanently increases strength',
        stackable: false,
        effects: [{ type: EffectID.StrengthPermanent, value: 1 }],
        tags: ['consumable', 'permanent', 'progression']
    },

    [ItemID.SantasCookie]: {
        id: ItemID.SantasCookie,
        name: 'Santa\'s Cookie',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.LEGENDARY,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 3, row: 0 },
        description: 'A cookie blessed by Santa himself',
        stackable: false,
        effects: [
            { type: AbilityID.Heal, value: 50 },
            { type: EffectID.MaxHpIncrease, value: 10 },
            { type: AbilityID.ChristmasSpirit, value: 100 }
        ],
        tags: ['consumable', 'permanent', 'legendary', 'santa']
    },

    // === ARTIFACTS ===
    // Rings
    [ItemID.RingOfFrost]: {
        id: ItemID.RingOfFrost,
        name: 'Ring of Frost',
        type: ItemType.ARTIFACT,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 3, row: 1 },
        description: 'Grants resistance to cold',
        effects: [
            { type: EffectID.ColdResistance, value: 50 },
            { type: EffectID.FrostDamageBonus, value: 2 }
        ],
        tags: ['artifact', 'ring', 'frost', 'resistance']
    },

    [ItemID.RingOfWarmth]: {
        id: ItemID.RingOfWarmth,
        name: 'Ring of Warmth',
        type: ItemType.ARTIFACT,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 4, row: 1 },
        description: 'Provides constant warmth',
        effects: [{ type: EffectID.WarmthGeneration, value: 3 }],
        tags: ['artifact', 'ring', 'warmth']
    },

    [ItemID.RingOfHaste]: {
        id: ItemID.RingOfHaste,
        name: 'Ring of Haste',
        type: ItemType.ARTIFACT,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 5, row: 1 },
        description: 'Increases speed',
        effects: [{ type: EffectID.SpeedBoost, value: 20 }],
        tags: ['artifact', 'ring', 'speed']
    },

    // Special Artifacts
    [ItemID.SnowGlobe]: {
        id: ItemID.SnowGlobe,
        name: 'Snow Globe',
        type: ItemType.ARTIFACT,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 0, row: 3 },
        description: 'A magical snow globe that protects its owner',
        effects: [
            { type: EffectID.DefenseBoost, value: 3 },
            { type: EffectID.ColdImmunity, value: 25 }
        ],
        tags: ['artifact', 'protection', 'winter']
    },

    [ItemID.ReindeerBell]: {
        id: ItemID.ReindeerBell,
        name: 'Reindeer Bell',
        type: ItemType.ARTIFACT,
        rarity: ItemRarity.EPIC,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 1, row: 3 },
        description: 'Summons reindeer to aid you',
        effects: [
            { type: EffectID.MovementSpeed, value: 15 },
            { type: EffectID.DashCooldownReduction, value: 2 }
        ],
        tags: ['artifact', 'reindeer', 'movement']
    },

    [ItemID.ElvenCompass]: {
        id: ItemID.ElvenCompass,
        name: 'Elven Compass',
        type: ItemType.ARTIFACT,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 2, row: 3 },
        description: 'Always points to the stairs',
        effects: [
            { type: EffectID.StairsDetection, value: 1 },
            { type: EffectID.TreasureDetection, value: 5 }
        ],
        tags: ['artifact', 'elf', 'utility', 'detection']
    },

    // === MISC/KEYS ===
    [ItemID.Gold]: {
        id: ItemID.Gold,
        name: 'Gold',
        type: ItemType.MISC,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsMiscPng, col: 4, row: 0 },
        description: 'Currency of the realm',
        stackable: true,
        maxStack: 9999,
        sellValue: 1,
        tags: ['currency', ItemID.Gold]
    },

    [ItemID.ChristmasKey]: {
        id: ItemID.ChristmasKey,
        name: 'Christmas Key',
        type: ItemType.MISC,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsMiscPng, col: 0, row: 0 },
        description: 'Opens Christmas chests',
        stackable: true,
        maxStack: 10,
        tags: ['key', 'christmas', 'utility']
    },

    [ItemID.SilverKey]: {
        id: ItemID.SilverKey,
        name: 'Silver Key',
        type: ItemType.MISC,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsMiscPng, col: 1, row: 0 },
        description: 'Opens silver doors',
        stackable: true,
        maxStack: 5,
        tags: ['key', 'utility']
    },

    [ItemID.GoldKey]: {
        id: ItemID.GoldKey,
        name: 'Gold Key',
        type: ItemType.MISC,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsMiscPng, col: 0, row: 0 },
        description: 'Opens gold doors',
        stackable: true,
        maxStack: 3,
        tags: ['key', 'utility']
    },

    [ItemID.BoneKey]: {
        id: ItemID.BoneKey,
        name: 'Bone Key',
        type: ItemType.MISC,
        rarity: ItemRarity.EPIC,
        graphics: { resource: Resources.ItemsMiscPng, col: 1, row: 0 },
        description: 'Opens ancient bone doors',
        stackable: true,
        maxStack: 1,
        tags: ['key', 'utility', 'rare']
    },
    
    // === NEW MISC ITEMS from items_misc.yaml ===
    [ItemID.NaughtyList]: {
        id: ItemID.NaughtyList,
        name: 'Naughty List',
        type: ItemType.MISC,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsMiscPng, col: 1, row: 1 },
        description: 'A scroll containing names of naughty children',
        sellValue: 10,
        tags: ['quest', 'paper']
    },

    [ItemID.ChristmasCandle]: {
        id: ItemID.ChristmasCandle,
        name: 'Christmas Candle',
        type: ItemType.MISC, // Could be artifact if it gives light
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsMiscPng, col: 2, row: 1 },
        description: 'A candle that never melts',
        effects: [{ type: 'light_radius', value: 2 }],
        tags: ['light', 'decor']
    },

    [ItemID.NewYearsClock]: {
        id: ItemID.NewYearsClock,
        name: 'New Year\'s Clock',
        type: ItemType.MISC,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsMiscPng, col: 0, row: 1 },
        description: 'Tick tock...',
        sellValue: 50,
        tags: ['valuable', 'clock']
    },

    [ItemID.ChampagneFlute]: {
        id: ItemID.ChampagneFlute,
        name: 'Champagne Flute',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsMiscPng, col: 2, row: 1 },
        description: 'A bubbly celebration drink',
        effects: [
            { type: AbilityID.Heal, value: 10 },
            { type: EffectID.Confusion, value: 5 } // Tip: don't drink too much
        ],
        tags: ['drink', 'alcohol']
    },

    [ItemID.CountdownCalendar]: {
        id: ItemID.CountdownCalendar,
        name: 'Countdown Calendar',
        type: ItemType.MISC,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsMiscPng, col: 3, row: 1 },
        description: 'Tracks the days until Christmas',
        tags: ['quest', 'paper']
    },

    [ItemID.ChristmasWishBone]: {
        id: ItemID.ChristmasWishBone,
        name: 'Christmas Wish Bone',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsMiscPng, col: 4, row: 1 },
        description: 'Make a wish!',
        effects: [{ type: 'luck_boost', value: 50, duration: 100 }],
        tags: ['luck', 'bone']
    },

    [ItemID.WrappedGift]: {
        id: ItemID.WrappedGift,
        name: 'Wrapped Gift',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsMiscPng, col: 5, row: 1 },
        description: 'Who knows what\'s inside?',
        effects: [{ type: 'unwrap_gift', value: 1 }], // Special marker for EffectExecutor
        tags: ['gift', 'mystery']
    },

    [ItemID.MagicStocking]: {
        id: ItemID.MagicStocking,
        name: 'Magic Stocking',
        type: ItemType.ARTIFACT, // Container?
        rarity: ItemRarity.EPIC,
        graphics: { resource: Resources.ItemsMiscPng, col: 6, row: 1 },
        description: 'Periodically generates small items',
        tags: ['artifact', 'container']
    },

    [ItemID.FrozenHeart]: {
        id: ItemID.FrozenHeart,
        name: 'Frozen Heart',
        type: ItemType.ARTIFACT, // Crafting material or artifact
        rarity: ItemRarity.LEGENDARY,
        graphics: { resource: Resources.ItemsMiscPng, col: 1, row: 2 },
        description: 'The heart of a powerful ice being',
        tags: ['artifact', 'ice', 'crafting']
    },

    [ItemID.KrampusHorn]: {
        id: ItemID.KrampusHorn, // Already used in loot table?
        name: 'Krampus Horn',
        type: ItemType.ARTIFACT,
        rarity: ItemRarity.EPIC,
        graphics: { resource: Resources.ItemsMiscPng, col: 2, row: 2 },
        description: 'Can be blown to scare enemies',
        effects: [{ type: 'fear_aura', value: 3 }],
        tags: ['artifact', 'horn']
    },

    [ItemID.Gem]: {
        id: ItemID.Gem,
        name: 'Gem',
        type: ItemType.MISC,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsMiscPng, col: 3, row: 2 },
        description: 'A sparkling gemstone',
        sellValue: 25,
        tags: ['valuable', 'currency']
    },

    // === CHRISTMAS WANDS (Complete Collection) ===
    [ItemID.SparklerWand]: {
        id: ItemID.SparklerWand,
        name: 'Sparkler Wand',
        type: ItemType.WEAPON,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 0, row: 2 },
        description: 'A wand that shoots sparkles',
        stats: { damage: 4, accuracy: 85, weight: 1 },
        effects: [{ type: EffectID.FireDamage, value: 2 }],
        tags: ['weapon', 'wand', EffectID.Fire]
    },

    [ItemID.CandlestickWand]: {
        id: ItemID.CandlestickWand,
        name: 'Candlestick Wand',
        type: ItemType.WEAPON,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 1, row: 2 },
        description: 'A magical candlestick',
        stats: { damage: 5, accuracy: 80, weight: 2 },
        effects: [{ type: EffectID.Light, value: 2 }],
        tags: ['weapon', 'wand', 'light']
    },

    [ItemID.HollyWand]: {
        id: ItemID.HollyWand,
        name: 'Holly Wand',
        type: ItemType.WEAPON,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 2, row: 2 },
        description: 'Wand wrapped in holly',
        stats: { damage: 6, accuracy: 85, weight: 1 },
        effects: [{ type: EffectID.NatureDamage, value: 3 }],
        tags: ['weapon', 'wand', 'nature']
    },

    [ItemID.MistletoeWand]: {
        id: ItemID.MistletoeWand,
        name: 'Mistletoe Wand',
        type: ItemType.WEAPON,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 3, row: 2 },
        description: 'Wand of festive magic',
        stats: { damage: 7, accuracy: 85, weight: 1 },
        effects: [{ type: EffectID.CharmChance, value: 10 }],
        tags: ['weapon', 'wand', 'charm']
    },

    [ItemID.ChristmasTreeStaff]: {
        id: ItemID.ChristmasTreeStaff,
        name: 'Christmas Tree Staff',
        type: ItemType.WEAPON,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 4, row: 2 },
        description: 'Staff shaped like a miniature Christmas tree',
        stats: { damage: 9, accuracy: 90, weight: 3 },
        effects: [{ type: AbilityID.ChristmasSpirit, value: 5 }],
        tags: ['weapon', 'staff', 'christmas']
    },

    [ItemID.StarTopperWand]: {
        id: ItemID.StarTopperWand,
        name: 'Star Topper Wand',
        type: ItemType.WEAPON,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 5, row: 2 },
        description: 'Wand topped with a bright star',
        stats: { damage: 10, accuracy: 90, weight: 1 },
        effects: [{ type: EffectID.LightBlast, value: 8 }],
        tags: ['weapon', 'wand', 'star', 'light']
    },

    [ItemID.JingleBellWand]: {
        id: ItemID.JingleBellWand,
        name: 'Jingle Bell Wand',
        type: ItemType.WEAPON,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 6, row: 2 },
        description: 'Every spell jingles merrily',
        stats: { damage: 8, accuracy: 88, weight: 1 },
        effects: [{ type: EffectID.SoundAttack, value: 6 }],
        tags: ['weapon', 'wand', 'sound']
    },

    [ItemID.GingerbreadWand]: {
        id: ItemID.GingerbreadWand,
        name: 'Gingerbread Wand',
        type: ItemType.WEAPON,
        rarity: ItemRarity.EPIC,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 7, row: 2 },
        description: 'Surprisingly powerful for a cookie',
        stats: { damage: 11, accuracy: 92, weight: 1 },
        effects: [{ type: EffectID.HealingOnHit, value: 2 }],
        tags: ['weapon', 'wand', 'food']
    },

    [ItemID.FireworksWand]: {
        id: ItemID.FireworksWand,
        name: 'Fireworks Wand',
        type: ItemType.WEAPON,
        rarity: ItemRarity.EPIC,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 0, row: 3 },
        description: 'Explosive festive magic',
        stats: { damage: 14, accuracy: 85, weight: 2 },
        effects: [{ type: EffectID.AoeDamage, value: 5 }],
        tags: ['weapon', 'wand', EffectID.Fire, 'aoe']
    },

    [ItemID.GrandFinaleWand]: {
        id: ItemID.GrandFinaleWand,
        name: 'Grand Finale Wand',
        type: ItemType.WEAPON,
        rarity: ItemRarity.LEGENDARY,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 1, row: 3 },
        description: 'The ultimate celebration of magic',
        stats: { damage: 20, accuracy: 95, weight: 2 },
        effects: [
            { type: 'aoe_damage', value: 10 },
            { type: 'stun_chance', value: 20 }
        ],
        tags: ['weapon', 'wand', 'legendary', 'aoe']
    },

    // === CHRISTMAS LIGHT WHIPS ===
    [ItemID.TangledChristmasLights]: {
        id: ItemID.TangledChristmasLights,
        name: 'Tangled Christmas Lights',
        type: ItemType.WEAPON,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 2, row: 3 },
        description: 'A mess of lights that somehow works as a weapon',
        stats: { damage: 5, accuracy: 70, weight: 2 },
        tags: ['weapon', 'whip', 'christmas']
    },



    [ItemID.ScrollOfFrost]: {
        id: ItemID.ScrollOfFrost,
        name: 'Scroll of Frost',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 7, row: 3 }, // Placeholder index
        description: 'Freezes enemies in a wide area',
        stackable: true,
        maxStack: 5,
        effects: [{ type: 'freeze_area', value: 1 }],
        tags: ['consumable', 'scroll', 'frost']
    },

    [ItemID.OldChristmasLights]: {
        id: ItemID.OldChristmasLights,
        name: 'Old Christmas Lights',
        type: ItemType.WEAPON,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 2, row: 3 },
        description: 'Vintage lights with character',
        stats: { damage: 7, accuracy: 75, weight: 2 },
        effects: [{ type: 'entangle_chance', value: 10 }],
        tags: ['weapon', 'whip', 'christmas']
    },

    [ItemID.BrightChristmasLights]: {
        id: ItemID.BrightChristmasLights,
        name: 'Bright Christmas Lights',
        type: ItemType.WEAPON,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 3, row: 3 },
        description: 'Dazzlingly bright festive lights',
        stats: { damage: 9, accuracy: 80, weight: 2 },
        effects: [
            { type: 'entangle_chance', value: 15 },
            { type: 'blind_chance', value: 10 }
        ],
        tags: ['weapon', 'whip', 'christmas', 'light']
    },

    [ItemID.LEDChristmasLights]: {
        id: ItemID.LEDChristmasLights,
        name: 'LED Christmas Lights',
        type: ItemType.WEAPON,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 3, row: 3 },
        description: 'Modern, efficient, and deadly',
        stats: { damage: 12, accuracy: 85, weight: 1 },
        effects: [
            { type: 'entangle_chance', value: 20 },
            { type: 'electric_damage', value: 5 }
        ],
        tags: ['weapon', 'whip', 'christmas', 'electric']
    },

    [ItemID.MagicalChristmasLights]: {
        id: ItemID.MagicalChristmasLights,
        name: 'Magical Christmas Lights',
        type: ItemType.WEAPON,
        rarity: ItemRarity.EPIC,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 4, row: 3 },
        description: 'Enchanted lights that never burn out',
        stats: { damage: 16, accuracy: 90, weight: 1 },
        effects: [
            { type: 'entangle_chance', value: 30 },
            { type: 'magic_damage', value: 8 }
        ],
        tags: ['weapon', 'whip', 'christmas', 'magic']
    },

    // === ARMOR VARIATIONS ===
    // Santa Suits (complete progression)
    [ItemID.TornSantaSuit]: {
        id: ItemID.TornSantaSuit,
        name: 'Torn Santa Suit',
        type: ItemType.ARMOR,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 2, row: 0 },
        description: 'A heavily worn Santa suit',
        stats: { defense: 2, warmth: 5, weight: 3 },
        tags: ['armor', 'santa', 'clothing']
    },

    [ItemID.TatteredSantaSuit]: {
        id: ItemID.TatteredSantaSuit,
        name: 'Tattered Santa Suit',
        type: ItemType.ARMOR,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 2, row: 0 },
        description: 'Slightly better than torn',
        stats: { defense: 4, warmth: 8, weight: 3 },
        tags: ['armor', 'santa', 'clothing']
    },

    [ItemID.ClassicSantaSuit]: {
        id: ItemID.ClassicSantaSuit,
        name: 'Classic Santa Suit',
        type: ItemType.ARMOR,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 1, row: 0 },
        description: 'The traditional red and white',
        stats: { defense: 6, warmth: 12, weight: 3 },
        effects: [{ type: AbilityID.ChristmasSpirit, value: 10 }],
        tags: ['armor', 'santa', 'clothing']
    },

    [ItemID.LuxurySantaSuit]: {
        id: ItemID.LuxurySantaSuit,
        name: 'Luxury Santa Suit',
        type: ItemType.ARMOR,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 3, row: 0 },
        description: 'Premium velvet and fur trim',
        stats: { defense: 10, warmth: 18, weight: 3 },
        effects: [{ type: AbilityID.ChristmasSpirit, value: 20 }],
        tags: ['armor', 'santa', 'clothing', 'luxury']
    },

    [ItemID.MagnificentSantaSuit]: {
        id: ItemID.MagnificentSantaSuit,
        name: 'Magnificent Santa Suit',
        type: ItemType.ARMOR,
        rarity: ItemRarity.LEGENDARY,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 4, row: 0 },
        description: 'The suit of Santa himself',
        stats: { defense: 15, warmth: 30, weight: 2 },
        effects: [
            { type: AbilityID.ChristmasSpirit, value: 50 },
            { type: 'gift_giving', value: 1 }
        ],
        tags: ['armor', 'santa', 'clothing', 'legendary']
    },

    // Ice Plates
    [ItemID.MeltingIcePlate]: {
        id: ItemID.MeltingIcePlate,
        name: 'Melting Ice Plate',
        type: ItemType.ARMOR,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 5, row: 0 },
        description: 'Ice armor that won\'t last long',
        stats: { defense: 3, warmth: -5, weight: 4 },
        possibleCurses: [CurseType.MELTING],
        tags: ['armor', EffectID.Ice]
    },

    [ItemID.ThinIcePlate]: {
        id: ItemID.ThinIcePlate,
        name: 'Thin Ice Plate',
        type: ItemType.ARMOR,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 5, row: 0 },
        description: 'Fragile but protective',
        stats: { defense: 5, warmth: -3, weight: 3 },
        tags: ['armor', EffectID.Ice]
    },

    [ItemID.ThickIcePlate]: {
        id: ItemID.ThickIcePlate,
        name: 'Thick Ice Plate',
        type: ItemType.ARMOR,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 6, row: 0 },
        description: 'Solid ice protection',
        stats: { defense: 8, warmth: 0, weight: 5 },
        effects: [{ type: 'cold_resistance', value: 25 }],
        tags: ['armor', EffectID.Ice]
    },

    [ItemID.EnchantedIcePlate]: {
        id: ItemID.EnchantedIcePlate,
        name: 'Enchanted Ice Plate',
        type: ItemType.ARMOR,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 6, row: 0 },
        description: 'Magically reinforced ice',
        stats: { defense: 12, warmth: 5, weight: 4 },
        effects: [
            { type: 'cold_resistance', value: 50 },
            { type: 'reflect_damage', value: 5 }
        ],
        tags: ['armor', EffectID.Ice, 'magic']
    },

    [ItemID.EternalIcePlate]: {
        id: ItemID.EternalIcePlate,
        name: 'Eternal Ice Plate',
        type: ItemType.ARMOR,
        rarity: ItemRarity.LEGENDARY,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 7, row: 0 },
        description: 'Ice that will never melt',
        stats: { defense: 18, warmth: 10, weight: 3 },
        effects: [
            { type: 'cold_immunity', value: 100 },
            { type: 'reflect_damage', value: 10 },
            { type: 'freeze_aura', value: 1 }
        ],
        tags: ['armor', EffectID.Ice, 'legendary']
    },

    // Christmas Cloaks
    [ItemID.TatteredElfCloak]: {
        id: ItemID.TatteredElfCloak,
        name: 'Tattered Elf Cloak',
        type: ItemType.ARMOR,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 0, row: 1 },
        description: 'A worn elven garment',
        stats: { defense: 1, warmth: 8, weight: 1 },
        tags: ['armor', 'cloak', 'elf']
    },

    [ItemID.ElfCloak]: {
        id: ItemID.ElfCloak,
        name: 'Elf Cloak',
        type: ItemType.ARMOR,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 0, row: 1 },
        description: 'Standard workshop attire',
        stats: { defense: 3, warmth: 12, weight: 1 },
        effects: [{ type: 'stealth', value: 10 }],
        tags: ['armor', 'cloak', 'elf']
    },

    [ItemID.MasterElfCloak]: {
        id: ItemID.MasterElfCloak,
        name: 'Master Elf Cloak',
        type: ItemType.ARMOR,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 1, row: 1 },
        description: 'Worn by santa\'s finest craftsmen',
        stats: { defense: 5, warmth: 15, weight: 1 },
        effects: [
            { type: 'stealth', value: 20 },
            { type: 'crafting_bonus', value: 2 }
        ],
        tags: ['armor', 'cloak', 'elf', 'master']
    },

    [ItemID.ReindeerHideCloak]: {
        id: ItemID.ReindeerHideCloak,
        name: 'Reindeer Hide Cloak',
        type: ItemType.ARMOR,
        rarity: ItemRarity.EPIC,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 2, row: 1 },
        description: 'Blessed by the flying reindeer',
        stats: { defense: 8, warmth: 25, weight: 2 },
        effects: [
            { type: 'movement_speed', value: 15 },
            { type: 'cold_resistance', value: 40 }
        ],
        tags: ['armor', 'cloak', 'reindeer', 'legendary']
    },

    // === REMAINING SCROLLS ===
    [ItemID.ScrollOfChristmasSpirit]: {
        id: ItemID.ScrollOfChristmasSpirit,
        name: 'Scroll of Christmas Spirit',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 6, row: 3 },
        description: 'Fills you with the joy of the season',
        stackable: true,
        maxStack: 3,
        effects: [{ type: AbilityID.ChristmasSpirit, value: 50 }],
        tags: ['consumable', 'scroll', 'christmas']
    },

    [ItemID.ScrollOfWinterWarmth]: {
        id: ItemID.ScrollOfWinterWarmth,
        name: 'Scroll of Winter Warmth',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 1, row: 3 },
        description: 'Provides protection from the cold',
        stackable: true,
        maxStack: 5,
        effects: [{ type: EffectID.WarmthRestore, value: 100 }],
        tags: ['consumable', 'scroll', 'warmth']
    },

    [ItemID.ScrollOfSantasBlessing]: {
        id: ItemID.ScrollOfSantasBlessing,
        name: 'Scroll of Santa\'s Blessing',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.LEGENDARY,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 5, row: 3 },
        description: 'A direct blessing from Santa Claus',
        stackable: false,
        effects: [
            { type: 'heal_full', value: 1 },
            { type: 'buff_all_stats', value: 5, duration: 100 }
        ],
        tags: ['consumable', 'scroll', 'santa', 'legendary']
    },

    // === ORNAMENT GRENADES ===
    [ItemID.CrackedOrnamentGrenade]: {
        id: ItemID.CrackedOrnamentGrenade,
        name: 'Cracked Ornament Grenade',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 5, row: 2 },
        description: 'Fragile explosive ornament',
        stackable: true,
        maxStack: 5,
        effects: [{ type: 'aoe_damage', value: 6 }],
        tags: ['consumable', 'grenade', 'explosive', 'ornament']
    },

    [ItemID.GlassOrnamentGrenade]: {
        id: ItemID.GlassOrnamentGrenade,
        name: 'Glass Ornament Grenade',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 5, row: 2 },
        description: 'Beautiful but deadly',
        stackable: true,
        maxStack: 5,
        effects: [{ type: 'aoe_damage', value: 10 }],
        tags: ['consumable', 'grenade', 'explosive', 'ornament']
    },

    [ItemID.SilverOrnamentGrenade]: {
        id: ItemID.SilverOrnamentGrenade,
        name: 'Silver Ornament Grenade',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 5, row: 2 },
        description: 'Premium explosive decoration',
        stackable: true,
        maxStack: 3,
        effects: [{ type: 'aoe_damage', value: 15 }],
        tags: ['consumable', 'grenade', 'explosive', 'ornament']
    },

    [ItemID.GoldOrnamentGrenade]: {
        id: ItemID.GoldOrnamentGrenade,
        name: 'Gold Ornament Grenade',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.EPIC,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 6, row: 2 },
        description: 'Gilded destruction',
        stackable: true,
        maxStack: 2,
        effects: [{ type: 'aoe_damage', value: 20 }],
        tags: ['consumable', 'grenade', 'explosive', 'ornament', ItemID.Gold]
    },

    [ItemID.PlatinumOrnamentGrenade]: {
        id: ItemID.PlatinumOrnamentGrenade,
        name: 'Platinum Ornament Grenade',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.LEGENDARY,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 6, row: 2 },
        description: 'The ultimate festive explosion',
        stackable: true,
        maxStack: 1,
        effects: [
            { type: 'aoe_damage', value: 30 },
            { type: 'stun_aoe', value: 2 }
        ],
        tags: ['consumable', 'grenade', 'explosive', 'ornament', 'legendary']
    },

    // === ADDITIONAL ARTIFACTS ===
    [ItemID.RingOfChristmasSpirit]: {
        id: ItemID.RingOfChristmasSpirit,
        name: 'Ring of Christmas Spirit',
        type: ItemType.ARTIFACT,
        rarity: ItemRarity.EPIC,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 3, row: 2 },
        description: 'Radiates festive joy',
        effects: [
            { type: AbilityID.ChristmasSpirit, value: 25 },
            { type: 'morale_boost', value: 10 }
        ],
        tags: ['artifact', 'ring', 'christmas']
    },

    // === UNIDENTIFIED/SPECIAL ===
    [ItemID.UnlabeledPotion]: {
        id: ItemID.UnlabeledPotion,
        name: 'Unlabeled Potion',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 0, row: 1 },
        description: 'Could be anything...',
        stackable: true,
        maxStack: 3,
        effects: [{ type: 'random_effect', value: 1 }],
        tags: ['consumable', 'potion', 'unidentified']
    },

    [ItemID.YellowSnowball]: {
        id: ItemID.YellowSnowball,
        name: 'Yellow Snowball',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 3, row: 2 },
        description: 'You don\'t want to know...',
        stackable: true,
        maxStack: 10,
        effects: [
            { type: 'damage', value: 4 },
            { type: 'poison_chance', value: 50 }
        ],
        tags: ['consumable', 'projectile', EffectID.Poison]
    },

    [ItemID.CoalSnowball]: {
        id: ItemID.CoalSnowball,
        name: 'Coal Snowball',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 4, row: 2 },
        description: 'Snowball with coal dust',
        stackable: true,
        maxStack: 15,
        effects: [
            { type: 'damage', value: 6 },
            { type: 'blind_chance', value: 30 }
        ],
        tags: ['consumable', 'projectile', 'coal']
    },

    // === FINAL MISSING ITEMS ===
    // Weapons
    [ItemID.PoinsettiaDagger]: {
        id: ItemID.PoinsettiaDagger,
        name: 'Poinsettia Dagger',
        type: ItemType.WEAPON,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 0, row: 0 },
        description: 'A blade shaped like a festive flower',
        stats: { damage: 8, accuracy: 90, weight: 1 },
        effects: [{ type: 'poison_chance', value: 20 }],
        tags: ['weapon', 'dagger', 'nature']
    },

    [ItemID.AngelWingsStaff]: {
        id: ItemID.AngelWingsStaff,
        name: 'Angel Wings Staff',
        type: ItemType.WEAPON,
        rarity: ItemRarity.EPIC,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 4, row: 2 },
        description: 'Blessed staff with angelic power',
        stats: { damage: 13, accuracy: 93, weight: 2 },
        effects: [
            { type: 'holy_damage', value: 6 },
            { type: 'healing_aura', value: 1 }
        ],
        tags: ['weapon', 'staff', EffectID.Holy, 'angel']
    },

    // Scrolls
    [ItemID.ScrollOfNiceList]: {
        id: ItemID.ScrollOfNiceList,
        name: 'Scroll of Nice List',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 0, row: 3 },
        description: 'Grants Santa\'s favor',
        stackable: true,
        maxStack: 3,
        effects: [
            { type: 'buff_luck', value: 10, duration: 50 },
            { type: AbilityID.ChristmasSpirit, value: 25 }
        ],
        tags: ['consumable', 'scroll', 'santa']
    },

    [ItemID.ScrollOfNaughtyList]: {
        id: ItemID.ScrollOfNaughtyList,
        name: 'Scroll of Naughty List',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsMiscPng, col: 1, row: 1 },
        description: 'Curses your enemies',
        stackable: true,
        maxStack: 3,
        effects: [{ type: 'curse_enemies', value: 1 }],
        tags: ['consumable', 'scroll', 'curse']
    },

    [ItemID.ScrollOfReindeerCall]: {
        id: ItemID.ScrollOfReindeerCall,
        name: 'Scroll of Reindeer Call',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.EPIC,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 4, row: 3 },
        description: 'Summons a flying reindeer',
        stackable: true,
        maxStack: 2,
        effects: [{ type: 'summon_mount', value: 1, duration: 100 }],
        tags: ['consumable', 'scroll', 'summon', 'reindeer']
    },

    [ItemID.ScrollOfElvenBlessing]: {
        id: ItemID.ScrollOfElvenBlessing,
        name: 'Scroll of Elven Blessing',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 0, row: 3 },
        description: 'Grants elven grace',
        stackable: true,
        maxStack: 3,
        effects: [
            { type: 'dexterity_boost', value: 5, duration: 50 },
            { type: 'stealth', value: 15, duration: 50 }
        ],
        tags: ['consumable', 'scroll', 'elf']
    },

    [ItemID.ScrollOfSantasSight]: {
        id: ItemID.ScrollOfSantasSight,
        name: 'Scroll of Santa\'s Sight',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 5, row: 3 },
        description: 'See all hidden things',
        stackable: true,
        maxStack: 5,
        effects: [{ type: 'reveal_secrets', value: 1 }],
        tags: ['consumable', 'scroll', 'vision']
    },

    [ItemID.ScrollOfJingleAll]: {
        id: ItemID.ScrollOfJingleAll,
        name: 'Scroll of Jingle All',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 6, row: 3 },
        description: 'Makes everything jingle joyfully',
        stackable: true,
        maxStack: 3,
        effects: [{ type: 'stun_all_enemies', value: 2 }],
        tags: ['consumable', 'scroll', 'sound', 'aoe']
    },

    [ItemID.ScrollOfMistletoePortal]: {
        id: ItemID.ScrollOfMistletoePortal,
        name: 'Scroll of Mistletoe Portal',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.EPIC,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 4, row: 3 },
        description: 'Opens a portal to the next floor',
        stackable: true,
        maxStack: 1,
        effects: [{ type: 'create_stairs', value: 1 }],
        tags: ['consumable', 'scroll', AbilityID.Teleport]
    },

    [ItemID.ScrollOfSnowStorm]: {
        id: ItemID.ScrollOfSnowStorm,
        name: 'Scroll of Snow Storm',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 7, row: 3 },
        description: 'Summons a blizzard',
        stackable: true,
        maxStack: 3,
        effects: [
            { type: 'aoe_damage', value: 12 },
            { type: 'slow_all', value: 50, duration: 10 }
        ],
        tags: ['consumable', 'scroll', EffectID.Ice, 'aoe']
    },

    [ItemID.ScrollOfElvenCraftsmanship]: {
        id: ItemID.ScrollOfElvenCraftsmanship,
        name: 'Scroll of Elven Craftsmanship',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.EPIC,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 0, row: 3 },
        description: 'Upgrade an item',
        stackable: false,
        effects: [{ type: 'upgrade_item', value: 1 }],
        tags: ['consumable', 'scroll', 'upgrade', 'elf']
    },



    // Rings
    [ItemID.RingOfJingleBells]: {
        id: ItemID.RingOfJingleBells,
        name: 'Ring of Jingle Bells',
        type: ItemType.ARTIFACT,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 3, row: 2 },
        description: 'Jingles announce your presence',
        effects: [
            { type: 'sound_detection', value: 5 },
            { type: AbilityID.ChristmasSpirit, value: 10 }
        ],
        tags: ['artifact', 'ring', 'sound']
    },

    [ItemID.RingOfElvenGrace]: {
        id: ItemID.RingOfElvenGrace,
        name: 'Ring of Elven Grace',
        type: ItemType.ARTIFACT,
        rarity: ItemRarity.EPIC,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 4, row: 2 },
        description: 'Grace of the elves',
        effects: [
            { type: 'dexterity_boost', value: 5 },
            { type: 'dodge_chance', value: 10 }
        ],
        tags: ['artifact', 'ring', 'elf']
    },



    // Special Artifacts
    [ItemID.RingOfReindeerSpeed]: {
        id: ItemID.RingOfReindeerSpeed,
        name: 'Ring of Reindeer Speed',
        type: ItemType.ARTIFACT,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 2, row: 3 },
        description: 'Swift as a flying reindeer',
        effects: [{ type: 'movement_speed', value: 25 }],
        tags: ['artifact', 'ring', 'speed', 'reindeer']
    },

    [ItemID.AngelFeatherRevive]: {
        id: ItemID.AngelFeatherRevive,
        name: 'Angel Feather (Revive)',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.LEGENDARY,
        graphics: { resource: Resources.ItemsMiscPng, col: 7, row: 1 }, 
        description: 'Automatically revives you upon death',
        stackable: false,
        effects: [{ type: 'auto_revive', value: 1 }],
        tags: ['consumable', 'revive', 'angel', 'legendary']
    },

    [ItemID.PotionOfCureDisease]: {
        id: ItemID.PotionOfCureDisease,
        name: 'Potion of Cure Disease',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 3, row: 1 },
        description: 'Cures any ailment',
        stackable: true,
        maxStack: 3,
        effects: [{ type: 'cure_all', value: 1 }],
        tags: ['consumable', 'potion', 'cure']
    },

    [ItemID.ChristmasWish]: {
        id: ItemID.ChristmasWish,
        name: 'Christmas Wish',
        type: ItemType.ARTIFACT,
        rarity: ItemRarity.UNIQUE,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 3, row: 3 },
        description: 'The power of hope itself',
        effects: [
            { type: 'luck', value: 20 },
            { type: AbilityID.ChristmasSpirit, value: 100 },
            { type: 'miracle_chance', value: 1 }
        ],
        tags: ['artifact', 'unique', 'christmas', 'wish']
    },

    [ItemID.MistletoeCharm]: {
        id: ItemID.MistletoeCharm,
        name: 'Mistletoe Charm',
        type: ItemType.ARTIFACT,
        rarity: ItemRarity.UNCOMMON,
        graphics: { resource: Resources.ItemsEquipmentPng, col: 3, row: 2 },
        description: 'Brings good fortune in romance',
        effects: [
            { type: 'charm_immunity', value: 100 },
            { type: 'friendly_npc_boost', value: 20 }
        ],
        tags: ['artifact', 'charm', 'mistletoe']
    },

    [ItemID.AngelFeather]: {
        id: ItemID.AngelFeather,
        name: 'Angel Feather',
        type: ItemType.ARTIFACT,
        rarity: ItemRarity.RARE,
        graphics: { resource: Resources.ItemsMiscPng, col: 7, row: 1 },
        description: 'Blessed by angels',
        effects: [
            { type: 'holy_protection', value: 10 },
            { type: 'resurrection_chance', value: 5 }
        ],
        tags: ['artifact', 'angel', EffectID.Holy]
    },

    [ItemID.DriedWreath]: {
        id: ItemID.DriedWreath,
        name: 'Dried Wreath',
        type: ItemType.ARTIFACT,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsMiscPng, col: 2, row: 1 },
        description: 'An old Christmas wreath, still has some magic',
        effects: [
            { type: AbilityID.ChristmasSpirit, value: 5 },
            { type: 'warmth_generation', value: 1 }
        ],
        tags: ['artifact', 'christmas', 'decoration']
    },
    [ItemID.Marshmallow]: {
        id: ItemID.Marshmallow,
        name: 'Marshmallow',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsConsumablesPng, col: 0, row: 2 },
        description: 'A fluffy marshmallow, restores warmth',
        stackable: true,
        maxStack: 10,
        effects: [
            { type: EffectID.WarmthRestore, value: 15 },
            { type: 'heal', value: 3 }
        ],
        tags: ['consumable', 'food', 'warmth']
    },
    [ItemID.CandyCane]: {
        id: ItemID.CandyCane,
        name: 'Candy Cane',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        graphics: { resource: Resources.ItemsWeaponsPng, col: 0, row: 0 },
        description: 'A sweet peppermint treat',
        stackable: true,
        maxStack: 15,
        effects: [
            { type: 'heal', value: 5 },
            { type: AbilityID.ChristmasSpirit, value: 5 }
        ],
        tags: ['consumable', 'food', 'christmas']
    }
};

// Item category helpers
export const ItemCategories = {
    getWeapons: () => Object.values(ItemDefinitions).filter(item => item.type === ItemType.WEAPON),
    getArmor: () => Object.values(ItemDefinitions).filter(item => item.type === ItemType.ARMOR),
    getConsumables: () => Object.values(ItemDefinitions).filter(item => item.type === ItemType.CONSUMABLE),
    getArtifacts: () => Object.values(ItemDefinitions).filter(item => item.type === ItemType.ARTIFACT),
    getByRarity: (rarity: ItemRarity) => Object.values(ItemDefinitions).filter(item => item.rarity === rarity),
    getByTag: (tag: string) => Object.values(ItemDefinitions).filter(item => item.tags.includes(tag))
};