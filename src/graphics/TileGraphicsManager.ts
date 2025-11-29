import * as ex from 'excalibur';
import { ResourceManager } from '../core/ResourceManager';
import { BiomeDefinition, MaterialType, TileVariant } from '../data/biomes';
import { TerrainType } from '../data/terrain';
import { Logger } from '../core/Logger';
import { PerlinNoise } from '../dungeon/algorithms/PerlinNoise';

export class TileGraphicsManager {
    private static _instance: TileGraphicsManager;
    private spriteSheets: Map<string, ex.SpriteSheet> = new Map();
    private initialized: boolean = false;
    private noise: PerlinNoise;

    public static get instance(): TileGraphicsManager {
        if (!this._instance) {
            this._instance = new TileGraphicsManager();
        }
        return this._instance;
    }

    private constructor() {
        this.noise = new PerlinNoise(Date.now());
    }

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

        // Initialize biome tilesets
        await this.initializeBiomeTilesets();

        this.initialized = true;
        Logger.info('[TileGraphicsManager] Initialization complete');
    }

    private async initializeBiomeTilesets(): Promise<void> {
        // Note: Biome tilesets are created on-demand when needed
        // This avoids preloading all possible biome sprites
        Logger.debug('[TileGraphicsManager] Biome tilesets will be loaded on-demand');
    }

    public getTileGraphic(
        terrainType: TerrainType, 
        biome: BiomeDefinition, 
        x: number = 0, 
        y: number = 0, 
        material: MaterialType = MaterialType.Stone
    ): ex.Graphic {
        if (!this.initialized) {
            Logger.warn('[TileGraphicsManager] Not initialized, returning fallback graphic');
            return this.createFallbackGraphic(terrainType);
        }

        // 1. Try biome-specific sprite with material and noise
        const biomeGraphics = biome.visuals.tileGraphics[terrainType];
        
        // Check for material-specific variants first (New System)
        if (biome.visuals.materials && biome.visuals.materials[material]) {
            const materialVariants = biome.visuals.materials[material][terrainType];
            if (materialVariants && materialVariants.length > 0) {
                const variant = this.getTileVariant(materialVariants, x, y);
                const sprite = this.getBiomeSprite(biome, variant.spriteCoords);
                if (sprite) return sprite;
            }
        }

        // Fallback to legacy single sprite coord (Old System)
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

    private getTileVariant(variants: TileVariant[], x: number, y: number): TileVariant {
        if (variants.length === 1) return variants[0];

        // Use Perlin noise to select variant
        // Scale coordinates to get smooth noise patches
        const scale = 0.2; // Increased from 0.1 for more frequent variation
        const noiseValue = (this.noise.noise(x * scale, y * scale) + 1) / 2; // 0 to 1

        // Calculate total weight
        const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
        
        // Map noise value to weighted selection
        // We use the noise value as a "roll" across the weighted distribution
        // However, for "patches", we might want specific noise ranges to map to specific variants.
        // But weighted random selection based on noise is a good start for "organic" feel.
        
        // Better approach for patches: Use noise thresholds.
        // But since we don't have explicit thresholds in TileVariant, let's use the weighted random approach
        // but seeded with the noise value * totalWeight.
        
        // Actually, to get "patches" of specific variants (like mossy stone), we want consistent selection for similar noise values.
        // So we map the 0-1 noise value directly to the cumulative weight distribution.
        
        let currentWeight = 0;
        const targetWeight = noiseValue * totalWeight;
        
        for (const variant of variants) {
            currentWeight += variant.weight;
            if (targetWeight <= currentWeight) {
                return variant;
            }
        }
        
        return variants[variants.length - 1];
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
            [TerrainType.Water]: ex.Color.Blue,
            [TerrainType.Ice]: ex.Color.Cyan,
            [TerrainType.DeepSnow]: ex.Color.fromHex('#F0F8FF'),
            [TerrainType.Chasm]: ex.Color.Black
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