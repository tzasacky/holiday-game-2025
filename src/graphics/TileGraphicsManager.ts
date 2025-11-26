import * as ex from 'excalibur';
import { ResourceManager } from '../core/ResourceManager';
import { CommonTiles } from '../data/commonTiles';
import { BiomeDefinition } from '../data/biomes';
import { TerrainType } from '../data/terrain';
import { Logger } from '../core/Logger';

export class TileGraphicsManager {
    private static _instance: TileGraphicsManager;
    private spriteSheets: Map<string, ex.SpriteSheet> = new Map();
    private initialized: boolean = false;

    public static get instance(): TileGraphicsManager {
        if (!this._instance) {
            this._instance = new TileGraphicsManager();
        }
        return this._instance;
    }

    private constructor() {}

    public async initialize(): Promise<void> {
        if (this.initialized) {
            Logger.info('[TileGraphicsManager] Already initialized');
            return;
        }

        Logger.info('[TileGraphicsManager] Initializing...');

        // Ensure resources are loaded first
        if (!ResourceManager.instance.isReady()) {
            Logger.info('[TileGraphicsManager] Waiting for ResourceManager to be ready...');
            await ResourceManager.instance.ensureAllLoaded();
        }

        // Initialize CommonTiles system
        await this.initializeCommonTiles();

        // Initialize biome tilesets
        await this.initializeBiomeTilesets();

        this.initialized = true;
        Logger.info('[TileGraphicsManager] Initialization complete');
    }

    private async initializeCommonTiles(): Promise<void> {
        try {
            CommonTiles.instance.initialize();
            Logger.info('[TileGraphicsManager] CommonTiles initialized successfully');
        } catch (error) {
            Logger.error('[TileGraphicsManager] Failed to initialize CommonTiles:', error);
        }
    }

    private async initializeBiomeTilesets(): Promise<void> {
        // Note: Biome tilesets are created on-demand when needed
        // This avoids preloading all possible biome sprites
        Logger.debug('[TileGraphicsManager] Biome tilesets will be loaded on-demand');
    }

    public getTileGraphic(terrainType: TerrainType, biome: BiomeDefinition): ex.Graphic {
        if (!this.initialized) {
            Logger.warn('[TileGraphicsManager] Not initialized, returning fallback graphic');
            return this.createFallbackGraphic(terrainType);
        }

        // 1. Try CommonTiles first (doors, stairs, etc.)
        if (CommonTiles.instance.has(terrainType)) {
            const sprite = CommonTiles.instance.getSprite(terrainType);
            if (sprite) {
                return sprite;
            }
        }

        // 2. Try biome-specific sprite
        const biomeGraphics = biome.visuals.tileGraphics[terrainType];
        if (biomeGraphics?.spriteCoords && biome.visuals.tileset) {
            const sprite = this.getBiomeSprite(biome, biomeGraphics.spriteCoords);
            if (sprite) {
                return sprite;
            }
        }

        // 3. Fallback to colored rectangle
        const color = biomeGraphics?.color || this.getDefaultColor(terrainType);
        return this.createColoredRectangle(color);
    }

    private getBiomeSprite(biome: BiomeDefinition, spriteCoords: [number, number]): ex.Sprite | null {
        if (!biome.visuals.tileset) {
            return null;
        }

        // Check if we already have the sprite sheet
        let spriteSheet = this.spriteSheets.get(biome.id);

        if (!spriteSheet) {
            // Create sprite sheet on-demand
            if (!ResourceManager.instance.isResourceLoaded(biome.visuals.tileset)) {
                Logger.warn(`[TileGraphicsManager] Tileset not loaded for biome: ${biome.id}`);
                return null;
            }

            try {
                spriteSheet = ex.SpriteSheet.fromImageSource({
                    image: biome.visuals.tileset,
                    grid: {
                        rows: 3,
                        columns: 8,
                        spriteWidth: 32,
                        spriteHeight: 32
                    }
                });

                this.spriteSheets.set(biome.id, spriteSheet);
                Logger.debug(`[TileGraphicsManager] Created sprite sheet for biome: ${biome.id}`);
            } catch (error) {
                Logger.error(`[TileGraphicsManager] Failed to create sprite sheet for biome: ${biome.id}`, error);
                return null;
            }
        }

        const [col, row] = spriteCoords;
        const sprite = spriteSheet.getSprite(col, row);

        if (!sprite) {
            Logger.warn(`[TileGraphicsManager] Sprite not found at (${col}, ${row}) for biome: ${biome.id}`);
        }

        return sprite;
    }

    private createColoredRectangle(color: ex.Color): ex.Rectangle {
        return new ex.Rectangle({
            width: 32,
            height: 32,
            color: color
        });
    }

    private createFallbackGraphic(terrainType: TerrainType): ex.Rectangle {
        const color = this.getDefaultColor(terrainType);
        return this.createColoredRectangle(color);
    }

    private getDefaultColor(terrainType: TerrainType): ex.Color {
        const defaultColors: Record<TerrainType, ex.Color> = {
            [TerrainType.Wall]: ex.Color.Gray,
            [TerrainType.Floor]: ex.Color.White,
            [TerrainType.Door]: ex.Color.Brown,
            [TerrainType.LockedDoor]: ex.Color.Yellow,
            [TerrainType.SecretDoor]: ex.Color.Gray,
            [TerrainType.Water]: ex.Color.Blue,
            [TerrainType.Ice]: ex.Color.Cyan,
            [TerrainType.DeepSnow]: ex.Color.fromHex('#F0F8FF'),
            [TerrainType.Chasm]: ex.Color.Black,
            [TerrainType.StairsDown]: ex.Color.fromHex('#8B4513'),
            [TerrainType.Bridge]: ex.Color.fromHex('#DEB887'),
            [TerrainType.Fireplace]: ex.Color.Red,
            [TerrainType.Decoration]: ex.Color.Purple
        };

        return defaultColors[terrainType] || ex.Color.Magenta;
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    public clearCache(): void {
        this.spriteSheets.clear();
        Logger.info('[TileGraphicsManager] Cache cleared');
    }

    public getBiomeSpriteSheetInfo(biome: BiomeDefinition): { loaded: boolean, spriteCount?: number } {
        const spriteSheet = this.spriteSheets.get(biome.id);
        
        if (!spriteSheet) {
            return { loaded: false };
        }

        return {
            loaded: true,
            spriteCount: spriteSheet.sprites.length
        };
    }

    // For debugging purposes
    public getLoadedBiomes(): string[] {
        return Array.from(this.spriteSheets.keys());
    }

    public reset(): void {
        this.spriteSheets.clear();
        this.initialized = false;
        Logger.info('[TileGraphicsManager] Reset complete');
    }
}