import { LootTableID } from '../constants/LootTableIDs';
import { RoomTypeID } from '../constants/RoomTypeID';
import { InteractableID } from '../constants/InteractableIDs';
import { ItemID } from '../constants/ItemIDs';
import { DecorID } from '../constants/DecorIDs';
import { Tags } from '../constants/Tags';
import { DecorPlacementType } from '../constants/DecorPlacementType';
import { TerrainType } from './terrain';
import { ActorID } from '../constants/ActorIDs';
import * as ex from 'excalibur';

export interface DecorPlacementRule {
    placementType: DecorPlacementType;
    items: string[]; // Can be DecorID or InteractableID
    probability: number;
    count?: number; // Max number of items to place
    
    // Constraints
    requiresTerrain?: string[]; // TerrainType IDs
    requiresWall?: boolean; // If true, must be adjacent to a wall (for Floor placement)
    minDistance?: number; // Minimum distance from other decor
    unique?: boolean; // If true, only place one of this type
}

export interface PrefabActorPlacement {
  actorId: ActorID;
  position: ex.Vector;
  properties?: Record<string, any>;
}

export interface PrefabInteractablePlacement {
  interactableId: InteractableID;
  position: ex.Vector;
  properties?: Record<string, any>;
}

export interface PrefabItemPlacement {
  itemId: ItemID;
  position: ex.Vector;
  count?: number;
  probability?: number;
}

export interface PrefabConfig {
    width: number;
    height: number;
    layout: string[];
    legend: Record<string, TerrainType>;
    actors?: PrefabActorPlacement[];
    interactables?: PrefabInteractablePlacement[];
    items?: PrefabItemPlacement[];
}

export interface InteractablePlacement {
  type: InteractableID;
  probability: number; // 0-1 probability of spawning
  minCount?: number;
  maxCount?: number;
  placement: 'wall' | 'floor' | 'corner' | 'center' | 'edge';
  avoidPlayerSpawn?: boolean;
  size?: { width: number; height: number }; // Optional size requirement (default 1x1)
}

export interface SpawnPointConfig {
  spawnDensity: 'low' | 'medium' | 'high';
  spawnTable?: string; // Override default spawn table
  guaranteedSpawns?: {
    type: 'normal' | 'elite' | 'boss' | 'pack' | 'guardian';
    count: number;
  }[];
}

export interface LootConfig {
  tableId?: LootTableID;
  itemProbability: number; // 0-1 chance for items to spawn
  guaranteedItems?: {
    itemId: ItemID;
    count: number;
  }[];
}

export type RoomCategory = 'basic' | 'flavor' | 'special';

export interface PlacementConfig {
  biomeWeights?: Record<string, number>; // BiomeID -> Weight multiplier
  depthScaling?: {
    startFloor: number;
    endFloor: number;
    weightMultiplier: number; // Multiplier at endFloor
  };
}

export interface RoomTemplate {
  id: RoomTypeID;
  name: string;
  description: string;
  category: RoomCategory; // High-level placement logic
  type: 'normal' | 'boss' | 'treasure' | 'puzzle' | 'ambush' | 'safe' | 'shop';
  minSize: { width: number; height: number };
  maxSize: { width: number; height: number };
  
  // Placement configuration
  placement?: PlacementConfig;

  // Spawn configuration
  spawns: SpawnPointConfig;
  
  // Interactable placement rules
  interactables: InteractablePlacement[];
  
  // Loot configuration
  loot: LootConfig;

  // Decor placement rules (Data-driven decor)
  decorRules?: DecorPlacementRule[];
  
  // Prefab configuration (Fixed layout)
  prefab?: PrefabConfig;

  // Material overrides
  materials?: {
    floor?: string;
    wall?: string;
  };
  
  // Special properties
  tags: string[];
  rarity: 'common' | 'uncommon' | 'rare' | 'special';
  floorRestrictions?: {
    minFloor?: number;
    maxFloor?: number;
  };
  
  // Visual/theme properties
  theme?: {
    preferredTerrain?: string[];
    lighting?: 'normal' | 'dim' | 'bright' | 'flickering';
    temperature?: 'normal' | 'cold' | 'warm' | 'freezing';
  };
}

// Room templates for different types
export const RoomTemplateDefinitions: Record<RoomTypeID, RoomTemplate> = {
  // Basic room types
  [RoomTypeID.Basic]: {
    id: RoomTypeID.Basic,
    name: 'Basic Room',
    description: 'Standard dungeon room with basic enemies and loot',
    category: 'basic',
    type: 'normal',
    minSize: { width: 5, height: 5 },
    maxSize: { width: 15, height: 15 },
    spawns: {
      spawnDensity: 'medium',
    },
    interactables: [
      {
        type: InteractableID.CHEST,
        probability: 0.2,
        placement: 'corner',
        avoidPlayerSpawn: true,
      },
    ],
    loot: {
      itemProbability: 0.3,
    },
    decorRules: [
        { placementType: DecorPlacementType.FloorCorners, items: [DecorID.CrateCommon, DecorID.BarrelCommon, DecorID.SackCommon], probability: 0.5 },
        { placementType: DecorPlacementType.FloorPerimeter, items: [DecorID.BarrelCommon, DecorID.CrateCommon, DecorID.Cabinet, DecorID.BookshelfCommon], probability: 0.5, count: 4 },
        { placementType: DecorPlacementType.FloorRandom, items: [DecorID.RockCommon], probability: 0.2 },
        { placementType: DecorPlacementType.FloorCenter, items: [DecorID.TableRect, DecorID.TableRound], probability: 0.3 },
        { placementType: DecorPlacementType.OnWall, items: [DecorID.Painting, DecorID.Mirror, DecorID.Clock, DecorID.Wreath, InteractableID.WallTorch], probability: 0.6 }
    ],
    tags: ['basic', 'common'],
    rarity: 'common',
    placement: {
      depthScaling: {
        startFloor: 1,
        endFloor: 10,
        weightMultiplier: 0.5, // Becomes less common deeper
      },
    },
  },

  // Combat-focused rooms
  [RoomTypeID.Combat]: {
    id: RoomTypeID.Combat,
    name: 'Combat Arena',
    description: 'Room designed for challenging combat encounters',
    category: 'basic', // Combat rooms are basic filler
    type: 'normal',
    minSize: { width: 8, height: 8 },
    maxSize: { width: 20, height: 20 },
    spawns: {
      spawnDensity: 'high',
      guaranteedSpawns: [
        { type: 'elite', count: 1 },
        { type: 'normal', count: 2 },
      ],
    },
    interactables: [
      {
        type: InteractableID.TRAP,
        probability: 0.4,
        minCount: 1,
        maxCount: 3,
        placement: 'floor',
      },
    ],
    loot: {
      itemProbability: 0.5,
      tableId: LootTableID.COMBAT_LOOT,
    },
    decorRules: [
        { placementType: DecorPlacementType.FloorPerimeter, items: [DecorID.WeaponRack, DecorID.ArmorStand], probability: 0.5, count: 3 },
        { placementType: DecorPlacementType.FloorCorners, items: [DecorID.ArmorStand], probability: 0.3 },
        { placementType: DecorPlacementType.FloorRandom, items: [DecorID.RockSnow, DecorID.BonePile], probability: 0.3 },
        { placementType: DecorPlacementType.FloorCenter, items: [InteractableID.Campfire], probability: 0.3 },
        { placementType: DecorPlacementType.OnWall, items: [DecorID.BannerRed, DecorID.ShieldDecor], probability: 0.3 }
    ],
    tags: [Tags.CombatRoom, 'arena'],
    rarity: 'uncommon',
    placement: {
      depthScaling: {
        startFloor: 1,
        endFloor: 10,
        weightMultiplier: 2.0, // Becomes more common deeper
      },
      biomeWeights: {
        'krampus_lair': 1.5, // More combat in Krampus Lair
      },
    },
  },

  // Treasure rooms
  [RoomTypeID.Treasure]: {
    id: RoomTypeID.Treasure,
    name: 'Treasure Vault',
    description: 'Room filled with valuable loot, but well guarded',
    category: 'special',
    type: 'treasure',
    minSize: { width: 6, height: 6 },
    maxSize: { width: 12, height: 12 },
    spawns: {
      spawnDensity: 'medium',
      spawnTable: 'treasure_room_guards',
      guaranteedSpawns: [
        { type: 'guardian', count: 2 },
      ],
    },
    interactables: [
      {
        type: InteractableID.CHEST,
        probability: 0.8,
        minCount: 2,
        maxCount: 4,
        placement: 'wall',
      },
      {
        type: InteractableID.PresentChest,
        probability: 0.6,
        minCount: 1,
        maxCount: 2,
        placement: 'center',
      },
    ],
    loot: {
      itemProbability: 0.8,
      tableId: LootTableID.TREASURE_ROOM_LOOT,
    },
    decorRules: [
        { placementType: DecorPlacementType.FloorCenter, items: [DecorID.RugRed], probability: 0.8 },
        { placementType: DecorPlacementType.FloorCorners, items: [DecorID.Vase], probability: 0.4 },
        { placementType: DecorPlacementType.OnWall, items: [DecorID.Painting], probability: 0.4 }
    ],
    tags: [Tags.TreasureRoom, 'loot', 'reward'],
    rarity: 'rare',
    theme: {
      lighting: 'bright',
      preferredTerrain: ['Floor', 'WoodFloor'],
    },
  },

  // Boss rooms
  [RoomTypeID.Boss]: {
    id: RoomTypeID.Boss,
    name: 'Boss Chamber',
    description: 'Large chamber for epic boss encounters',
    category: 'special',
    type: 'boss',
    minSize: { width: 12, height: 12 },
    maxSize: { width: 25, height: 25 },
    spawns: {
      spawnDensity: 'low',
      spawnTable: 'boss_room',
      guaranteedSpawns: [
        { type: 'boss', count: 1 },
      ],
    },
    interactables: [
      {
        type: InteractableID.ALTAR,
        probability: 0.5,
        placement: 'center',
      },
      {
        type: InteractableID.BOSS_CHEST,
        probability: 1.0,
        placement: 'wall',
      },
    ],
    loot: {
      itemProbability: 1.0,
      tableId: LootTableID.BOSS_LOOT,
    },
    decorRules: [
        { placementType: DecorPlacementType.FloorCenter, items: [DecorID.RugRed], probability: 0.5 },
        { placementType: DecorPlacementType.FloorCorners, items: [DecorID.CandleStand], probability: 0.8 },
        { placementType: DecorPlacementType.FloorPerimeter, items: [DecorID.ArmorStand], probability: 0.6, count: 4 },
        { placementType: DecorPlacementType.OnWall, items: [DecorID.BannerRed, DecorID.Torch, InteractableID.WallTorch], probability: 0.7 }
    ],
    tags: [Tags.BossRoom, 'danger', 'finale'],
    rarity: 'special',
    floorRestrictions: {
      minFloor: 5,
    },
    theme: {
      lighting: 'dim',
      preferredTerrain: ['StoneFloor'],
    },
  },

  // Safe rooms
  [RoomTypeID.Safe]: {
    id: RoomTypeID.Safe,
    name: 'Sanctuary',
    description: 'Peaceful room with no enemies and healing items',
    category: 'flavor',
    type: 'safe',
    minSize: { width: 4, height: 4 },
    maxSize: { width: 8, height: 8 },
    spawns: {
      spawnDensity: 'low', // No enemies
    },
    interactables: [
      {
        type: InteractableID.Fireplace,
        probability: 0.8,
        placement: 'wall',
      },
      {
        type: InteractableID.Bookshelf,
        probability: 0.4,
        minCount: 1,
        maxCount: 2,
        placement: 'wall',
      },
    ],
    loot: {
      itemProbability: 0.6,
      guaranteedItems: [
        { itemId: ItemID.HotCocoa, count: 1 },
      ],
    },
    decorRules: [
        { placementType: DecorPlacementType.FloorCenter, items: [DecorID.RugGreen], probability: 0.6 },
        { placementType: DecorPlacementType.FloorCenter, items: [DecorID.TableRoundSnow], probability: 0.4 },
        { placementType: DecorPlacementType.FloorRandom, items: [DecorID.ChairFrontSnow], probability: 0.4 },
        { placementType: DecorPlacementType.OnWall, items: [DecorID.Wreath], probability: 0.5 }
    ],
    tags: [Tags.SafeRoom, 'rest', 'healing'],
    rarity: 'uncommon',
    theme: {
      temperature: 'warm',
    },
  },

  // Ambush rooms
  [RoomTypeID.Ambush]: {
    id: RoomTypeID.Ambush,
    name: 'Ambush Point',
    description: 'Seemingly empty room that spawns enemies when entered',
    category: 'special',
    type: 'ambush',
    minSize: { width: 6, height: 6 },
    maxSize: { width: 14, height: 14 },
    spawns: {
      spawnDensity: 'high',
      spawnTable: 'ambush',
      guaranteedSpawns: [
        { type: 'pack', count: 2 },
      ],
    },
    interactables: [
      {
        type: InteractableID.HIDDEN_DOOR,
        probability: 0.3,
        placement: 'wall',
      },
      {
        type: InteractableID.TRIGGER_PLATE,
        probability: 0.7,
        placement: 'center',
      },
    ],
    loot: {
      itemProbability: 0.4,
    },
    decorRules: [
        { placementType: DecorPlacementType.FloorRandom, items: [DecorID.CrateCommon, DecorID.BarrelCommon], probability: 0.5, count: 6 }
    ],
    tags: [Tags.AmbushRoom, 'trap', 'danger'],
    rarity: 'uncommon',
  },

  // Puzzle rooms
  [RoomTypeID.Puzzle]: {
    id: RoomTypeID.Puzzle,
    name: 'Puzzle Chamber',
    description: 'Room with interactive puzzles and mechanisms',
    category: 'special',
    type: 'puzzle',
    minSize: { width: 8, height: 8 },
    maxSize: { width: 16, height: 16 },
    spawns: {
      spawnDensity: 'low',
    },
    interactables: [
      {
        type: InteractableID.LEVER,
        probability: 0.8,
        minCount: 2,
        maxCount: 4,
        placement: 'wall',
      },
      {
        type: InteractableID.PRESSURE_PLATE,
        probability: 0.6,
        minCount: 1,
        maxCount: 3,
        placement: 'floor',
      },
      {
        type: InteractableID.PUZZLE_CHEST,
        probability: 0.7,
        placement: 'center',
      },
    ],
    loot: {
      itemProbability: 0.7,
      tableId: LootTableID.PUZZLE_REWARD_LOOT,
    },
    decorRules: [
        { placementType: DecorPlacementType.FloorCenter, items: [DecorID.FloorChecker], probability: 0.4 },
        { placementType: DecorPlacementType.OnWall, items: [DecorID.Clock], probability: 0.3 }
    ],
    tags: [Tags.PuzzleRoom, 'mystery'],
    rarity: 'rare',
    floorRestrictions: {
      minFloor: 3,
    },
  },

  // Special holiday-themed rooms
  [RoomTypeID.Workshop]: {
    id: RoomTypeID.Workshop,
    name: 'Santa\'s Workshop',
    description: 'Abandoned workshop with crafting materials and elven tools',
    category: 'special',
    type: 'treasure',
    minSize: { width: 10, height: 8 },
    maxSize: { width: 18, height: 14 },
    spawns: {
      spawnDensity: 'medium',
      spawnTable: 'workshop_guardians',
      guaranteedSpawns: [
        { type: 'guardian', count: 1 }
      ]
    },
    interactables: [
      {
        type: InteractableID.Anvil,
        probability: 0.9,
        placement: 'center',
      },
      {
        type: InteractableID.SleighStation,
        probability: 0.7,
        placement: 'wall',
      },
      {
        type: InteractableID.ChristmasTree,
        probability: 0.8,
        placement: 'corner',
      },
    ],
    loot: {
      itemProbability: 0.9,
      tableId: LootTableID.CRAFTING_LOOT,
      guaranteedItems: [
        { itemId: ItemID.HolidayHammer, count: 1 },
      ],
    },
    decorRules: [
        { placementType: DecorPlacementType.FloorCenter, items: [DecorID.TableRect], probability: 0.7 },
        { placementType: DecorPlacementType.FloorRandom, items: [DecorID.WoodPile, DecorID.ShovelSnow, DecorID.CrateSnow], probability: 0.4, count: 6 }
    ],
    tags: [Tags.WorkshopRoom, 'crafting'],
    rarity: 'special',
    floorRestrictions: {
      minFloor: 2,
      maxFloor: 8,
    },
    placement: {
      biomeWeights: {
        'snowy_village': 2.0, // Very likely in village
      },
    },
    theme: {
      temperature: 'warm',
      preferredTerrain: ['WoodFloor'],
    },
  },
  
  [RoomTypeID.Entrance]: {
    id: RoomTypeID.Entrance,
    name: 'Dungeon Entrance',
    description: 'The starting point of the floor.',
    category: 'special',
    type: 'safe',
    minSize: { width: 6, height: 6 },
    maxSize: { width: 10, height: 10 },
    spawns: { spawnDensity: 'low' },
    interactables: [],
    loot: { itemProbability: 0 },
    decorRules: [
        { placementType: DecorPlacementType.FloorCenter, items: [DecorID.RugRed], probability: 0.5 },
        { placementType: DecorPlacementType.FloorCorners, items: [DecorID.LanternGround], probability: 0.8 }
    ],
    tags: [Tags.StartRoom, 'safe'],
    rarity: 'common'
  },
  
  [RoomTypeID.Exit]: {
    id: RoomTypeID.Exit,
    name: 'Dungeon Exit',
    description: 'The way to the next floor.',
    category: 'special',
    type: 'safe',
    minSize: { width: 6, height: 6 },
    maxSize: { width: 10, height: 10 },
    spawns: { spawnDensity: 'low' },
    interactables: [],
    loot: { itemProbability: 0 },
    decorRules: [
        { placementType: DecorPlacementType.FloorCorners, items: [DecorID.LanternGround], probability: 0.8 }
    ],
    tags: [Tags.EndRoom, 'exit'],
    rarity: 'common'
  },

  [RoomTypeID.Shop]: {
    id: RoomTypeID.Shop,
    name: 'Goblin Shop',
    description: 'A safe place to trade wares.',
    category: 'flavor',
    type: 'shop',
    minSize: { width: 8, height: 8 },
    maxSize: { width: 12, height: 12 },
    spawns: { spawnDensity: 'low' },
    interactables: [],
    loot: { itemProbability: 0 },
    decorRules: [
        { placementType: DecorPlacementType.FloorCenter, items: [DecorID.RugGreen], probability: 0.8 },
        { placementType: DecorPlacementType.FloorCenter, items: [DecorID.TableRectSnow], probability: 0.8 },
        { placementType: DecorPlacementType.OnWall, items: [DecorID.CrateSnow], probability: 0.6 },
        { placementType: DecorPlacementType.FloorCorners, items: [DecorID.BarrelSnow], probability: 0.6 }
    ],
    tags: [Tags.ShopRoom, 'merchant', 'trade'],
    rarity: 'uncommon'
  },

  [RoomTypeID.Library]: {
    id: RoomTypeID.Library,
    name: 'Ancient Library',
    description: 'Filled with old books and scrolls.',
    category: 'flavor',
    type: 'normal',
    minSize: { width: 8, height: 8 },
    maxSize: { width: 14, height: 14 },
    spawns: { spawnDensity: 'medium' },
    interactables: [{ type: InteractableID.Bookshelf, probability: 0.8, placement: 'wall', minCount: 3, maxCount: 8 }],
    loot: { itemProbability: 0.4 },
    materials: { floor: 'wood', wall: 'wood' },
    decorRules: [
        { placementType: DecorPlacementType.OnWall, items: [InteractableID.Bookshelf, DecorID.BookshelfCommon, DecorID.Cabinet], probability: 0.8 },
        { placementType: DecorPlacementType.FloorCenter, items: [DecorID.TableRoundSnow, DecorID.TableRound], probability: 0.6 },
        { placementType: DecorPlacementType.FloorRandom, items: [DecorID.ChairFrontSnow, DecorID.ChairBackSnow, DecorID.ChairFront, DecorID.ChairBack], probability: 0.5, count: 4 },
        { placementType: DecorPlacementType.FloorCorners, items: [DecorID.CandleStand], probability: 0.4 }
    ],
    tags: [Tags.LibraryRoom, 'knowledge'],
    rarity: 'uncommon',
  },

  [RoomTypeID.Armory]: {
    id: RoomTypeID.Armory,
    name: 'Old Armory',
    description: 'Racks of weapons and armor line the walls.',
    category: 'flavor',
    type: 'normal',
    minSize: { width: 8, height: 8 },
    maxSize: { width: 14, height: 14 },
    spawns: { spawnDensity: 'high' },
    interactables: [],
    loot: { itemProbability: 0.6, tableId: LootTableID.COMBAT_LOOT },
    materials: { floor: 'stone', wall: 'stone' },
    decorRules: [
        { placementType: DecorPlacementType.FloorPerimeter, items: [DecorID.ArmorStand, DecorID.WeaponRack], probability: 0.8, count: 6 },
        { placementType: DecorPlacementType.FloorCorners, items: [DecorID.CrateCommon], probability: 0.5 },
        { placementType: DecorPlacementType.OnWall, items: [DecorID.ShieldDecor, DecorID.BannerBlue, DecorID.Torch, InteractableID.WallTorch], probability: 0.6 }
    ],
    placement: {
      biomeWeights: {
        'frozen_depths': 1.2,
      },
    },
    tags: ['armory', 'combat', 'weapons'],
    rarity: 'uncommon',
  },

  [RoomTypeID.Kitchen]: {
    id: RoomTypeID.Kitchen,
    name: 'Mess Hall',
    description: 'Where the dungeon denizens eat.',
    category: 'flavor',
    type: 'normal',
    minSize: { width: 8, height: 8 },
    maxSize: { width: 14, height: 14 },
    spawns: { spawnDensity: 'medium' },
    interactables: [{ type: InteractableID.Table, probability: 0.8, placement: 'center', minCount: 2, maxCount: 4 }],
    loot: { itemProbability: 0.5 },
    materials: { floor: 'stone', wall: 'wood' },
    decorRules: [
        { placementType: DecorPlacementType.FloorCenter, items: [DecorID.TableRectSnow, DecorID.TableRect], probability: 0.8 },
        { placementType: DecorPlacementType.FloorPerimeter, items: [DecorID.BarrelSnow, DecorID.SackSnow, DecorID.CrateSnow, DecorID.PotSnow, DecorID.BarrelCommon, DecorID.SackCommon, DecorID.CrateCommon], probability: 0.6, count: 5 },
        { placementType: DecorPlacementType.OnWall, items: [DecorID.Painting, DecorID.Clock, DecorID.Torch, InteractableID.WallTorch], probability: 0.6 }
    ],
    tags: [Tags.KitchenRoom, 'food'],
    rarity: 'common',
  },

  [RoomTypeID.Bedroom]: {
    id: RoomTypeID.Bedroom,
    name: 'Barracks',
    description: 'Sleeping quarters for guards.',
    category: 'flavor',
    type: 'normal',
    minSize: { width: 8, height: 8 },
    maxSize: { width: 14, height: 14 },
    spawns: { spawnDensity: 'high' },
    interactables: [{ type: InteractableID.Bed, probability: 0.8, placement: 'wall', minCount: 4, maxCount: 8 }],
    loot: { itemProbability: 0.3 },
    materials: { floor: 'wood', wall: 'wood' },
    decorRules: [
        { placementType: DecorPlacementType.FloorPerimeter, items: [InteractableID.Bed], probability: 0.7, count: 4 },
        { placementType: DecorPlacementType.FloorPerimeter, items: [DecorID.Cabinet], probability: 0.5, count: 2 },
        { placementType: DecorPlacementType.FloorCenter, items: [DecorID.RugRed], probability: 0.5 },
        { placementType: DecorPlacementType.OnWall, items: [DecorID.Painting, DecorID.Mirror], probability: 0.3 }
    ],
    tags: [Tags.BedroomRoom, 'sleep'],
    rarity: 'common',
  },

  [RoomTypeID.Garden]: {
    id: RoomTypeID.Garden,
    name: 'Winter Garden',
    description: 'An indoor or enclosed garden with snowy flora.',
    category: 'flavor',
    type: 'normal',
    minSize: { width: 10, height: 10 },
    maxSize: { width: 20, height: 20 },
    spawns: { spawnDensity: 'medium' },
    interactables: [
        { type: InteractableID.ChristmasTree, probability: 0.5, placement: 'corner', minCount: 1, maxCount: 4 }
    ],
    loot: { itemProbability: 0.4 },
    materials: { floor: 'grass', wall: 'hedge' },
    decorRules: [
        { placementType: DecorPlacementType.FloorPerimeter, items: [DecorID.FenceH, DecorID.FenceV, DecorID.FenceCorner], probability: 1.0 },
        { placementType: DecorPlacementType.FloorCenter, items: [DecorID.SnowmanProp], probability: 0.5 },
        { placementType: DecorPlacementType.FloorRandom, items: [DecorID.TreePineSmall, DecorID.BushFrozen, DecorID.RockSnow], probability: 0.3, count: 8 }
    ],
    tags: [Tags.GardenRoom, 'nature', 'outside'],
    rarity: 'uncommon',
    theme: { preferredTerrain: ['DeepSnow'] }
  },

  [RoomTypeID.Shrine]: {
    id: RoomTypeID.Shrine,
    name: 'Holiday Shrine',
    description: 'A sacred place dedicated to the holiday spirit.',
    category: 'special',
    type: 'safe',
    minSize: { width: 8, height: 8 },
    maxSize: { width: 12, height: 12 },
    spawns: { spawnDensity: 'low' },
    interactables: [
        { type: InteractableID.ALTAR, probability: 1.0, placement: 'center', minCount: 1, maxCount: 1 },
        { type: InteractableID.ChristmasTree, probability: 0.8, placement: 'corner', minCount: 2, maxCount: 4 }
    ],
    loot: { itemProbability: 0.8, tableId: LootTableID.TREASURE_ROOM_LOOT },
    materials: { floor: 'ice', wall: 'ice' },
    decorRules: [
        { placementType: DecorPlacementType.FloorCenter, items: [InteractableID.ALTAR], probability: 1.0 },
        { placementType: DecorPlacementType.FloorCenter, items: [DecorID.RugRed], probability: 1.0 },
        { placementType: DecorPlacementType.FloorCorners, items: [DecorID.CandleStand, DecorID.TreeXmas], probability: 1.0 },
        { placementType: DecorPlacementType.OnWall, items: [DecorID.Wreath], probability: 0.5 }
    ],
    tags: [Tags.ShrineRoom, 'holy', 'safe'],
    rarity: 'rare'
  },
  [RoomTypeID.Gallery]: {
    id: RoomTypeID.Gallery,
    name: 'Art Gallery',
    description: 'A long hall displaying festive art.',
    category: 'flavor',
    type: 'normal',
    minSize: { width: 6, height: 10 },
    maxSize: { width: 10, height: 20 }, // Long and narrow
    spawns: { spawnDensity: 'medium' },
    interactables: [], // DecorSystem handles paintings
    loot: { itemProbability: 0.5 },
    decorRules: [
        { placementType: DecorPlacementType.OnWall, items: [DecorID.Painting, DecorID.Mirror, DecorID.Clock, DecorID.Vase], probability: 0.7 },
        { placementType: DecorPlacementType.FloorCenter, items: [DecorID.RugRed], probability: 0.5 }
    ],
    tags: [Tags.GalleryRoom, 'art'],
    rarity: 'uncommon'
  },

  [RoomTypeID.Storage]: {
    id: RoomTypeID.Storage,
    name: 'Storage Room',
    description: 'Packed with supplies.',
    category: 'basic',
    type: 'normal',
    minSize: { width: 6, height: 6 },
    maxSize: { width: 12, height: 12 },
    spawns: { spawnDensity: 'medium' },
    interactables: [
        { type: InteractableID.CHEST, probability: 0.3, placement: 'corner', minCount: 1, maxCount: 2 }
    ],
    loot: { itemProbability: 0.6 },
    decorRules: [
        { placementType: DecorPlacementType.FloorRandom, items: [DecorID.CrateSnow, DecorID.BarrelSnow, DecorID.SackSnow, DecorID.CrateCommon, DecorID.BarrelCommon, DecorID.SackCommon], probability: 0.4, count: 15 }
    ],
    tags: [Tags.StorageRoom, 'clutter'],
    rarity: 'common'
  },

  // --- New Special Rooms ---

  [RoomTypeID.SummoningRoom]: {
    id: RoomTypeID.SummoningRoom,
    name: 'Summoning Chamber',
    description: 'A dark room with a pulsing magical circle.',
    category: 'special',
    type: 'ambush', // Or puzzle/special
    minSize: { width: 10, height: 10 },
    maxSize: { width: 16, height: 16 },
    spawns: { 
        spawnDensity: 'medium',
        spawnTable: 'summoning_room_spawns',
        guaranteedSpawns: [{ type: 'guardian', count: 1 }]
    },
    interactables: [
        { 
            type: InteractableID.SummoningCircle, 
            probability: 1.0, 
            placement: 'center', 
            minCount: 1, 
            maxCount: 1,
            size: { width: 3, height: 3 }
        },
        { type: InteractableID.CandleStand, probability: 0.8, placement: 'corner', minCount: 4, maxCount: 4 }
    ],
    loot: { itemProbability: 0.8, tableId: LootTableID.MAGIC_LOOT },
    decorRules: [
        { placementType: DecorPlacementType.FloorCenter, items: [InteractableID.SummoningCircle], probability: 1.0 },
        { placementType: DecorPlacementType.FloorCorners, items: [InteractableID.CandleStand], probability: 0.8 }
    ],
    tags: [Tags.SummoningRoom, 'magic', 'dark'],
    rarity: 'rare',
    theme: { lighting: 'dim' }
  },

  [RoomTypeID.IceChamber]: {
    id: RoomTypeID.IceChamber,
    name: 'Frozen Chamber',
    description: 'A room covered in slippery and breakable ice.',
    category: 'special', // or basic/flavor
    type: 'normal',
    minSize: { width: 8, height: 8 },
    maxSize: { width: 14, height: 14 },
    spawns: { 
      spawnDensity: 'medium',
      spawnTable: 'ice_chamber_spawns'
    },
    interactables: [
        { 
            type: InteractableID.SlipperyIce, 
            probability: 0.7, 
            placement: 'floor', 
            minCount: 3, 
            maxCount: 8,
            size: { width: 3, height: 3 } // Assuming 3x3 patches
        },
        { 
            type: InteractableID.BreakableIce, 
            probability: 0.5, 
            placement: 'center', 
            minCount: 1, 
            maxCount: 3, 
            size: { width: 3, height: 3 }
        }
    ],
    loot: { itemProbability: 0.4 },
    decorRules: [
        { placementType: DecorPlacementType.FloorRandom, items: [InteractableID.SlipperyIce], probability: 0.7, count: 5, requiresTerrain: [TerrainType.Ice] },
        { placementType: DecorPlacementType.FloorCenter, items: [InteractableID.BreakableIce], probability: 0.5 }
    ],
    tags: [Tags.IceChamber, 'cold', 'danger'],
    rarity: 'uncommon',
    theme: { temperature: 'freezing', preferredTerrain: ['Ice'] }
  },

  [RoomTypeID.ChasmRoom]: {
    id: RoomTypeID.ChasmRoom,
    name: 'Chasm Bridge',
    description: 'A precarious room with deep chasms.',
    category: 'special',
    type: 'normal',
    minSize: { width: 10, height: 10 },
    maxSize: { width: 16, height: 16 },
    spawns: { spawnDensity: 'low' },
    interactables: [
        { 
            type: InteractableID.Chasm, 
            probability: 1.0, 
            placement: 'edge', 
            minCount: 2, 
            maxCount: 6,
            size: { width: 3, height: 3 }
        }
    ],
    loot: { itemProbability: 0.3 },
    decorRules: [
        { placementType: DecorPlacementType.FloorPerimeter, items: [InteractableID.Chasm], probability: 1.0 }
    ],
    tags: [Tags.ChasmRoom, 'danger', 'void'],
    rarity: 'uncommon'
  },

  // --- Prefab Rooms ---

  [RoomTypeID.SmallShrine]: {
    id: RoomTypeID.SmallShrine,
    name: 'Small Shrine',
    description: 'A small, safe shrine with a fireplace.',
    category: 'special',
    type: 'safe',
    minSize: { width: 5, height: 5 },
    maxSize: { width: 5, height: 5 },
    spawns: { spawnDensity: 'low' },
    interactables: [],
    loot: { itemProbability: 0 },
    tags: ['shrine', 'safe'],
    rarity: 'uncommon',
    prefab: {
        width: 5,
        height: 5,
        layout: [
          "#####",
          "#...#",
          "#.F.#",
          "#...#",
          "#####"
        ],
        legend: {
          '#': TerrainType.Wall,
          '.': TerrainType.Floor,
          'F': TerrainType.Floor
        },
        interactables: [
          { interactableId: InteractableID.Fireplace, position: ex.vec(2, 2) }
        ],
        items: [
          { itemId: ItemID.HotCocoa, position: ex.vec(1, 2), count: 2, probability: 0.8 },
          { itemId: ItemID.Marshmallow, position: ex.vec(3, 2), count: 1, probability: 0.6 }
        ]
    }
  },

  [RoomTypeID.MerchantShop]: {
    id: RoomTypeID.MerchantShop,
    name: 'Merchant Shop',
    description: 'A structured shop with a counter.',
    category: 'flavor', // Using utility as per prefab def, mapped to flavor/special?
    type: 'shop',
    minSize: { width: 7, height: 5 },
    maxSize: { width: 7, height: 5 },
    spawns: { spawnDensity: 'low' },
    interactables: [],
    loot: { itemProbability: 0 },
    tags: ['shop', 'merchant'],
    rarity: 'rare',
    floorRestrictions: { minFloor: 2 },
    prefab: {
        width: 7,
        height: 5,
        layout: [
          "#######",
          "#.....#",
          "#.M...#",
          "#.....#",
          "#######"
        ],
        legend: {
          '#': TerrainType.Wall,
          '.': TerrainType.Floor,
          'M': TerrainType.Floor
        },
        interactables: [
          { interactableId: InteractableID.SHOP_COUNTER, position: ex.vec(2, 2) }
        ]
    }
  },

  [RoomTypeID.TreasureVault]: {
    id: RoomTypeID.TreasureVault,
    name: 'Treasure Vault (Prefab)',
    description: 'A heavily guarded vault.',
    category: 'special',
    type: 'treasure',
    minSize: { width: 9, height: 7 },
    maxSize: { width: 9, height: 7 },
    spawns: { spawnDensity: 'high' }, // Handled by prefab actors
    interactables: [],
    loot: { itemProbability: 0 },
    tags: ['treasure', 'vault'],
    rarity: 'rare', // unique in prefab
    floorRestrictions: { minFloor: 3 },
    prefab: {
        width: 9,
        height: 7,
        layout: [
          "#########",
          "#.......#",
          "#.#####.#",
          "#.#C.C#.#",
          "#.#####.#",
          "#.......#",
          "#########"
        ],
        legend: {
          '#': TerrainType.Wall,
          '.': TerrainType.Floor,
          'C': TerrainType.Floor
        },
        actors: [
          { actorId: ActorID.SNOW_GOLEM, position: ex.vec(1, 1), properties: { isGuard: true } },
          { actorId: ActorID.SNOW_GOLEM, position: ex.vec(7, 5), properties: { isGuard: true } }
        ],
        interactables: [
          { interactableId: InteractableID.TREASURE_CHEST, position: ex.vec(3, 3), properties: { lootTableId: 'rare_treasure_loot' } },
          { interactableId: InteractableID.TREASURE_CHEST, position: ex.vec(5, 3), properties: { lootTableId: 'rare_treasure_loot' } }
        ]
    }
  },

  [RoomTypeID.BossArena]: {
    id: RoomTypeID.BossArena,
    name: 'Boss Arena (Prefab)',
    description: 'The final showdown.',
    category: 'special',
    type: 'boss',
    minSize: { width: 11, height: 11 },
    maxSize: { width: 11, height: 11 },
    spawns: { spawnDensity: 'low' },
    interactables: [],
    loot: { itemProbability: 0 },
    tags: ['boss', 'arena'],
    rarity: 'special', // unique
    floorRestrictions: { minFloor: 5 },
    prefab: {
        width: 11,
        height: 11,
        layout: [
          "###########",
          "#.........#",
          "#.........#",
          "#.........#",
          "#....B....#",
          "#.........#",
          "#.........#",
          "#.........#",
          "#.........#",
          "#.........#",
          "###########"
        ],
        legend: {
          '#': TerrainType.Wall,
          '.': TerrainType.Floor,
          'B': TerrainType.Floor
        },
        actors: [
          { actorId: ActorID.FROST_GIANT, position: ex.vec(5, 5), properties: { isBoss: true, floorScaling: true } }
        ],
        items: [
          { itemId: ItemID.HotCocoa, position: ex.vec(2, 2), probability: 0.9 },
          { itemId: ItemID.HotCocoa, position: ex.vec(8, 8), probability: 0.9 }
        ]
    }
  },

  // Floor 15: Final Krampus Lair Boss - Summoning Circle
  [RoomTypeID.KrampusLair]: {
    id: RoomTypeID.KrampusLair,
    name: 'Krampus Summoning Chamber',
    description: 'A massive chamber with a pulsing summoning circle. Interact with it to face the ultimate evil.',
    category: 'special',
    type: 'boss',
    minSize: { width: 15, height: 15 },
    maxSize: { width: 15, height: 15 },
    spawns: { 
      spawnDensity: 'low',
      guaranteedSpawns: [
        { type: 'elite', count: 2 } // Guards before the summoning
      ]
    },
    interactables: [
      {
        type: InteractableID.SummoningCircle,
        probability: 1.0,
        placement: 'center',
        minCount: 1,
        maxCount: 1,
        size: { width: 5, height: 5 }
      },
      {
        type: InteractableID.CandleStand,
        probability: 1.0,
        placement: 'corner',
        minCount: 4,
        maxCount: 4
      },
      {
        type: InteractableID.EVIL_ALTAR,
        probability: 0.8,
        placement: 'wall',
        minCount: 2,
        maxCount: 4
      }
    ],
    loot: {
      itemProbability: 1.0,
      tableId: LootTableID.FINAL_BOSS_LOOT
    },
    decorRules: [
      { placementType: DecorPlacementType.FloorCenter, items: [InteractableID.SummoningCircle], probability: 1.0 },
      { placementType: DecorPlacementType.FloorCorners, items: [InteractableID.CandleStand], probability: 1.0 },
      { placementType: DecorPlacementType.FloorPerimeter, items: [DecorID.RuneRed, DecorID.RuneRed2], probability: 0.8, count: 8 },
      { placementType: DecorPlacementType.OnWall, items: [InteractableID.EVIL_ALTAR], probability: 0.6 }
    ],
    tags: ['krampus_lair', 'final_boss', 'summoning', 'interactive_boss'],
    rarity: 'special',
    floorRestrictions: {
      minFloor: 15,
      maxFloor: 15
    },
    theme: {
      lighting: 'dim',
      temperature: 'freezing',
      preferredTerrain: ['Floor']
    }
  },

  [RoomTypeID.WarmthSanctuary]: {
    id: RoomTypeID.WarmthSanctuary,
    name: 'Warmth Sanctuary',
    description: 'A blessed room radiating with magical warmth and comfort',
    category: 'special',
    type: 'safe',
    minSize: { width: 8, height: 8 },
    maxSize: { width: 12, height: 12 },
    spawns: {
      spawnDensity: 'low',
    },
    interactables: [
      {
        type: InteractableID.Fireplace,
        probability: 1.0,
        placement: 'wall',
        avoidPlayerSpawn: true,
      },
      {
        type: InteractableID.Campfire,
        probability: 0.8,
        placement: 'center',
        avoidPlayerSpawn: true,
      },
    ],
    loot: {
      itemProbability: 0.4,
      tableId: LootTableID.WARMTH_ITEMS,
    },
    materials: { floor: 'stone', wall: 'stone' },
    decorRules: [
      { placementType: DecorPlacementType.OnWall, items: [InteractableID.WallTorch], probability: 1.0, count: 8 },
      { placementType: DecorPlacementType.FloorCorners, items: [DecorID.CandleStand], probability: 0.8 },
      { placementType: DecorPlacementType.FloorCenter, items: [DecorID.RugRed], probability: 0.6 },
    ],
    tags: [Tags.SafeRoom, 'warmth', 'sanctuary', 'healing'],
    rarity: 'rare',
    placement: {
      depthScaling: {
        startFloor: 3,
        endFloor: 8,
        weightMultiplier: 1.5,
      },
    },
  },

  [RoomTypeID.Hearth]: {
    id: RoomTypeID.Hearth,
    name: 'Cozy Hearth',
    description: 'A small, intimate room with a crackling hearth and warm atmosphere',
    category: 'special',
    type: 'safe',
    minSize: { width: 6, height: 6 },
    maxSize: { width: 8, height: 8 },
    spawns: {
      spawnDensity: 'low',
    },
    interactables: [
      {
        type: InteractableID.Fireplace,
        probability: 1.0,
        placement: 'wall',
        avoidPlayerSpawn: true,
      },
    ],
    loot: {
      itemProbability: 0.6,
      tableId: LootTableID.FOOD_TABLE,
    },
    materials: { floor: 'wood', wall: 'stone' },
    decorRules: [
      { placementType: DecorPlacementType.OnWall, items: [InteractableID.WallTorch, DecorID.Painting], probability: 0.7 },
      { placementType: DecorPlacementType.FloorCenter, items: [DecorID.RugRed, DecorID.RugGreen], probability: 0.8 },
      { placementType: DecorPlacementType.FloorCorners, items: [DecorID.ChairFront, DecorID.ChairBack], probability: 0.6 },
      { placementType: DecorPlacementType.FloorPerimeter, items: [DecorID.TableRound], probability: 0.4 },
    ],
    tags: [Tags.SafeRoom, 'warmth', 'comfort', 'cozy'],
    rarity: 'uncommon',
    placement: {
      depthScaling: {
        startFloor: 1,
        endFloor: 10,
        weightMultiplier: 1.0,
      },
    },
  }
};

// Room generation constraints and rules
export const RoomGenerationRules = {
  // Maximum percentage of special rooms per floor
  maxSpecialRoomPercentage: 0.3,
  
  // Minimum distance between similar room types
  minDistanceBetweenSimilar: 3,
  
  // Required room types per floor
  requiredRoomTypes: {
    1: [RoomTypeID.Safe], // Floor 1 always has a safe room
    5: [RoomTypeID.Boss], // Floor 5 has boss
    10: [RoomTypeID.Boss, RoomTypeID.Workshop], // Floor 10 has multiple special rooms
  },
  
  // Room type distribution by floor ranges
  floorDistribution: {
    early: { // Floors 1-3
      [RoomTypeID.Basic]: 0.4,
      [RoomTypeID.Safe]: 0.15,
      [RoomTypeID.Combat]: 0.15,
      [RoomTypeID.Treasure]: 0.1,
      [RoomTypeID.Kitchen]: 0.1,
      [RoomTypeID.Bedroom]: 0.1,
    },
    mid: { // Floors 4-7
      [RoomTypeID.Basic]: 0.3,
      [RoomTypeID.Combat]: 0.25,
      [RoomTypeID.Treasure]: 0.15,
      [RoomTypeID.Puzzle]: 0.1,
      [RoomTypeID.Ambush]: 0.05,
      [RoomTypeID.Library]: 0.05,
      [RoomTypeID.Armory]: 0.05,
      [RoomTypeID.Shop]: 0.05,
    },
    late: { // Floors 8+
      [RoomTypeID.Combat]: 0.35,
      [RoomTypeID.Treasure]: 0.2,
      [RoomTypeID.Boss]: 0.1,
      [RoomTypeID.Puzzle]: 0.15,
      [RoomTypeID.Ambush]: 0.1,
      [RoomTypeID.Workshop]: 0.05,
      [RoomTypeID.Library]: 0.05,
    },
  },
} as const;

// Utility function to get room templates for a specific floor
export function getRoomTemplatesForFloor(floorNumber: number): RoomTemplate[] {
  const templates = Object.values(RoomTemplateDefinitions);
  
  return templates.filter(template => {
    // Check floor restrictions
    if (template.floorRestrictions?.minFloor && floorNumber < template.floorRestrictions.minFloor) {
      return false;
    }
    if (template.floorRestrictions?.maxFloor && floorNumber > template.floorRestrictions.maxFloor) {
      return false;
    }
    
    return true;
  });
}

// Get room distribution weights for a floor
export function getRoomDistributionForFloor(floorNumber: number): Record<string, number> {
  if (floorNumber <= 3) {
    return RoomGenerationRules.floorDistribution.early;
  } else if (floorNumber <= 7) {
    return RoomGenerationRules.floorDistribution.mid;
  } else {
    return RoomGenerationRules.floorDistribution.late;
  }
}