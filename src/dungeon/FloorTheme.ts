import * as ex from 'excalibur';
import { Resources } from '../config/resources';
import { TerrainType } from './Terrain';

import { Level } from './Level';

export interface FloorTheme {
    name: string;
    id: string;
    tiles: Record<TerrainType, ex.Graphic>; // Keep for simple access if needed, or deprecate?
    
    // Data-driven properties
    preferredSpawnTables?: string[];
    biomeModifiers?: {
        spawnRateMultiplier?: number;
        lootRateMultiplier?: number;
        ambientEffects?: string[];
    };
    interactableSet?: string[]; // Preferred interactable types for this theme
    visualEffects?: {
        lighting?: 'dim' | 'normal' | 'bright';
        particleEffect?: string;
        fogColor?: ex.Color;
    };
    
    // Context-aware methods for layers
    getBottomTile(x: number, y: number, level: Level): ex.Graphic;
    getTopTile(x: number, y: number, level: Level): ex.Graphic | null;
}

import { AppConfig } from '../main';

// Lazy load sprites to ensure Resources are ready
// Removed global export to prevent circular dependencies
// Themes should be instantiated in main.ts or a factory
