import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { CollisionSystem } from './CollisionSystem';
import { Level } from '../dungeon/Level';
import * as ex from 'excalibur';

export interface PathfindingRequest {
  actorId: string;
  start: ex.Vector;
  goal: ex.Vector;
  level: Level;
  options?: {
    maxDistance?: number;
    avoidActors?: boolean;
    allowDiagonal?: boolean;
    canInteract?: boolean;
  };
}

export interface PathfindingResult {
  actorId: string;
  path: ex.Vector[];
  success: boolean;
  reason?: string;
  cost: number;
}

interface PathNode {
  position: ex.Vector;
  gCost: number; // Distance from start
  hCost: number; // Distance to goal (heuristic)
  fCost: number; // gCost + hCost
  parent?: PathNode;
}

export class PathfindingSystem {
  private static _instance: PathfindingSystem;


  public static get instance(): PathfindingSystem {
    if (!PathfindingSystem._instance) {
      PathfindingSystem._instance = new PathfindingSystem();
    }
    return PathfindingSystem._instance;
  }

  private constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    EventBus.instance.on('pathfinding:request' as any, (event: PathfindingRequest) => {
      this.handlePathfindingRequest(event);
    });
  }

  private async handlePathfindingRequest(request: PathfindingRequest): Promise<void> {
    const { actorId, start, goal, level, options = {} } = request;
    
    // Default options
    const opts = {
      maxDistance: 50,
      avoidActors: true,
      allowDiagonal: false,
      canInteract: true,
      ...options
    };

    try {
      const path = await this.findPath(start, goal, level, actorId, opts);
      
      const result: PathfindingResult = {
        actorId,
        path,
        success: path.length > 0,
        cost: path.length,
        reason: path.length === 0 ? 'No valid path found' : undefined
      };

      EventBus.instance.emit('pathfinding:result' as any, result);
      
    } catch (error) {
      const result: PathfindingResult = {
        actorId,
        path: [],
        success: false,
        reason: `Pathfinding error: ${error}`,
        cost: Infinity
      };

      EventBus.instance.emit('pathfinding:result' as any, result);
    }
  }

  private async findPath(
    start: ex.Vector, 
    goal: ex.Vector, 
    level: Level, 
    actorId: string, 
    options: any
  ): Promise<ex.Vector[]> {
    const openSet: PathNode[] = [];
    const closedSet: Set<string> = new Set();
    
    const startNode: PathNode = {
      position: start,
      gCost: 0,
      hCost: this.getDistance(start, goal),
      fCost: 0
    };
    startNode.fCost = startNode.gCost + startNode.hCost;
    
    openSet.push(startNode);

    while (openSet.length > 0) {
      // Get node with lowest fCost
      openSet.sort((a, b) => a.fCost - b.fCost);
      const currentNode = openSet.shift()!;
      
      const posKey = `${currentNode.position.x},${currentNode.position.y}`;
      closedSet.add(posKey);

      // Check if we reached the goal
      if (currentNode.position.equals(goal)) {
        return this.reconstructPath(currentNode);
      }

      // Explore neighbors
      const neighbors = this.getNeighbors(currentNode.position, options.allowDiagonal);
      
      for (const neighborPos of neighbors) {
        const neighborKey = `${neighborPos.x},${neighborPos.y}`;
        
        if (closedSet.has(neighborKey)) {
          continue;
        }

        // Check if we can move to this neighbor using the collision system
        const canMove = await this.canMoveToPosition(actorId, neighborPos, level, options);
        if (!canMove) {
          continue;
        }

        const gCost = currentNode.gCost + this.getMovementCost(currentNode.position, neighborPos, level);
        const hCost = this.getDistance(neighborPos, goal);
        const fCost = gCost + hCost;

        // Check if this path to neighbor is better
        let existingNode = openSet.find(n => n.position.equals(neighborPos));
        
        if (!existingNode) {
          existingNode = {
            position: neighborPos,
            gCost,
            hCost,
            fCost,
            parent: currentNode
          };
          openSet.push(existingNode);
        } else if (gCost < existingNode.gCost) {
          existingNode.gCost = gCost;
          existingNode.fCost = fCost;
          existingNode.parent = currentNode;
        }
      }

      // Prevent infinite loops
      if (closedSet.size > options.maxDistance * options.maxDistance) {
        Logger.warn(`[PathfindingSystem] Pathfinding exceeded max iterations for actor ${actorId}`);
        break;
      }
    }

    // No path found
    return [];
  }

  private async canMoveToPosition(
    actorId: string, 
    position: ex.Vector, 
    level: Level, 
    options: any
  ): Promise<boolean> {
    try {
      return await CollisionSystem.checkMovement(actorId, position, level, 'walk');
    } catch (error) {
      Logger.warn(`[PathfindingSystem] Collision check failed for ${actorId} at ${position}`);
      return false;
    }
  }

  private getNeighbors(position: ex.Vector, allowDiagonal: boolean): ex.Vector[] {
    const neighbors: ex.Vector[] = [];
    
    // Cardinal directions
    neighbors.push(
      ex.vec(position.x + 1, position.y),
      ex.vec(position.x - 1, position.y),
      ex.vec(position.x, position.y + 1),
      ex.vec(position.x, position.y - 1)
    );

    // Diagonal directions
    if (allowDiagonal) {
      neighbors.push(
        ex.vec(position.x + 1, position.y + 1),
        ex.vec(position.x + 1, position.y - 1),
        ex.vec(position.x - 1, position.y + 1),
        ex.vec(position.x - 1, position.y - 1)
      );
    }

    return neighbors;
  }

  private getDistance(a: ex.Vector, b: ex.Vector): number {
    // Manhattan distance for grid-based movement
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private getMovementCost(from: ex.Vector, to: ex.Vector, level: Level): number {
    // Base cost
    let cost = 1;

    // Check terrain movement cost
    const terrainType = level.terrainData[to.y]?.[to.x];
    if (terrainType) {
      // Query terrain cost from data definitions
      // For now, use basic logic
      switch (terrainType.toString()) {
        case 'water':
          cost = 2; // Slower movement through water
          break;
        case 'deep_snow':
          cost = 2; // Slower movement through snow
          break;
        case 'ice':
          cost = 1; // Normal movement but slippery
          break;
      }
    }

    // Diagonal movement costs more
    if (Math.abs(from.x - to.x) + Math.abs(from.y - to.y) > 1) {
      cost *= 1.4; // Diagonal cost multiplier
    }

    return cost;
  }

  private reconstructPath(endNode: PathNode): ex.Vector[] {
    const path: ex.Vector[] = [];
    let currentNode: PathNode | undefined = endNode;

    while (currentNode) {
      path.unshift(currentNode.position);
      currentNode = currentNode.parent;
    }

    return path;
  }

  /**
   * High-level pathfinding API
   */
  public static async findPath(
    actorId: string,
    start: ex.Vector,
    goal: ex.Vector,
    level: Level,
    options?: any
  ): Promise<ex.Vector[]> {
    return new Promise((resolve, reject) => {
      const handleResult = (result: PathfindingResult) => {
        if (result.actorId === actorId) {
          EventBus.instance.off('pathfinding:result' as any, handleResult);
          
          if (result.success) {
            resolve(result.path);
          } else {
            reject(new Error(result.reason || 'Pathfinding failed'));
          }
        }
      };

      EventBus.instance.on('pathfinding:result' as any, handleResult);

      EventBus.instance.emit('pathfinding:request' as any, {
        actorId,
        start,
        goal,
        level,
        options
      } as PathfindingRequest);

      // Timeout safety
      setTimeout(() => {
        EventBus.instance.off('pathfinding:result' as any, handleResult);
        reject(new Error('Pathfinding timeout'));
      }, 5000);
    });
  }

  /**
   * Simple API for checking if a path exists
   */
  public static async canReach(
    actorId: string,
    start: ex.Vector,
    goal: ex.Vector,
    level: Level,
    maxDistance: number = 20
  ): Promise<boolean> {
    try {
      const path = await this.findPath(actorId, start, goal, level, { maxDistance });
      return path.length > 0;
    } catch (error) {
      return false;
    }
  }
}