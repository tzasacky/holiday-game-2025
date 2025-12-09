import { ActorID } from '../constants/ActorIDs';
import { SpawnTableID } from '../constants/SpawnTableID';
import { Tags } from '../constants/Tags';

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
  // Floors 1-5: Snowy Village Biome - Basic tutorial enemies
  [SpawnTableID.EarlyFloors]: {
    id: SpawnTableID.EarlyFloors,
    name: 'Early Floor Spawns',
    entries: [
      { actorId: ActorID.SNOW_SPRITE, weight: 50, minFloor: 1, maxFloor: 5, tags: ['common', 'basic'] },
      { actorId: ActorID.SNOWMAN, weight: 35, minFloor: 1, maxFloor: 4, tags: ['common', 'basic'] },
      { actorId: ActorID.EVIL_ELF, weight: 15, minFloor: 2, maxFloor: 6, tags: ['uncommon', 'fast'] }
    ],
    floorScaling: {
      strengthBonus: 0.1,
      hpBonus: 0.15
    }
  },

  // Floors 5-10: Mid-game progression
  [SpawnTableID.MidFloors]: {
    id: SpawnTableID.MidFloors, 
    name: 'Mid Floor Spawns',
    entries: [
      { actorId: ActorID.SNOW_GOLEM, weight: 40, minFloor: 5, maxFloor: 12, tags: ['uncommon', 'construct'] },
      { actorId: ActorID.FROST_GIANT, weight: 25, minFloor: 8, maxFloor: 15, tags: ['rare', 'giant'] },
      { actorId: ActorID.WINTER_WOLF, weight: 30, minFloor: 6, maxFloor: 12, tags: ['uncommon', 'pack'] }
    ],
    floorScaling: {
      strengthBonus: 0.12,
      hpBonus: 0.18
    }
  },

  // Floors 10-15: Late game enemies
  [SpawnTableID.LateFloors]: {
    id: SpawnTableID.LateFloors,
    name: 'Late Floor Spawns', 
    entries: [
      { actorId: ActorID.ICE_WRAITH, weight: 30, minFloor: 10, tags: ['rare', 'incorporeal'] },
      { actorId: ActorID.CORRUPTED_SANTA, weight: 25, minFloor: 12, tags: ['rare', 'boss_minion'] },
      { actorId: ActorID.BLIZZARD_ELEMENTAL, weight: 25, minFloor: 11, tags: ['rare', 'elemental'] },
      { actorId: ActorID.ICE_DRAGON, weight: 20, minFloor: 13, tags: ['legendary', 'dragon'] }
    ],
    floorScaling: {
      strengthBonus: 0.15,
      hpBonus: 0.2
    }
  },
  
  // Holiday-themed creatures (floors 1-8)
  [SpawnTableID.HolidayCreatures]: {
    id: SpawnTableID.HolidayCreatures,
    name: 'Holiday Themed Creatures',
    entries: [
      { actorId: ActorID.GINGERBREAD_GOLEM, weight: 40, minFloor: 2, maxFloor: 8, tags: ['themed', 'construct'] },
      { actorId: ActorID.NUTCRACKER_SOLDIER, weight: 35, minFloor: 3, maxFloor: 10, tags: ['themed', 'armored'] },
      { actorId: ActorID.CANDY_CANE_SPIDER, weight: 25, minFloor: 4, maxFloor: 12, tags: ['themed', 'fast'] }
    ],
    floorScaling: {
      strengthBonus: 0.1,
      hpBonus: 0.12
    }
  },

  // Ice creatures (floors 5-12)
  [SpawnTableID.IceCreatures]: {
    id: SpawnTableID.IceCreatures,
    name: 'Ice Creatures',
    entries: [
      { actorId: ActorID.FROST_WISP, weight: 45, minFloor: 5, maxFloor: 12, tags: ['common', 'elemental'] },
      { actorId: ActorID.ICE_SPIDER, weight: 35, minFloor: 6, maxFloor: 14, tags: ['uncommon', 'venomous'] },
      { actorId: ActorID.WINTER_WOLF, weight: 20, minFloor: 7, maxFloor: 15, tags: ['uncommon', 'pack'] }
    ],
    floorScaling: {
      strengthBonus: 0.13,
      hpBonus: 0.16
    }
  },

  // Corrupted creatures (floors 8-15)
  [SpawnTableID.CorruptedCreatures]: {
    id: SpawnTableID.CorruptedCreatures,
    name: 'Corrupted Creatures',
    entries: [
      { actorId: ActorID.ICE_WRAITH, weight: 40, minFloor: 8, tags: ['rare', 'incorporeal'] },
      { actorId: ActorID.CORRUPTED_SANTA, weight: 30, minFloor: 10, tags: ['rare', 'boss_minion'] },
      { actorId: ActorID.BLIZZARD_ELEMENTAL, weight: 30, minFloor: 9, tags: ['rare', 'elemental'] }
    ],
    floorScaling: {
      strengthBonus: 0.16,
      hpBonus: 0.19
    }
  },

  // Boss spawns (floors 5, 10, 15) - Environment-appropriate bosses
  [SpawnTableID.BossSpawns]: { 
    id: SpawnTableID.BossSpawns, 
    name: 'Boss Spawns', 
    entries: [
      // Floor 5: Snowy Village - Krampus (Holiday-themed boss)
      { actorId: ActorID.KRAMPUS, weight: 100, minFloor: 5, maxFloor: 5, tags: ['boss', 'holiday'] },
      
      // Floor 10: Frozen Depths - Ice Dragon (Ice-themed boss) 
      { actorId: ActorID.ICE_DRAGON, weight: 100, minFloor: 10, maxFloor: 10, tags: ['boss', 'ice', 'dragon'] },
      
      // Floor 15: Krampus Lair - Corrupted Santa (Final corrupted boss)
      { actorId: ActorID.CORRUPTED_SANTA, weight: 100, minFloor: 15, maxFloor: 15, tags: ['boss', 'corrupted', 'final'] }
    ],
    floorScaling: {
      strengthBonus: 0.2,
      hpBonus: 0.25
    }
  },

  // Elite spawns (floors 8+)
  [SpawnTableID.EliteSpawns]: { 
    id: SpawnTableID.EliteSpawns, 
    name: 'Elite Spawns', 
    entries: [
      { actorId: ActorID.FROST_GIANT, weight: 40, minFloor: 8, tags: ['elite', 'giant'] },
      { actorId: ActorID.SNOW_GOLEM, weight: 35, minFloor: 6, tags: ['elite', 'construct'] },
      { actorId: ActorID.ICE_DRAGON, weight: 25, minFloor: 12, tags: ['elite', 'dragon'] }
    ],
    floorScaling: {
      strengthBonus: 0.18,
      hpBonus: 0.22
    }
  }
};

export const SpecialSpawnTables: Record<string, SpawnTableDefinition> = {
  // Special room spawns
  treasure_room_guards: {
    id: 'treasure_room_guards' as SpawnTableID,
    name: 'Treasure Room Guards',
    entries: [
      { actorId: ActorID.GINGERBREAD_GOLEM, weight: 40, minFloor: 2, tags: ['guardian', 'territorial'] },
      { actorId: ActorID.NUTCRACKER_SOLDIER, weight: 35, minFloor: 3, tags: ['guardian', 'territorial'] },
      { actorId: ActorID.FROST_GIANT, weight: 25, minFloor: 8, tags: ['guardian', 'territorial', 'miniboss'] }
    ],
    floorScaling: {
      strengthBonus: 0.15,
      hpBonus: 0.2
    }
  },

  ambush: {
    id: 'ambush' as SpawnTableID,
    name: 'Ambush Spawns',
    entries: [
      { actorId: ActorID.CANDY_CANE_SPIDER, weight: 40, minFloor: 4, packSize: { min: 3, max: 5 }, tags: ['ambush', 'pack'] },
      { actorId: ActorID.EVIL_ELF, weight: 35, minFloor: 2, packSize: { min: 2, max: 4 }, tags: ['ambush', 'pack'] },
      { actorId: ActorID.ICE_SPIDER, weight: 25, minFloor: 6, packSize: { min: 2, max: 3 }, tags: ['ambush', 'pack'] }
    ],
    floorScaling: {
      strengthBonus: 0.1,
      hpBonus: 0.15
    }
  },

  workshop_guardians: {
    id: 'workshop_guardians' as SpawnTableID,
    name: 'Workshop Guardian Spawns',
    entries: [
      { actorId: ActorID.NUTCRACKER_SOLDIER, weight: 50, minFloor: 3, maxFloor: 8, tags: ['guardian', 'territorial', 'miniboss'] },
      { actorId: ActorID.GINGERBREAD_GOLEM, weight: 30, minFloor: 2, maxFloor: 8, tags: ['guardian', 'territorial'] },
      { actorId: ActorID.EVIL_ELF, weight: 20, minFloor: 2, maxFloor: 6, tags: ['guardian'] }
    ],
    floorScaling: {
      strengthBonus: 0.12,
      hpBonus: 0.18
    }
  },

  ice_chamber_spawns: {
    id: 'ice_chamber_spawns' as SpawnTableID,
    name: 'Ice Chamber Spawns',
    entries: [
      { actorId: ActorID.FROST_WISP, weight: 45, minFloor: 5, tags: ['ice_adapted', 'elemental'] },
      { actorId: ActorID.ICE_WRAITH, weight: 35, minFloor: 8, tags: ['ice_adapted', 'incorporeal', 'miniboss'] },
      { actorId: ActorID.WINTER_WOLF, weight: 20, minFloor: 7, packSize: { min: 2, max: 3 }, tags: ['ice_adapted', 'pack'] }
    ],
    floorScaling: {
      strengthBonus: 0.14,
      hpBonus: 0.18
    }
  },

  summoning_room_spawns: {
    id: 'summoning_room_spawns' as SpawnTableID,
    name: 'Summoning Room Spawns',
    entries: [
      { actorId: ActorID.BLIZZARD_ELEMENTAL, weight: 50, minFloor: 9, tags: ['summoned', 'elemental', 'miniboss'] },
      { actorId: ActorID.ICE_WRAITH, weight: 35, minFloor: 8, tags: ['summoned', 'incorporeal'] },
      { actorId: ActorID.CORRUPTED_SANTA, weight: 15, minFloor: 12, tags: ['summoned', 'boss_minion', 'miniboss'] }
    ],
    floorScaling: {
      strengthBonus: 0.16,
      hpBonus: 0.22
    }
  },

  boss_room: {
    id: 'boss_room' as SpawnTableID,
    name: 'Boss Room Spawns',
    entries: [
      // Floor 5: Krampus
      { actorId: ActorID.KRAMPUS, weight: 100, minFloor: 5, maxFloor: 5, tags: ['boss', 'holiday'] },
      // Floor 10: Ice Dragon
      { actorId: ActorID.ICE_DRAGON, weight: 100, minFloor: 10, maxFloor: 10, tags: ['boss', 'ice', 'dragon'] },
      // Floor 15: Corrupted Santa (spawned via summoning circle)
      { actorId: ActorID.CORRUPTED_SANTA, weight: 100, minFloor: 15, maxFloor: 15, tags: ['boss', 'corrupted', 'final'] }
    ],
    floorScaling: {
      strengthBonus: 0.25,
      hpBonus: 0.3
    }
  }
};

// 15-Floor Progression System with Biome-Based Spawning
export const FloorSpawnTableMapping: Record<number, SpawnTableID[]> = {
  // Floors 1-5: Snowy Village (tutorial progression)
  1: [SpawnTableID.EarlyFloors, SpawnTableID.HolidayCreatures],
  2: [SpawnTableID.EarlyFloors, SpawnTableID.HolidayCreatures], 
  3: [SpawnTableID.EarlyFloors, SpawnTableID.HolidayCreatures],
  4: [SpawnTableID.EarlyFloors, SpawnTableID.HolidayCreatures],
  5: [SpawnTableID.EarlyFloors, SpawnTableID.BossSpawns], // First boss floor
  
  // Floors 6-10: Frozen Depths (mid-game progression)  
  6: [SpawnTableID.MidFloors, SpawnTableID.IceCreatures],
  7: [SpawnTableID.MidFloors, SpawnTableID.IceCreatures],
  8: [SpawnTableID.MidFloors, SpawnTableID.IceCreatures, SpawnTableID.EliteSpawns],
  9: [SpawnTableID.MidFloors, SpawnTableID.IceCreatures, SpawnTableID.EliteSpawns],
  10: [SpawnTableID.MidFloors, SpawnTableID.BossSpawns], // Second boss floor
  
  // Floors 11-15: Krampus Lair (late game + final boss)
  11: [SpawnTableID.LateFloors, SpawnTableID.CorruptedCreatures, SpawnTableID.EliteSpawns],
  12: [SpawnTableID.LateFloors, SpawnTableID.CorruptedCreatures, SpawnTableID.EliteSpawns],
  13: [SpawnTableID.LateFloors, SpawnTableID.CorruptedCreatures, SpawnTableID.EliteSpawns],
  14: [SpawnTableID.LateFloors, SpawnTableID.CorruptedCreatures, SpawnTableID.EliteSpawns],
  15: [SpawnTableID.BossSpawns] // Final Krampus boss floor
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