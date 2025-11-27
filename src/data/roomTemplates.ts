import { LootTableID } from '../constants/LootTableIDs';

export interface InteractablePlacement {
  type: string; // InteractableID
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
    itemId: string;
    count: number;
  }[];
}

export interface RoomTemplate {
  id: string;
  name: string;
  description: string;
  type: 'normal' | 'boss' | 'treasure' | 'puzzle' | 'ambush' | 'safe' | 'shop';
  minSize: { width: number; height: number };
  maxSize: { width: number; height: number };
  
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
export const RoomTemplateDefinitions: Record<string, RoomTemplate> = {
  // Basic room types
  basic_room: {
    id: 'basic_room',
    name: 'Basic Room',
    description: 'Standard dungeon room with basic enemies and loot',
    type: 'normal',
    minSize: { width: 5, height: 5 },
    maxSize: { width: 15, height: 15 },
    spawns: {
      spawnDensity: 'medium',
    },
    interactables: [
      {
        type: 'chest',
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
  },

  // Combat-focused rooms
  combat_room: {
    id: 'combat_room',
    name: 'Combat Arena',
    description: 'Room designed for challenging combat encounters',
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
        type: 'trap',
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
  },

  // Treasure rooms
  treasure_room: {
    id: 'treasure_room',
    name: 'Treasure Vault',
    description: 'Room filled with valuable loot, but well guarded',
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
        type: 'chest',
        probability: 0.8,
        minCount: 2,
        maxCount: 4,
        placement: 'wall',
      },
      {
        type: 'present_chest',
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
  boss_room: {
    id: 'boss_room',
    name: 'Boss Chamber',
    description: 'Large chamber for epic boss encounters',
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
        type: 'altar',
        probability: 0.5,
        placement: 'center',
      },
      {
        type: 'boss_chest',
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
  safe_room: {
    id: 'safe_room',
    name: 'Sanctuary',
    description: 'Peaceful room with no enemies and healing items',
    type: 'safe',
    minSize: { width: 4, height: 4 },
    maxSize: { width: 8, height: 8 },
    spawns: {
      spawnDensity: 'low', // No enemies
    },
    interactables: [
      {
        type: 'fireplace',
        probability: 0.8,
        placement: 'wall',
      },
      {
        type: 'bookshelf',
        probability: 0.4,
        minCount: 1,
        maxCount: 2,
        placement: 'wall',
      },
    ],
    loot: {
      itemProbability: 0.6,
      guaranteedItems: [
        { itemId: 'hot_cocoa', count: 1 },
      ],
    },
    tags: ['safe', 'healing', 'peaceful'],
    rarity: 'uncommon',
    theme: {
      lighting: 'warm',
      temperature: 'warm',
    },
  },

  // Ambush rooms
  ambush_room: {
    id: 'ambush_room',
    name: 'Ambush Point',
    description: 'Seemingly empty room that spawns enemies when entered',
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
        type: 'hidden_door',
        probability: 0.3,
        placement: 'wall',
      },
      {
        type: 'trigger_plate',
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
  puzzle_room: {
    id: 'puzzle_room',
    name: 'Puzzle Chamber',
    description: 'Room with interactive puzzles and mechanisms',
    type: 'puzzle',
    minSize: { width: 8, height: 8 },
    maxSize: { width: 16, height: 16 },
    spawns: {
      spawnDensity: 'low',
    },
    interactables: [
      {
        type: 'lever',
        probability: 0.8,
        minCount: 2,
        maxCount: 4,
        placement: 'wall',
      },
      {
        type: 'pressure_plate',
        probability: 0.6,
        minCount: 1,
        maxCount: 3,
        placement: 'floor',
      },
      {
        type: 'puzzle_chest',
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
  workshop_room: {
    id: 'workshop_room',
    name: 'Santa\'s Workshop',
    description: 'Abandoned workshop with crafting materials and elven tools',
    type: 'treasure',
    minSize: { width: 10, height: 8 },
    maxSize: { width: 18, height: 14 },
    spawns: {
      spawnDensity: 'medium',
    },
    interactables: [
      {
        type: 'anvil',
        probability: 0.9,
        placement: 'center',
      },
      {
        type: 'sleigh_station',
        probability: 0.7,
        placement: 'wall',
      },
      {
        type: 'christmas_tree',
        probability: 0.8,
        placement: 'corner',
      },
    ],
    loot: {
      itemProbability: 0.9,
      tableId: LootTableID.CRAFTING_LOOT,
      guaranteedItems: [
        { itemId: 'holiday_hammer', count: 1 },
      ],
    },
    tags: ['holiday', 'workshop', 'crafting'],
    rarity: 'special',
    floorRestrictions: {
      minFloor: 2,
      maxFloor: 8,
    },
    theme: {
      lighting: 'warm',
      temperature: 'warm',
      preferredTerrain: ['WoodFloor'],
    },
  },
};

// Room generation constraints and rules
export const RoomGenerationRules = {
  // Maximum percentage of special rooms per floor
  maxSpecialRoomPercentage: 0.3,
  
  // Minimum distance between similar room types
  minDistanceBetweenSimilar: 3,
  
  // Required room types per floor
  requiredRoomTypes: {
    1: ['safe_room'], // Floor 1 always has a safe room
    5: ['boss_room'], // Floor 5 has boss
    10: ['boss_room', 'workshop_room'], // Floor 10 has multiple special rooms
  },
  
  // Room type distribution by floor ranges
  floorDistribution: {
    early: { // Floors 1-3
      basic_room: 0.6,
      safe_room: 0.2,
      combat_room: 0.1,
      treasure_room: 0.1,
    },
    mid: { // Floors 4-7
      basic_room: 0.4,
      combat_room: 0.3,
      treasure_room: 0.15,
      puzzle_room: 0.1,
      ambush_room: 0.05,
    },
    late: { // Floors 8+
      combat_room: 0.4,
      treasure_room: 0.2,
      boss_room: 0.1,
      puzzle_room: 0.15,
      ambush_room: 0.1,
      workshop_room: 0.05,
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