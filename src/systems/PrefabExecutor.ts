import { DataManager } from '../core/DataManager';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { ActorFactory } from '../factories/ActorFactory';
import { ItemFactory } from '../items/ItemFactory';
import { Level } from '../dungeon/Level';
import { Room } from '../dungeon/Room';
import { PrefabDefinition, PrefabActorPlacement, PrefabInteractablePlacement, PrefabItemPlacement } from '../data/prefabDefinitions';
import { TerrainType } from '../data/terrain';
import { WorldItemEntity } from '../items/WorldItemEntity';
import * as ex from 'excalibur';

export interface PrefabPlacementRequest {
  prefabId: string;
  position: ex.Vector;
  level: Level;
  room?: Room;
  floorNumber: number;
}

export interface PrefabPlacementResult {
  prefabId: string;
  success: boolean;
  actorsPlaced: number;
  interactablesPlaced: number;
  itemsPlaced: number;
  terrainModified: boolean;
  reason?: string;
}

export class PrefabExecutor {
  private static _instance: PrefabExecutor;
  private logger = Logger.instance;
  private placedPrefabs: Map<string, number> = new Map(); // Track prefabs per level

  public static get instance(): PrefabExecutor {
    if (!PrefabExecutor._instance) {
      PrefabExecutor._instance = new PrefabExecutor();
    }
    return PrefabExecutor._instance;
  }

  private constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    EventBus.instance.on('prefab:place_request' as any, (event: PrefabPlacementRequest) => {
      this.handlePrefabPlacement(event);
    });

    // Reset placement tracking on new level
    EventBus.instance.on('level:generated' as any, () => {
      this.placedPrefabs.clear();
    });
  }

  /**
   * Place a prefab at the specified location
   */
  public placePrefab(request: PrefabPlacementRequest): PrefabPlacementResult {
    const prefabDef = DataManager.instance.query<PrefabDefinition>('prefab', request.prefabId);
    
    if (!prefabDef) {
      return {
        prefabId: request.prefabId,
        success: false,
        actorsPlaced: 0,
        interactablesPlaced: 0,
        itemsPlaced: 0,
        terrainModified: false,
        reason: `Prefab definition '${request.prefabId}' not found`
      };
    }

    // Validate constraints
    if (!this.validatePlacement(prefabDef, request)) {
      return {
        prefabId: request.prefabId,
        success: false,
        actorsPlaced: 0,
        interactablesPlaced: 0,
        itemsPlaced: 0,
        terrainModified: false,
        reason: 'Placement constraints not met'
      };
    }

    const result: PrefabPlacementResult = {
      prefabId: request.prefabId,
      success: true,
      actorsPlaced: 0,
      interactablesPlaced: 0,
      itemsPlaced: 0,
      terrainModified: false
    };

    try {
      // 1. Modify terrain if needed
      if (this.shouldModifyTerrain(prefabDef, request)) {
        this.applyTerrainLayout(prefabDef, request);
        result.terrainModified = true;
      }

      // 2. Place actors
      result.actorsPlaced = this.placeActors(prefabDef, request);

      // 3. Place interactables  
      result.interactablesPlaced = this.placeInteractables(prefabDef, request);

      // 4. Place items
      result.itemsPlaced = this.placeItems(prefabDef, request);

      // 5. Track placement count
      this.trackPrefabPlacement(request.prefabId);

      this.logger.info(`[PrefabExecutor] Successfully placed prefab '${prefabDef.name}' at ${request.position}`);

    } catch (error) {
      this.logger.error(`[PrefabExecutor] Failed to place prefab '${request.prefabId}':`, error);
      result.success = false;
      result.reason = String(error);
    }

    return result;
  }

  private handlePrefabPlacement(request: PrefabPlacementRequest): void {
    const result = this.placePrefab(request);
    
    EventBus.instance.emit('prefab:placed' as any, {
      request,
      result
    });
  }

  private validatePlacement(prefab: PrefabDefinition, request: PrefabPlacementRequest): boolean {
    // Check floor constraints
    if (prefab.minFloor && request.floorNumber < prefab.minFloor) {
      this.logger.debug(`[PrefabExecutor] Prefab '${prefab.id}' requires min floor ${prefab.minFloor}, current floor ${request.floorNumber}`);
      return false;
    }

    if (prefab.maxFloor && request.floorNumber > prefab.maxFloor) {
      this.logger.debug(`[PrefabExecutor] Prefab '${prefab.id}' requires max floor ${prefab.maxFloor}, current floor ${request.floorNumber}`);
      return false;
    }

    // Check level placement limits
    const currentCount = this.placedPrefabs.get(prefab.id) || 0;
    if (prefab.maxPerLevel && currentCount >= prefab.maxPerLevel) {
      this.logger.debug(`[PrefabExecutor] Prefab '${prefab.id}' already placed ${currentCount}/${prefab.maxPerLevel} times`);
      return false;
    }

    // Check if prefab fits in level bounds
    const { position, level } = request;
    if (position.x + prefab.width > level.width || position.y + prefab.height > level.height) {
      this.logger.debug(`[PrefabExecutor] Prefab '${prefab.id}' doesn't fit at position ${position}`);
      return false;
    }

    return true;
  }

  private shouldModifyTerrain(prefab: PrefabDefinition, request: PrefabPlacementRequest): boolean {
    // Only modify terrain if we're placing in an empty area or specifically requested
    // For now, assume prefabs that have special terrain should modify
    return prefab.layout && prefab.legend && Object.keys(prefab.legend).length > 2; // More than just wall/floor
  }

  private applyTerrainLayout(prefab: PrefabDefinition, request: PrefabPlacementRequest): void {
    const { position, level } = request;
    
    for (let y = 0; y < prefab.height; y++) {
      for (let x = 0; x < prefab.width; x++) {
        const layoutChar = prefab.layout[y]?.[x];
        if (!layoutChar) continue;

        const terrainType = prefab.legend[layoutChar];
        if (terrainType === undefined) continue;

        const worldX = position.x + x;
        const worldY = position.y + y;

        if (worldX >= 0 && worldX < level.width && worldY >= 0 && worldY < level.height) {
          level.terrainData[worldY][worldX] = terrainType;
        }
      }
    }
    
    this.logger.debug(`[PrefabExecutor] Applied terrain layout for prefab '${prefab.id}'`);
  }

  private placeActors(prefab: PrefabDefinition, request: PrefabPlacementRequest): number {
    if (!prefab.actors || prefab.actors.length === 0) {
      return 0;
    }

    let placed = 0;
    const { position, level } = request;

    for (const actorPlacement of prefab.actors) {
      const worldPos = position.add(actorPlacement.position);
      
      try {
        const actor = ActorFactory.instance.createActor(actorPlacement.actorId, worldPos);
        if (actor) {
          level.addMob(actor);
          
          // Apply special properties if specified
          if (actorPlacement.properties) {
            this.applyActorProperties(actor, actorPlacement.properties);
          }
          
          placed++;
          this.logger.debug(`[PrefabExecutor] Placed actor ${actorPlacement.actorId} at ${worldPos}`);
        }
      } catch (error) {
        this.logger.warn(`[PrefabExecutor] Failed to place actor ${actorPlacement.actorId}:`, error);
      }
    }

    return placed;
  }

  private placeInteractables(prefab: PrefabDefinition, request: PrefabPlacementRequest): number {
    if (!prefab.interactables || prefab.interactables.length === 0) {
      return 0;
    }

    let placed = 0;
    const { position } = request;

    for (const interactablePlacement of prefab.interactables) {
      const worldPos = position.add(interactablePlacement.position);
      
      try {
        // Emit event for InteractableFactory to handle
        EventBus.instance.emit('interactable:create' as any, {
          interactableId: interactablePlacement.interactableId,
          position: worldPos,
          properties: interactablePlacement.properties || {}
        });
        
        placed++;
        this.logger.debug(`[PrefabExecutor] Requested interactable ${interactablePlacement.interactableId} at ${worldPos}`);
      } catch (error) {
        this.logger.warn(`[PrefabExecutor] Failed to place interactable ${interactablePlacement.interactableId}:`, error);
      }
    }

    return placed;
  }

  private placeItems(prefab: PrefabDefinition, request: PrefabPlacementRequest): number {
    if (!prefab.items || prefab.items.length === 0) {
      return 0;
    }

    let placed = 0;
    const { position, level } = request;

    for (const itemPlacement of prefab.items) {
      // Roll probability if specified
      if (itemPlacement.probability && Math.random() > itemPlacement.probability) {
        continue;
      }

      const worldPos = position.add(itemPlacement.position);
      const count = itemPlacement.count || 1;
      
      try {
        const itemEntity = ItemFactory.instance.createAt(itemPlacement.itemId, worldPos, count);
        if (itemEntity) {
          const worldItem = new WorldItemEntity(worldPos, itemEntity);
          level.addItem(worldItem);
          
          placed++;
          this.logger.debug(`[PrefabExecutor] Placed ${count}x ${itemPlacement.itemId} at ${worldPos}`);
        }
      } catch (error) {
        this.logger.warn(`[PrefabExecutor] Failed to place item ${itemPlacement.itemId}:`, error);
      }
    }

    return placed;
  }

  private applyActorProperties(actor: any, properties: Record<string, any>): void {
    // Apply special properties like boss status, scaling, etc.
    for (const [key, value] of Object.entries(properties)) {
      switch (key) {
        case 'isBoss':
          if (value && actor.components) {
            // Mark as boss - this would be handled by a BossComponent in a full system
            this.logger.debug(`[PrefabExecutor] Marked actor as boss`);
          }
          break;
        case 'isGuard':
          if (value) {
            this.logger.debug(`[PrefabExecutor] Marked actor as guard`);
          }
          break;
        case 'floorScaling':
          if (value) {
            this.logger.debug(`[PrefabExecutor] Applied floor scaling to actor`);
          }
          break;
        default:
          this.logger.debug(`[PrefabExecutor] Applied property ${key}=${value} to actor`);
      }
    }
  }

  private trackPrefabPlacement(prefabId: string): void {
    const current = this.placedPrefabs.get(prefabId) || 0;
    this.placedPrefabs.set(prefabId, current + 1);
  }

  /**
   * Get available prefabs for a floor/biome
   */
  public getAvailablePrefabs(floorNumber: number, biome?: string, category?: string): PrefabDefinition[] {
    const allPrefabs = DataManager.instance.getAllData('prefab');
    const available: PrefabDefinition[] = [];

    Object.values(allPrefabs).forEach(prefab => {
      if (!prefab) return;
      
      const prefabDef = prefab as PrefabDefinition;
      
      // Check floor constraints
      const minFloor = prefabDef.minFloor || 1;
      const maxFloor = prefabDef.maxFloor || Infinity;
      if (floorNumber < minFloor || floorNumber > maxFloor) return;
      
      // Check biome restrictions
      if (biome && prefabDef.biomeRestrictions && !prefabDef.biomeRestrictions.includes(biome)) {
        return;
      }
      
      // Check category filter
      if (category && prefabDef.category !== category) return;
      
      // Check placement limits
      const currentCount = this.placedPrefabs.get(prefabDef.id) || 0;
      if (prefabDef.maxPerLevel && currentCount >= prefabDef.maxPerLevel) return;
      
      available.push(prefabDef);
    });

    return available;
  }

  /**
   * Reset placement tracking (for new level generation)
   */
  public resetPlacementTracking(): void {
    this.placedPrefabs.clear();
    this.logger.debug('[PrefabExecutor] Reset placement tracking');
  }
}