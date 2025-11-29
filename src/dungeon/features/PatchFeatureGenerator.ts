import { FeatureGenerator, FeatureContext } from './FeatureGenerator';
import { FeatureConfig } from './FeatureTypes';
import { TerrainType } from '../../data/terrain';
import { Logger } from '../../core/Logger';
import { PerlinNoise } from '../algorithms/PerlinNoise';

export class PatchFeatureGenerator implements FeatureGenerator {
  private noise: PerlinNoise;

  constructor() {
    this.noise = new PerlinNoise();
  }

  public apply(context: FeatureContext, config: FeatureConfig): void {
    const { level, rng } = context;
    const density = config.properties?.density || 0.1;
    const threshold = config.properties?.threshold || 0.6;
    
    // Use a random offset for noise to ensure variety
    const noiseOffsetX = rng.next() * 1000;
    const noiseOffsetY = rng.next() * 1000;
    const scale = 0.1; // Controls patch size
    
    let patchCount = 0;
    
    for (let x = 0; x < level.width; x++) {
      for (let y = 0; y < level.height; y++) {
        // Only apply to floor tiles
        if (level.terrainData[x][y] !== TerrainType.Floor) continue;
        
        const noiseVal = this.noise.noise(x * scale + noiseOffsetX, y * scale + noiseOffsetY);
        
        // If noise is high enough, apply patch
        if (noiseVal > threshold) {
          // Additional density check
          if (rng.next() < density) {
            // Check placement constraints
            let canPlace = true;
            if (config.placement === 'corridor') {
                const inRoom = level.rooms.some(r => r.contains(x, y));
                if (inRoom) canPlace = false;
            } else if (config.placement === 'room') {
                const inRoom = level.rooms.some(r => r.contains(x, y));
                if (!inRoom) canPlace = false;
            }

            if (canPlace) {
                level.terrainData[x][y] = config.terrainType;
                patchCount++;
            }
          }
        }
      }
    }
    
    Logger.info(`[PatchFeatureGenerator] Generated ${patchCount} tiles of ${config.terrainType}`);
  }
}
