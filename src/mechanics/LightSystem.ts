import * as ex from 'excalibur';
import { Level } from '../dungeon/Level';
import { Actor } from '../actors/Actor';

export class LightSystem {
    private level: Level | null = null;
    
    // Simple Fog of War: keep track of explored tiles
    private explored: boolean[][] = [];
    private visible: boolean[][] = [];

    constructor() {}

    public init(level: Level) {
        this.level = level;
        this.explored = Array(level.width).fill(false).map(() => Array(level.height).fill(false));
        this.visible = Array(level.width).fill(false).map(() => Array(level.height).fill(false));
    }

    public updateVisibility(source: Actor) {
        if (!this.level) return;

        // Reset visible
        this.visible = this.visible.map(row => row.fill(false));

        // Raycast or Shadowcasting
        const radius = 8; // Light radius
        const startX = Math.max(0, source.gridPos.x - radius);
        const endX = Math.min(this.level.width - 1, source.gridPos.x + radius);
        const startY = Math.max(0, source.gridPos.y - radius);
        const endY = Math.min(this.level.height - 1, source.gridPos.y + radius);

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                // Simple distance check for now
                if (source.gridPos.distance(ex.vec(x, y)) <= radius) {
                    this.visible[x][y] = true;
                    this.explored[x][y] = true;
                    
                    // Update tile opacity/color
                    // const tile = this.level.tileMap.getTile(x, y);
                    // tile.color = ex.Color.White;
                }
            }
        }
        
        // Update all tiles based on state
        // This is expensive to do every turn if map is huge, but for 16x16 tiles on a screen it's fine.
    }
}
