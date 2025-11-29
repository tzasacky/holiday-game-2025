import { ActorID } from '../constants/ActorIDs';
import { SpawnTableID } from '../constants/SpawnTableID';

export interface SpawnEntry {
  actorId: ActorID;
  weight: number;
  minFloor?: number;
  maxFloor?: number;
  packSize?: { min: number; max: number };
  tags?: string[];
}

export interface SpawnTableDefinition {
  id: SpawnTableID;
  name: string;
  entries: SpawnEntry[];
  floorScaling?: {
    strengthBonus: number; // Per floor multiplier
    hpBonus: number;       // Per floor multiplier
  };
}

export const BaseSpawnTables: Record<SpawnTableID, SpawnTableDefinition> = {
  [SpawnTableID.EarlyFloors]: {
    id: SpawnTableID.EarlyFloors,
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

  [SpawnTableID.MidFloors]: {
    id: SpawnTableID.MidFloors, 
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

  [SpawnTableID.LateFloors]: {
    id: SpawnTableID.LateFloors,
    name: 'Late Floor Spawns', 
    entries: [
      { actorId: ActorID.KRAMPUS, weight: 30, minFloor: 12, tags: ['boss', 'legendary'] },
      { actorId: ActorID.FROST_GIANT, weight: 25, minFloor: 10, tags: ['rare', 'giant'] }
    ],
    floorScaling: {
      strengthBonus: 0.15,
      hpBonus: 0.2
    }
  },
  
  // Placeholders for missing tables to satisfy type check
  [SpawnTableID.IceCreatures]: {
      id: SpawnTableID.IceCreatures,
      name: 'Ice Creatures',
      entries: [],
  },
  [SpawnTableID.CorruptedCreatures]: {
      id: SpawnTableID.CorruptedCreatures,
      name: 'Corrupted Creatures',
      entries: [],
  },
  [SpawnTableID.BossSpawns]: { id: SpawnTableID.BossSpawns, name: 'Boss Spawns', entries: [] },
  [SpawnTableID.EliteSpawns]: { id: SpawnTableID.EliteSpawns, name: 'Elite Spawns', entries: [] },
  [SpawnTableID.HolidayCreatures]: { id: SpawnTableID.HolidayCreatures, name: 'Holiday Creatures', entries: [] }
};

export const SpecialSpawnTables: Partial<Record<SpawnTableID, SpawnTableDefinition>> = {
  [SpawnTableID.BossSpawns]: {
    id: SpawnTableID.BossSpawns,
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

  [SpawnTableID.EliteSpawns]: {
    id: SpawnTableID.EliteSpawns, 
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

  [SpawnTableID.HolidayCreatures]: {
    id: SpawnTableID.HolidayCreatures,
    name: 'Holiday Themed Creatures',
    entries: [
      { actorId: ActorID.SNOWMAN, weight: 40, minFloor: 1, maxFloor: 8, tags: ['themed', 'construct'] },
      { actorId: ActorID.SNOW_SPRITE, weight: 35, minFloor: 1, maxFloor: 10, tags: ['themed', 'sprite'] },
      { actorId: ActorID.SNOW_GOLEM, weight: 25, minFloor: 4, maxFloor: 12, tags: ['themed', 'construct'] }
    ]
  }
};

// Floor-based table mapping
export const FloorSpawnTableMapping: Record<number, SpawnTableID[]> = {
  1: [SpawnTableID.EarlyFloors, SpawnTableID.HolidayCreatures],
  2: [SpawnTableID.EarlyFloors, SpawnTableID.HolidayCreatures], 
  3: [SpawnTableID.EarlyFloors, SpawnTableID.HolidayCreatures],
  4: [SpawnTableID.EarlyFloors, SpawnTableID.HolidayCreatures],
  5: [SpawnTableID.EarlyFloors, SpawnTableID.MidFloors, SpawnTableID.HolidayCreatures],
  6: [SpawnTableID.MidFloors, SpawnTableID.HolidayCreatures],
  7: [SpawnTableID.MidFloors, SpawnTableID.HolidayCreatures],
  8: [SpawnTableID.MidFloors, SpawnTableID.EliteSpawns, SpawnTableID.HolidayCreatures],
  9: [SpawnTableID.MidFloors, SpawnTableID.EliteSpawns],
  10: [SpawnTableID.MidFloors, SpawnTableID.LateFloors, SpawnTableID.EliteSpawns],
  11: [SpawnTableID.MidFloors, SpawnTableID.LateFloors, SpawnTableID.EliteSpawns],
  12: [SpawnTableID.LateFloors, SpawnTableID.EliteSpawns],
  13: [SpawnTableID.LateFloors, SpawnTableID.EliteSpawns],
  14: [SpawnTableID.LateFloors, SpawnTableID.EliteSpawns],
  15: [SpawnTableID.LateFloors, SpawnTableID.BossSpawns]
};

// Combine all spawn tables for easy lookup
export const AllSpawnTables: Record<string, SpawnTableDefinition> = {
  ...BaseSpawnTables,
  ...SpecialSpawnTables
};

/**
 * Get the appropriate spawn table ID for a given floor number
 */
export function getSpawnTableForFloor(floorNumber: number): SpawnTableID {
  const tables = FloorSpawnTableMapping[floorNumber] || FloorSpawnTableMapping[15];
  // Return the first table in the list (primary table for this floor)
  return tables[0] || SpawnTableID.EarlyFloors;
}