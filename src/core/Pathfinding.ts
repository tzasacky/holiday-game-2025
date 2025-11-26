import * as ex from 'excalibur';
import { Level } from '../dungeon/Level';
import { TerrainType } from '../data/terrain';
import { Logger } from './Logger';
import { GameActor } from '../components/GameActor';

export interface PathfindingOptions {
    avoidInteractables?: boolean;
    allowItems?: boolean;
    allowActors?: boolean;
    maxDistance?: number;
}

interface PathNode {
    position: ex.Vector;
    gCost: number; // Distance from start
    hCost: number; // Heuristic distance to goal
    fCost: number; // gCost + hCost
    parent?: PathNode;
}

/**
 * Static pathfinding utility using A* algorithm
 * Simple, no events, no singletons - just returns a path array
 */
export class Pathfinding {
    /**
     * Find a path from start to end using A*
     * Returns array of grid positions (excluding start position)
     * Returns empty array if no path exists
     */
    public static findPath(
        level: Level,
        start: ex.Vector,
        end: ex.Vector,
        options: PathfindingOptions = {}
    ): ex.Vector[] {
        const opts = {
            avoidInteractables: options.avoidInteractables ?? true,
            allowItems: options.allowItems ?? false,
            allowActors: options.allowActors ?? false,
            maxDistance: options.maxDistance ?? 50
        };

        // Check bounds
        if (!level.inBounds(end.x, end.y)) {
            Logger.debug('[Pathfinding] Target out of bounds:', end);
            return [];
        }

        // If already at target, no path needed
        if (start.distance(end) < 1.0) {
            Logger.debug('[Pathfinding] Already at target');
            return [];
        }

        // Check if target is valid
        if (!this.isValidTarget(level, end.x, end.y)) {
            Logger.debug('[Pathfinding] Target is not valid:', end);
            return [];
        }

        // Run A*
        const path = this.astar(level, start, end, opts);
        
        if (!path || path.length === 0) {
            Logger.debug('[Pathfinding] No path found');
            return [];
        }

        // Remove start position from path (index 0)
        Logger.debug('[Pathfinding] Created path with', path.length - 1, 'steps');
        return path.slice(1);
    }

    /**
     * Check what interaction is available at a position
     * Returns interaction type or null
     */
    public static getInteractionAt(level: Level, x: number, y: number): string | null {
        if (!level.inBounds(x, y)) {
            return null;
        }

        // Check for interactable entities first
        const interactableEntity = level.getInteractableAt(x, y);
        if (interactableEntity) {
            // Check if player can interact with this
            const hero = level.actors.find(a => a.isPlayer);
            if (hero && interactableEntity.canInteract(hero)) {
                return 'entity_interact';
            }
        }

        // Check for actors (combat)
        const actorAtPos = level.getActorAt(x, y);
        if (actorAtPos && !actorAtPos.isPlayer) {
            return 'actor_attack';
        }

        // Check terrain interactions (legacy system for doors/stairs placed as terrain)
        const terrain = level.getTile(x, y);
        
        // Door interactions
        if (terrain === TerrainType.Door) return 'door_open';
        if (terrain === TerrainType.LockedDoor) return 'door_locked';
        if (terrain === TerrainType.SecretDoor) return 'secret_door';
        
        if (terrain === TerrainType.StairsDown) {
            return 'stairs_down';
        }

        return null;
    }

    /**
     * A* pathfinding algorithm
     */
    private static astar(
        level: Level,
        start: ex.Vector,
        goal: ex.Vector,
        options: Required<PathfindingOptions>
    ): ex.Vector[] | null {
        const openSet: PathNode[] = [];
        const closedSet = new Set<string>();

        const startNode: PathNode = {
            position: start.clone(),
            gCost: 0,
            hCost: this.heuristic(start, goal),
            fCost: 0
        };
        startNode.fCost = startNode.gCost + startNode.hCost;

        openSet.push(startNode);

        let iterations = 0;
        const maxIterations = options.maxDistance * options.maxDistance;

        while (openSet.length > 0) {
            iterations++;
            if (iterations > maxIterations) {
                Logger.warn('[Pathfinding] Max iterations reached');
                return null;
            }

            // Get node with lowest fCost
            openSet.sort((a, b) => a.fCost - b.fCost);
            const current = openSet.shift()!;

            const posKey = this.posKey(current.position);
            closedSet.add(posKey);

            // Check if we reached the goal
            if (current.position.equals(goal)) {
                return this.reconstructPath(current);
            }

            // Check neighbors (4-directional)
            const neighbors = this.getNeighbors(current.position);

            for (const neighborPos of neighbors) {
                const nKey = this.posKey(neighborPos);

                if (closedSet.has(nKey)) {
                    continue;
                }

                // Check if neighbor is passable
                if (!this.isPassable(level, neighborPos.x, neighborPos.y, options)) {
                    continue;
                }

                const gCost = current.gCost + level.getMovementCost(neighborPos.x, neighborPos.y);
                const hCost = this.heuristic(neighborPos, goal);
                const fCost = gCost + hCost;

                // Check if this path to neighbor is better
                let existing = openSet.find(n => n.position.equals(neighborPos));

                if (!existing) {
                    openSet.push({
                        position: neighborPos,
                        gCost,
                        hCost,
                        fCost,
                        parent: current
                    });
                } else if (gCost < existing.gCost) {
                    existing.gCost = gCost;
                    existing.fCost = fCost;
                    existing.parent = current;
                }
            }
        }

        // No path found
        return null;
    }

    /**
     * Check if a position is passable for pathfinding
     * Doors are treated as walkable for pathfinding - they'll be opened when reached
     */
    private static isPassable(
        level: Level,
        x: number,
        y: number,
        options: Required<PathfindingOptions>
    ): boolean {
        // Check bounds
        if (!level.inBounds(x, y)) {
            return false;
        }

        // Check terrain - only walls and chasms are impassable
        // Doors are passable for pathing (will be opened when reached)
        const terrain = level.getTile(x, y);
        if (terrain === TerrainType.Wall || terrain === TerrainType.Chasm) {
            return false;
        }

        // Check for actors (unless allowed)
        if (!options.allowActors) {
            const actorAtPos = level.getActorAt(x, y);
            if (actorAtPos) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if a position is a valid pathfinding target
     */
    private static isValidTarget(level: Level, x: number, y: number): boolean {
        if (!level.inBounds(x, y)) {
            return false;
        }

        const terrain = level.getTile(x, y);
        
        // Can't target walls or chasms
        if (terrain === TerrainType.Wall || terrain === TerrainType.Chasm) {
            return false;
        }

        // Can target everything else (doors, actors, etc. - will be handled as interactions)
        return true;
    }

    /**
     * Get neighboring positions (4-directional)
     */
    private static getNeighbors(pos: ex.Vector): ex.Vector[] {
        return [
            ex.vec(pos.x + 1, pos.y),
            ex.vec(pos.x - 1, pos.y),
            ex.vec(pos.x, pos.y + 1),
            ex.vec(pos.x, pos.y - 1)
        ];
    }

    /**
     * Manhattan distance heuristic
     */
    private static heuristic(a: ex.Vector, b: ex.Vector): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    /**
     * Reconstruct path from end node
     */
    private static reconstructPath(endNode: PathNode): ex.Vector[] {
        const path: ex.Vector[] = [];
        let current: PathNode | undefined = endNode;

        while (current) {
            path.unshift(current.position.clone());
            current = current.parent;
        }

        return path;
    }

    /**
     * Position key for Set lookups
     */
    private static posKey(pos: ex.Vector): string {
        return `${pos.x},${pos.y}`;
    }
}