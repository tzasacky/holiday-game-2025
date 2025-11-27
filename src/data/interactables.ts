import * as ex from 'excalibur';
import { Resources } from '../config/resources';
import { ItemID } from '../constants';
import { AbilityID } from '../constants';
import { EffectID } from '../constants';
import { InteractableID } from '../constants';

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
    spriteIndex?: number;
    animation?: string;
    fallbackColor?: ex.Color;
}

export interface InteractableEffect {
    type: string;
    value?: number;
    target?: 'self' | 'actor' | 'area';
    condition?: string;
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
    InteractableID.Door: {
        id: InteractableID.Door,
        name: 'Door',
        type: InteractableType.DOOR,
        graphics: { 
            resource: Resources.TilesPng, // Assuming doors are in the tileset
            fallbackColor: ex.Color.fromHex('#8B4513')
        },
        description: 'A wooden door that can be opened or closed',
        blocking: true,
        effects: [
            { type: 'toggle_passage', target: 'self' }
        ],
        tags: [InteractableID.Door, 'passage']
    },

    InteractableID.LockedDoor: {
        id: InteractableID.LockedDoor, 
        name: 'Locked Door',
        type: InteractableType.DOOR,
        graphics: {
            resource: Resources.TilesPng,
            fallbackColor: ex.Color.fromHex('#654321')
        },
        description: 'A sturdy door secured with a lock',
        blocking: true,
        requiresKey: 'door_key',
        effects: [
            { type: 'unlock_and_open', target: 'self' }
        ],
        tags: [InteractableID.Door, 'locked', 'requires_key']
    },

    InteractableID.PresentChest: {
        id: InteractableID.PresentChest,
        name: 'Present Chest',
        type: InteractableType.CONTAINER,
        graphics: {
            resource: Resources.TilesPng,
            fallbackColor: ex.Color.fromHex('#FF0000')
        },
        description: 'A festive chest wrapped like a present. Who knows what treasures await inside?',
        consumeOnUse: true,
        loot: [
            { itemId: 'gold_coin', chance: 80, minQuantity: 5, maxQuantity: 15 },
            { itemId: ItemID.CandyCaneSpear, chance: 30 },
            { itemId: ItemID.HotCocoa, chance: 60, minQuantity: 1, maxQuantity: 3 },
            { itemId: ItemID.CozySweater, chance: 25 }
        ],
        effects: [
            { type: AbilityID.ChristmasSpirit, value: 10, target: 'actor' }
        ],
        tags: ['container', 'loot', 'festive', 'present']
    },

    InteractableID.Stocking: {
        id: InteractableID.Stocking,
        name: 'Christmas Stocking',
        type: InteractableType.CONTAINER,
        graphics: {
            resource: Resources.TilesPng,
            fallbackColor: ex.Color.fromHex('#FF6666')
        },
        description: 'A Christmas stocking hanging by the fireplace',
        consumeOnUse: true,
        loot: [
            { itemId: 'coal', chance: 40, minQuantity: 1, maxQuantity: 3 },
            { itemId: ItemID.CandyCaneSpear, chance: 20 },
            { itemId: 'gold_coin', chance: 60, minQuantity: 2, maxQuantity: 8 },
            { itemId: ItemID.HotCocoa, chance: 45 }
        ],
        tags: ['container', 'festive', InteractableID.Stocking]
    },

    InteractableID.ChristmasTree: {
        id: InteractableID.ChristmasTree,
        name: 'Christmas Tree',
        type: InteractableType.DECORATIVE,
        graphics: {
            resource: Resources.TilesPng,
            fallbackColor: ex.Color.fromHex('#00AA00')
        },
        description: 'A beautifully decorated Christmas tree emanating warmth and joy',
        warmthGeneration: 5,
        lightRadius: 2,
        effects: [
            { type: 'restore_warmth', value: 20, target: 'actor' },
            { type: 'christmas_blessing', value: 1, target: 'actor' }
        ],
        cooldownTurns: 10,
        tags: ['decorative', 'warmth', 'festive', 'blessing']
    },

    InteractableID.Fireplace: {
        id: InteractableID.Fireplace,
        name: 'Fireplace',
        type: InteractableType.FUNCTIONAL,
        graphics: {
            resource: Resources.TilesPng,
            fallbackColor: ex.Color.fromHex('#FF4500')
        },
        description: 'A roaring fireplace that provides warmth and light',
        warmthGeneration: 15,
        lightRadius: 3,
        effects: [
            { type: 'restore_warmth', value: 50, target: 'actor' },
            { type: 'dry_equipment', target: 'actor' }
        ],
        tags: ['warmth', 'light', EffectID.Fire, 'functional']
    },

    InteractableID.Bookshelf: {
        id: InteractableID.Bookshelf,
        name: 'Bookshelf',
        type: InteractableType.FUNCTIONAL,
        graphics: {
            resource: Resources.TilesPng,
            fallbackColor: ex.Color.fromHex('#8B4513')
        },
        description: 'A shelf filled with ancient tomes and scrolls',
        loot: [
            { itemId: 'scroll_of_warmth', chance: 40 },
            { itemId: 'scroll_of_healing', chance: 35 },
            { itemId: 'book_of_lore', chance: 20 },
            { itemId: 'spell_components', chance: 30 }
        ],
        effects: [
            { type: 'grant_knowledge', value: 1, target: 'actor' }
        ],
        useLimit: 1,
        tags: ['knowledge', 'scrolls', 'magic', 'functional']
    },

    InteractableID.Anvil: {
        id: InteractableID.Anvil,
        name: 'Anvil',
        type: InteractableType.CRAFTING,
        graphics: {
            resource: Resources.TilesPng,
            fallbackColor: ex.Color.fromHex('#555555')
        },
        description: 'A sturdy anvil for forging and repairing equipment',
        effects: [
            { type: 'open_smithing_interface', target: 'actor' },
            { type: 'repair_equipment', target: 'actor' }
        ],
        tags: ['crafting', 'smithing', 'repair', 'functional']
    },

    InteractableID.AlchemyPot: {
        id: InteractableID.AlchemyPot,
        name: 'Alchemy Pot',
        type: InteractableType.CRAFTING,
        graphics: {
            resource: Resources.TilesPng,
            fallbackColor: ex.Color.fromHex('#800080')
        },
        description: 'A bubbling cauldron perfect for brewing potions',
        effects: [
            { type: 'open_alchemy_interface', target: 'actor' },
            { type: 'brew_potions', target: 'actor' }
        ],
        lightRadius: 1,
        tags: ['crafting', 'alchemy', 'potions', 'magical']
    },

    InteractableID.SleighStation: {
        id: InteractableID.SleighStation,
        name: 'Sleigh Station',
        type: InteractableType.PORTAL,
        graphics: {
            resource: Resources.TilesPng,
            fallbackColor: ex.Color.fromHex('#FFD700')
        },
        description: 'A magical sleigh that can transport you between floors',
        effects: [
            { type: 'floor_travel', target: 'actor' },
            { type: 'save_progress', target: 'actor' }
        ],
        tags: ['portal', 'travel', 'sleigh', 'magical']
    },

    InteractableID.SecretDoor: {
        id: InteractableID.SecretDoor,
        name: 'Secret Door',
        type: InteractableType.DOOR,
        graphics: {
            resource: Resources.TilesPng,
            fallbackColor: ex.Color.fromHex('#654321')
        },
        description: 'A hidden passage disguised as a wall',
        blocking: true,
        effects: [
            { type: 'reveal_and_open', target: 'self' },
            { type: 'grant_discovery_bonus', target: 'actor' }
        ],
        tags: [InteractableID.Door, 'secret', 'hidden', 'discovery']
    },

    InteractableID.DestructibleWall: {
        id: InteractableID.DestructibleWall,
        name: 'Cracked Wall',
        type: InteractableType.TRAP,
        graphics: {
            resource: Resources.TilesPng,
            fallbackColor: ex.Color.fromHex('#666666')
        },
        description: 'A weakened wall that can be broken through with enough force',
        blocking: true,
        destructible: true,
        health: 25,
        loot: [
            { itemId: 'stone_fragments', chance: 80, minQuantity: 2, maxQuantity: 5 },
            { itemId: 'iron_ore', chance: 30 },
            { itemId: 'gold_coin', chance: 40, minQuantity: 1, maxQuantity: 3 }
        ],
        tags: ['destructible', 'wall', 'obstacle', 'breakable']
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