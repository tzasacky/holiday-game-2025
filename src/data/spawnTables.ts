import { ActorID } from '../constants/ActorIDs';

export interface SpawnEntry {
  actorId: ActorID;
  weight: number;
  minFloor?: number;
  maxFloor?: number;
  packSize?: { min: number; max: number };
  tags?: string[];
}

export interface SpawnTableDefinition {
  id: string;
  name: string;
  entries: SpawnEntry[];
  floorScaling?: {
    strengthBonus: number; // Per floor multiplier
    hpBonus: number;       // Per floor multiplier
  };
}

export const BaseSpawnTables: Record<string, SpawnTableDefinition> = {
  early_floors: {
    id: 'early_floors',
    name: 'Early Floor Spawns',
    entries: [
      { actorId: ActorID.SNOW_SPRITE, weight: 60, maxFloor: 5, tags: ['common', 'basic'] },
      { actorId: ActorID.SNOWMAN, weight: 30, maxFloor: 4, tags: ['uncommon', 'basic'] },
      { actorId: ActorID.SNOW_GOLEM, weight: 20, minFloor: 3, maxFloor: 7, tags: ['uncommon', 'construct'] }
    ],
    floorScaling: {
      strengthBonus: 0.1,
      hpBonus: 0.15
    }
  },

  mid_floors: {
    id: 'mid_floors', 
    name: 'Mid Floor Spawns',
    entries: [
      { actorId: ActorID.SNOW_GOLEM, weight: 40, minFloor: 5, maxFloor: 12, tags: ['uncommon', 'construct'] },
      { actorId: ActorID.FROST_GIANT, weight: 25, minFloor: 8, maxFloor: 15, tags: ['rare', 'giant'] },
      { actorId: ActorID.KRAMPUS, weight: 15, minFloor: 10, maxFloor: 15, tags: ['rare', 'boss'] }
    ],
    floorScaling: {
      strengthBonus: 0.12,
      hpBonus: 0.18
    }
  },

  late_floors: {
    id: 'late_floors',
    name: 'Late Floor Spawns', 
    entries: [
      { actorId: ActorID.KRAMPUS, weight: 30, minFloor: 12, tags: ['boss', 'legendary'] },
      { actorId: ActorID.FROST_GIANT, weight: 25, minFloor: 10, tags: ['rare', 'giant'] }
    ],
    floorScaling: {
      strengthBonus: 0.15,
      hpBonus: 0.2
    }
  }
};

export const SpecialSpawnTables: Record<string, SpawnTableDefinition> = {
  boss_spawns: {
    id: 'boss_spawns',
    name: 'Boss Room Spawns',
    entries: [
      { actorId: ActorID.KRAMPUS, weight: 50, minFloor: 8, tags: ['boss', 'legendary'] },
      { actorId: ActorID.FROST_GIANT, weight: 30, minFloor: 10, tags: ['boss', 'giant'] }
    ],
    floorScaling: {
      strengthBonus: 0.2,
      hpBonus: 0.25
    }
  },

  elite_spawns: {
    id: 'elite_spawns', 
    name: 'Elite Enemy Spawns',
    entries: [
      { actorId: ActorID.FROST_GIANT, weight: 40, minFloor: 6, tags: ['elite', 'giant'] },
      { actorId: ActorID.SNOW_GOLEM, weight: 35, minFloor: 5, tags: ['elite', 'construct'] },
      { actorId: ActorID.KRAMPUS, weight: 25, minFloor: 8, tags: ['elite', 'boss'] }
    ],
    floorScaling: {
      strengthBonus: 0.18,
      hpBonus: 0.22
    }
  },

  holiday_creatures: {
    id: 'holiday_creatures',
    name: 'Holiday Themed Creatures',
    entries: [
      { actorId: ActorID.SNOWMAN, weight: 40, minFloor: 1, maxFloor: 8, tags: ['themed', 'construct'] },
      { actorId: ActorID.SNOW_SPRITE, weight: 35, minFloor: 1, maxFloor: 10, tags: ['themed', 'sprite'] },
      { actorId: ActorID.SNOW_GOLEM, weight: 25, minFloor: 4, maxFloor: 12, tags: ['themed', 'construct'] }
    ]
  }
};

// Floor-based table mapping
export const FloorSpawnTableMapping: Record<number, string[]> = {
  1: ['early_floors', 'holiday_creatures'],
  2: ['early_floors', 'holiday_creatures'], 
  3: ['early_floors', 'holiday_creatures'],
  4: ['early_floors', 'holiday_creatures'],
  5: ['early_floors', 'mid_floors', 'holiday_creatures'],
  6: ['mid_floors', 'holiday_creatures'],
  7: ['mid_floors', 'holiday_creatures'],
  8: ['mid_floors', 'elite_spawns', 'holiday_creatures'],
  9: ['mid_floors', 'elite_spawns'],
  10: ['mid_floors', 'late_floors', 'elite_spawns'],
  11: ['mid_floors', 'late_floors', 'elite_spawns'],
  12: ['late_floors', 'elite_spawns'],
  13: ['late_floors', 'elite_spawns'],
  14: ['late_floors', 'elite_spawns'],
  15: ['late_floors', 'boss_spawns']
};

// Combine all spawn tables for easy lookup
export const AllSpawnTables: Record<string, SpawnTableDefinition> = {
  ...BaseSpawnTables,
  ...SpecialSpawnTables
};

/**
 * Get the appropriate spawn table ID for a given floor number
 */
export function getSpawnTableForFloor(floorNumber: number): string {
  const tables = FloorSpawnTableMapping[floorNumber] || FloorSpawnTableMapping[15];
  // Return the first table in the list (primary table for this floor)
  return tables[0] || 'early_floors';
}