import * as ex from 'excalibur';
import { FloorTheme } from '../FloorTheme';
import { TerrainType } from '../Terrain';
import { Level } from '../Level';
import { Resources } from '../../config/resources';

export class SnowyVillageTheme implements FloorTheme {
    name = "Snowy Village";
    private tilesSheet: ex.SpriteSheet;
    private decorSheet: ex.SpriteSheet;
    public tiles: Record<TerrainType, ex.Graphic>;

    constructor() {
        this.tilesSheet = ex.SpriteSheet.fromImageSource({
            image: Resources.SnowyVillageTilesPng,
            grid: { spriteWidth: 32, spriteHeight: 32, rows: 3, columns: 8 }
        });
        
        this.decorSheet = ex.SpriteSheet.fromImageSource({
            image: Resources.SnowyVillageDecorPng,
            grid: { spriteWidth: 32, spriteHeight: 32, rows: 5, columns: 8 }
        });

        // Basic mapping (Fallback)
        this.tiles = {
            [TerrainType.Floor]: this.tilesSheet.getSprite(0, 0)!,
            [TerrainType.DeepSnow]: this.tilesSheet.getSprite(1, 0)!,
            [TerrainType.Ice]: this.tilesSheet.getSprite(2, 0)!,
            [TerrainType.Water]: this.tilesSheet.getSprite(4, 0)!, // Flowing Water
            [TerrainType.Wall]: this.tilesSheet.getSprite(0, 2)!, // Log Wall
            [TerrainType.DoorOpen]: this.decorSheet.getSprite(3, 1)!, // Row 2, Col 3
            [TerrainType.DoorClosed]: this.decorSheet.getSprite(2, 1)!, // Row 2, Col 2
            [TerrainType.DoorLocked]: this.decorSheet.getSprite(2, 1)!,
            [TerrainType.Chasm]: this.tilesSheet.getSprite(5, 0)!, // Still Water as placeholder
            [TerrainType.Fireplace]: this.decorSheet.getSprite(4, 1)!, // Row 2, Col 4
            [TerrainType.Decoration]: this.decorSheet.getSprite(0, 0)!, // Red Rug Center (Row 1, Col 0)
            [TerrainType.StairsDown]: this.decorSheet.getSprite(5, 0)!, // Placeholder
            [TerrainType.Bridge]: this.tilesSheet.getSprite(6, 0)!, // Vertical Bridge default
        };
    }

    getBottomTile(x: number, y: number, level: Level): ex.Graphic {
        const type = level.terrainData[x][y];

        // Special cases for bottom layer
        if (type === TerrainType.Chasm) {
            return this.tiles[TerrainType.Chasm];
        }
        if (type === TerrainType.Water) {
            return this.tiles[TerrainType.Water];
        }
        if (type === TerrainType.Bridge) {
            // Bridge sits on top of Water (or Chasm)
            // For now, assume Water
            return this.tiles[TerrainType.Water];
        }

        // Always return a floor tile for other types
        const inRoom = level.rooms.some(r => r.contains(x, y));

        if (inRoom) {
            // Indoors: Wood Planks (Light)
            return this.tilesSheet.getSprite(0, 1)!; 
        } else {
            // Outdoors: Snow or Ice
            if (type === TerrainType.Ice) {
                return this.tilesSheet.getSprite(2, 0)!; // Packed Ice
            }
            if (type === TerrainType.DeepSnow) {
                return this.tilesSheet.getSprite(1, 0)!; // Deep Snow
            }
            // Default Snow
            return this.tilesSheet.getSprite(0, 0)!; // Clean Snow
        }
    }

    getTopTile(x: number, y: number, level: Level): ex.Graphic | null {
        const type = level.terrainData[x][y];

        // If it's a floor type, return null (nothing on top)
        if (type === TerrainType.Floor || type === TerrainType.Ice || type === TerrainType.DeepSnow || type === TerrainType.Water || type === TerrainType.Chasm) {
            return null;
        }

        if (type === TerrainType.Decoration) {
            return this.getRugTile(x, y, level);
        }

        if (type === TerrainType.Wall) {
            return this.getWallTile(x, y, level);
        }

        if (type === TerrainType.Bridge) {
            // Determine orientation
            // If neighbors N/S are Bridge or Floor, Vertical
            // If neighbors E/W are Bridge or Floor, Horizontal
            // Default Vertical (Col 6)
            // Horizontal is Col 7
            // Simple check: if Wall to West/East, probably Vertical?
            // Actually, if river is horizontal, bridge is vertical.
            // Let's check neighbors.
            const n = this.isWalkable(x, y - 1, level);
            const s = this.isWalkable(x, y + 1, level);
            const w = this.isWalkable(x - 1, y, level);
            const e = this.isWalkable(x + 1, y, level);
            
            if ((w || e) && !(n || s)) {
                return this.tilesSheet.getSprite(7, 0)!; // Horizontal
            }
            return this.tilesSheet.getSprite(6, 0)!; // Vertical
        }

        // Doors, Stairs, etc.
        if (this.tiles[type]) {
            return this.tiles[type];
        }

        return null;
    }

    private isWalkable(x: number, y: number, level: Level): boolean {
        if (x < 0 || x >= level.width || y < 0 || y >= level.height) return false;
        const t = level.terrainData[x][y];
        return t === TerrainType.Floor || t === TerrainType.Bridge || t === TerrainType.DoorOpen;
    }

    private getRugTile(x: number, y: number, level: Level): ex.Graphic {
        // Red Rug (Row 1 in decor sheet, Cols 0-2)
        const startCol = 0; 
        const row = 0; // Row 1 is index 0 in decor sheet

        const n = this.isDecoration(x, y - 1, level);
        const s = this.isDecoration(x, y + 1, level);
        const w = this.isDecoration(x - 1, y, level);
        const e = this.isDecoration(x + 1, y, level);

        // Center
        if (n && s && w && e) return this.decorSheet.getSprite(startCol, row)!;

        // Edges (Use Col 1)
        // Top Edge -> !n, s, w, e. Rotation 0.
        if (!n && s && w && e) return this.decorSheet.getSprite(startCol + 1, row)!.clone();
        
        // Bottom Edge -> !s, n, w, e. Rotation 180.
        if (n && !s && w && e) {
            const s = this.decorSheet.getSprite(startCol + 1, row)!.clone();
            s.rotation = Math.PI;
            return s;
        }

        // Left Edge -> !w, n, s, e. Rotation -90 (270).
        if (n && s && !w && e) {
            const s = this.decorSheet.getSprite(startCol + 1, row)!.clone();
            s.rotation = -Math.PI / 2;
            return s;
        }

        // Right Edge -> !e, n, s, w. Rotation 90.
        if (n && s && w && !e) {
            const s = this.decorSheet.getSprite(startCol + 1, row)!.clone();
            s.rotation = Math.PI / 2;
            return s;
        }

        // Corners (Use Col 2)
        // Top-Left Corner -> !n, !w, s, e. Rotation 0.
        if (!n && !w && s && e) return this.decorSheet.getSprite(startCol + 2, row)!.clone();

        // Top-Right Corner -> !n, !e, s, w. Rotation 90.
        if (!n && !e && s && w) {
            const s = this.decorSheet.getSprite(startCol + 2, row)!.clone();
            s.rotation = Math.PI / 2;
            return s;
        }

        // Bottom-Right Corner -> !s, !e, n, w. Rotation 180.
        if (!s && !e && n && w) {
            const s = this.decorSheet.getSprite(startCol + 2, row)!.clone();
            s.rotation = Math.PI;
            return s;
        }

        // Bottom-Left Corner -> !s, !w, n && e. Rotation -90.
        if (!s && !w && n && e) {
            const s = this.decorSheet.getSprite(startCol + 2, row)!.clone();
            s.rotation = -Math.PI / 2;
            return s;
        }

        // Default Center
        return this.decorSheet.getSprite(startCol, row)!;
    }

    private isDecoration(x: number, y: number, level: Level): boolean {
        if (x < 0 || x >= level.width || y < 0 || y >= level.height) return false;
        return level.terrainData[x][y] === TerrainType.Decoration;
    }

    private getWallType(x: number, y: number, level: Level): 'log' | 'ice' | 'brick' {
        const neighbors = [
            {x: x, y: y-1}, {x: x, y: y+1}, {x: x-1, y: y}, {x: x+1, y: y},
            {x: x-1, y: y-1}, {x: x+1, y: y-1}, {x: x-1, y: y+1}, {x: x+1, y: y+1}
        ];

        let touchingRoom = false;
        for (const n of neighbors) {
            if (level.rooms.some(r => r.contains(n.x, n.y))) {
                touchingRoom = true;
                break;
            }
        }

        if (touchingRoom) return 'log';
        return 'ice';
    }

    private getWallTile(x: number, y: number, level: Level): ex.Graphic {
        const wallType = this.getWallType(x, y, level);
        
        // Row 3 (Index 2) in tiles sheet
        if (wallType === 'ice') return this.tilesSheet.getSprite(1, 2)!;
        if (wallType === 'brick') return this.tilesSheet.getSprite(2, 2)!;
        
        // Default Log
        return this.tilesSheet.getSprite(0, 2)!;
    }

    private isWall(x: number, y: number, level: Level): boolean {
        if (x < 0 || x >= level.width || y < 0 || y >= level.height) return true;
        const type = level.terrainData[x][y];
        return type === TerrainType.Wall || type === TerrainType.DoorClosed || type === TerrainType.DoorLocked;
    }
}
