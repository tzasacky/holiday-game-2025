import * as ex from 'excalibur';
import { Logger } from '../core/Logger';
import { Level } from '../dungeon/Level';

export interface PathOptions {
    maxDistance?: number;
    allowDiagonal?: boolean;
}

interface PathNode {
    position: ex.Vector;
    gCost: number; // Distance from start
    hCost: number; // Heuristic distance to goal
    fCost: number; // gCost + hCost
    parent?: PathNode;
}

/**
 * Synchronous pathfinding system using A*
 * No events, no async - just fast pathfinding
 */
export class PathfindingSystem {
    private static _instance: PathfindingSystem;

    public static get instance(): PathfindingSystem {
        if (!PathfindingSystem._instance) {
            PathfindingSystem._instance = new PathfindingSystem();
        }
        return PathfindingSystem._instance;
    }

    private constructor() {}

    /**
     * Find a path from start to goal
     * Returns array of positions (excluding start position) or null if no path
     */
    public findPath(
        start: ex.Vector,
        goal: ex.Vector,
        level: Level,
        actorId: string,
        options: PathOptions = {}
    ): ex.Vector[] | null {
        const opts = {
            maxDistance: options.maxDistance ?? 50,
            allowDiagonal: options.allowDiagonal ?? false
        };

        // Early validation - don't even try to pathfind if start or goal is invalid
        if (!level.inBounds(start.x, start.y) || !level.inBounds(goal.x, goal.y)) {
            Logger.debug(`[PathfindingSystem] Start or goal out of bounds`);
            return null;
        }

        if (!level.isWalkable(goal.x, goal.y, actorId)) {
            Logger.debug(`[PathfindingSystem] Goal position is not walkable`);
            return null;
        }

        // If start equals goal, return empty path
        if (start.equals(goal)) {
            return [];
        }

        // Run A*
        const path = this.astar(start, goal, level, actorId, opts);

        if (!path || path.length === 0) {
            return null;
        }

        // Remove start position from path (index 0)
        return path.slice(1);
    }

    /**
     * Get next single step toward goal
     * Useful for AI that only needs one step at a time
     */
    public getNextStep(
        from: ex.Vector,
        to: ex.Vector,
        level: Level,
        actorId: string
    ): ex.Vector | null {
        const path = this.findPath(from, to, level, actorId, { maxDistance: 20 });
        return path?.[0] ?? null;
    }

    /**
     * A* pathfinding algorithm
     * Returns full path including start position
     */
    private astar(
        start: ex.Vector,
        goal: ex.Vector,
        level: Level,
        actorId: string,
        options: Required<PathOptions>
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
                Logger.warn(`[PathfindingSystem] Max iterations reached`);
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

            // Check neighbors
            const neighbors = this.getNeighbors(current.position, options.allowDiagonal);

            for (const neighborPos of neighbors) {
                const nKey = this.posKey(neighborPos);

                if (closedSet.has(nKey)) {
                    continue;
                }

                // Check if neighbor is walkable (synchronous!)
                if (!level.isWalkable(neighborPos.x, neighborPos.y, actorId)) {
                    continue;
                }

                const gCost = current.gCost + this.getMovementCost(current.position, neighborPos, level);
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
     * Get neighboring positions
     */
    private getNeighbors(pos: ex.Vector, allowDiagonal: boolean): ex.Vector[] {
        const neighbors: ex.Vector[] = [
            ex.vec(pos.x + 1, pos.y),
            ex.vec(pos.x - 1, pos.y),
            ex.vec(pos.x, pos.y + 1),
            ex.vec(pos.x, pos.y - 1)
        ];

        if (allowDiagonal) {
            neighbors.push(
                ex.vec(pos.x + 1, pos.y + 1),
                ex.vec(pos.x + 1, pos.y - 1),
                ex.vec(pos.x - 1, pos.y + 1),
                ex.vec(pos.x - 1, pos.y - 1)
            );
        }

        return neighbors;
    }

    /**
     * Manhattan distance heuristic
     */
    private heuristic(a: ex.Vector, b: ex.Vector): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    /**
     * Get movement cost between two adjacent positions
     */
    private getMovementCost(from: ex.Vector, to: ex.Vector, level: Level): number {
        let cost = level.getMovementCost(to.x, to.y);

        // Diagonal movement costs more
        const isDiagonal = Math.abs(from.x - to.x) + Math.abs(from.y - to.y) > 1;
        if (isDiagonal) {
            cost *= 1.4;
        }

        return cost;
    }

    /**
     * Reconstruct path from end node
     */
    private reconstructPath(endNode: PathNode): ex.Vector[] {
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
    private posKey(pos: ex.Vector): string {
        return `${pos.x},${pos.y}`;
    }
}