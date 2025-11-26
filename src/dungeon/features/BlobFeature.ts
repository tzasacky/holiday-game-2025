import * as ex from 'excalibur';
import { TerrainFeature } from './TerrainFeature';
import { GenerationContext, TileReservation } from '../generators/GenerationContext';
import { TerrainType } from '../Terrain';

export class BlobFeature extends TerrainFeature {
    constructor(
        private terrainType: TerrainType, 
        private count: { min: number, max: number }, 
        private size: { min: number, max: number },
        private replaceOnly?: TerrainType[]
    ) {
        super();
    }

    apply(context: GenerationContext): void {
        const level = context.level;
        const rng = context.random;
        
        const blobCount = rng.integer(this.count.min, this.count.max);
        
        for (let i = 0; i < blobCount; i++) {
            const cx = rng.integer(2, level.width - 3);
            const cy = rng.integer(2, level.height - 3);
            
            // Grow a small blob
            const blobSize = rng.integer(this.size.min, this.size.max);
            for (let j = 0; j < blobSize; j++) {
                const ox = cx + rng.integer(-1, 1);
                const oy = cy + rng.integer(-1, 1);
                
                if (context.isValid(ox, oy)) {
                    // Check reservation
                    if (!context.isAvailable(ox, oy, TileReservation.Feature)) continue;

                    const current = level.terrainData[ox][oy];
                    
                    // Check replacement rules
                    if (this.replaceOnly) {
                        if (!this.replaceOnly.includes(current)) continue;
                    }

                    level.terrainData[ox][oy] = this.terrainType;
                    context.reserve(ox, oy, TileReservation.Feature);
                }
            }
        }
    }
}
