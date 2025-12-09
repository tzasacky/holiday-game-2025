import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';
import { Level } from '../dungeon/Level';
import { InteractableType } from '../data/interactables';
import { VisibilityConfig } from '../config/VisibilityConfig';
import { Logger } from './Logger';
import { TerrainType, TerrainDefinitions } from '../data/terrain';
import { InteractableEntity } from '../entities/InteractableEntity';

/**
 * Result of a line-of-sight check
 */
export interface LOSResult {
    visible: boolean;
    distance: number;
    blockedBy?: string | null;
}

/**
 * Visibility System using grid-based raycasting
 * Provides line-of-sight checks for fog-of-war and AI
 */
export class VisibilitySystem {
    private static _instance: VisibilitySystem;
    private raycastCache = new Map<string, LOSResult>();
    private currentFrame = 0;

    public static get instance(): VisibilitySystem {
        if (!this._instance) {
            this._instance = new VisibilitySystem();
        }
        return this._instance;
    }

    /**
     * Clear raycast cache (call once per frame/turn)
     */
    public newFrame(): void {
        this.currentFrame++;
        this.raycastCache.clear();
    }

    /**
     * Check if one actor can see another actor
     */
    public canSee(from: GameActor, to: GameActor, scene: ex.Scene): boolean {
        if (!VisibilityConfig.enabled) return true; // System disabled
        
        const distance = from.gridPos.distance(to.gridPos);
        
        // Check distance first (cheap)
        if (distance > VisibilityConfig.enemyViewDistance) {
            return false;
        }
        
        // Raycast to check for obstructions
        const result = this.rayCastGrid(from.gridPos, to.gridPos, scene);
        return result.visible;
    }

    /**
     * Check if a position is visible from an actor
     */
    public canSeePosition(from: GameActor, toPos: ex.Vector, scene: ex.Scene, maxDistance?: number): boolean {
        if (!VisibilityConfig.enabled) return true;
        
        const distance = from.gridPos.distance(toPos);
        const maxDist = maxDistance || VisibilityConfig.playerViewRadius;
        
        if (distance > maxDist) {
            return false;
        }
        
        const result = this.rayCastGrid(from.gridPos, toPos, scene);
        return result.visible;
    }

    /**
     * Get all visible tile positions within radius from actor
     * Used for fog-of-war discovery
     */
    public getVisibleTiles(from: GameActor, scene: ex.Scene, radius?: number): Set<string> {
        if (!VisibilityConfig.enabled) {
            // When disabled, return all tiles in radius
            return this.getTilesInRadius(from.gridPos, radius || 100);
        }
        
        const viewRadius = radius || VisibilityConfig.playerViewRadius;
        const visible = new Set<string>();
        const fromGrid = from.gridPos;
        
        // Check all tiles in square radius
        for (let dx = -viewRadius; dx <= viewRadius; dx++) {
            for (let dy = -viewRadius; dy <= viewRadius; dy++) {
                const tilePos = ex.vec(fromGrid.x + dx, fromGrid.y + dy);
                const dist = fromGrid.distance(tilePos);
                
                // Skip if outside circular radius
                if (dist > viewRadius) continue;
                
                // Raycast to check visibility
                if (this.rayCastGrid(from.gridPos, tilePos, scene).visible) {
                    visible.add(`${tilePos.x},${tilePos.y}`);
                }
            }
        }
        
        return visible;
    }

    /**
     * Grid-based raycast using Bresenham's line algorithm
     * Checks terrain tiles and door entities
     */
    private rayCastGrid(from: ex.Vector, to: ex.Vector, scene: any): LOSResult {
        // Check cache if enabled
        if (VisibilityConfig.cacheRaycastResults) {
            const key = `${this.currentFrame}:${from.x},${from.y}-${to.x},${to.y}`;
            const cached = this.raycastCache.get(key);
            if (cached) return cached;
        }
        
        const distance = from.distance(to);
        
        // Get level from scene
        const level = scene.level as Level;
        if (!level) {
            Logger.warn('[VisibilitySystem] No level found in scene for raycast');
            return { visible: true, distance };
        }
        
        // Get all grid positions along the line using Bresenham's algorithm
        const line = this.bresenhamLine(
            Math.floor(from.x),
            Math.floor(from.y),
            Math.floor(to.x),
            Math.floor(to.y)
        );
        
        // Check each tile along the line (skip first, which is the source position)
        for (let i = 1; i < line.length; i++) {
            const [x, y] = line[i];
            
            // Check if out of bounds
            if (!level.inBounds(x, y)) {
                const result: LOSResult = {
                    visible: false,
                    distance,
                    blockedBy: 'out-of-bounds'
                };
                this.cacheResult(from, to, result);
                return result;
            }
            
            // Check terrain - walls block line of sight
            const terrain = level.getTile(x, y);
            const terrainDef = TerrainDefinitions[terrain];
            if (terrainDef && !terrainDef.isTransparent) {
                // If this is the target tile, it IS visible (we see the wall)
                if (Math.floor(to.x) === x && Math.floor(to.y) === y) {
                     const result: LOSResult = {
                        visible: true, // We see the wall itself
                        distance,
                        blockedBy: `wall-${terrain}`
                    };
                    this.cacheResult(from, to, result);
                    return result;
                }

                const result: LOSResult = {
                    visible: false,
                    distance,
                    blockedBy: `wall-${terrain}`
                };
                this.cacheResult(from, to, result);
                return result;
            }
            
            // Check for doors at this position
            const door = level.getInteractableAt(x, y);
            if (door && door.definition.type === InteractableType.Door) {
                // Check if door is closed/locked
                if (door.state === 'closed' || door.state === 'locked') {
                    // If this is the target tile, it IS visible (we see the door)
                    if (Math.floor(to.x) === x && Math.floor(to.y) === y) {
                        const result: LOSResult = {
                            visible: true, // We see the door itself
                            distance,
                            blockedBy: `door-${door.state}`
                        };
                        this.cacheResult(from, to, result);
                        return result;
                    }

                    const result: LOSResult = {
                        visible: false,
                        distance,
                        blockedBy: `door-${door.state}`
                    };
                    this.cacheResult(from, to, result);
                    return result;
                }
            }

            // Check for blocking decor
            const decorList = level.getDecorAt(x, y);
            for (const decor of decorList) {
                if (decor.blocksSight) {
                    // If this is the target tile, it IS visible (we see the decor)
                    if (Math.floor(to.x) === x && Math.floor(to.y) === y) {
                        const result: LOSResult = {
                            visible: true,
                            distance,
                            blockedBy: `decor-${decor.decorId}`
                        };
                        this.cacheResult(from, to, result);
                        return result;
                    }

                    const result: LOSResult = {
                        visible: false,
                        distance,
                        blockedBy: `decor-${decor.decorId}`
                    };
                    this.cacheResult(from, to, result);
                    return result;
                }
            }
        }
        
        // No obstacles found
        const result: LOSResult = {
            visible: true,
            distance
        };
        this.cacheResult(from, to, result);
        return result;
    }

    /**
     * Bresenham's line algorithm to get all grid cells between two points
     */
    private bresenhamLine(x0: number, y0: number, x1: number, y1: number): [number, number][] {
        const points: [number, number][] = [];
        
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        
        let x = x0;
        let y = y0;
        
        while (true) {
            points.push([x, y]);
            
            if (x === x1 && y === y1) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
        
        return points;
    }

    /**
     * Cache a raycast result
     */
    private cacheResult(from: ex.Vector, to: ex.Vector, result: LOSResult): void {
        if (VisibilityConfig.cacheRaycastResults) {
            const key = `${this.currentFrame}:${from.x},${from.y}-${to.x},${to.y}`;
            this.raycastCache.set(key, result);
        }
    }

    /**
     * Helper: Get all tiles in radius (for when system is disabled)
     */
    private getTilesInRadius(center: ex.Vector, radius: number): Set<string> {
        const tiles = new Set<string>();
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (Math.sqrt(dx * dx + dy * dy) <= radius) {
                    tiles.add(`${center.x + dx},${center.y + dy}`);
                }
            }
        }
        return tiles;
    }
}
