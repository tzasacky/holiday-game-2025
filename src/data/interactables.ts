import * as ex from 'excalibur';
import { Resources } from '../config/resources';
import { ItemID } from '../constants/ItemIDs';
import { AbilityID } from '../constants/AbilityIDs';
import { EffectID } from '../constants/EffectIDs';
import { InteractableID } from '../constants/InteractableIDs';
import { LootTableID } from '../constants/LootTableIDs';

import { GraphicType } from '../constants/GraphicType';
import { InteractableState } from '../constants/InteractableState';
import { Tags } from '../constants/Tags';

export enum InteractableType {
    Container = 'container',
    Door = 'door',
    Crafting = 'crafting',
    Decorative = 'decorative',
    Functional = 'functional',
    Trap = 'trap',
    Portal = 'portal',
    Chasm = 'chasm',
    Ice = 'ice',
    SlipperyIce = 'slippery_ice'
}

export interface InteractableStateGraphics {
    spriteCoords?: { x: number, y: number };
    animation?: {
        frames: { x: number, y: number, duration: number }[];
        loop?: boolean;
    };
    graphicType?: GraphicType;
}

export interface InteractableGraphics {
    resource: ex.ImageSource;
    // Legacy/Default
    spriteCoords?: { x: number, y: number }; 
    animation?: string;
    graphicType?: GraphicType; 
    fallbackColor?: ex.Color;
    
    // New State-based system
    states?: Partial<Record<InteractableState, InteractableStateGraphics>>;
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
    size?: { width: number, height: number };
    placement?: 'floor' | 'wall'; // Default 'floor'
    
    // Spawn rules for placement system
    spawnRules?: {
        indoor?: boolean;           // Require indoor context
        outdoor?: boolean;          // Require outdoor context
        minPerRoom?: number;        // Guarantee minimum spawns
        maxPerRoom?: number;        // Cap spawns per room
        avoidCorridors?: boolean;   // Don't spawn in corridors
    };
    
    tags: string[];
}

// Data-first interactable definitions
export const InteractableDefinitions: Record<string, InteractableDefinition> = {
    [InteractableID.Door]: {
        id: InteractableID.Door,
        name: 'Door',
        type: InteractableType.Door,
        graphics: { 
            resource: Resources.CommonTilesPng,
            spriteCoords: { x: 0, y: 0 }, // Doors on row 1 (0-indexed 0), first two sprites
            fallbackColor: ex.Color.fromHex('#8B4513'),
            states: {
                [InteractableState.Closed]: { spriteCoords: { x: 0, y: 0 } },
                [InteractableState.Open]: { spriteCoords: { x: 1, y: 0 } }
            }
        },
        description: 'A wooden door that can be opened or closed',
        blocking: true,
        effects: [
            { type: EffectID.TogglePassage, target: 'self' }
        ],
        tags: [InteractableID.Door, Tags.Portal]
    },

    [InteractableID.LockedDoor]: {
        id: InteractableID.LockedDoor, 
        name: 'Locked Door',
        type: InteractableType.Door,
        graphics: {
            resource: Resources.InteractablesPng,
            spriteCoords: { x: 2, y: 0 }, // Iron Door (Closed)
            fallbackColor: ex.Color.fromHex('#FFD700'),
            states: {
                [InteractableState.Closed]: { spriteCoords: { x: 2, y: 0 } },
                [InteractableState.Locked]: { spriteCoords: { x: 2, y: 0 } },
                [InteractableState.Open]: { spriteCoords: { x: 3, y: 0 } }
            }
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
        type: InteractableType.Container,
        graphics: {
            resource: Resources.InteractablesPng,
            spriteCoords: { x: 4, y: 1 }, // Present (Red, Closed)
            fallbackColor: ex.Color.fromHex('#FF0000'),
            states: {
                [InteractableState.Closed]: { spriteCoords: { x: 4, y: 1 } },
                [InteractableState.Open]: { spriteCoords: { x: 5, y: 1 } }, // Assuming next sprite is open
                [InteractableState.Used]: { spriteCoords: { x: 5, y: 1 } }
            }
        },
        description: 'A festive chest wrapped like a present. Who knows what treasures await inside?',
        consumeOnUse: true,
        lootTableId: InteractableID.PresentChest,
        effects: [
            { type: AbilityID.ChristmasSpirit, value: 10, target: 'actor' }
        ],
        tags: [Tags.Container, 'loot', 'festive', 'present']
    },

    [InteractableID.Stocking]: {
        id: InteractableID.Stocking,
        name: 'Christmas Stocking',
        type: InteractableType.Container,
        graphics: {
            resource: Resources.InteractablesPng,
            spriteCoords: { x: 6, y: 1 }, // Stocking (Full)
            fallbackColor: ex.Color.fromHex('#FF6666'),
            states: {
                [InteractableState.Closed]: { spriteCoords: { x: 6, y: 1 } },
                [InteractableState.Open]: { spriteCoords: { x: 7, y: 1 } }, // Assuming next sprite is empty
                [InteractableState.Used]: { spriteCoords: { x: 7, y: 1 } }
            }
        },
        description: 'A Christmas stocking hanging by the fireplace',
        consumeOnUse: true,
        lootTableId: InteractableID.Stocking,
        tags: [Tags.Container, 'festive', InteractableID.Stocking]
    },

    [InteractableID.ChristmasTree]: {
        id: InteractableID.ChristmasTree,
        name: 'Christmas Tree',
        type: InteractableType.Decorative,
        graphics: {
            resource: Resources.CommonDecorPng, // Still in decor
            spriteCoords: { x: 0, y: 1 }, // Christmas Tree (Row 2 in new decor layout)
            fallbackColor: ex.Color.fromHex('#00AA00'),
            states: {
                [InteractableState.Closed]: { spriteCoords: { x: 0, y: 1 } },
                [InteractableState.Active]: { 
                    animation: {
                        frames: [
                            { x: 0, y: 1, duration: 500 },
                            { x: 1, y: 1, duration: 500 } // Assuming 2 frame animation for lights
                        ],
                        loop: true
                    }
                }
            }
        },
        description: 'A beautifully decorated Christmas tree emanating warmth and joy',
        warmthGeneration: 5,
        lightRadius: 2,
        effects: [
            { type: EffectID.WarmthRestore, value: 20, target: 'actor' },
            { type: EffectID.ChristmasBlessing, value: 1, target: 'actor' }
        ],
        cooldownTurns: 10,
        tags: [Tags.Decor, Tags.HeatSource, Tags.LightSource, 'festive', 'blessing']
    },

    [InteractableID.Fireplace]: {
        id: InteractableID.Fireplace,
        name: 'Fireplace',
        type: InteractableType.Functional,
        graphics: {
            resource: Resources.InteractablesPng,
            spriteCoords: { x: 0, y: 3 }, // Fireplace (Lit Frame 1)
            fallbackColor: ex.Color.fromHex('#FF4500'),
            states: {
                [InteractableState.Active]: {
                    animation: {
                        frames: [
                            { x: 0, y: 3, duration: 200 },
                            { x: 1, y: 3, duration: 200 },
                            { x: 2, y: 3, duration: 200 },
                            { x: 3, y: 3, duration: 200 }
                        ],
                        loop: true
                    }
                },
                [InteractableState.Closed]: { // Default state for fireplace? Or should it be Active?
                    // If it's always lit, maybe default state should be Active or we map Closed to Lit?
                    // Let's assume 'closed' means 'lit' for now or we change default state.
                    animation: {
                        frames: [
                            { x: 0, y: 3, duration: 200 },
                            { x: 1, y: 3, duration: 200 },
                            { x: 2, y: 3, duration: 200 },
                            { x: 3, y: 3, duration: 200 }
                        ],
                        loop: true
                    }
                }
            }
        },
        description: 'A roaring fireplace that provides warmth and light',
        warmthGeneration: 15,
        lightRadius: 3,
        effects: [
            { type: EffectID.WarmthRestore, value: 50, target: 'actor' },
            { type: EffectID.DryEquipment, target: 'actor' }
        ],
        tags: [Tags.HeatSource, Tags.LightSource, EffectID.Fire, 'functional']
    },

    [InteractableID.Bookshelf]: {
        id: InteractableID.Bookshelf,
        name: 'Bookshelf',
        type: InteractableType.Functional,
        graphics: {
            resource: Resources.CommonDecorPng, // Still in decor
            spriteCoords: { x: 6, y: 0 }, // Bookshelf (Row 1 in new decor layout)
            fallbackColor: ex.Color.fromHex('#8B4513'),
            states: {
                [InteractableState.Closed]: { spriteCoords: { x: 6, y: 0 } },
                [InteractableState.Used]: { spriteCoords: { x: 7, y: 0 } } // Assuming empty bookshelf sprite
            }
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
        tags: ['knowledge', 'scrolls', Tags.Magic, 'functional']
    },

    [InteractableID.Anvil]: {
        id: InteractableID.Anvil,
        name: 'Anvil',
        type: InteractableType.Crafting,
        graphics: {
            resource: Resources.InteractablesPng,
            spriteCoords: { x: 5, y: 7 }, // Anvil - Row 8 (index 7)
            fallbackColor: ex.Color.fromHex('#555555'),
            states: {
                [InteractableState.Closed]: { spriteCoords: { x: 5, y: 7 } },
                [InteractableState.Active]: { spriteCoords: { x: 5, y: 7 } }
            }
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
        type: InteractableType.Crafting,
        graphics: {
            resource: Resources.InteractablesPng,
            spriteCoords: { x: 6, y: 7 }, // Alchemy Pot - Row 8 (index 7)
            fallbackColor: ex.Color.fromHex('#800080'),
            states: {
                [InteractableState.Closed]: { spriteCoords: { x: 6, y: 7 } },
                [InteractableState.Active]: { 
                    animation: {
                        frames: [
                            { x: 6, y: 7, duration: 300 },
                            { x: 7, y: 7, duration: 300 } // Assuming bubbling animation
                        ],
                        loop: true
                    }
                }
            }
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
        type: InteractableType.Portal,
        graphics: {
            resource: Resources.InteractablesPng,
            spriteCoords: { x: 4, y: 7 }, // Sleigh Station - Row 8 (index 7)
            fallbackColor: ex.Color.fromHex('#FFD700'),
            states: {
                [InteractableState.Closed]: { spriteCoords: { x: 4, y: 7 } },
                [InteractableState.Active]: { spriteCoords: { x: 4, y: 7 } }
            }
        },
        description: 'A magical sleigh that can transport you between floors',
        effects: [
            { type: EffectID.FloorTravel, target: 'actor' },
            { type: EffectID.SaveProgress, target: 'actor' }
        ],
        tags: [Tags.Portal, 'travel', 'sleigh', 'magical']
    },

    [InteractableID.SecretDoor]: {
        id: InteractableID.SecretDoor,
        name: 'Secret Door',
        type: InteractableType.Door,
        graphics: {
            resource: Resources.InteractablesPng,
            spriteCoords: { x: 6, y: 0 }, // Secret Door (Wall Lookalike)
            fallbackColor: ex.Color.fromHex('#654321'),
            states: {
                [InteractableState.Hidden]: { spriteCoords: { x: 6, y: 0 } }, // Wall lookalike
                [InteractableState.Closed]: { spriteCoords: { x: 6, y: 0 } }, // Wall lookalike
                [InteractableState.Open]: { spriteCoords: { x: 7, y: 0 } } // Open passage
            }
        },
        description: 'A hidden passage disguised as a wall',
        blocking: true,
        effects: [
            { type: EffectID.RevealAndOpen, target: 'self' },
            { type: EffectID.GrantDiscovery, target: 'actor' }
        ],
        tags: [InteractableID.Door, Tags.SecretRoom, 'hidden', 'discovery']
    },

    [InteractableID.DestructibleWall]: {
        id: InteractableID.DestructibleWall,
        name: 'Cracked Wall',
        type: InteractableType.Trap,
        graphics: {
            resource: Resources.InteractablesPng, // Using Wall Lookalike for now, or could use Spikes/Trap
            spriteCoords: { x: 6, y: 0 }, // Secret Door/Wall
            fallbackColor: ex.Color.fromHex('#666666'),
            states: {
                [InteractableState.Closed]: { spriteCoords: { x: 6, y: 0 } },
                [InteractableState.Broken]: { spriteCoords: { x: 7, y: 0 } } // Rubble
            }
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
        tags: [Tags.Destructible, 'wall', 'obstacle', 'breakable']
    },

    [InteractableID.StairsDown]: {
        id: InteractableID.StairsDown,
        name: 'Stairs Down',
        type: InteractableType.Portal,
        graphics: {
            resource: Resources.InteractablesPng,
            spriteCoords: { x: 1, y: 2 }, // Stairs Down (Stone) - Row 3 (index 2)
            fallbackColor: ex.Color.fromHex('#8B4513'),
            states: {
                [InteractableState.Closed]: { spriteCoords: { x: 1, y: 2 } },
                [InteractableState.Open]: { spriteCoords: { x: 1, y: 2 } },
                [InteractableState.Active]: { spriteCoords: { x: 1, y: 2 } }
            }
        },
        description: 'A staircase leading to the next floor',
        effects: [
            { type: EffectID.LevelTransition, value: 1, target: 'actor' }
        ],
        tags: ['stairs', Tags.Portal, 'level_transition', 'descent']
    },

    [InteractableID.StairsUp]: {
        id: InteractableID.StairsUp,
        name: 'Stairs Up',
        type: InteractableType.Portal,
        graphics: {
            resource: Resources.InteractablesPng,
            spriteCoords: { x: 0, y: 2 }, // Stairs Up (Stone) - Row 3 (index 2)
            fallbackColor: ex.Color.fromHex('#8B4513'),
            states: {
                [InteractableState.Closed]: { spriteCoords: { x: 0, y: 2 } },
                [InteractableState.Open]: { spriteCoords: { x: 0, y: 2 } },
                [InteractableState.Active]: { spriteCoords: { x: 0, y: 2 } }
            }
        },
        description: 'A staircase leading back to the previous floor',
        effects: [
            { type: EffectID.LevelTransition, value: -1, target: 'actor' }
        ],
        tags: ['stairs', Tags.Portal, 'level_transition', 'ascent']
    },

    'trigger_plate': {
        id: 'trigger_plate',
        name: 'Pressure Plate',
        type: InteractableType.Trap,
        graphics: {
            resource: Resources.InteractablesPng,
            spriteCoords: { x: 2, y: 6 }, // Pressure Plate (Up) - Row 7 (index 6)
            fallbackColor: ex.Color.DarkGray,
            states: {
                [InteractableState.Closed]: { spriteCoords: { x: 2, y: 6 } }, // Up
                [InteractableState.Active]: { spriteCoords: { x: 3, y: 6 } } // Down
            }
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
        tags: [Tags.Trap, 'trigger', 'plate']
    },

    [InteractableID.Chasm]: {
        id: InteractableID.Chasm,
        name: 'Chasm',
        type: InteractableType.Trap,
        graphics: {
            resource: Resources.LargeObjectsPng,
            graphicType: GraphicType.NineSlice,
            fallbackColor: ex.Color.Black,
            states: {
                [InteractableState.Closed]: { graphicType: GraphicType.NineSlice },
                [InteractableState.Active]: { graphicType: GraphicType.NineSlice }
            }
        },
        description: 'A deep, dark chasm. Falling in would be fatal.',
        blocking: false,
        effects: [
            { type: EffectID.FallDamage, value: 999, target: 'actor' }
        ],
        tags: ['chasm', Tags.Trap, 'fall', 'dangerous']
    },

    [InteractableID.SlipperyIce]: {
        id: InteractableID.SlipperyIce,
        name: 'Slippery Ice',
        type: InteractableType.Trap,
        graphics: {
            resource: Resources.LargeObjectsPng,
            graphicType: GraphicType.NineSlice,
            fallbackColor: ex.Color.Cyan,
            states: {
                [InteractableState.Closed]: { graphicType: GraphicType.NineSlice },
                [InteractableState.Active]: { graphicType: GraphicType.NineSlice }
            }
        },
        description: 'A patch of dangerously slippery ice.',
        blocking: false,
        effects: [
            // Slide effect to be implemented or use existing
            { type: 'slide', target: 'actor' } 
        ],
        tags: ['ice', 'slippery', Tags.Trap]
    },

    [InteractableID.BreakableIce]: {
        id: InteractableID.BreakableIce,
        name: 'Breakable Ice',
        type: InteractableType.Trap,
        graphics: {
            resource: Resources.LargeObjectsPng,
            graphicType: GraphicType.NineSlice,
            fallbackColor: ex.Color.White,
            states: {
                [InteractableState.Closed]: { graphicType: GraphicType.NineSlice },
                [InteractableState.Broken]: { 
                    // When broken, maybe it becomes water or just disappears? 
                    // For now, let's say it becomes open water (which might be a different graphic or just nothing)
                    // Or we can use the 'VoidHole' graphic for broken ice (water underneath)
                    graphicType: GraphicType.NineSlice 
                }
            }
        },
        description: 'Thin ice that might crack under pressure.',
        blocking: true, // Blocks movement until broken? Or walkable but breaks?
        // Let's assume it blocks like a wall but can be destroyed
        destructible: true,
        health: 10,
        tags: ['ice', 'breakable', Tags.Destructible]
    },

    [InteractableID.SummoningCircle]: {
        id: InteractableID.SummoningCircle,
        name: 'Summoning Circle',
        type: InteractableType.Functional,
        graphics: {
            resource: Resources.LargeObjectsPng,
            graphicType: GraphicType.NineSlice,
            fallbackColor: ex.Color.Purple,
            states: {
                [InteractableState.Closed]: { graphicType: GraphicType.NineSlice },
                [InteractableState.Active]: { graphicType: GraphicType.NineSlice }
            }
        },
        description: 'A magical circle pulsing with dark energy.',
        blocking: false,
        effects: [
            { type: 'summon_boss', target: 'area' }
        ],
        size: { width: 3, height: 3 },
        tags: [Tags.Magic, 'summon', 'boss', 'functional']
    },

    [InteractableID.ALTAR]: {
        id: InteractableID.ALTAR,
        name: 'Altar',
        type: InteractableType.Functional,
        graphics: {
            resource: Resources.InteractablesPng, // Placeholder or use specific sprite
            spriteCoords: { x: 5, y: 7 }, // Using Anvil/Table placeholder for now
            fallbackColor: ex.Color.Red,
            states: {
                [InteractableState.Closed]: { spriteCoords: { x: 5, y: 7 } },
                [InteractableState.Active]: { spriteCoords: { x: 5, y: 7 } }
            }
        },
        description: 'A mysterious altar.',
        blocking: true,
        tags: ['altar', 'religious', 'functional']
    },

    [InteractableID.CandleStand]: {
        id: InteractableID.CandleStand,
        name: 'Candle Stand',
        type: InteractableType.Decorative,
        graphics: {
            resource: Resources.CommonDecorPng,
            graphicType: GraphicType.Animation,
            fallbackColor: ex.Color.Yellow,
            states: {
                [InteractableState.Closed]: { 
                    graphicType: GraphicType.Animation,
                    animation: { 
                        frames: [
                            { x: 7, y: 3, duration: 100 }, // Candle Stand - Row 4 (index 3), Col 8 (index 7)
                            { x: 7, y: 3, duration: 100 }, // Need to check if there are actual animation frames
                            // Looking at decor.ts: [DecorID.CandleStand]: { sheet: DecorSheet.Common, col: 7, row: 3, animation: { frameCount: 4, duration: 100 }, type: GraphicType.Animation }
                            // If it's a 4 frame animation starting at col 7, it would go off the sheet (8x8).
                            // Wait, DecorDefinitions says col 7, row 3. If frameCount is 4, it implies it wraps or goes to next row?
                            // Or maybe my assumption about 8x8 sheet is wrong or it's horizontal.
                            // Let's assume for now it's just 2 frames toggling or something simple if I can't verify the sheet.
                            // Actually, let's look at DecorDefinitions again.
                            // [DecorID.CandleStand]: { sheet: DecorSheet.Common, col: 7, row: 3, animation: { frameCount: 4, duration: 100 }, type: GraphicType.Animation }
                            // If col is 7 and count is 4, it goes 7, 8, 9, 10.
                            // If the sheet is 8 columns wide (0-7), then 8, 9, 10 are invalid unless it wraps.
                            // GraphicsManager.getSmallDecorSprite handles this by checking bounds: if (col < 8).
                            // So if I define it here, I should probably stick to valid frames.
                            // Let's just use the static sprite for now to be safe, or a simple flicker if I knew the frames.
                            // I'll use the static sprite for now to avoid broken graphics.
                            { x: 7, y: 3, duration: 100 }
                        ],
                        loop: true 
                    }
                }
            }
        },
        description: 'A stand with flickering candles.',
        blocking: true,
        tags: [Tags.LightSource, Tags.Decor]
    },

    [InteractableID.CHEST]: {
        id: InteractableID.CHEST,
        name: 'Chest',
        type: InteractableType.Container,
        graphics: {
            resource: Resources.InteractablesPng,
            spriteCoords: { x: 0, y: 1 }, // Chest (Wood, Closed) - Row 2 (index 1)
            fallbackColor: ex.Color.fromHex('#8B4513'),
            states: {
                [InteractableState.Closed]: { spriteCoords: { x: 0, y: 1 } },
                [InteractableState.Open]: { spriteCoords: { x: 1, y: 1 } },
                [InteractableState.Used]: { spriteCoords: { x: 1, y: 1 } }
            }
        },
        description: 'A wooden chest that might contain treasure',
        consumeOnUse: true,
        lootTableId: LootTableID.CHEST,
        tags: [Tags.Container, 'loot', Tags.TreasureRoom]
    },

    [InteractableID.TREASURE_CHEST]: {
        id: InteractableID.TREASURE_CHEST,
        name: 'Treasure Chest',
        type: InteractableType.Container,
        graphics: {
            resource: Resources.InteractablesPng,
            spriteCoords: { x: 2, y: 1 }, // Chest (Gold, Closed) - Row 2 (index 1)
            fallbackColor: ex.Color.fromHex('#FFD700'),
            states: {
                [InteractableState.Closed]: { spriteCoords: { x: 2, y: 1 } },
                [InteractableState.Open]: { spriteCoords: { x: 3, y: 1 } },
                [InteractableState.Used]: { spriteCoords: { x: 3, y: 1 } }
            }
        },
        description: 'A gilded chest containing valuable treasures',
        consumeOnUse: true,
        lootTableId: LootTableID.TREASURE_CHEST,
        tags: [Tags.Container, 'loot', Tags.TreasureRoom, 'rare']
    },

    [InteractableID.Campfire]: {
        id: InteractableID.Campfire,
        name: 'Campfire',
        type: InteractableType.Functional,
        graphics: {
            resource: Resources.InteractablesPng,
            spriteCoords: { x: 2, y: 2 },
            fallbackColor: ex.Color.fromHex('#FF6600'),
            states: {
                [InteractableState.Active]: {
                    animation: {
                        frames: [
                            { x: 0, y: 4, duration: 200 },
                            { x: 1, y: 4, duration: 200 },
                            { x: 2, y: 4, duration: 200 },
                        ],
                        loop: true
                    }
                },
                [InteractableState.Closed]: {
                    animation: {
                        frames: [
                            { x: 0, y: 4, duration: 200 },
                            { x: 1, y: 4, duration: 200 },
                            { x: 2, y: 4, duration: 200 },
                        ],
                        loop: true
                    }
                }
            }
        },
        description: 'A crackling campfire that restores warmth and dries equipment',
        warmthGeneration: 20,
        lightRadius: 4,
        effects: [
            { type: EffectID.WarmthRestore, value: 40, target: 'actor' },
            { type: EffectID.DryEquipment, target: 'actor' }
        ],
        tags: [Tags.HeatSource, Tags.LightSource, EffectID.Fire, 'survival']
    },

    [InteractableID.WallTorch]: {
        id: InteractableID.WallTorch,
        name: 'Wall Torch',
        type: InteractableType.Decorative,
        graphics: {
            resource: Resources.InteractablesPng,
            spriteCoords: { x: 0, y: 2 },
            fallbackColor: ex.Color.fromHex('#FF8800'),
            states: {
                [InteractableState.Active]: {
                    animation: {
                        frames: [
                            { x: 0, y: 5, duration: 300 },
                            { x: 1, y: 5, duration: 300 },
                            { x: 2, y: 5, duration: 300 },
                            { x: 3, y: 5, duration: 300 }
                            
                        ],
                        loop: true
                    }
                },
                [InteractableState.Closed]: {
                    animation: {
                        frames: [
                            { x: 0, y: 5, duration: 300 },
                            { x: 1, y: 5, duration: 300 },
                            { x: 2, y: 5, duration: 300 },
                            { x: 3, y: 5, duration: 300 }
                        ],
                        loop: true
                    }
                }
            }
        },
        description: 'A torch mounted on the wall providing warmth and light',
        warmthGeneration: 20,
        lightRadius: 6,
        placement: 'wall',
        spawnRules: {
            indoor: true,
            minPerRoom: 4,
            maxPerRoom: 8,
            avoidCorridors: true
        },
        tags: [Tags.HeatSource, Tags.LightSource, EffectID.Fire, 'wall-mounted']
    }
};

// Helper functions for data access
export const InteractableCategories = {
    getContainers: () => Object.values(InteractableDefinitions).filter(def => def.type === InteractableType.Container),
    getDoors: () => Object.values(InteractableDefinitions).filter(def => def.type === InteractableType.Door),
    getCraftingStations: () => Object.values(InteractableDefinitions).filter(def => def.type === InteractableType.Crafting),
    getWarmthSources: () => Object.values(InteractableDefinitions).filter(def => def.warmthGeneration && def.warmthGeneration > 0),
    getLightSources: () => Object.values(InteractableDefinitions).filter(def => def.lightRadius && def.lightRadius > 0),
    getByTag: (tag: string) => Object.values(InteractableDefinitions).filter(def => def.tags.includes(tag))
};