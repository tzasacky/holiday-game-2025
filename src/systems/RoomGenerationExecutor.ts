import { DataManager } from '../core/DataManager';
import { Logger } from '../core/Logger';
import { EventBus } from '../core/EventBus';
import { GameEventNames, FactoryCreateEvent } from '../core/GameEvents';
import { SpawnTableExecutor } from './SpawnTableExecutor';
import { ActorFactory } from '../factories/ActorFactory';
import { Level } from '../dungeon/Level';
import { Room } from '../dungeon/Room';
import { RoomTemplate, InteractablePlacement, SpawnPointConfig } from '../data/roomTemplates';
import { Spawner, SpawnConfig } from '../dungeon/Spawner';
import { InteractableSpawner } from './InteractableSpawner';
import { LootSpawner } from './LootSpawner';
import { TerrainType } from '../data/terrain';
import { RegistryKey } from '../constants/RegistryKeys';
import * as ex from 'excalibur';

export interface RoomPopulationRequest {
  room: Room;
  template: RoomTemplate;
  floorNumber: number;
  level: Level;
}

export interface InteractableSpawnResult {
  type: string;
  position: ex.Vector;
  spawned: boolean;
  reason?: string;
}

export class RoomGenerationExecutor {
  private static _instance: RoomGenerationExecutor;


  public static get instance(): RoomGenerationExecutor {
    if (!RoomGenerationExecutor._instance) {
      RoomGenerationExecutor._instance = new RoomGenerationExecutor();
    }
    return RoomGenerationExecutor._instance;
  }

  private constructor() {}

  /**
   * Populate a room based on its template
   */
  public populateRoom(request: RoomPopulationRequest): void {
    const { room, template, floorNumber, level } = request;
    
    Logger.debug(`[RoomGenerationExecutor] Populating room '${template.name}' on floor ${floorNumber}`);
    
    // 1. Spawn actors based on template
    this.populateActors(room, template, floorNumber, level);
    
    // 2. Place interactables based on template
    this.populateInteractables(room, template, level);
    
    // 3. Spawn loot items based on template
    this.populateLoot(room, template, level);
    
    Logger.info(`[RoomGenerationExecutor] Successfully populated ${template.type} room: ${template.name}`);
  }

  /**
   * Spawn actors in the room based on template configuration
   */
  private populateActors(room: Room, template: RoomTemplate, floorNumber: number, level: Level): void {
    const spawns = template.spawns;
    const roomArea = room.width * room.height;
    
    // Don't spawn actors in the entrance room (first room)
    if (room === level.rooms[0]) {
      Logger.debug(`[RoomGenerationExecutor] Skipping actor spawning in entrance room`);
      return;
    }
    
    // Generate spawn points within this room (floor positions)
    const roomSpawnPoints: ex.Vector[] = [];
    for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
      for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
        if (level.terrainData[x][y] === TerrainType.Floor) {
          roomSpawnPoints.push(ex.vec(x, y));
        }
      }
    }
    
    if (roomSpawnPoints.length === 0) {
      Logger.warn(`[RoomGenerationExecutor] No floor positions found in room ${template.name}`);
      return;
    }


    // Calculate spawn count using SpawnTableExecutor
    const spawnCount = SpawnTableExecutor.instance.calculateSpawnCount(roomArea, spawns.spawnDensity);
    
    // Handle guaranteed spawns first
    if (spawns.guaranteedSpawns) {
      for (const guaranteedSpawn of spawns.guaranteedSpawns) {
        for (let i = 0; i < guaranteedSpawn.count && roomSpawnPoints.length > 0; i++) {
          const spawnPointIndex = Math.floor(Math.random() * roomSpawnPoints.length);
          const spawnPoint = roomSpawnPoints.splice(spawnPointIndex, 1)[0];
          
          const spawnType = guaranteedSpawn.type === 'guardian' ? 'elite' : guaranteedSpawn.type as 'normal' | 'elite' | 'boss' | 'pack';
          const mob = Spawner.spawnMobAt(level, spawnPoint, floorNumber, spawnType);
          if (mob !== null) {
            Logger.debug(`[RoomGenerationExecutor] Spawned guaranteed ${guaranteedSpawn.type} at ${spawnPoint}`);
          }
        }
      }
    }
    
    // Spawn remaining mobs using normal spawn logic
    const remainingSpawns = Math.max(0, spawnCount - (spawns.guaranteedSpawns?.reduce((sum, spawn) => sum + spawn.count, 0) || 0));
    
    if (remainingSpawns > 0 && roomSpawnPoints.length > 0) {
      const spawnConfig: SpawnConfig = {
        floorNumber,
        spawnDensity: spawns.spawnDensity,
        roomType: this.mapTemplateTypeToSpawnerType(template.type),
        roomArea
      };
      
      // Use Spawner but limit to available spawn points in this room
      for (let i = 0; i < Math.min(remainingSpawns, roomSpawnPoints.length); i++) {
        const spawnPointIndex = Math.floor(Math.random() * roomSpawnPoints.length);
        const spawnPoint = roomSpawnPoints.splice(spawnPointIndex, 1)[0];
        
        const tableId = spawns.spawnTable || this.getDefaultSpawnTable(floorNumber, template.type);
        const mob = this.spawnMobFromTable(level, spawnPoint, tableId, floorNumber);
        
        if (mob) {
          Logger.debug(`[RoomGenerationExecutor] Spawned ${mob.name} at ${spawnPoint}`);
        }
      }
    }
  }

  /**
   * Place interactables in the room based on template
   */
  private populateInteractables(room: Room, template: RoomTemplate, level: Level): void {
    // Use InteractableSpawner utility for placement
    const results = InteractableSpawner.spawnInteractables(level, room, template.interactables);
    
    // Create actual interactable entities from spawn results
    for (const result of results) {
      if (result.success) {
        this.createInteractable(result.type, result.position, level);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    Logger.debug(`[RoomGenerationExecutor] Placed ${successCount}/${results.length} interactables in room`);
  }

  /**
   * Spawn loot items in the room based on template
   */
  private populateLoot(room: Room, template: RoomTemplate, level: Level): void {
    const lootConfig = template.loot;
    
    if (!lootConfig || lootConfig.itemProbability <= 0) {
      return;
    }
    
    // Use LootSpawner utility to determine what to spawn
    const floorNumber = 1; // TODO: Get actual floor number
    const lootResults = LootSpawner.spawnLoot(level, room, lootConfig, floorNumber);
    
    // Spawn the items via event bus
    for (const result of lootResults) {
      if (result.success) {
        this.spawnLootItem(result.itemId, result.position, level, result.quantity);
      }
    }
    
    Logger.debug(`[RoomGenerationExecutor] Spawned ${lootResults.length} loot items in room`);
  }

  /**
   * Spawn a specific interactable in a room
   */
  private spawnInteractable(room: Room, placement: InteractablePlacement, level: Level): InteractableSpawnResult[] {
    const results: InteractableSpawnResult[] = [];
    
    // Roll probability
    if (Math.random() > placement.probability) {
      results.push({
        type: placement.type,
        position: ex.vec(-1, -1),
        spawned: false,
        reason: 'Failed probability roll'
      });
      return results;
    }
    
    // Determine spawn count
    const minCount = placement.minCount || 1;
    const maxCount = placement.maxCount || 1;
    const spawnCount = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
    
    // Get available positions for this placement type
    const availablePositions = this.getInteractablePositions(room, placement.placement, level, placement.size);
    
    if (availablePositions.length === 0) {
      results.push({
        type: placement.type,
        position: ex.vec(-1, -1),
        spawned: false,
        reason: `No valid ${placement.placement} positions available`
      });
      return results;
    }
    
    // Spawn interactables
    for (let i = 0; i < Math.min(spawnCount, availablePositions.length); i++) {
      const positionIndex = Math.floor(Math.random() * availablePositions.length);
      const position = availablePositions.splice(positionIndex, 1)[0];
      
      const spawned = this.createInteractable(placement.type, position, level);
      
      results.push({
        type: placement.type,
        position,
        spawned,
        reason: spawned ? 'Success' : 'Failed to create interactable'
      });
    }
    
    return results;
  }

  /**
   * Get positions suitable for interactable placement
   */
  /**
   * Get positions suitable for interactable placement
   */
  private getInteractablePositions(room: Room, placement: string, level: Level, size: { width: number, height: number } = { width: 1, height: 1 }): ex.Vector[] {
    const positions: ex.Vector[] = [];
    const w = size.width;
    const h = size.height;
    
    switch (placement) {
      case 'wall':
        // Positions adjacent to walls but on floor
        for (let x = room.x + 1; x <= room.x + room.width - 1 - w; x++) {
          for (let y = room.y + 1; y <= room.y + room.height - 1 - h; y++) {
            // Check if adjacent to a wall
            const adjacentToWall = this.isAdjacentToWall(x, y, level, w, h);
            if (adjacentToWall && this.isAreaClear(x, y, w, h, level)) {
              positions.push(ex.vec(x, y));
            }
          }
        }
        break;
        
      case 'floor':
        // Any floor position
        for (let x = room.x + 1; x <= room.x + room.width - 1 - w; x++) {
          for (let y = room.y + 1; y <= room.y + room.height - 1 - h; y++) {
            if (this.isAreaClear(x, y, w, h, level)) {
              positions.push(ex.vec(x, y));
            }
          }
        }
        break;
        
      case 'corner':
        // Corner positions (adjusted for size)
        const corners = [
          ex.vec(room.x + 1, room.y + 1), // Top-Left
          ex.vec(room.x + room.width - 1 - w, room.y + 1), // Top-Right
          ex.vec(room.x + 1, room.y + room.height - 1 - h), // Bottom-Left
          ex.vec(room.x + room.width - 1 - w, room.y + room.height - 1 - h), // Bottom-Right
        ];
        
        corners.forEach(corner => {
          if (this.isAreaClear(corner.x, corner.y, w, h, level)) {
            positions.push(corner);
          }
        });
        break;
        
      case 'center':
        // Center of room
        const centerX = Math.floor(room.x + (room.width - w) / 2);
        const centerY = Math.floor(room.y + (room.height - h) / 2);
        if (this.isAreaClear(centerX, centerY, w, h, level)) {
          positions.push(ex.vec(centerX, centerY));
        }
        break;
        
      case 'edge':
        // Positions near room edges but not corners
        // Top Edge
        for (let x = room.x + 2; x <= room.x + room.width - 2 - w; x++) {
            if (this.isAreaClear(x, room.y + 1, w, h, level)) positions.push(ex.vec(x, room.y + 1));
        }
        // Bottom Edge
        for (let x = room.x + 2; x <= room.x + room.width - 2 - w; x++) {
            if (this.isAreaClear(x, room.y + room.height - 1 - h, w, h, level)) positions.push(ex.vec(x, room.y + room.height - 1 - h));
        }
        // Left Edge
        for (let y = room.y + 2; y <= room.y + room.height - 2 - h; y++) {
            if (this.isAreaClear(room.x + 1, y, w, h, level)) positions.push(ex.vec(room.x + 1, y));
        }
        // Right Edge
        for (let y = room.y + 2; y <= room.y + room.height - 2 - h; y++) {
            if (this.isAreaClear(room.x + room.width - 1 - w, y, w, h, level)) positions.push(ex.vec(room.x + room.width - 1 - w, y));
        }
        break;
    }
    
    return positions;
  }

  /**
   * Helper methods for position validation
   */
  private isFloorPosition(x: number, y: number, level: Level): boolean {
    if (x < 0 || x >= level.width || y < 0 || y >= level.height) {
      return false;
    }
    
    const terrain = level.terrainData[y]?.[x];
    return terrain && terrain !== TerrainType.Wall;
  }

  private isAdjacentToWall(x: number, y: number, level: Level, w: number = 1, h: number = 1): boolean {
    // Check all tiles around the perimeter of the object
    for (let ix = x - 1; ix <= x + w; ix++) {
        for (let iy = y - 1; iy <= y + h; iy++) {
            // Skip the object itself
            if (ix >= x && ix < x + w && iy >= y && iy < y + h) continue;
            
            // Check if this perimeter tile is a wall
             if (ix < 0 || ix >= level.width || iy < 0 || iy >= level.height) {
                return true; // Edge of level counts as wall
            }
            
            const terrain = level.terrainData[iy]?.[ix];
            if (terrain && terrain === TerrainType.Wall) return true;
        }
    }
    return false;
  }

  private isAreaClear(x: number, y: number, w: number, h: number, level: Level): boolean {
    for (let ix = x; ix < x + w; ix++) {
      for (let iy = y; iy < y + h; iy++) {
        if (!this.isFloorPosition(ix, iy, level)) return false;
        
        // Check for existing entities, but ignore background decor (z < 0)
        const entities = level.getEntitiesAt(ix, iy);
        const blockingEntity = entities.find(e => e.z >= 0);
        
        if (blockingEntity) return false;
        if (level.getInteractableAt(ix, iy)) return false;
      }
    }
    return true;
  }

  private getFloorPositions(room: Room, level: Level): ex.Vector[] {
    const positions: ex.Vector[] = [];
    
    for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
      for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
        if (this.isFloorPosition(x, y, level)) {
          positions.push(ex.vec(x, y));
        }
      }
    }
    
    return positions;
  }

  /**
   * Helper methods for spawning
   */
  private mapTemplateTypeToSpawnerType(templateType: string): 'normal' | 'boss' | 'treasure' | 'ambush' {
    switch (templateType) {
      case 'boss': return 'boss';
      case 'treasure': return 'treasure';
      case 'ambush': return 'ambush';
      default: return 'normal';
    }
  }

  private getDefaultSpawnTable(floorNumber: number, roomType: string): string {
    // This should use the same logic as Spawner.getSpawnTableId
    switch (roomType) {
      case 'boss':
        return 'boss_room';
      case 'treasure':
        return 'treasure_room_guards';
      case 'ambush':
        return 'ambush';
      default:
        // Use floor-based spawn table
        if (floorNumber <= 3) return 'early_floors';
        if (floorNumber <= 7) return 'mid_floors';
        return 'late_floors';
    }
  }

  private spawnMobFromTable(level: Level, position: ex.Vector, tableId: string, floorNumber: number): any {
    const spawnRequest = {
      tableId,
      floorNumber,
      spawnType: 'normal' as const,
      position
    };

    // Check for occupancy
    const existingActors = level.getEntitiesAt(position.x, position.y);
    if (existingActors.length > 0) {
        Logger.warn(`[RoomGenerationExecutor] Cannot spawn at ${position} - occupied`);
        return null;
    }

    const spawnResult = SpawnTableExecutor.instance.rollSpawn(spawnRequest);
    
    if (!spawnResult) {
      return null;
    }

    const mob = ActorFactory.instance.createActor(spawnResult.actorId, position);
    
    if (mob) {
      level.addMob(mob);
      
      // Apply scaling if needed
      if (spawnResult.floorScaling) {
        // This would apply scaling similar to Spawner.applyFloorScaling
        // For now, just log it
        Logger.debug(`[RoomGenerationExecutor] Would apply floor scaling to ${spawnResult.actorId}`);
      }
    }
    
    return mob;
  }

  private createInteractable(type: string, position: ex.Vector, level: Level): boolean {
    try {
      // Create interactable using the factory system
      EventBus.instance.emit(GameEventNames.InteractableCreate, new FactoryCreateEvent(
        type,
        { position, config: {}, level }
      ));
      
      Logger.debug(`[RoomGenerationExecutor] Created ${type} interactable at ${position}`);
      return true;
    } catch (error) {
      Logger.error(`[RoomGenerationExecutor] Failed to create ${type} interactable:`, error);
      return false;
    }
  }

  private spawnLootItem(itemId: string, position: ex.Vector, level: Level, count: number = 1): boolean {
    EventBus.instance.emit(GameEventNames.ItemSpawnRequest, {
      itemId: itemId,
      position: position,
      level: level,
      count: count
    });
    
    Logger.debug(`[RoomGenerationExecutor] Spawned ${count}x ${itemId} at ${position}`);
    return true;
  }

  /**
   * Validate that room templates are properly configured
   */
  public validateRoomTemplates(): boolean {
    const allTemplates = DataManager.instance.getAllData(RegistryKey.ROOM_TEMPLATE);
    let isValid = true;

    Object.entries(allTemplates).forEach(([id, template]) => {
      if (!template) return;

      const roomTemplate = template as RoomTemplate;
      
      // Basic validation
      if (!roomTemplate.name || !roomTemplate.type) {
        Logger.error(`[RoomGenerationExecutor] Invalid room template '${id}': missing name or type`);
        isValid = false;
      }

      if (roomTemplate.minSize.width <= 0 || roomTemplate.minSize.height <= 0) {
        Logger.error(`[RoomGenerationExecutor] Invalid room template '${id}': invalid minSize`);
        isValid = false;
      }

      if (roomTemplate.maxSize.width < roomTemplate.minSize.width || 
          roomTemplate.maxSize.height < roomTemplate.minSize.height) {
        Logger.error(`[RoomGenerationExecutor] Invalid room template '${id}': maxSize smaller than minSize`);
        isValid = false;
      }
    });

    if (isValid) {
      Logger.info('RoomGenerationExecutor: All room templates validated successfully');
    }

    return isValid;
  }
}