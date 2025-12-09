import * as ex from 'excalibur';
import { Level } from '../dungeon/Level';
import { TerrainType } from '../data/terrain';
import { Logger } from './Logger';
import { GameActor } from '../components/GameActor';
import { InteractionType } from '../constants/InteractionType';
import { InteractableType } from '../data/interactables';
import { InteractableID } from '../constants/InteractableIDs';

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
    public static getInteractionAt(level: Level, x: number, y: number): InteractionType | null {
        if (!level.inBounds(x, y)) {
            return null;
        }

        // Check for interactable entities first
        const interactableEntity = level.getInteractableAt(x, y);
        if (interactableEntity) {
            // Check if player can interact with this
            const hero = level.actors.find(a => a.isPlayer);
            if (hero && interactableEntity.canInteract(hero)) {
                // Return specific interaction type based on definition
                const def = interactableEntity.definition;
                if (def.type === InteractableType.Door) {
                    return interactableEntity.state === 'locked' ? InteractionType.DoorLocked : InteractionType.DoorOpen;
                }
                if (def.id === InteractableID.StairsDown) return InteractionType.StairsDown;
                if (def.id === InteractableID.StairsUp) return InteractionType.StairsUp;
                
                return InteractionType.EntityInteract;
            }
        }

        // Check for actors (combat) - skip dead actors
        const actorAtPos = level.getActorAt(x, y);
        if (actorAtPos && !actorAtPos.isPlayer && !actorAtPos.isDead) {
            return InteractionType.ActorAttack;
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
        // Allow for more iterations than just distance^2 to account for obstacles
        // 40x40 map = 1600 tiles. 3000 should be plenty for any path.
        const maxIterations = 3000;

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
                if (!this.isPassable(level, neighborPos.x, neighborPos.y, options, goal)) {
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
        options: Required<PathfindingOptions>,
        goal?: ex.Vector
    ): boolean {
        // Check bounds
        if (!level.inBounds(x, y)) {
            return false;
        }

        // Check terrain - only walls and chasms are impassable
        const terrain = level.getTile(x, y);
        if (terrain === TerrainType.Wall || terrain === TerrainType.Chasm) {
            return false;
        }

        // Check for blocking interactables
        const interactable = level.getInteractableAt(x, y);
        if (interactable && interactable.blocksMovement) {
            // Doors are passable for pathing (will be opened when reached)
            if (interactable.definition.type === InteractableType.Door) {
                return true;
            }
            // Other blocking interactables (decorations, etc) are obstacles
            return false;
        }

        // Check for blocking decor
        const decorList = level.getDecorAt(x, y);
        for (const decor of decorList) {
            if (decor.blocksMovement) {
                return false;
            }
        }

        // Check for actors (unless allowed)
        if (!options.allowActors) {
            // If this is the goal, we allow it (we want to path TO the actor, just not THROUGH others)
            if (goal && goal.x === x && goal.y === y) {
                return true;
            }

            const actorAtPos = level.getActorAt(x, y);
            if (actorAtPos && !actorAtPos.isDead) {
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
        
        // Check for blocking interactables
        const interactable = level.getInteractableAt(x, y);
        if (interactable && interactable.blocksMovement) {
            // Doors are valid targets (can interact)
            if (interactable.definition.type === InteractableType.Door) {
                return true;
            }
            return false;
        }

        // Check for blocking decor
        const decorList = level.getDecorAt(x, y);
        for (const decor of decorList) {
            if (decor.blocksMovement) {
                return false;
            }
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