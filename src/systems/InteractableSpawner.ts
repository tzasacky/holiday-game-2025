import * as ex from 'excalibur';
import { Level } from '../dungeon/Level';
import { Room } from '../dungeon/Room';
import { InteractablePlacement } from '../data/roomTemplates';
import { Logger } from '../core/Logger';
import { TerrainType } from '../data/terrain';

export interface InteractableSpawnResult {
    type: string;
    position: ex.Vector;
    success: boolean;
}

/**
 * Utility for spawning interactable objects in rooms based on placement rules
 */
export class InteractableSpawner {
    /**
     * Spawn interactables in a room according to placement rules
     */
    public static spawnInteractables(
        level: Level,
        room: Room,
        placements: InteractablePlacement[]
    ): InteractableSpawnResult[] {
        const results: InteractableSpawnResult[] = [];

        for (const placement of placements) {
            // Roll probability
            if (Math.random() > placement.probability) {
                continue;
            }

            // Determine count
            const minCount = placement.minCount || 1;
            const maxCount = placement.maxCount || 1;
            const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;

            // Find valid positions
            const positions = this.findPlacementPositions(level, room, placement.placement, count);

            // Spawn at each position
            for (const position of positions) {
                const result: InteractableSpawnResult = {
                    type: placement.type,
                    position: position,
                    success: true
                };
                results.push(result);

                Logger.debug(`[InteractableSpawner] Would spawn ${placement.type} at ${position} (${placement.placement})`);
            }
        }

        return results;
    }

    /**
     * Find valid positions for interactable placement
     */
    private static findPlacementPositions(
        level: Level,
        room: Room,
        placementType: 'wall' | 'floor' | 'corner' | 'center' | 'edge',
        count: number
    ): ex.Vector[] {
        let candidates: ex.Vector[] = [];

        switch (placementType) {
            case 'wall':
                candidates = this.getWallPositions(level, room);
                break;
            case 'corner':
                candidates = this.getCornerPositions(level, room);
                break;
            case 'center':
                candidates = this.getCenterPositions(level, room);
                break;
            case 'edge':
                candidates = this.getEdgePositions(level, room);
                break;
            case 'floor':
                candidates = this.getFloorPositions(level, room);
                break;
        }

        // Filter out occupied positions
        candidates = candidates.filter(pos => this.isPositionAvailable(level, pos));

        // Shuffle and take requested count
        const shuffled = candidates.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    /**
     * Get positions adjacent to walls (not corners)
     */
    private static getWallPositions(level: Level, room: Room): ex.Vector[] {
        const positions: ex.Vector[] = [];

        for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
            for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
                // Skip if not floor
                if (level.getTile(x, y) !== TerrainType.Floor) continue;

                // Check if adjacent to wall
                const adjacentToWall = 
                    level.getTile(x - 1, y) === TerrainType.Wall ||
                    level.getTile(x + 1, y) === TerrainType.Wall ||
                    level.getTile(x, y - 1) === TerrainType.Wall ||
                    level.getTile(x, y + 1) === TerrainType.Wall;

                // Not a corner
                const isCorner = this.isCornerTile(room, x, y);

                if (adjacentToWall && !isCorner) {
                    positions.push(ex.vec(x, y));
                }
            }
        }

        return positions;
    }

    /**
     * Get corner positions of room
     */
    private static getCornerPositions(level: Level, room: Room): ex.Vector[] {
        const positions: ex.Vector[] = [
            ex.vec(room.x + 1, room.y + 1),                          // Top-left
            ex.vec(room.x + room.width - 2, room.y + 1),             // Top-right
            ex.vec(room.x + 1, room.y + room.height - 2),            // Bottom-left
            ex.vec(room.x + room.width - 2, room.y + room.height - 2) // Bottom-right
        ];

        // Filter to only floor tiles
        return positions.filter(pos => level.getTile(pos.x, pos.y) === TerrainType.Floor);
    }

    /**
     * Get center area positions (3x3 center)
     */
    private static getCenterPositions(level: Level, room: Room): ex.Vector[] {
        const positions: ex.Vector[] = [];
        const centerX = Math.floor(room.x + room.width / 2);
        const centerY = Math.floor(room.y + room.height / 2);

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const x = centerX + dx;
                const y = centerY + dy;
                if (level.getTile(x, y) === TerrainType.Floor) {
                    positions.push(ex.vec(x, y));
                }
            }
        }

        return positions;
    }

    /**
     * Get edge/perimeter positions (not corners)
     */
    private static getEdgePositions(level: Level, room: Room): ex.Vector[] {
        const positions: ex.Vector[] = [];

        // Top and bottom edges
        for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
            const topY = room.y + 1;
            const bottomY = room.y + room.height - 2;
            
            if (level.getTile(x, topY) === TerrainType.Floor && !this.isCornerTile(room, x, topY)) {
                positions.push(ex.vec(x, topY));
            }
            if (level.getTile(x, bottomY) === TerrainType.Floor && !this.isCornerTile(room, x, bottomY)) {
                positions.push(ex.vec(x, bottomY));
            }
        }

        // Left and right edges
        for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
            const leftX = room.x + 1;
            const rightX = room.x + room.width - 2;
            
            if (level.getTile(leftX, y) === TerrainType.Floor && !this.isCornerTile(room, leftX, y)) {
                positions.push(ex.vec(leftX, y));
            }
            if (level.getTile(rightX, y) === TerrainType.Floor && !this.isCornerTile(room, rightX, y)) {
                positions.push(ex.vec(rightX, y));
            }
        }

        return positions;
    }

    /**
     * Get all floor positions in room (not adjacent to walls)
     */
    private static getFloorPositions(level: Level, room: Room): ex.Vector[] {
        const positions: ex.Vector[] = [];

        for (let x = room.x + 2; x < room.x + room.width - 2; x++) {
            for (let y = room.y + 2; y < room.y + room.height - 2; y++) {
                if (level.getTile(x, y) === TerrainType.Floor) {
                    // Check not adjacent to walls
                    const adjacentToWall = 
                        level.getTile(x - 1, y) === TerrainType.Wall ||
                        level.getTile(x + 1, y) === TerrainType.Wall ||
                        level.getTile(x, y - 1) === TerrainType.Wall ||
                        level.getTile(x, y + 1) === TerrainType.Wall;

                    if (!adjacentToWall) {
                        positions.push(ex.vec(x, y));
                    }
                }
            }
        }

        return positions;
    }

    /**
     * Check if position is a corner tile
     */
    private static isCornerTile(room: Room, x: number, y: number): boolean {
        return (
            (x === room.x + 1 && y === room.y + 1) ||
            (x === room.x + room.width - 2 && y === room.y + 1) ||
            (x === room.x + 1 && y === room.y + room.height - 2) ||
            (x === room.x + room.width - 2 && y === room.y + room.height - 2)
        );
    }

    /**
     * Check if a position is available for spawning
     */
    private static isPositionAvailable(level: Level, position: ex.Vector): boolean {
        // Check terrain is floor
        if (level.getTile(position.x, position.y) !== TerrainType.Floor) {
            return false;
        }

        // Check no actors at position
        if (level.getActorAt(position.x, position.y)) {
            return false;
        }

        // Check not a door position
        for (const room of level.rooms) {
            if (room.entrances.some(e => e.equals(position))) {
                return false;
            }
        }

        return true;
    }
}
