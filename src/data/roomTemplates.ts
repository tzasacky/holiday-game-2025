import { LootTableID } from '../constants/LootTableIDs';
import { RoomTypeID } from '../constants/RoomTypeID';
import { InteractableID } from '../constants/InteractableIDs';
import { ItemID } from '../constants/ItemIDs';

export interface InteractablePlacement {
  type: InteractableID;
  probability: number; // 0-1 probability of spawning
  minCount?: number;
  maxCount?: number;
  placement: 'wall' | 'floor' | 'corner' | 'center' | 'edge';
  avoidPlayerSpawn?: boolean;
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
    tags: ['combat', 'dangerous'],
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
    tags: ['treasure', 'valuable', 'guarded'],
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
    tags: ['boss', 'epic', 'unique'],
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
    tags: ['safe', 'healing', 'peaceful'],
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
    tags: ['ambush', 'trap', 'surprise'],
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
    tags: ['puzzle', 'interactive', 'brain'],
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
    tags: ['holiday', 'workshop', 'crafting'],
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
    tags: ['entrance', 'safe'],
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
    tags: ['exit', 'safe'],
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
    tags: ['shop', 'safe', 'merchant'],
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
    tags: ['library', 'knowledge'],
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
    tags: ['armory', 'weapons'],
    rarity: 'uncommon',
    placement: {
      biomeWeights: {
        'frozen_depths': 1.2,
      },
    },
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
    tags: ['kitchen', 'food'],
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
    tags: ['bedroom', 'sleep'],
    rarity: 'common',
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