import * as ex from 'excalibur';
import { Level } from '../dungeon/Level';
import { TerrainType } from '../dungeon/Terrain';
import { Logger } from './Logger';

export interface PathfindingOptions {
    avoidInteractables?: boolean;
    allowItems?: boolean;
    allowMobs?: boolean;
}

export class Pathfinding {
    public static findPath(
        level: Level,
        start: ex.Vector,
        end: ex.Vector,
        options: PathfindingOptions = {}
    ): ex.Vector[] {
        const {
            avoidInteractables = true,
            allowItems = false,
            allowMobs = false
        } = options;

        // Check bounds
        if (end.x < 0 || end.x >= level.width || 
            end.y < 0 || end.y >= level.height) {
            Logger.debug("[Pathfinding] Target out of bounds:", end);
            return [];
        }

        // If already at target, no path needed
        if (start.distance(end) < 1.0) {
            Logger.debug("[Pathfinding] Already at target");
            return [];
        }

        // Check if target is valid
        if (!this.isValidTarget(level, end.x, end.y, options)) {
            Logger.debug("[Pathfinding] Target is not valid:", end);
            return [];
        }

        // Create a simple straight-line path with obstacle avoidance
        const path: ex.Vector[] = [];
        let current = start.clone();
        
        while (current.distance(end) > 1.0) {
            const dx = Math.sign(end.x - current.x);
            const dy = Math.sign(end.y - current.y);
            
            let nextStep: ex.Vector | null = null;
            
            // Try diagonal movement first
            if (dx !== 0 && dy !== 0) {
                const diagonal = ex.vec(current.x + dx, current.y + dy);
                if (this.isPassable(level, diagonal.x, diagonal.y, options)) {
                    nextStep = diagonal;
                }
            }
            
            // Try horizontal movement
            if (!nextStep && dx !== 0) {
                const horizontal = ex.vec(current.x + dx, current.y);
                if (this.isPassable(level, horizontal.x, horizontal.y, options)) {
                    nextStep = horizontal;
                }
            }
            
            // Try vertical movement
            if (!nextStep && dy !== 0) {
                const vertical = ex.vec(current.x, current.y + dy);
                if (this.isPassable(level, vertical.x, vertical.y, options)) {
                    nextStep = vertical;
                }
            }
            
            // If no movement is possible, path is blocked
            if (!nextStep) {
                Logger.debug("[Pathfinding] Path blocked at:", current);
                break;
            }
            
            current = nextStep;
            path.push(current.clone());
            
            // Prevent infinite loops
            if (path.length > 100) {
                Logger.debug("[Pathfinding] Path too long, stopping");
                break;
            }
        }
        
        Logger.debug("[Pathfinding] Created path with", path.length, "steps");
        return path;
    }

    private static isPassable(level: Level, x: number, y: number, options: PathfindingOptions): boolean {
        // Check bounds
        if (x < 0 || x >= level.width || y < 0 || y >= level.height) {
            return false;
        }

        // Check terrain
        const terrain = level.getTile(x, y);
        if (terrain === TerrainType.Wall || terrain === TerrainType.Chasm) {
            return false;
        }

        // Check for solid tiles
        const tile = level.objectMap.getTile(x, y);
        if (tile && tile.solid) {
            // Special case: doors can be interacted with
            // TODO: Check for door interactables instead of terrain types
            if (false) { // Temporarily disabled - doors are now interactables
                return !options.avoidInteractables;
            }
            return false;
        }

        // Check for mobs (unless allowed)
        if (!options.allowMobs) {
            const mobAtPos = level.mobs.find(mob => 
                mob.gridPos.x === x && mob.gridPos.y === y && mob.hp > 0
            );
            if (mobAtPos) {
                return false;
            }
        }

        // Check for items (if avoiding interactables)
        if (options.avoidInteractables && !options.allowItems) {
            const itemAtPos = level.items.find(item => 
                (item as any).gridPos && (item as any).gridPos.x === x && (item as any).gridPos.y === y
            );
            if (itemAtPos) {
                return false;
            }
        }

        return true;
    }

    private static isValidTarget(level: Level, x: number, y: number, options: PathfindingOptions): boolean {
        // Check bounds
        if (x < 0 || x >= level.width || y < 0 || y >= level.height) {
            return false;
        }

        // Target can be an interactable (door, item, mob) even if we avoid them in pathfinding
        const terrain = level.getTile(x, y);
        
        // Can't target walls or chasms
        if (terrain === TerrainType.Wall || terrain === TerrainType.Chasm) {
            return false;
        }

        // Can target doors (will be handled as interaction)
        // TODO: Check for door interactables instead of terrain types  
        if (false) { // doors are now interactables
            return true;
        }

        // Can target tiles with items or mobs (will be handled as interaction)
        return true;
    }

    public static getInteractionAt(level: Level, x: number, y: number): string | null {
        // Check bounds
        if (x < 0 || x >= level.width || y < 0 || y >= level.height) {
            return null;
        }

        // Check terrain interactions
        const terrain = level.getTile(x, y);
        // TODO: Check for closed door interactable
        if (false) { // doors are now interactables
            return 'door_open';
        }
        // TODO: Check for locked door interactable  
        if (false) { // doors are now interactables
            return 'door_locked';
        }

        // Check for items
        const itemAtPos = level.items.find(item => 
            (item as any).gridPos && (item as any).gridPos.x === x && (item as any).gridPos.y === y
        );
        if (itemAtPos) {
            return 'item_pickup';
        }

        // Check for mobs
        const mobAtPos = level.mobs.find(mob => 
            mob.gridPos.x === x && mob.gridPos.y === y && mob.hp > 0
        );
        if (mobAtPos) {
            return 'mob_attack';
        }

        return null;
    }
}