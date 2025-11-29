import * as ex from 'excalibur';
import { Resources } from '../config/resources';
import { ItemID } from '../constants/ItemIDs';
import { AbilityID } from '../constants/AbilityIDs';
import { EffectID } from '../constants/EffectIDs';
import { InteractableID } from '../constants/InteractableIDs';
import { LootTableID } from '../constants/LootTableIDs';

export enum InteractableType {
    CONTAINER = 'container',
    DOOR = InteractableID.Door, 
    CRAFTING = 'crafting',
    DECORATIVE = 'decorative',
    FUNCTIONAL = 'functional',
    TRAP = 'trap',
    PORTAL = 'portal'
}

export interface InteractableGraphics {
    resource: ex.ImageSource;
    spriteCoords?: { x: number, y: number }; // 2D coordinates in sprite sheet
    animation?: string;
    fallbackColor?: ex.Color;
}

export interface InteractableEffect {
    type: string;
    value?: number;
    target?: 'self' | 'actor' | 'area';
    condition?: string;
    magnitude?: number;
    duration?: number;
    chance?: number;
}

export interface InteractableLoot {
    itemId: string;
    chance: number;
    minQuantity?: number;
    maxQuantity?: number;
}

export interface InteractableDefinition {
    id: string;
    name: string;
    type: InteractableType;
    graphics: InteractableGraphics;
    description: string;
    
    // Interaction properties
    requiresKey?: string;
    consumeOnUse?: boolean;
    useLimit?: number;
    cooldownTurns?: number;
    
    // Effects when used
    effects?: InteractableEffect[];
    
    // Loot for containers
    loot?: InteractableLoot[];
    guaranteedLoot?: string[];
    lootTableId?: string;
    
    // Physical properties
    blocking?: boolean;
    destructible?: boolean;
    health?: number;
    
    // Special properties
    lightRadius?: number;
    warmthGeneration?: number;
    
    tags: string[];
}

// Data-first interactable definitions
export const InteractableDefinitions: Record<string, InteractableDefinition> = {
    [InteractableID.Door]: {
        id: InteractableID.Door,
        name: 'Door',
        type: InteractableType.DOOR,
        graphics: { 
            resource: Resources.CommonTilesPng,
            spriteCoords: { x: 0, y: 0 }, // Closed
            fallbackColor: ex.Color.fromHex('#8B4513')
        },
        description: 'A wooden door that can be opened or closed',
        blocking: true,
        effects: [
            { type: EffectID.TogglePassage, target: 'self' }
        ],
        tags: [InteractableID.Door, 'passage']
    },

    [InteractableID.LockedDoor]: {
        id: InteractableID.LockedDoor, 
        name: 'Locked Door',
        type: InteractableType.DOOR,
        graphics: {
            resource: Resources.CommonTilesPng,
            spriteCoords: { x: 2, y: 0 }, // Closed
            fallbackColor: ex.Color.fromHex('#FFD700')
        },
        description: 'A sturdy door secured with a lock',
        blocking: true,
        requiresKey: ItemID.ChristmasKey,
        effects: [
            { type: EffectID.UnlockAndOpen, target: 'self' }
        ],
        tags: [InteractableID.Door, 'locked', 'requires_key']
    },

    [InteractableID.PresentChest]: {
        id: InteractableID.PresentChest,
        name: 'Present Chest',
        type: InteractableType.CONTAINER,
        graphics: {
            resource: Resources.CommonDecorPng,
            spriteCoords: { x: 4, y: 3 }, // Red Gift Box
            fallbackColor: ex.Color.fromHex('#FF0000')
        },
        description: 'A festive chest wrapped like a present. Who knows what treasures await inside?',
        consumeOnUse: true,
        loot: [
            { itemId: ItemID.GoldCoin, chance: 80, minQuantity: 5, maxQuantity: 15 },
            { itemId: ItemID.CandyCaneSpear, chance: 30 },
            { itemId: ItemID.HotCocoa, chance: 60, minQuantity: 1, maxQuantity: 3 },
            { itemId: ItemID.CozySweater, chance: 25 }
        ],
        effects: [
            { type: AbilityID.ChristmasSpirit, value: 10, target: 'actor' }
        ],
        tags: ['container', 'loot', 'festive', 'present']
    },

    [InteractableID.Stocking]: {
        id: InteractableID.Stocking,
        name: 'Christmas Stocking',
        type: InteractableType.CONTAINER,
        graphics: {
            resource: Resources.CommonDecorPng,
            spriteCoords: { x: 3, y: 3 }, // Stocking
            fallbackColor: ex.Color.fromHex('#FF6666')
        },
        description: 'A Christmas stocking hanging by the fireplace',
        consumeOnUse: true,
        loot: [
            { itemId: ItemID.Coal, chance: 40, minQuantity: 1, maxQuantity: 3 },
            { itemId: ItemID.CandyCaneSpear, chance: 20 },
            { itemId: ItemID.GoldCoin, chance: 60, minQuantity: 2, maxQuantity: 8 },
            { itemId: ItemID.HotCocoa, chance: 45 }
        ],
        tags: ['container', 'festive', InteractableID.Stocking]
    },

    [InteractableID.ChristmasTree]: {
        id: InteractableID.ChristmasTree,
        name: 'Christmas Tree',
        type: InteractableType.DECORATIVE,
        graphics: {
            resource: Resources.CommonDecorPng,
            spriteCoords: { x: 0, y: 3 }, // Christmas Tree
            fallbackColor: ex.Color.fromHex('#00AA00')
        },
        description: 'A beautifully decorated Christmas tree emanating warmth and joy',
        warmthGeneration: 5,
        lightRadius: 2,
        effects: [
            { type: EffectID.WarmthRestore, value: 20, target: 'actor' },
            { type: EffectID.ChristmasBlessing, value: 1, target: 'actor' }
        ],
        cooldownTurns: 10,
        tags: ['decorative', 'warmth', 'festive', 'blessing']
    },

    [InteractableID.Fireplace]: {
        id: InteractableID.Fireplace,
        name: 'Fireplace',
        type: InteractableType.FUNCTIONAL,
        graphics: {
            resource: Resources.CommonDecorPng,
            spriteCoords: { x: 7, y: 2 }, // Fireplace (Lit)
            fallbackColor: ex.Color.fromHex('#FF4500')
        },
        description: 'A roaring fireplace that provides warmth and light',
        warmthGeneration: 15,
        lightRadius: 3,
        effects: [
            { type: EffectID.WarmthRestore, value: 50, target: 'actor' },
            { type: EffectID.DryEquipment, target: 'actor' }
        ],
        tags: ['warmth', 'light', EffectID.Fire, 'functional']
    },

    [InteractableID.Bookshelf]: {
        id: InteractableID.Bookshelf,
        name: 'Bookshelf',
        type: InteractableType.FUNCTIONAL,
        graphics: {
            resource: Resources.CommonDecorPng,
            spriteCoords: { x: 6, y: 1 }, // Bookshelf
            fallbackColor: ex.Color.fromHex('#8B4513')
        },
        description: 'A shelf filled with ancient tomes and scrolls',
        loot: [
            { itemId: ItemID.ScrollOfWinterWarmth, chance: 40 },
            { itemId: ItemID.ScrollOfElvenBlessing, chance: 35 },
            { itemId: ItemID.ScrollOfMapping, chance: 20 },
            { itemId: ItemID.ScrollOfEnchantment, chance: 30 }
        ],
        effects: [
            { type: EffectID.GrantKnowledge, value: 1, target: 'actor' }
        ],
        useLimit: 1,
        tags: ['knowledge', 'scrolls', 'magic', 'functional']
    },

    [InteractableID.Anvil]: {
        id: InteractableID.Anvil,
        name: 'Anvil',
        type: InteractableType.CRAFTING,
        graphics: {
            resource: Resources.CommonDecorPng,
            spriteCoords: { x: 4, y: 0 }, // Crate as placeholder? No anvil in list. Using Crate for now.
            fallbackColor: ex.Color.fromHex('#555555')
        },
        description: 'A sturdy anvil for forging and repairing equipment',
        effects: [
            { type: EffectID.OpenSmithing, target: 'actor' },
            { type: EffectID.RepairEquipment, target: 'actor' }
        ],
        tags: ['crafting', 'smithing', 'repair', 'functional']
    },

    [InteractableID.AlchemyPot]: {
        id: InteractableID.AlchemyPot,
        name: 'Alchemy Pot',
        type: InteractableType.CRAFTING,
        graphics: {
            resource: Resources.CommonDecorPng,
            spriteCoords: { x: 7, y: 0 }, // Pot/Vase
            fallbackColor: ex.Color.fromHex('#800080')
        },
        description: 'A bubbling cauldron perfect for brewing potions',
        effects: [
            { type: EffectID.OpenAlchemy, target: 'actor' },
            { type: EffectID.BrewPotions, target: 'actor' }
        ],
        lightRadius: 1,
        tags: ['crafting', 'alchemy', 'potions', 'magical']
    },

    [InteractableID.SleighStation]: {
        id: InteractableID.SleighStation,
        name: 'Sleigh Station',
        type: InteractableType.PORTAL,
        graphics: {
            resource: Resources.CommonDecorPng,
            spriteCoords: { x: 4, y: 1 }, // Chair as placeholder? No sleigh.
            fallbackColor: ex.Color.fromHex('#FFD700')
        },
        description: 'A magical sleigh that can transport you between floors',
        effects: [
            { type: EffectID.FloorTravel, target: 'actor' },
            { type: EffectID.SaveProgress, target: 'actor' }
        ],
        tags: ['portal', 'travel', 'sleigh', 'magical']
    },

    [InteractableID.SecretDoor]: {
        id: InteractableID.SecretDoor,
        name: 'Secret Door',
        type: InteractableType.DOOR,
        graphics: {
            resource: Resources.CommonTilesPng,
            spriteCoords: { x: 0, y: 2 }, // Log Cabin Wall (looks like wall)
            fallbackColor: ex.Color.fromHex('#654321')
        },
        description: 'A hidden passage disguised as a wall',
        blocking: true,
        effects: [
            { type: EffectID.RevealAndOpen, target: 'self' },
            { type: EffectID.GrantDiscovery, target: 'actor' }
        ],
        tags: [InteractableID.Door, 'secret', 'hidden', 'discovery']
    },

    [InteractableID.DestructibleWall]: {
        id: InteractableID.DestructibleWall,
        name: 'Cracked Wall',
        type: InteractableType.TRAP,
        graphics: {
            resource: Resources.CommonTilesPng,
            spriteCoords: { x: 0, y: 2 }, // Log Cabin Wall
            fallbackColor: ex.Color.fromHex('#666666')
        },
        description: 'A weakened wall that can be broken through with enough force',
        blocking: true,
        destructible: true,
        health: 25,
        loot: [
            { itemId: ItemID.Coal, chance: 80, minQuantity: 2, maxQuantity: 5 },
            { itemId: ItemID.Coal, chance: 30 },
            { itemId: ItemID.GoldCoin, chance: 40, minQuantity: 1, maxQuantity: 3 }
        ],
        tags: ['destructible', 'wall', 'obstacle', 'breakable']
    },

    [InteractableID.StairsDown]: {
        id: InteractableID.StairsDown,
        name: 'Stairs Down',
        type: InteractableType.PORTAL,
        graphics: {
            resource: Resources.CommonTilesPng,
            spriteCoords: { x: 1, y: 1 }, // Stairs Down (Stone)
            fallbackColor: ex.Color.fromHex('#8B4513')
        },
        description: 'A staircase leading to the next floor',
        effects: [
            { type: EffectID.LevelTransition, value: 1, target: 'actor' }
        ],
        tags: ['stairs', 'portal', 'level_transition', 'descent']
    },

    [InteractableID.StairsUp]: {
        id: InteractableID.StairsUp,
        name: 'Stairs Up',
        type: InteractableType.PORTAL,
        graphics: {
            resource: Resources.CommonTilesPng,
            spriteCoords: { x: 0, y: 1 }, // Stairs Up (Stone)
            fallbackColor: ex.Color.fromHex('#8B4513')
        },
        description: 'A staircase leading back to the previous floor',
        effects: [
            { type: EffectID.LevelTransition, value: -1, target: 'actor' }
        ],
        tags: ['stairs', 'portal', 'level_transition', 'ascent']
    },

    'trigger_plate': {
        id: 'trigger_plate',
        name: 'Pressure Plate',
        type: InteractableType.TRAP,
        graphics: {
            resource: Resources.CommonTilesPng, // Assuming it's in common tiles or use a fallback
            spriteCoords: { x: 7, y: 2 }, // Placeholder coords, check tileset
            fallbackColor: ex.Color.DarkGray
        },
        description: 'A suspicious plate on the floor.',
        blocking: false,
        effects: [
            {
                type: EffectID.TrapSpike,
                magnitude: 10,
                duration: 0,
                chance: 1.0
            }
        ],
        tags: ['trap', 'trigger', 'plate']
    },

    chasm: {
        id: 'chasm',
        name: 'Chasm',
        type: InteractableType.TRAP,
        graphics: {
            resource: Resources.CommonTilesPng,
            fallbackColor: ex.Color.fromHex('#000000')
        },
        description: 'A deep chasm. Falling in would be dangerous.',
        blocking: false, // Can walk into it but triggers effects
        effects: [
            { type: EffectID.FallDamage, value: 20, target: 'actor' },
            { type: EffectID.LevelTransition, value: 1, target: 'actor' }
        ],
        tags: ['chasm', 'trap', 'fall', 'dangerous']
    },

    [InteractableID.CHEST]: {
        id: InteractableID.CHEST,
        name: 'Chest',
        type: InteractableType.CONTAINER,
        graphics: {
            resource: Resources.CommonDecorPng,
            spriteCoords: { x: 0, y: 0 }, // Chest (Wood, Closed)
            fallbackColor: ex.Color.fromHex('#8B4513')
        },
        description: 'A wooden chest that might contain treasure',
        consumeOnUse: true,
        loot: [
            { itemId: ItemID.GoldCoin, chance: 70, minQuantity: 3, maxQuantity: 10 },
            { itemId: ItemID.Coal, chance: 40, minQuantity: 1, maxQuantity: 3 },
            { itemId: ItemID.HotCocoa, chance: 50 },
            { itemId: ItemID.CandyCane, chance: 60, minQuantity: 1, maxQuantity: 2 }
        ],
        tags: ['container', 'loot', 'treasure']
    },

    [InteractableID.TREASURE_CHEST]: {
        id: InteractableID.TREASURE_CHEST,
        name: 'Treasure Chest',
        type: InteractableType.CONTAINER,
        graphics: {
            resource: Resources.CommonDecorPng,
            spriteCoords: { x: 2, y: 0 }, // Chest (Gold, Closed)
            fallbackColor: ex.Color.fromHex('#FFD700')
        },
        description: 'A gilded chest containing valuable treasures',
        consumeOnUse: true,
        loot: [
            { itemId: ItemID.GoldCoin, chance: 90, minQuantity: 10, maxQuantity: 25 },
            { itemId: ItemID.ChristmasKey, chance: 60 },
            { itemId: ItemID.ScrollOfEnchantment, chance: 45 },
            { itemId: ItemID.CandyCaneSpear, chance: 30 }
        ],
        tags: ['container', 'loot', 'treasure', 'rare']
    }
};

// Helper functions for data access
export const InteractableCategories = {
    getContainers: () => Object.values(InteractableDefinitions).filter(def => def.type === InteractableType.CONTAINER),
    getDoors: () => Object.values(InteractableDefinitions).filter(def => def.type === InteractableType.DOOR),
    getCraftingStations: () => Object.values(InteractableDefinitions).filter(def => def.type === InteractableType.CRAFTING),
    getWarmthSources: () => Object.values(InteractableDefinitions).filter(def => def.warmthGeneration && def.warmthGeneration > 0),
    getLightSources: () => Object.values(InteractableDefinitions).filter(def => def.lightRadius && def.lightRadius > 0),
    getByTag: (tag: string) => Object.values(InteractableDefinitions).filter(def => def.tags.includes(tag))
};