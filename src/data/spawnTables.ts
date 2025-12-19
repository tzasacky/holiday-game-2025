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
  // Floors 0-3: Tutorial and Early Enemies (Snowy Village Outskirts)
  [SpawnTableID.EarlyFloors]: {
    id: SpawnTableID.EarlyFloors,
    name: 'Early Floor Spawns',
    entries: [
      // Floor 0-1: Tutorial enemy
      { actorId: ActorID.SNOW_SPRITE, weight: 60, minFloor: 0, maxFloor: 3, tags: ['common', 'tutorial'] },
      
      // Floor 2+: Introduce variety
      { actorId: ActorID.EVIL_ELF, weight: 40, minFloor: 1, maxFloor: 4, tags: ['common', 'fast'] },
      { actorId: ActorID.GINGERBREAD_GOLEM, weight: 25, minFloor: 3, maxFloor: 5, tags: ['uncommon', 'construct'] },
      
      // Floor 4: Mini-boss introduction
      { actorId: ActorID.NUTCRACKER_SOLDIER, weight: 15, minFloor: 3, maxFloor: 6, tags: ['uncommon', 'armored', 'miniboss'] }
    ],
    floorScaling: {
      strengthBonus: 0.08,
      hpBonus: 0.12
    }
  },

  // Floors 6-7: Early Frozen Depths
  [SpawnTableID.MidFloors]: {
    id: SpawnTableID.MidFloors, 
    name: 'Mid Floor Spawns',
    entries: [
      // Floor 6-7: Light glass cannons and balanced enemies
      { actorId: ActorID.ICE_SPIDER, weight: 50, minFloor: 5, maxFloor: 7, tags: ['common', 'glass_cannon', 'pack'] },
      { actorId: ActorID.NUTCRACKER_SOLDIER, weight: 35, minFloor: 5, maxFloor: 8, tags: ['common', 'balanced'] },
      { actorId: ActorID.ICE_WRAITH, weight: 15, minFloor: 6, maxFloor: 9, tags: ['uncommon', 'balanced'] }
    ],
    floorScaling: {
      strengthBonus: 0.12,
      hpBonus: 0.15
    }
  },

  // Floors 8-9: Deep Frozen Depths  
  [SpawnTableID.LateFloors]: {
    id: SpawnTableID.LateFloors,
    name: 'Late Floor Spawns', 
    entries: [
      // Floor 8-9: Tanks and stronger enemies
      { actorId: ActorID.ICE_WRAITH, weight: 40, minFloor: 7, maxFloor: 9, tags: ['common', 'balanced'] },
      { actorId: ActorID.FROST_GIANT, weight: 35, minFloor: 7, maxFloor: 8, tags: ['common', 'tank'] },
      { actorId: ActorID.ICE_SPIDER, weight: 25, minFloor: 7, maxFloor: 8, tags: ['uncommon', 'glass_cannon', 'pack'] }
    ],
    floorScaling: { 
      strengthBonus: 0.18, 
      hpBonus: 0.22 
    }
  },

  // Boss Spawns (Floors 5 & 10)
  [SpawnTableID.BossSpawns]: { 
    id: SpawnTableID.BossSpawns, 
    name: 'Boss Spawns', 
    entries: [
      // Floor 5: Krampus
      { actorId: ActorID.KRAMPUS, weight: 100, minFloor: 5, maxFloor: 5, tags: ['boss', 'holiday'] },
      
      // Floor 10: Corrupted Santa
      { actorId: ActorID.CORRUPTED_SANTA, weight: 100, minFloor: 10, maxFloor: 10, tags: ['boss', 'corrupted', 'final'] }
    ],
    floorScaling: {
      strengthBonus: 0.2,
      hpBonus: 0.25
    }
  },

  // Unused tables kept for compatibility but empty or irrelevant for main loop
  [SpawnTableID.HolidayCreatures]: {
    id: SpawnTableID.HolidayCreatures,
    name: 'Holiday Themed Creatures',
    entries: [],
    floorScaling: { strengthBonus: 0.1, hpBonus: 0.1 }
  },
  [SpawnTableID.IceCreatures]: {
    id: SpawnTableID.IceCreatures,
    name: 'Ice Creatures',
    entries: [],
    floorScaling: { strengthBonus: 0.1, hpBonus: 0.1 }
  },
  [SpawnTableID.CorruptedCreatures]: {
    id: SpawnTableID.CorruptedCreatures,
    name: 'Corrupted Creatures',
    entries: [],
    floorScaling: { strengthBonus: 0.1, hpBonus: 0.1 }
  },
  [SpawnTableID.EliteSpawns]: { 
    id: SpawnTableID.EliteSpawns, 
    name: 'Elite Spawns', 
    entries: [],
    floorScaling: { strengthBonus: 0.1, hpBonus: 0.1 }
  }
};

export const SpecialSpawnTables: Record<string, SpawnTableDefinition> = {
  // Special room spawns
  treasure_room_guards: {
    id: 'treasure_room_guards' as SpawnTableID,
    name: 'Treasure Room Guards',
    entries: [
      { actorId: ActorID.GINGERBREAD_GOLEM, weight: 50, minFloor: 2, tags: ['guardian', 'territorial'] },
      { actorId: ActorID.FROST_GIANT, weight: 50, minFloor: 6, tags: ['guardian', 'territorial', 'miniboss'] }
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
      { actorId: ActorID.EVIL_ELF, weight: 60, minFloor: 2, packSize: { min: 2, max: 4 }, tags: ['ambush', 'pack'] },
      { actorId: ActorID.ICE_SPIDER, weight: 40, minFloor: 6, packSize: { min: 2, max: 3 }, tags: ['ambush', 'pack'] }
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
      { actorId: ActorID.NUTCRACKER_SOLDIER, weight: 60, minFloor: 3, tags: ['guardian', 'territorial', 'miniboss'] },
      { actorId: ActorID.GINGERBREAD_GOLEM, weight: 40, minFloor: 2, tags: ['guardian', 'territorial'] }
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
      { actorId: ActorID.ICE_WRAITH, weight: 60, minFloor: 6, tags: ['ice_adapted', 'incorporeal'] },
      { actorId: ActorID.FROST_WISP, weight: 40, minFloor: 6, tags: ['ice_adapted', 'elemental'] }
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
      { actorId: ActorID.ICE_WRAITH, weight: 100, minFloor: 8, tags: ['summoned', 'incorporeal'] }
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
      // Floor 10: Corrupted Santa
      { actorId: ActorID.CORRUPTED_SANTA, weight: 100, minFloor: 10, maxFloor: 10, tags: ['boss', 'corrupted', 'final'] }
    ],
    floorScaling: {
      strengthBonus: 0.25,
      hpBonus: 0.3
    }
  }
};

// 10-Floor Progression System (0-10)
export const FloorSpawnTableMapping: Record<number, SpawnTableID[]> = {
  // Floor 0: Tutorial floor
  0: [SpawnTableID.EarlyFloors],
  
  // Floors 1-4: Snowy Village (Early game)
  1: [SpawnTableID.EarlyFloors],
  2: [SpawnTableID.EarlyFloors], 
  3: [SpawnTableID.EarlyFloors],
  4: [SpawnTableID.EarlyFloors],
  
  // Floor 5: Krampus (Mid-game boss)
  5: [SpawnTableID.BossSpawns], 
  
  // Floors 6-7: Early Frozen Depths
  6: [SpawnTableID.MidFloors],
  7: [SpawnTableID.MidFloors],
  
  // Floors 8-9: Deep Frozen Depths (Pre-endgame)
  8: [SpawnTableID.LateFloors],
  9: [SpawnTableID.LateFloors],
  
  // Floor 10: Corrupted Santa (Final boss)
  10: [SpawnTableID.BossSpawns],
  
  // Safety fallback for any extra floors
  11: [SpawnTableID.LateFloors],
  12: [SpawnTableID.LateFloors],
  13: [SpawnTableID.LateFloors],
  14: [SpawnTableID.LateFloors],
  15: [SpawnTableID.BossSpawns]
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