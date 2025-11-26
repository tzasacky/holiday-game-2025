import * as ex from 'excalibur';
import { Resources } from '../config/resources';
import { TerrainType } from './terrain';
import { Logger } from '../core/Logger';

/**
 * Common tiles sprite map - doors, stairs, bridges, etc.
 * These are loaded once globally and used across all biomes
 */
export interface CommonTileMap {
    // Doors (common_tiles.png Row 0)
    [TerrainType.Door]: ex.Sprite;
    [TerrainType.LockedDoor]: ex.Sprite;
    
    // Stairs (common_tiles.png Row 1)
    [TerrainType.StairsDown]: ex.Sprite;
    [TerrainType.Bridge]: ex.Sprite;
}

/**
 * Global common tiles system
 * Initialized after resources load
 */
export class CommonTiles {
    private static _instance: CommonTiles;
    private spriteSheet?: ex.SpriteSheet;
    private tiles: Partial<CommonTileMap> = {};
    
    private constructor() {}
    
    public static get instance(): CommonTiles {
        if (!this._instance) {
            this._instance = new CommonTiles();
        }
        return this._instance;
    }
    
    /**
     * Initialize common tiles sprite sheet
     * MUST be called after loader completes
     */
    public initialize(): void {
        if (this.spriteSheet) {
            Logger.warn('[CommonTiles] Already initialized');
            return;
        }
        
        if (!Resources.CommonTilesPng.isLoaded()) {
            Logger.error('[CommonTiles] CommonTilesPng not loaded yet!');
            return;
        }
        
        Logger.info('[CommonTiles] Creating sprite sheet from:', Resources.CommonTilesPng.path);
        
        this.spriteSheet = ex.SpriteSheet.fromImageSource({
            image: Resources.CommonTilesPng,
            grid: {
                rows: 3,
                columns: 8,
                spriteWidth: 32,
                spriteHeight: 32
            }
        });
        
        // Map sprites from common_tiles.yaml:
        // Row 0: Doors
        this.tiles[TerrainType.Door] = this.spriteSheet.getSprite(0, 0)!; // Wooden Door (Closed)
        this.tiles[TerrainType.LockedDoor] = this.spriteSheet.getSprite(2, 0)!; // Iron Door (Closed)
        
        // Row 1: Stairs & Bridges  
        this.tiles[TerrainType.StairsDown] = this.spriteSheet.getSprite(1, 1)!; // Stairs Down (Stone)
        this.tiles[TerrainType.Bridge] = this.spriteSheet.getSprite(4, 1)!; // Bridge (Vertical)
        
        Logger.info('[CommonTiles] Initialized with', Object.keys(this.tiles).length, 'sprites');
    }
    
    /**
     * Get sprite for a common terrain type
     */
    public getSprite(terrainType: TerrainType): ex.Sprite | null {
        const tile = this.tiles[terrainType as keyof CommonTileMap];
        return tile || null;
    }
    
    /**
     * Check if a terrain type has a common sprite
     */
    public has(terrainType: TerrainType): boolean {
        return terrainType in this.tiles;
    }
}
