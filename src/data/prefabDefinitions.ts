import { TerrainType } from './terrain';
import { ActorID } from '../constants/ActorIDs';
import { ItemID } from '../constants/ItemIDs';
import { InteractableID } from '../constants/InteractableIDs';
import { PrefabID } from '../constants/PrefabID';
import * as ex from 'excalibur';

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

export interface PrefabDefinition {
  id: PrefabID;
  name: string;
  category: 'special_room' | 'treasure' | 'boss' | 'utility' | 'decoration';
  width: number;
  height: number;
  layout: string[];
  legend: Record<string, TerrainType>;
  
  // Data-driven placement rules
  actors?: PrefabActorPlacement[];
  interactables?: PrefabInteractablePlacement[];
  items?: PrefabItemPlacement[];
  
  // Constraints
  minFloor?: number;
  maxFloor?: number;
  biomeRestrictions?: string[];
  rarity?: 'common' | 'uncommon' | 'rare' | 'unique';
  
  // Spawning rules
  spawnProbability?: number;
  maxPerLevel?: number;
}

export const PrefabDefinitions: Record<PrefabID, PrefabDefinition> = {
  [PrefabID.SmallShrine]: {
    id: PrefabID.SmallShrine,
    name: 'Small Shrine',
    category: 'special_room',
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
      'F': TerrainType.Floor // Fireplace location
    },
    interactables: [
      {
        interactableId: InteractableID.Fireplace,
        position: ex.vec(2, 2)
      }
    ],
    // Place healing items near the fireplace
    items: [
      {
        itemId: ItemID.HotCocoa,
        position: ex.vec(1, 2),
        count: 2,
        probability: 0.8
      },
      {
        itemId: ItemID.Marshmallow,
        position: ex.vec(3, 2),
        count: 1,
        probability: 0.6
      }
    ],
    spawnProbability: 0.15,
    maxPerLevel: 1,
    rarity: 'uncommon'
  },

  [PrefabID.StorageRoom]: {
    id: PrefabID.StorageRoom,
    name: 'Storage Room',
    category: 'treasure',
    width: 6,
    height: 4,
    layout: [
      "######",
      "#D..D#",
      "#....#",
      "######"
    ],
    legend: {
      '#': TerrainType.Wall,
      '.': TerrainType.Floor,
      'D': TerrainType.Floor // Decoration location
    },
    // Storage rooms have containers and loot
    interactables: [
      {
        interactableId: InteractableID.CHEST,
        position: ex.vec(1, 1),
        properties: { lootTableId: 'treasure_room_loot' }
      },
      {
        interactableId: InteractableID.CHEST,
        position: ex.vec(4, 1),
        properties: { lootTableId: 'common_loot' }
      }
    ],
    items: [
      {
        itemId: ItemID.CandyCane,
        position: ex.vec(2, 2),
        count: 3,
        probability: 0.7
      }
    ],
    spawnProbability: 0.1,
    maxPerLevel: 2,
    rarity: 'uncommon'
  },

  [PrefabID.MerchantShop]: {
    id: PrefabID.MerchantShop,
    name: 'Merchant Shop',
    category: 'utility',
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
    // TODO: Add merchant actor when available
    actors: [
      // {
      //   actorId: ActorID.MERCHANT,
      //   position: ex.vec(2, 2),
      //   properties: { shopInventory: 'basic_shop' }
      // }
    ],
    interactables: [
      {
        interactableId: InteractableID.SHOP_COUNTER,
        position: ex.vec(2, 2)
      }
    ],
    spawnProbability: 0.05,
    maxPerLevel: 1,
    rarity: 'rare',
    minFloor: 2
  },

  [PrefabID.TreasureVault]: {
    id: PrefabID.TreasureVault,
    name: 'Treasure Vault',
    category: 'treasure',
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
      'C': TerrainType.Floor // Chest locations
    },
    // Multiple treasure chests with guards
    actors: [
      {
        actorId: ActorID.SNOW_GOLEM,
        position: ex.vec(1, 1),
        properties: { isGuard: true }
      },
      {
        actorId: ActorID.SNOW_GOLEM,
        position: ex.vec(7, 5),
        properties: { isGuard: true }
      }
    ],
    interactables: [
      {
        interactableId: InteractableID.TREASURE_CHEST,
        position: ex.vec(3, 3),
        properties: { lootTableId: 'rare_treasure_loot' }
      },
      {
        interactableId: InteractableID.TREASURE_CHEST,
        position: ex.vec(5, 3),
        properties: { lootTableId: 'rare_treasure_loot' }
      }
    ],
    spawnProbability: 0.03,
    maxPerLevel: 1,
    rarity: 'unique',
    minFloor: 3
  },

  [PrefabID.BossArena]: {
    id: PrefabID.BossArena,
    name: 'Boss Arena',
    category: 'boss',
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
      'B': TerrainType.Floor // Boss spawn location
    },
    // Boss room configuration
    actors: [
      {
        actorId: ActorID.FROST_GIANT,
        position: ex.vec(5, 5),
        properties: { isBoss: true, floorScaling: true }
      }
    ],
    items: [
      // Healing items around the edges for the fight
      {
        itemId: ItemID.HotCocoa,
        position: ex.vec(2, 2),
        probability: 0.9
      },
      {
        itemId: ItemID.HotCocoa,
        position: ex.vec(8, 8),
        probability: 0.9
      }
    ],
    spawnProbability: 1.0, // Always spawn if selected
    maxPerLevel: 1,
    rarity: 'unique',
    minFloor: 5
  },

  [PrefabID.Workshop]: {
    id: PrefabID.Workshop,
    name: 'Workshop',
    category: 'utility',
    width: 8,
    height: 6,
    layout: [
      "########",
      "#......#",
      "#.W..W.#",
      "#......#",
      "#..F...#",
      "########"
    ],
    legend: {
      '#': TerrainType.Wall,
      '.': TerrainType.Floor,
      'W': TerrainType.Floor, // Workbench locations
      'F': TerrainType.Floor // Fireplace location
    },
    interactables: [
      {
        interactableId: InteractableID.WORKBENCH,
        position: ex.vec(2, 2)
      },
      {
        interactableId: InteractableID.WORKBENCH,
        position: ex.vec(5, 2)
      },
      {
        interactableId: InteractableID.Anvil,
        position: ex.vec(4, 4) // Moved next to fireplace
      },
      {
        interactableId: InteractableID.Fireplace,
        position: ex.vec(3, 4)
      }
    ],
    items: [
      {
        itemId: ItemID.CandyCaneSpear,
        position: ex.vec(1, 1),
        probability: 0.3
      }
    ],
    spawnProbability: 0.08,
    maxPerLevel: 1,
    rarity: 'uncommon',
    minFloor: 2
  }
};

// Helper function to get prefabs by category
export function getPrefabsByCategory(category: PrefabDefinition['category']): PrefabDefinition[] {
  return Object.values(PrefabDefinitions).filter(prefab => prefab.category === category);
}

// Helper function to get prefabs suitable for a floor
export function getPrefabsForFloor(floorNumber: number): PrefabDefinition[] {
  return Object.values(PrefabDefinitions).filter(prefab => {
    const minFloor = prefab.minFloor || 1;
    const maxFloor = prefab.maxFloor || Infinity;
    return floorNumber >= minFloor && floorNumber <= maxFloor;
  });
}

// Helper function to roll for prefab spawning
export function rollForPrefab(prefab: PrefabDefinition): boolean {
  const probability = prefab.spawnProbability || 0.1;
  return Math.random() < probability;
}