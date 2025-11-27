import { Level } from './Level';
import { GameActor } from '../components/GameActor';
import { ActorSpawnSystem } from '../components/ActorSpawnSystem';
import { SpawnTableExecutor } from '../systems/SpawnTableExecutor';
import { getSpawnTableForFloor } from '../data/spawnTables';
import { ActorFactory } from '../factories/ActorFactory';
import { Logger } from '../core/Logger';
import * as ex from 'excalibur';
import { TerrainType } from '../constants';

export interface SpawnConfig {
    floorNumber: number;
    spawnDensity: 'low' | 'medium' | 'high';
    roomType?: 'normal' | 'boss' | 'treasure' | 'ambush';
    roomArea?: number;
}

export class Spawner {
    // Logger used via static methods

    /**
     * Data-driven mob spawning for a level
     */
    static spawnMobs(level: Level, config: SpawnConfig) {
        const { floorNumber, spawnDensity, roomType = 'normal' } = config;
        
        // Skip the first spawn point (Hero's spot)
        const availableSpawns = level.spawnPoints.slice(1);
        
        if (availableSpawns.length === 0) {
            Logger.warn('[Spawner] No spawn points available for mob spawning');
            return;
        }

        // Calculate spawn count based on room area and density
        const roomArea = config.roomArea || (level.width * level.height) * 0.6; // Estimate if not provided
        const targetSpawnCount = SpawnTableExecutor.instance.calculateSpawnCount(roomArea, spawnDensity);
        
        Logger.debug(`[Spawner] Spawning ${targetSpawnCount} mobs on floor ${floorNumber} (density: ${spawnDensity})`);

        // Get appropriate spawn table for this floor and room type
        const tableId = this.getSpawnTableId(floorNumber, roomType);
        
        // Spawn mobs at random spawn points
        const spawnedMobs = this.spawnMobsFromTable(level, availableSpawns, tableId, targetSpawnCount, floorNumber);
        
        Logger.info(`[Spawner] Spawned ${spawnedMobs.length}/${targetSpawnCount} mobs on floor ${floorNumber}`);
    }

    /**
     * Spawn specific mob at a position using spawn tables
     */
    static spawnMobAt(level: Level, pos: ex.Vector, floorNumber: number, spawnType?: 'normal' | 'elite' | 'boss' | 'pack'): GameActor | null {
        const tableId = this.getSpawnTableId(floorNumber, 'normal');
        
        const spawnRequest = {
            tableId,
            floorNumber,
            spawnType,
            position: pos
        };

        const spawnResult = SpawnTableExecutor.instance.rollSpawn(spawnRequest);
        
        if (!spawnResult) {
            Logger.warn(`[Spawner] Failed to roll spawn at ${pos} on floor ${floorNumber}`);
            return null;
        }

        // Create the actor using ActorFactory
        const mob = ActorFactory.instance.createActor(spawnResult.actorId, pos);
        
        if (!mob) {
            Logger.error(`[Spawner] Failed to create actor '${spawnResult.actorId}' at ${pos}`);
            return null;
        }

        // Apply floor scaling if present
        if (spawnResult.floorScaling) {
            this.applyFloorScaling(mob, spawnResult.floorScaling);
        }

        // Handle pack spawns
        if (spawnResult.packSize > 1) {
            this.spawnPackMembers(level, pos, spawnResult, floorNumber);
        }

        level.addMob(mob);
        
        Logger.debug(`[Spawner] Spawned ${spawnResult.actorId} at ${pos} (floor ${floorNumber}, scaling: ${spawnResult.floorScaling ? 'yes' : 'no'})`);
        
        return mob;
    }

    /**
     * Get appropriate spawn table ID based on floor and room type
     */
    private static getSpawnTableId(floorNumber: number, roomType: string): string {
        switch (roomType) {
            case 'boss':
                return 'boss_room';
            case 'treasure':
                return 'treasure_room_guards';
            case 'ambush':
                return 'ambush';
            default:
                return getSpawnTableForFloor(floorNumber);
        }
    }

    /**
     * Spawn multiple mobs from a table at various spawn points
     */
    private static spawnMobsFromTable(
        level: Level, 
        spawnPoints: ex.Vector[], 
        tableId: string, 
        targetCount: number,
        floorNumber: number
    ): GameActor[] {
        const spawnedMobs: GameActor[] = [];
        const shuffledSpawns = [...spawnPoints].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < Math.min(targetCount, shuffledSpawns.length); i++) {
            const spawn = shuffledSpawns[i];
            const mob = this.spawnMobAt(level, spawn, floorNumber);
            
            if (mob) {
                spawnedMobs.push(mob);
            }
        }
        
        return spawnedMobs;
    }

    /**
     * Apply floor scaling modifiers to a spawned mob
     */
    private static applyFloorScaling(mob: GameActor, scaling: { strengthMultiplier: number; hpMultiplier: number }) {
        const statsComponent = mob.getGameComponent('stats') as any;
        
        if (statsComponent) {
            // Apply scaling via events to maintain data-driven approach
            const strengthBonus = Math.floor(statsComponent.getStat('strength') * (scaling.strengthMultiplier - 1));
            const hpBonus = Math.floor(statsComponent.getStat('maxHp') * (scaling.hpMultiplier - 1));
            
            if (strengthBonus > 0) {
                statsComponent.modifyStat('strength', strengthBonus);
            }
            
            if (hpBonus > 0) {
                statsComponent.modifyStat('maxHp', hpBonus);
                statsComponent.modifyStat('hp', hpBonus);
            }
            
            Logger.debug(`[Spawner] Applied floor scaling: +${strengthBonus} STR, +${hpBonus} HP`);
        }
    }

    /**
     * Spawn additional pack members near the original spawn
     */
    private static spawnPackMembers(level: Level, originPos: ex.Vector, spawnResult: any, floorNumber: number) {
        const packSize = spawnResult.packSize - 1; // -1 because we already spawned the first one
        
        for (let i = 0; i < packSize; i++) {
            // Find nearby position for pack member
            const offsetX = (Math.random() - 0.5) * 6; // Random offset within 3 tiles
            const offsetY = (Math.random() - 0.5) * 6;
            const packPos = originPos.add(ex.vec(Math.round(offsetX), Math.round(offsetY)));
            
            // Ensure position is valid and not occupied
            if (this.isValidSpawnPosition(level, packPos)) {
                const packMob = ActorFactory.instance.createActor(spawnResult.actorId, packPos);
                
                if (packMob) {
                    if (spawnResult.floorScaling) {
                        this.applyFloorScaling(packMob, spawnResult.floorScaling);
                    }
                    
                    level.addMob(packMob);
                    Logger.debug(`[Spawner] Spawned pack member ${spawnResult.actorId} at ${packPos}`);
                }
            }
        }
    }

    /**
     * Check if a position is valid for spawning
     */
    private static isValidSpawnPosition(level: Level, pos: ex.Vector): boolean {
        // Basic bounds check
        if (pos.x < 0 || pos.x >= level.width || pos.y < 0 || pos.y >= level.height) {
            return false;
        }
        
        // Check if position is occupied by another actor
        const existingActors = level.getEntitiesAt(pos.x, pos.y);
        if (existingActors.length > 0) {
            return false;
        }
        
        // Check terrain (avoid walls)
        const terrainType = level.terrainData[pos.y]?.[pos.x];
        if (terrainType && terrainType === TerrainType.Wall) {
            return false;
        }
        
        return true;
    }
}
