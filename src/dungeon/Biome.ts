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
    theme: FloorTheme;
    features: FeatureConfig;
    
    // New Abstractions
    terrainFeatures: TerrainFeature[];
    roomDecorators: RoomDecorator[];

    decorateRoom(level: Level, room: Room, isSpecial: boolean): void;
    generateHazards(level: Level, room: Room): void;
}
