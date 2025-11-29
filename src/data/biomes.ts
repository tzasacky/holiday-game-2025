import * as ex from 'excalibur';
import { TerrainType } from './terrain';
import { DamageType } from './mechanics';
import { Resources } from '../config/resources';
import { BiomeID } from '../constants/BiomeID';
import { InteractableID } from '../constants/InteractableIDs';
import { RoomTypeID } from '../constants/RoomTypeID';
import { PrefabID } from '../constants/PrefabID';
import { SpawnTableID } from '../constants/SpawnTableID';
import { LootTableID } from '../constants/LootTableIDs';
import { FeatureConfig, FeatureMorphology } from '../dungeon/features/FeatureTypes';

export enum MaterialType {
  Stone = 'stone',
  Wood = 'wood',
  Ice = 'ice',
  Snow = 'snow',
  Brick = 'brick',
}

export interface TileVariant {
  spriteCoords: [number, number];
  weight: number; // Higher = more common
  tags?: string[]; // e.g., 'cracked', 'mossy', 'clean'
}

// Unified Biome/Theme system - combines visual themes with gameplay properties
export interface BiomeDefinition {
  id: BiomeID;
  name: string;
  description: string;
  
  // Visual properties (formerly "theme")
  visuals: {
    tileset?: ex.ImageSource;
    
    // Construction Materials: Defines how Walls and Floors look for a given material
    // Map Material -> TerrainType (Floor/Wall) -> Variants
    materials?: Partial<Record<MaterialType, Partial<Record<TerrainType, TileVariant[]>>>>;
    
    // Terrain Features: Defines how specific terrain types look (independent of material)
    // Map TerrainType (Water, Chasm, etc.) -> Variants
    features?: Partial<Record<TerrainType, TileVariant[]>>;
    
    // Legacy support until full migration
    tileGraphics: Record<TerrainType, {
      spriteCoords?: [number, number]; // [col, row] for getSprite(col, row)
      color?: ex.Color;
      fallbackText?: string;
    }>;
    
    // Visual effects
    lighting: 'dim' | 'normal' | 'bright';
    
    // Default material for corridors and undefined areas
    defaultMaterial: MaterialType;
  };
  
  // Gameplay properties (formerly "biome")
  gameplay: {
    // Spawn table preferences
    preferredSpawnTables: SpawnTableID[];
    spawnRateMultiplier: number;
    
    // Loot modifications
    lootRateMultiplier: number;
    lootTableOverrides?: Partial<Record<RoomTypeID, LootTableID>>; // roomType -> lootTableId
    
    // Preferred interactables for this biome
    interactableSet: InteractableID[];
    
    // Preferred prefabs
    preferredPrefabs: PrefabID[];
  };
  
  // Floor availability
  minFloor: number;
  maxFloor?: number;
  rarity: 'common' | 'uncommon' | 'rare';
  
  // Special terrain features (data-driven replacements for old decorators/features)
  // These define WHERE features are placed, not how they look
  featureGenerators?: FeatureConfig[];
}

export const BiomeDefinitions: Record<BiomeID, BiomeDefinition> = {
  [BiomeID.SnowyVillage]: {
    id: BiomeID.SnowyVillage,
    name: 'Snowy Village',
    description: 'A festive winter village covered in snow and holiday decorations.',
    
    visuals: {
      tileset: Resources.SnowyVillageTilesPng,
      
      // Construction Materials (Walls & Floors)
      materials: {
          [MaterialType.Snow]: {
              [TerrainType.Floor]: [
                  { spriteCoords: [0, 0], weight: 80, tags: ['clean'] }, // Clean Snow
                  { spriteCoords: [1, 0], weight: 20, tags: ['deep'] }   // Deep Snow
              ],
              [TerrainType.Wall]: [
                  { spriteCoords: [1, 2], weight: 100, tags: ['ice_wall'] } // Clear Ice Wall (closest to snow wall?)
              ]
          },
          [MaterialType.Ice]: {
              [TerrainType.Floor]: [
                  { spriteCoords: [2, 0], weight: 70, tags: ['packed_ice'] },
                  { spriteCoords: [3, 0], weight: 30, tags: ['slushy_ice'] }
              ],
              [TerrainType.Wall]: [
                  { spriteCoords: [1, 2], weight: 100, tags: ['ice_wall'] } // Clear Ice Wall
              ]
          },
          [MaterialType.Wood]: {
              [TerrainType.Floor]: [
                  { spriteCoords: [0, 1], weight: 50, tags: ['planks_light'] },
                  { spriteCoords: [1, 1], weight: 50, tags: ['planks_dark'] },
                  { spriteCoords: [4, 1], weight: 30, tags: ['wood_variation'] },
                  { spriteCoords: [7, 1], weight: 20, tags: ['frozen_planks'] }
              ],
              [TerrainType.Wall]: [
                  { spriteCoords: [0, 2], weight: 100, tags: ['log_cabin'] }
              ]
          },
          [MaterialType.Brick]: {
              [TerrainType.Floor]: [
                  { spriteCoords: [0, 1], weight: 50, tags: ['planks_light'] },
                  { spriteCoords: [1, 1], weight: 50, tags: ['planks_dark'] },
              ],
              [TerrainType.Wall]: [
                  { spriteCoords: [2, 2], weight: 100, tags: ['red_brick'] }
              ]
          },
          [MaterialType.Stone]: {
              [TerrainType.Floor]: [
                  { spriteCoords: [4, 1], weight: 30, tags: ['wood_variation'] },
              ],
              [TerrainType.Wall]: [
                  { spriteCoords: [3, 2], weight: 100, tags: ['stone_dungeon'] }
              ]
          },
      },
      
      // Terrain Features (Independent of Material)
      features: {
          [TerrainType.Water]: [
              { spriteCoords: [5, 0], weight: 100, tags: ['flowing'] }
          ],
          [TerrainType.Chasm]: [
              { spriteCoords: [4, 0], weight: 100, tags: ['lake'] }
          ],
          [TerrainType.DeepSnow]: [
              { spriteCoords: [1, 0], weight: 100, tags: ['deep'] }
          ],
          [TerrainType.Ice]: [
              { spriteCoords: [2, 0], weight: 100, tags: ['packed'] }
          ]
      },
      
      tileGraphics: {
        // ROW 0: Winter Floors (snowy_village_tiles.png)
        [TerrainType.Floor]: { spriteCoords: [0, 0], color: ex.Color.fromHex('#FFFAFA'), fallbackText: '·' }, // Clean Snow
        [TerrainType.DeepSnow]: { spriteCoords: [1, 0], color: ex.Color.fromHex('#F0F8FF'), fallbackText: '❄' }, // Deep Snow
        [TerrainType.Ice]: { spriteCoords: [2, 0], color: ex.Color.fromHex('#B0E0E6'), fallbackText: '≡' }, // Packed Ice
        [TerrainType.Water]: { spriteCoords: [5, 0], color: ex.Color.fromHex('#87CEEB'), fallbackText: '≋' }, // Flowing Water (Frame 1)
        [TerrainType.Chasm]: { spriteCoords: [4, 0], color: ex.Color.fromHex('#2F4F4F'), fallbackText: '▓' }, // Lake Tile
        
        // ROW 2: Walls (snowy_village_tiles.png)
        [TerrainType.Wall]: { spriteCoords: [0, 2], color: ex.Color.fromHex('#8B4513'), fallbackText: '█' }, // Log Cabin Wall
      },
      lighting: 'normal',
      defaultMaterial: MaterialType.Snow
    },
    
    gameplay: {
      preferredSpawnTables: [SpawnTableID.EarlyFloors, SpawnTableID.HolidayCreatures],
      spawnRateMultiplier: 1.0,
      lootRateMultiplier: 1.1,
      
      interactableSet: [InteractableID.Fireplace, InteractableID.ChristmasTree, InteractableID.PresentChest, InteractableID.Stocking],
      preferredPrefabs: [PrefabID.SmallShrine, PrefabID.StorageRoom, PrefabID.MerchantShop]
    },
    
    minFloor: 1,
    maxFloor: 5,
    rarity: 'common',
    
    featureGenerators: [
      {
        morphology: FeatureMorphology.Patch,
        terrainType: TerrainType.Ice,
        probability: 0.4, // Increased from 0.2
        properties: { density: 0.15, slippery: true }
      },
      {
        morphology: FeatureMorphology.Linear,
        terrainType: TerrainType.Water,
        probability: 0.3, // Added River
        properties: { width: 2, meander: 0.3, frozen: false },
        placement: 'corridor' // Avoid rooms
      }
    ]
  },

  [BiomeID.FrozenDepths]: {
    id: BiomeID.FrozenDepths,
    name: 'Frozen Depths',
    description: 'Deep underground caverns filled with ancient ice and dangerous creatures.',
    
    visuals: {
      tileGraphics: {
        [TerrainType.Wall]: { color: ex.Color.fromHex('#4682B4'), fallbackText: '█' },
        [TerrainType.Floor]: { color: ex.Color.fromHex('#2F4F4F'), fallbackText: '·' },
        [TerrainType.Water]: { color: ex.Color.fromHex('#00008B'), fallbackText: '≋' },
        [TerrainType.Chasm]: { color: ex.Color.fromHex('#000000'), fallbackText: '▓' },
        [TerrainType.Ice]: { color: ex.Color.fromHex('#87CEFA'), fallbackText: '≡' },
        [TerrainType.DeepSnow]: { color: ex.Color.fromHex('#E0FFFF'), fallbackText: '❄' }
      },
      lighting: 'dim',
      defaultMaterial: MaterialType.Ice
    },
    
    gameplay: {
      preferredSpawnTables: [SpawnTableID.MidFloors, SpawnTableID.IceCreatures, SpawnTableID.EliteSpawns],
      spawnRateMultiplier: 1.3,
      lootRateMultiplier: 1.2,
      
      interactableSet: [InteractableID.FROZEN_CHEST, InteractableID.ICE_SHRINE, InteractableID.CRYSTAL_FORMATION],
      preferredPrefabs: [PrefabID.TreasureVault, PrefabID.Workshop, PrefabID.BossArena]
    },
    
    minFloor: 5,
    maxFloor: 15,
    rarity: 'uncommon',
    
    featureGenerators: [
      {
        morphology: FeatureMorphology.Patch,
        terrainType: TerrainType.Chasm,
        probability: 0.3, // Increased from 0.15
        properties: { density: 0.08, fallDamage: 10, levelTransition: true }
      },
      {
        morphology: FeatureMorphology.Linear,
        terrainType: TerrainType.Ice, // Frozen river
        probability: 0.5, // Increased from 0.3
        properties: { width: 3, meander: 0.6, crossable: true },
        placement: 'corridor'
      }
    ]
  },

  [BiomeID.KrampusLair]: {
    id: BiomeID.KrampusLair,
    name: "Krampus's Lair",
    description: 'A twisted version of Christmas cheer, filled with dark magic and corrupted decorations.',
    
    visuals: {
      tileGraphics: {
        [TerrainType.Wall]: { color: ex.Color.fromHex('#8B0000'), fallbackText: '█' },
        [TerrainType.Floor]: { color: ex.Color.fromHex('#2F2F2F'), fallbackText: '·' },
        [TerrainType.Water]: { color: ex.Color.fromHex('#8B0000'), fallbackText: '≋' },
        [TerrainType.Chasm]: { color: ex.Color.fromHex('#8B0000'), fallbackText: '▓' },
        [TerrainType.Ice]: { color: ex.Color.fromHex('#4B0082'), fallbackText: '≡' },
        [TerrainType.DeepSnow]: { color: ex.Color.fromHex('#696969'), fallbackText: '❄' }
      },
      lighting: 'dim',
      defaultMaterial: MaterialType.Stone
    },
    
    gameplay: {
      preferredSpawnTables: [SpawnTableID.LateFloors, SpawnTableID.BossSpawns, SpawnTableID.CorruptedCreatures],
      spawnRateMultiplier: 1.5,
      lootRateMultiplier: 1.5,
      lootTableOverrides: {
        [RoomTypeID.Treasure]: LootTableID.CorruptedTreasure,
        [RoomTypeID.Boss]: LootTableID.KrampusBoss
      },
      
      interactableSet: [InteractableID.CORRUPTED_TREE, InteractableID.EVIL_ALTAR, InteractableID.TRAPPED_CHEST, InteractableID.BONE_PILE],
      preferredPrefabs: [PrefabID.BossArena, PrefabID.TreasureVault]
    },
    
    minFloor: 10,
    rarity: 'rare',
    
    featureGenerators: [
      {
        morphology: FeatureMorphology.Patch,
        terrainType: TerrainType.Chasm,
        probability: 0.25,
        properties: { density: 0.08, fallDamage: 20, levelTransition: true, cursed: true }
      }
    ]
  }
};

// Helper functions for biome selection
export function getBiomesForFloor(floorNumber: number): BiomeDefinition[] {
  return Object.values(BiomeDefinitions).filter(biome => {
    return floorNumber >= biome.minFloor && 
           (!biome.maxFloor || floorNumber <= biome.maxFloor);
  });
}

export function selectRandomBiome(floorNumber: number): BiomeDefinition {
  const availableBiomes = getBiomesForFloor(floorNumber);
  
  if (availableBiomes.length === 0) {
    // Fallback to snowy village
    return BiomeDefinitions[BiomeID.SnowyVillage];
  }
  
  // Weight by rarity (common = 60%, uncommon = 30%, rare = 10%)
  const rarityWeights = { common: 0.6, uncommon: 0.3, rare: 0.1 };
  const weightedBiomes: BiomeDefinition[] = [];
  
  availableBiomes.forEach(biome => {
    const weight = rarityWeights[biome.rarity] || 0.1;
    const count = Math.ceil(weight * 100);
    for (let i = 0; i < count; i++) {
      weightedBiomes.push(biome);
    }
  });
  
  const randomIndex = Math.floor(Math.random() * weightedBiomes.length);
  return weightedBiomes[randomIndex];
}

// Legacy compatibility - map old theme/biome interfaces
export interface LegacyFloorTheme {
  name: string;
  id: string;
  getBottomTile(x: number, y: number, level: any): any;
  getTopTile(x: number, y: number, level: any): any | null;
}

export interface LegacyBiome {
  name: string;
  id: string;
  decorateRoom(level: any, room: any, isSpecial: boolean): void;
  generateHazards(level: any, room: any): void;
}