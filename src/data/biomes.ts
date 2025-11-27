import * as ex from 'excalibur';
import { TerrainType } from './terrain';
import { DamageType } from './mechanics';

// Unified Biome/Theme system - combines visual themes with gameplay properties
export interface BiomeDefinition {
  id: string;
  name: string;
  description: string;
  
  // Visual properties (formerly "theme")
  visuals: {
    // Terrain tile graphics mapping
    tileGraphics: Record<TerrainType, {
      spriteIndex?: number;
      color?: ex.Color;
      fallbackText?: string;
    }>;
    
    // Visual effects
    lighting: 'dim' | 'normal' | 'bright';
    particleEffects?: string[];
    fogColor?: ex.Color;
    ambientColor?: ex.Color;
  };
  
  // Gameplay properties (formerly "biome")
  gameplay: {
    // Spawn table preferences
    preferredSpawnTables: string[];
    spawnRateMultiplier: number;
    
    // Loot modifications
    lootRateMultiplier: number;
    lootTableOverrides?: Record<string, string>; // roomType -> lootTableId
    
    // Environmental hazards
    environmentalHazards: Array<{
      type: string;
      probability: number;
      damageType: DamageType;
      damagePerTurn?: number;
      effect?: string; // e.g., 'slow', 'poison', 'burn'
    }>;
    
    // Preferred interactables for this biome
    interactableSet: string[];
    
    // Preferred prefabs
    preferredPrefabs: string[];
  };
  
  // Floor availability
  minFloor: number;
  maxFloor?: number;
  rarity: 'common' | 'uncommon' | 'rare';
  
  // Special terrain features (data-driven replacements for old decorators/features)
  features?: Array<{
    type: 'river' | 'chasm' | 'columns' | 'ice_patches';
    probability: number;
    density?: number;
    properties?: Record<string, any>;
  }>;
}

export const BiomeDefinitions: Record<string, BiomeDefinition> = {
  snowy_village: {
    id: 'snowy_village',
    name: 'Snowy Village',
    description: 'A festive winter village covered in snow and holiday decorations.',
    
    visuals: {
      tileGraphics: {
        [TerrainType.Wall]: { color: ex.Color.fromHex('#D3D3D3'), fallbackText: '█' },
        [TerrainType.Floor]: { color: ex.Color.fromHex('#FFFAFA'), fallbackText: '·' },
        [TerrainType.Water]: { color: ex.Color.fromHex('#87CEEB'), fallbackText: '≋' },
        [TerrainType.Chasm]: { color: ex.Color.fromHex('#2F4F4F'), fallbackText: '▓' },
        [TerrainType.Ice]: { color: ex.Color.fromHex('#B0E0E6'), fallbackText: '≡' },
        [TerrainType.DeepSnow]: { color: ex.Color.fromHex('#F0F8FF'), fallbackText: '❄' },
        [TerrainType.Fireplace]: { color: ex.Color.fromHex('#FF6347'), fallbackText: '♨' },
        [TerrainType.Decoration]: { color: ex.Color.fromHex('#32CD32'), fallbackText: '♦' },
        [TerrainType.StairsDown]: { color: ex.Color.fromHex('#8B4513'), fallbackText: '>' },
        [TerrainType.Bridge]: { color: ex.Color.fromHex('#DEB887'), fallbackText: '=' }
      },
      lighting: 'normal',
      particleEffects: ['snow_fall', 'sparkles'],
      fogColor: ex.Color.fromHex('#F0F8FF'),
      ambientColor: ex.Color.fromHex('#E6F3FF')
    },
    
    gameplay: {
      preferredSpawnTables: ['early_floors', 'holiday_creatures'],
      spawnRateMultiplier: 1.0,
      lootRateMultiplier: 1.1,
      
      environmentalHazards: [
        {
          type: 'freezing_cold',
          probability: 0.3,
          damageType: DamageType.Ice,
          damagePerTurn: 1,
          effect: 'slow'
        }
      ],
      
      interactableSet: ['fireplace', 'christmas_tree', 'present_chest', 'stocking'],
      preferredPrefabs: ['small_shrine', 'storage_room', 'merchant_shop']
    },
    
    minFloor: 1,
    maxFloor: 5,
    rarity: 'common',
    
    features: [
      {
        type: 'ice_patches',
        probability: 0.2,
        density: 0.1,
        properties: { slippery: true }
      }
    ]
  },

  frozen_depths: {
    id: 'frozen_depths',
    name: 'Frozen Depths',
    description: 'Deep underground caverns filled with ancient ice and dangerous creatures.',
    
    visuals: {
      tileGraphics: {
        [TerrainType.Wall]: { color: ex.Color.fromHex('#4682B4'), fallbackText: '█' },
        [TerrainType.Floor]: { color: ex.Color.fromHex('#2F4F4F'), fallbackText: '·' },
        [TerrainType.Water]: { color: ex.Color.fromHex('#00008B'), fallbackText: '≋' },
        [TerrainType.Chasm]: { color: ex.Color.fromHex('#000000'), fallbackText: '▓' },
        [TerrainType.Ice]: { color: ex.Color.fromHex('#87CEFA'), fallbackText: '≡' },
        [TerrainType.DeepSnow]: { color: ex.Color.fromHex('#E0FFFF'), fallbackText: '❄' },
        [TerrainType.Fireplace]: { color: ex.Color.fromHex('#FF4500'), fallbackText: '♨' },
        [TerrainType.Decoration]: { color: ex.Color.fromHex('#4169E1'), fallbackText: '♦' },
        [TerrainType.StairsDown]: { color: ex.Color.fromHex('#696969'), fallbackText: '>' },
        [TerrainType.Bridge]: { color: ex.Color.fromHex('#708090'), fallbackText: '=' }
      },
      lighting: 'dim',
      particleEffects: ['ice_crystals', 'cold_mist'],
      fogColor: ex.Color.fromHex('#1E1E1E'),
      ambientColor: ex.Color.fromHex('#0F1419')
    },
    
    gameplay: {
      preferredSpawnTables: ['mid_floors', 'ice_creatures', 'elite_spawns'],
      spawnRateMultiplier: 1.3,
      lootRateMultiplier: 1.2,
      
      environmentalHazards: [
        {
          type: 'hypothermia',
          probability: 0.5,
          damageType: DamageType.Ice,
          damagePerTurn: 2,
          effect: 'slow'
        },
        {
          type: 'unstable_ice',
          probability: 0.1,
          damageType: DamageType.Physical,
          damagePerTurn: 5,
          effect: 'fall'
        }
      ],
      
      interactableSet: ['frozen_chest', 'ice_shrine', 'crystal_formation'],
      preferredPrefabs: ['treasure_vault', 'workshop', 'boss_arena']
    },
    
    minFloor: 5,
    maxFloor: 15,
    rarity: 'uncommon',
    
    features: [
      {
        type: 'chasm',
        probability: 0.15,
        density: 0.05,
        properties: { fallDamage: 10, levelTransition: true }
      },
      {
        type: 'river',
        probability: 0.3,
        density: 0.1,
        properties: { frozen: true, crossable: true }
      }
    ]
  },

  krampus_lair: {
    id: 'krampus_lair',
    name: "Krampus's Lair",
    description: 'A twisted version of Christmas cheer, filled with dark magic and corrupted decorations.',
    
    visuals: {
      tileGraphics: {
        [TerrainType.Wall]: { color: ex.Color.fromHex('#8B0000'), fallbackText: '█' },
        [TerrainType.Floor]: { color: ex.Color.fromHex('#2F2F2F'), fallbackText: '·' },
        [TerrainType.Water]: { color: ex.Color.fromHex('#8B0000'), fallbackText: '≋' },
        [TerrainType.Chasm]: { color: ex.Color.fromHex('#8B0000'), fallbackText: '▓' },
        [TerrainType.Ice]: { color: ex.Color.fromHex('#4B0082'), fallbackText: '≡' },
        [TerrainType.DeepSnow]: { color: ex.Color.fromHex('#696969'), fallbackText: '❄' },
        [TerrainType.Fireplace]: { color: ex.Color.fromHex('#DC143C'), fallbackText: '♨' },
        [TerrainType.Decoration]: { color: ex.Color.fromHex('#800080'), fallbackText: '♦' },
        [TerrainType.StairsDown]: { color: ex.Color.fromHex('#8B4513'), fallbackText: '>' },
        [TerrainType.Bridge]: { color: ex.Color.fromHex('#A0522D'), fallbackText: '=' }
      },
      lighting: 'dim',
      particleEffects: ['dark_snow', 'evil_sparkles', 'red_mist'],
      fogColor: ex.Color.fromHex('#8B0000'),
      ambientColor: ex.Color.fromHex('#2F0000')
    },
    
    gameplay: {
      preferredSpawnTables: ['late_floors', 'boss_spawns', 'corrupted_creatures'],
      spawnRateMultiplier: 1.5,
      lootRateMultiplier: 1.5,
      lootTableOverrides: {
        'treasure': 'corrupted_treasure_loot',
        'boss': 'krampus_boss_loot'
      },
      
      environmentalHazards: [
        {
          type: 'dark_magic',
          probability: 0.4,
          damageType: DamageType.Magical,
          damagePerTurn: 3,
          effect: 'curse'
        },
        {
          type: 'corrupted_ground',
          probability: 0.2,
          damageType: DamageType.Physical, // Changed from Poison which doesn't exist
          damagePerTurn: 2,
          effect: 'poison'
        }
      ],
      
      interactableSet: ['corrupted_tree', 'evil_altar', 'trapped_chest', 'bone_pile'],
      preferredPrefabs: ['boss_arena', 'treasure_vault']
    },
    
    minFloor: 10,
    rarity: 'rare',
    
    features: [
      {
        type: 'chasm',
        probability: 0.25,
        density: 0.08,
        properties: { fallDamage: 20, levelTransition: true, cursed: true }
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
    return BiomeDefinitions.snowy_village;
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