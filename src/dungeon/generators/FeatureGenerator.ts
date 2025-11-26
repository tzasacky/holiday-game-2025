import * as ex from 'excalibur';
import { Level } from '../Level';
import { TerrainType } from '../Terrain';
import { Biome } from '../Biome';

export class FeatureGenerator {
    
    static generateFeatures(level: Level, biome: Biome) {
        // 1. Rivers
        if (biome.features.hasRivers && new ex.Random().bool(biome.features.riverChance || 0.7)) {
            this.addRiver(level, biome);
        }

        // 2. Chasms
        if (biome.features.hasChasms) {
            this.addChasms(level, biome);
        }
    }

    private static addRiver(level: Level, biome: Biome) {
        const rng = new ex.Random();
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
            return { x: 0, y: 0 };
        };

        const start = getPointOnSide(startSide);
        const end = getPointOnSide(endSide);

        // Simple drunkard's walk or line drawing
        let cx = start.x;
        let cy = start.y;

        while (Math.abs(cx - end.x) > 1 || Math.abs(cy - end.y) > 1) {
            // Move towards end
            if (rng.bool(0.5)) {
                if (cx < end.x) cx++;
                else if (cx > end.x) cx--;
            } else {
                if (cy < end.y) cy++;
                else if (cy > end.y) cy--;
            }

            // Apply Terrain
            if (cx > 0 && cx < level.width - 1 && cy > 0 && cy < level.height - 1) {
                const current = level.terrainData[cx][cy];
                
                // If Floor or Door, make Bridge
                if (current === TerrainType.Floor || current === TerrainType.DoorClosed || current === TerrainType.DoorOpen) {
                    level.terrainData[cx][cy] = TerrainType.Bridge;
                } 
                // If Wall, make Water
                else if (current === TerrainType.Wall) {
                    level.terrainData[cx][cy] = TerrainType.Water;
                }
            }
        }
    }

    private static addChasms(level: Level, biome: Biome) {
        const rng = new ex.Random();
        // Place a few chasm patches
        const count = rng.integer(3, 8);
        
        for (let i = 0; i < count; i++) {
            const cx = rng.integer(2, level.width - 3);
            const cy = rng.integer(2, level.height - 3);
            
            // Grow a small blob
            const size = rng.integer(2, 10);
            for (let j = 0; j < size; j++) {
                const ox = cx + rng.integer(-1, 1);
                const oy = cy + rng.integer(-1, 1);
                
                if (ox > 0 && ox < level.width - 1 && oy > 0 && oy < level.height - 1) {
                    const current = level.terrainData[ox][oy];
                    if (current === TerrainType.Wall) {
                        level.terrainData[ox][oy] = TerrainType.Chasm;
                    }
                }
            }
        }
    }

    static addColumns(level: Level, room: any, biome: Biome) {
         // Simple pattern: Pillars in corners or grid
         const rng = new ex.Random();
         const pattern = rng.pickOne(['corners', 'grid', 'random']);
 
         const placeColumn = (x: number, y: number) => {
             if (level.terrainData[x][y] === TerrainType.Floor) {
                 level.terrainData[x][y] = TerrainType.Wall;
             }
         };
 
         if (pattern === 'corners') {
             // Inset by 1
             placeColumn(room.x + 1, room.y + 1);
             placeColumn(room.x + room.width - 2, room.y + 1);
             placeColumn(room.x + 1, room.y + room.height - 2);
             placeColumn(room.x + room.width - 2, room.y + room.height - 2);
         } else if (pattern === 'grid') {
             for (let x = room.x + 2; x < room.x + room.width - 2; x += 2) {
                 for (let y = room.y + 2; y < room.y + room.height - 2; y += 2) {
                     placeColumn(x, y);
                 }
             }
         } else {
             // Random
             const count = rng.integer(1, 5);
             for (let i = 0; i < count; i++) {
                 const cx = rng.integer(room.x + 1, room.x + room.width - 2);
                 const cy = rng.integer(room.y + 1, room.y + room.height - 2);
                 placeColumn(cx, cy);
             }
         }
    }
}
