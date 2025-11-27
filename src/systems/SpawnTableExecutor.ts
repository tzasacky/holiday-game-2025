import { DataManager } from '../core/DataManager';
import { Logger } from '../core/Logger';
import { ActorID } from '../constants/ActorIDs';
import { SpawnTableDefinition, SpawnEntry } from '../data/spawnTables';
import * as ex from 'excalibur';

export interface SpawnResult {
  actorId: ActorID;
  packSize: number;
  floorScaling?: {
    strengthMultiplier: number;
    hpMultiplier: number;
  };
}

export interface SpawnRequest {
  tableId: string;
  floorNumber: number;
  spawnType?: 'normal' | 'elite' | 'boss' | 'pack' | 'guardian';
  tags?: string[];
  position?: ex.Vector;
}

export class SpawnTableExecutor {
  private static _instance: SpawnTableExecutor;


  public static get instance(): SpawnTableExecutor {
    if (!SpawnTableExecutor._instance) {
      SpawnTableExecutor._instance = new SpawnTableExecutor();
    }
    return SpawnTableExecutor._instance;
  }

  private constructor() {}

  /**
   * Roll for a spawn from a table with optional filtering
   */
  public rollSpawn(request: SpawnRequest): SpawnResult | null {
    const table = DataManager.instance.query<SpawnTableDefinition>('spawn_table', request.tableId);
    
    if (!table) {
      Logger.warn(`SpawnTableExecutor: Table '${request.tableId}' not found`);
      return null;
    }

    // Filter entries based on floor and tags
    const validEntries = this.filterEntries(table.entries, request);
    
    if (validEntries.length === 0) {
      Logger.warn(`SpawnTableExecutor: No valid entries found for floor ${request.floorNumber} in table '${request.tableId}'`);
      return null;
    }

    // Calculate total weight and roll
    const totalWeight = validEntries.reduce((sum, entry) => sum + entry.weight, 0);
    const roll = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const entry of validEntries) {
      currentWeight += entry.weight;
      if (roll <= currentWeight) {
        const result = this.createSpawnResult(entry, table, request.floorNumber);
        
        Logger.debug(`SpawnTableExecutor: Rolled ${entry.actorId} from table '${request.tableId}' (${entry.weight}/${totalWeight} weight)`);
        return result;
      }
    }

    // Fallback to first entry if something goes wrong
    Logger.warn(`SpawnTableExecutor: Roll failed, using fallback spawn`);
    return this.createSpawnResult(validEntries[0], table, request.floorNumber);
  }

  /**
   * Roll multiple spawns from a table (for pack spawns)
   */
  public rollMultipleSpawns(request: SpawnRequest, count: number): SpawnResult[] {
    const results: SpawnResult[] = [];
    
    for (let i = 0; i < count; i++) {
      const result = this.rollSpawn(request);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Get spawn count for a room based on room size and type
   */
  public calculateSpawnCount(roomArea: number, spawnDensity: 'low' | 'medium' | 'high' = 'medium'): number {
    const baseDensity = {
      low: 0.02,    // 2 spawns per 100 tiles
      medium: 0.04, // 4 spawns per 100 tiles  
      high: 0.06    // 6 spawns per 100 tiles
    };

    const baseCount = Math.floor(roomArea * baseDensity[spawnDensity]);
    
    // Ensure at least 1 spawn in medium+ rooms, cap at reasonable max
    const minCount = roomArea > 25 ? 1 : 0;
    const maxCount = Math.min(8, Math.floor(roomArea / 10));
    
    return Math.max(minCount, Math.min(maxCount, baseCount));
  }

  /**
   * Filter spawn entries based on floor, tags, and spawn type
   */
  private filterEntries(entries: SpawnEntry[], request: SpawnRequest): SpawnEntry[] {
    return entries.filter(entry => {
      // Floor restrictions
      if (entry.minFloor && request.floorNumber < entry.minFloor) return false;
      if (entry.maxFloor && request.floorNumber > entry.maxFloor) return false;

      // Tag filtering
      if (request.tags && request.tags.length > 0) {
        const hasMatchingTag = request.tags.some(tag => entry.tags?.includes(tag));
        if (!hasMatchingTag) return false;
      }

      // Spawn type filtering
      if (request.spawnType) {
        switch (request.spawnType) {
          case 'boss':
            if (!entry.tags?.includes('boss')) return false;
            break;
          case 'elite':
            if (!entry.tags?.includes('elite') && !entry.tags?.includes('rare')) return false;
            break;
          case 'pack':
            if (!entry.packSize) return false;
            break;
          case 'guardian':
            if (!entry.tags?.includes('guardian')) return false;
            break;
          case 'normal':
            // Normal spawns can use any entry
            break;
        }
      }

      return true;
    });
  }

  /**
   * Create spawn result with scaling applied
   */
  private createSpawnResult(entry: SpawnEntry, table: SpawnTableDefinition, floorNumber: number): SpawnResult {
    const result: SpawnResult = {
      actorId: entry.actorId,
      packSize: 1,
    };

    // Calculate pack size if applicable
    if (entry.packSize) {
      const { min, max } = entry.packSize;
      result.packSize = min + Math.floor(Math.random() * (max - min + 1));
    }

    // Apply floor scaling if present
    if (table.floorScaling) {
      const floorMultiplier = Math.max(1, floorNumber - 1); // Start scaling from floor 2
      result.floorScaling = {
        strengthMultiplier: 1 + (table.floorScaling.strengthBonus * floorMultiplier),
        hpMultiplier: 1 + (table.floorScaling.hpBonus * floorMultiplier),
      };
    }

    return result;
  }

  /**
   * Validate that all spawn tables are properly configured
   */
  public validateSpawnTables(): boolean {
    const allTables = DataManager.instance.getAllData('spawn_table');
    let isValid = true;

    Object.entries(allTables).forEach(([id, table]) => {
      if (!table) return;

      const spawnTable = table as SpawnTableDefinition;
      
      // Check that entries have valid actor IDs
      spawnTable.entries.forEach(entry => {
        if (!Object.values(ActorID).includes(entry.actorId)) {
          Logger.error(`SpawnTableExecutor: Invalid actorId '${entry.actorId}' in table '${id}'`);
          isValid = false;
        }

        if (entry.weight <= 0) {
          Logger.error(`SpawnTableExecutor: Invalid weight '${entry.weight}' in table '${id}'`);
          isValid = false;
        }
      });

      // Ensure table has at least one entry
      if (spawnTable.entries.length === 0) {
        Logger.error(`SpawnTableExecutor: Table '${id}' has no entries`);
        isValid = false;
      }
    });

    if (isValid) {
      Logger.info('SpawnTableExecutor: All spawn tables validated successfully');
    }

    return isValid;
  }

  /**
   * Get debug information about a spawn table
   */
  public getTableDebugInfo(tableId: string, floorNumber: number): string {
    const table = DataManager.instance.query<SpawnTableDefinition>('spawn_table', tableId);
    
    if (!table) {
      return `Table '${tableId}' not found`;
    }

    const validEntries = this.filterEntries(table.entries, { tableId, floorNumber });
    const totalWeight = validEntries.reduce((sum, entry) => sum + entry.weight, 0);

    let debug = `Table: ${table.name} (Floor ${floorNumber})\n`;
    debug += `Valid entries: ${validEntries.length}/${table.entries.length}\n`;
    debug += `Total weight: ${totalWeight}\n\n`;

    validEntries.forEach(entry => {
      const chance = ((entry.weight / totalWeight) * 100).toFixed(1);
      debug += `${entry.actorId}: ${chance}% (weight: ${entry.weight})\n`;
    });

    return debug;
  }
}