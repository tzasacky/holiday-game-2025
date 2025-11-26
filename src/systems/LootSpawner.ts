import * as ex from 'excalibur';
import { Level } from '../dungeon/Level';
import { Room } from '../dungeon/Room';
import { LootConfig } from '../data/roomTemplates';
import { LootTables, LootTableEntry } from '../data/loot';
import { Logger } from '../core/Logger';
import { TerrainType } from '../data/terrain';

export interface LootSpawnResult {
    itemId: string;
    position: ex.Vector;
    quantity: number;
    success: boolean;
}

/**
 * Utility for spawning loot items on the ground based on loot tables and configurations
 */
export class LootSpawner {
    /**
     * Spawn loot in a room according to loot configuration
     */
    public static spawnLoot(
        level: Level,
        room: Room,
        lootConfig: LootConfig,
        floorNumber: number
    ): LootSpawnResult[] {
        const results: LootSpawnResult[] = [];

        // Get available floor positions
        const floorPositions = this.getAvailableFloorPositions(level, room);

        if (floorPositions.length === 0) {
            Logger.warn('[LootSpawner] No available floor positions for loot');
            return results;
        }

        // Spawn guaranteed items
        if (lootConfig.guaranteedItems) {
            for (const guaranteedItem of lootConfig.guaranteedItems) {
                if (floorPositions.length === 0) break;

                const positionIndex = Math.floor(Math.random() * floorPositions.length);
                const position = floorPositions.splice(positionIndex, 1)[0];

                results.push({
                    itemId: guaranteedItem.itemId,
                    position: position,
                    quantity: guaranteedItem.count,
                    success: true
                });

                Logger.debug(`[LootSpawner] Guaranteed spawn: ${guaranteedItem.count}x ${guaranteedItem.itemId} at ${position}`);
            }
        }

        // Roll for random loot from table
        if (Math.random() < lootConfig.itemProbability && floorPositions.length > 0) {
            const lootTableId = lootConfig.tableId || 'floor_general';
            const lootItem = this.rollLootFromTable(lootTableId, floorNumber);

            if (lootItem) {
                const positionIndex = Math.floor(Math.random() * floorPositions.length);
                const position = floorPositions.splice(positionIndex, 1)[0];

                results.push({
                    itemId: lootItem.itemId,
                    position: position,
                    quantity: lootItem.quantity,
                    success: true
                });

                Logger.debug(`[LootSpawner] Random loot: ${lootItem.quantity}x ${lootItem.itemId} at ${position}`);
            }
        }

        return results;
    }

    /**
     * Roll for a loot item from a loot table
     */
    private static rollLootFromTable(
        tableId: string,
        floorNumber: number
    ): { itemId: string; quantity: number } | null {
        const lootTable = LootTables[tableId];

        if (!lootTable) {
            Logger.warn(`[LootSpawner] Loot table '${tableId}' not found`);
            return null;
        }

        // Filter entries by floor restrictions
        const validEntries = lootTable.entries.filter(entry => {
            if (entry.minFloor && floorNumber < entry.minFloor) return false;
            if (entry.maxFloor && floorNumber > entry.maxFloor) return false;
            return true;
        });

        if (validEntries.length === 0) {
            Logger.warn(`[LootSpawner] No valid loot entries for floor ${floorNumber} in table ${tableId}`);
            return null;
        }

        // Build weighted array based on entry weights
        const weightedEntries: LootTableEntry[] = [];
        for (const entry of validEntries) {
            const weight = Math.max(1, Math.floor(entry.weight));
            for (let i = 0; i < weight; i++) {
                weightedEntries.push(entry);
            }
        }

        // Select random entry
        const selectedEntry = weightedEntries[Math.floor(Math.random() * weightedEntries.length)];

        // Determine quantity
        const quantity = selectedEntry.quantity
            ? Math.floor(Math.random() * (selectedEntry.quantity.max - selectedEntry.quantity.min + 1)) + selectedEntry.quantity.min
            : 1;

        return {
            itemId: selectedEntry.itemId,
            quantity: quantity
        };
    }

    /**
     * Get available floor positions in a room (not occupied by actors or doors)
     */
    private static getAvailableFloorPositions(level: Level, room: Room): ex.Vector[] {
        const positions: ex.Vector[] = [];

        for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
            for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
                // Must be floor terrain
                if (level.getTile(x, y) !== TerrainType.Floor) continue;

                // Check no actors at position
                if (level.getActorAt(x, y)) continue;

                // Check not a door
                const isDoor = room.entrances.some(e => e.x === x && e.y === y);
                if (isDoor) continue;

                positions.push(ex.vec(x, y));
            }
        }

        return positions;
    }
}
