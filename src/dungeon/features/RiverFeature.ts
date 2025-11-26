import * as ex from 'excalibur';
import { TerrainFeature } from './TerrainFeature';
import { GenerationContext, TileReservation } from '../generators/GenerationContext';
import { TerrainType } from '../Terrain';

export class RiverFeature extends TerrainFeature {
    apply(context: GenerationContext): void {
        const level = context.level;
        const rng = context.random;

        // Determine start and end sides (0: Top, 1: Right, 2: Bottom, 3: Left)
        const startSide = rng.integer(0, 3);
        const endSide = (startSide + 2) % 4; // Opposite side

        // Helper to get random point on side
        const getPointOnSide = (side: number) => {
            switch (side) {
                case 0: return { x: rng.integer(1, level.width - 2), y: 1 }; // Top
                case 1: return { x: level.width - 2, y: rng.integer(1, level.height - 2) }; // Right
                case 2: return { x: rng.integer(1, level.width - 2), y: level.height - 2 }; // Bottom
                case 3: return { x: 1, y: rng.integer(1, level.height - 2) }; // Left
            }
            return { x: 1, y: 1 };
        };

        const start = getPointOnSide(startSide);
        const end = getPointOnSide(endSide);

        // Simple drunkard's walk or line drawing
        let cx = start.x;
        let cy = start.y;

        let safety = 0;
        while ((Math.abs(cx - end.x) > 1 || Math.abs(cy - end.y) > 1) && safety < 1000) {
            safety++;
            
            // Move towards end
            if (rng.bool(0.5)) {
                if (cx < end.x) cx++;
                else if (cx > end.x) cx--;
            } else {
                if (cy < end.y) cy++;
                else if (cy > end.y) cy--;
            }

            // Apply Terrain if available
            if (context.isValid(cx, cy)) {
                // Check reservation
                if (context.isAvailable(cx, cy, TileReservation.Feature)) {
                    const current = level.terrainData[cx][cy];
                    
                    // If Floor or Door, make Bridge
                    if (current === TerrainType.Floor || current === TerrainType.DoorClosed || current === TerrainType.DoorOpen) {
                        level.terrainData[cx][cy] = TerrainType.Bridge;
                        context.reserve(cx, cy, TileReservation.Feature);
                    } 
                    // If Wall, make Water
                    else if (current === TerrainType.Wall) {
                        level.terrainData[cx][cy] = TerrainType.Water;
                        context.reserve(cx, cy, TileReservation.Feature);
                    }
                }
            }
        }
    }
}
