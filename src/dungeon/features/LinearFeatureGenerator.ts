import { FeatureGenerator, FeatureContext } from './FeatureGenerator';
import { FeatureConfig } from './FeatureTypes';
import { TerrainType } from '../../data/terrain';
import { Logger } from '../../core/Logger';
import * as ex from 'excalibur';
import { Level } from '../Level';

interface PathNode {
    x: number;
    y: number;
    g: number;
    h: number;
    f: number;
    parent: PathNode | null;
}

export class LinearFeatureGenerator implements FeatureGenerator {

  public apply(context: FeatureContext, config: FeatureConfig): void {
    const { level, rng } = context;
    const width = config.properties?.width || 1;
    const meander = config.properties?.meander || 0.5;
    
    // Determine start and end points
    // For now, we'll just go from one side to the other randomly
    const isHorizontal = rng.next() > 0.5;
    
    let start: ex.Vector;
    let end: ex.Vector;
    
    if (isHorizontal) {
      start = ex.vec(0, rng.integer(10, level.height - 10));
      end = ex.vec(level.width - 1, rng.integer(10, level.height - 10));
    } else {
      start = ex.vec(rng.integer(10, level.width - 10), 0);
      end = ex.vec(rng.integer(10, level.width - 10), level.height - 1);
    }
    
    this.carvePath(level, start, end, config.terrainType, width, meander, rng, config.placement);
    Logger.info(`[LinearFeatureGenerator] Generated linear feature (${config.terrainType}) from ${start} to ${end}`);
  }
  
  private carvePath(
    level: Level, 
    start: ex.Vector, 
    end: ex.Vector, 
    terrainType: TerrainType, 
    width: number, 
    meander: number,
    rng: ex.Random,
    placement: 'any' | 'room' | 'corridor' = 'any'
  ): void {
    // A* Pathfinding to find a path that respects constraints
    const path = this.findPath(level, start, end, placement, rng);
    
    if (path.length === 0) {
        Logger.warn('[LinearFeatureGenerator] Could not find path for feature');
        return;
    }

    // Carve the path
    for (const point of path) {
        // Carve with width
        for (let dx = -Math.floor(width/2); dx <= Math.ceil(width/2); dx++) {
            for (let dy = -Math.floor(width/2); dy <= Math.ceil(width/2); dy++) {
                const x = Math.floor(point.x + dx);
                const y = Math.floor(point.y + dy);
                
                if (level.inBounds(x, y)) {
                    const currentTile = level.terrainData[x][y];
                    
                    // Bridge logic: If we are placing water over an existing floor, keep it as floor (bridges are interactables now)
                    if (terrainType === TerrainType.Water && currentTile === TerrainType.Floor) {
                        level.terrainData[x][y] = TerrainType.Floor; // Keep as floor, maybe spawn bridge interactable later
                    } else if (currentTile !== TerrainType.Wall) { // Removed Bridge check
                        level.terrainData[x][y] = terrainType;
                    } else if (currentTile === TerrainType.Wall) {
                        level.terrainData[x][y] = terrainType;
                    }
                }
            }
        }
    }
  }

  private findPath(
    level: Level,
    start: ex.Vector,
    end: ex.Vector,
    placement: 'any' | 'room' | 'corridor',
    rng: ex.Random
  ): ex.Vector[] {
    const startNode: PathNode = { x: Math.floor(start.x), y: Math.floor(start.y), g: 0, h: 0, f: 0, parent: null };
    const endNode = { x: Math.floor(end.x), y: Math.floor(end.y) };
    
    const openList: PathNode[] = [startNode];
    const closedList: Set<string> = new Set();
    const nodeMap: Map<string, PathNode> = new Map();
    nodeMap.set(`${startNode.x},${startNode.y}`, startNode);

    while (openList.length > 0) {
        // Sort by f cost (lowest first)
        openList.sort((a, b) => a.f - b.f);
        const current = openList.shift();
        if (!current) break;
        
        // Check if reached end (or close enough)
        if (Math.abs(current.x - endNode.x) < 2 && Math.abs(current.y - endNode.y) < 2) {
            // Reconstruct path
            const path: ex.Vector[] = [];
            let curr = current;
            while (curr) {
                path.push(ex.vec(curr.x, curr.y));
                curr = curr.parent!;
            }
            return path.reverse();
        }

        closedList.add(`${current.x},${current.y}`);

        // Neighbors (4 cardinal + diagonals for smoother rivers?)
        // Let's stick to 4 cardinal for now to avoid diagonal gaps
        const neighbors = [
            { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
        ];

        for (const offset of neighbors) {
            const neighborX = current.x + offset.x;
            const neighborY = current.y + offset.y;
            const key = `${neighborX},${neighborY}`;

            if (!level.inBounds(neighborX, neighborY) || closedList.has(key)) {
                continue;
            }

            // Calculate cost
            let cost = 1;
            
            // Add randomness for meander
            cost += rng.next() * 2; 

            // Placement constraints
            if (placement === 'corridor') {
                const inRoom = level.rooms.some(r => r.contains(neighborX, neighborY));
                if (inRoom) {
                    cost += 50; // High cost to avoid rooms, but allow if necessary
                }
            } else if (placement === 'room') {
                const inRoom = level.rooms.some(r => r.contains(neighborX, neighborY));
                if (!inRoom) {
                    cost += 50;
                }
            }

            const g = current.g + cost;
            const h = Math.abs(neighborX - endNode.x) + Math.abs(neighborY - endNode.y); // Manhattan distance
            const f = g + h;

            let neighborNode = nodeMap.get(key);
            if (!neighborNode) {
                neighborNode = { x: neighborX, y: neighborY, g, h, f, parent: current };
                nodeMap.set(key, neighborNode);
                openList.push(neighborNode);
            } else if (g < neighborNode.g) {
                neighborNode.g = g;
                neighborNode.f = g + neighborNode.h;
                neighborNode.parent = current;
            }
        }
    }
    
    return []; // No path found
  }
}
