import { Level } from './Level';
import { Room } from './Room';
import { FloorTheme } from './FloorTheme';
import { TerrainFeature } from './features/TerrainFeature';
import { RoomDecorator } from './decorators/RoomDecorator';

export interface FeatureConfig {
    hasRivers?: boolean;
    riverChance?: number;
    hasChasms?: boolean;
    hasColumns?: boolean;
}

export interface Biome {
    name: string;
    id: string;
    theme: FloorTheme;
    features: FeatureConfig;
    
    // Data-driven properties
    spawnTableOverrides?: Record<string, string>; // roomType -> spawnTableId
    lootTableOverrides?: Record<string, string>; // roomType -> lootTableId
    preferredPrefabs?: string[]; // Prefab IDs that fit this biome
    environmentalHazards?: {
        type: string;
        probability: number;
        damagePerTurn?: number;
    }[];
    ambientEffects?: string[];
    
    // New Abstractions
    terrainFeatures: TerrainFeature[];
    roomDecorators: RoomDecorator[];

    decorateRoom(level: Level, room: Room, isSpecial: boolean): void;
    generateHazards(level: Level, room: Room): void;
}
