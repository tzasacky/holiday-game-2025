import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';
import { DataManager } from '../core/DataManager';
import { StatsComponent } from '../components/StatsComponent';
import { EquipmentComponent } from '../components/EquipmentComponent';

export class LightSystem {
    private static _instance: LightSystem;
    
    public static get instance(): LightSystem {
        if (!this._instance) {
            this._instance = new LightSystem();
        }
        return this._instance;
    }

    // Simple Fog of War: keep track of explored tiles
    // We need to store this per level, or assume single active level
    // For now, let's assume the level system manages the actual grid data, 
    // and this system just calculates visibility.
    
    public calculateVisibility(source: GameActor, levelWidth: number, levelHeight: number, isBlocking: (x: number, y: number) => boolean): { visible: boolean[][], explored: boolean[][] } {
        const visible = Array(levelWidth).fill(false).map(() => Array(levelHeight).fill(false));
        // Explored state should ideally be persistent or passed in to update
        // For this stateless calculation, we just return what's currently visible
        // The caller (Level or GameScene) should merge this with persistent explored state
        
        const stats = source.getGameComponent('stats') as StatsComponent;
        // Default view distance
        let radius = 8;
        
        // Check for light sources in equipment
        const equipment = source.getGameComponent('equipment') as EquipmentComponent;
        if (equipment) {
            // Logic to check for light-emitting items
            // e.g. if (equipment.hasItemWithTag('light_source')) radius += 2;
        }

        const startX = Math.floor(Math.max(0, source.gridPos.x - radius));
        const endX = Math.floor(Math.min(levelWidth - 1, source.gridPos.x + radius));
        const startY = Math.floor(Math.max(0, source.gridPos.y - radius));
        const endY = Math.floor(Math.min(levelHeight - 1, source.gridPos.y + radius));

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                // Simple distance check for now
                if (source.gridPos.distance(ex.vec(x, y)) <= radius) {
                    // Line of Sight check could go here
                    // if (this.hasLineOfSight(source.gridPos, ex.vec(x, y), isBlocking)) {
                        visible[x][y] = true;
                    // }
                }
            }
        }
        
        return { visible, explored: visible }; // Caller handles merging explored
    }
    
    // Placeholder for Shadowcasting implementation
    private hasLineOfSight(start: ex.Vector, end: ex.Vector, isBlocking: (x: number, y: number) => boolean): boolean {
        // Bresenham's line algorithm or similar
        return true;
    }
}
