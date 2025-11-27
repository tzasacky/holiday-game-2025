import * as ex from 'excalibur';
import { Level } from '../Level';
import { Room } from '../Room';
import { Biome } from '../Biome';
import { Door } from '../interactables/Door';
import { TerrainType } from '../Terrain';

import { PresentChest } from '../interactables/PresentChest';
import { Stocking } from '../interactables/Stocking';
import { ChristmasTree } from '../interactables/ChristmasTree';
import { SecretDoor } from '../interactables/SecretDoor';
import { DestructibleWall } from '../interactables/DestructibleWall';
import { Bookshelf } from '../interactables/Bookshelf';
import { AlchemyPot } from '../interactables/AlchemyPot';
import { Anvil } from '../interactables/Anvil';
import { SleighStation } from '../interactables/SleighStation';
import { ItemID } from '../../constants';

export class InteractableGenerator {
    
    static generate(level: Level, rooms: Room[], biome: Biome) {
        this.placeDoors(level, rooms);
        this.placeLoot(level, rooms);
        this.placeDecor(level, rooms);
        this.placeUtility(level, rooms);
    }

    private static placeLoot(level: Level, rooms: Room[]) {
        const rng = new ex.Random();
        rooms.forEach(room => {
            // Chests (10% chance per room)
            if (rng.bool(0.1)) {
                const pos = this.getRandomFloorPosition(level, room, rng);
                if (pos) {
                    const isLocked = rng.bool(0.3);
                    const isMimic = rng.bool(0.1);
                    const keyId = isLocked ? ItemID.SilverKey : null; // Simplified key logic
                    level.addEntity(new PresentChest(pos, isLocked, keyId, isMimic));
                }
            }

            // Stockings (Wall mounted, 20% chance)
            if (rng.bool(0.2)) {
                // Needs to be next to a wall
                const pos = this.getRandomWallAdjacentPosition(level, room, rng);
                if (pos) {
                    level.addEntity(new Stocking(pos));
                }
            }
        });
    }

    private static placeDecor(level: Level, rooms: Room[]) {
        const rng = new ex.Random();
        rooms.forEach(room => {
            // Christmas Trees (5% chance)
            if (rng.bool(0.05)) {
                const pos = this.getRandomFloorPosition(level, room, rng);
                if (pos) {
                    level.addEntity(new ChristmasTree(pos));
                }
            }

            // Bookshelves (10% chance)
            if (rng.bool(0.1)) {
                const pos = this.getRandomWallAdjacentPosition(level, room, rng);
                if (pos) {
                    level.addEntity(new Bookshelf(pos));
                }
            }
        });
    }

    private static placeUtility(level: Level, rooms: Room[]) {
        const rng = new ex.Random();
        // Place 1 Alchemy Pot and 1 Anvil per level guaranteed (if enough rooms)
        if (rooms.length > 2) {
            const r1 = rooms[rng.integer(0, rooms.length - 1)];
            const p1 = this.getRandomFloorPosition(level, r1, rng);
            if (p1) level.addEntity(new AlchemyPot(p1));

            const r2 = rooms[rng.integer(0, rooms.length - 1)];
            const p2 = this.getRandomFloorPosition(level, r2, rng);
            if (p2) level.addEntity(new Anvil(p2));
        }

        // Sleigh Station (Fast Travel) - 1 per level
        const r3 = rooms[rng.integer(0, rooms.length - 1)];
        const p3 = this.getRandomFloorPosition(level, r3, rng);
        if (p3) level.addEntity(new SleighStation(p3));
    }

    private static getRandomFloorPosition(level: Level, room: Room, rng: ex.Random): ex.Vector | null {
        // Try 10 times to find a spot
        for (let i = 0; i < 10; i++) {
            const x = rng.integer(room.x + 1, room.x + room.width - 2);
            const y = rng.integer(room.y + 1, room.y + room.height - 2);
            if (level.terrainData[x][y] === TerrainType.Floor) {
                // Check if occupied by another entity
                if (level.getEntitiesAt(x, y).length === 0) {
                    return ex.vec(x, y);
                }
            }
        }
        return null;
    }

    private static getRandomWallAdjacentPosition(level: Level, room: Room, rng: ex.Random): ex.Vector | null {
        // Try 10 times
        for (let i = 0; i < 10; i++) {
            const x = rng.integer(room.x + 1, room.x + room.width - 2);
            const y = rng.integer(room.y + 1, room.y + room.height - 2);
            
            if (level.terrainData[x][y] === TerrainType.Floor && level.getEntitiesAt(x, y).length === 0) {
                // Check neighbors for wall
                const hasWall = 
                    level.terrainData[x][y-1] === TerrainType.Wall ||
                    level.terrainData[x][y+1] === TerrainType.Wall ||
                    level.terrainData[x-1][y] === TerrainType.Wall ||
                    level.terrainData[x+1][y] === TerrainType.Wall;
                
                if (hasWall) return ex.vec(x, y);
            }
        }
        return null;
    }

    private static placeDoors(level: Level, rooms: Room[]) {
        rooms.forEach(room => {
            // Check boundaries for corridors
            for (let x = room.x; x < room.x + room.width; x++) {
                this.tryPlaceDoor(level, x, room.y - 1); // Top
                this.tryPlaceDoor(level, x, room.y + room.height); // Bottom
            }
            for (let y = room.y; y < room.y + room.height; y++) {
                this.tryPlaceDoor(level, room.x - 1, y); // Left
                this.tryPlaceDoor(level, room.x + room.width, y); // Right
            }
        });
    }

    private static tryPlaceDoor(level: Level, x: number, y: number) {
        if (x < 0 || x >= level.width || y < 0 || y >= level.height) return;
        
        // Must be a Floor tile (corridor/entrance)
        if (level.terrainData[x][y] !== TerrainType.Floor) return;

        // Check neighbors to determine orientation and validity
        const above = level.terrainData[x][y-1] === TerrainType.Wall;
        const below = level.terrainData[x][y+1] === TerrainType.Wall;
        const left = level.terrainData[x-1][y] === TerrainType.Wall;
        const right = level.terrainData[x+1][y] === TerrainType.Wall;

        // Valid door spots:
        // 1. Horizontal Corridor: Walls above and below, Floor left and right
        // 2. Vertical Corridor: Walls left and right, Floor above and below
        
        const isHorizontal = above && below && !left && !right;
        const isVertical = left && right && !above && !below;

        if (isHorizontal || isVertical) {
            // Check for adjacent doors (Rule: No 2 doors adjacent)
            if (this.hasAdjacentDoor(level, x, y)) return;

            // Place Door Entity
            const door = new Door(ex.vec(x, y));
            level.addEntity(door);
            
            // Note: We do NOT change TerrainType to DoorClosed anymore.
            // It remains Floor so pathfinding works (Door entity handles blocking).
        }
    }

    private static hasAdjacentDoor(level: Level, x: number, y: number): boolean {
        // Check 4 cardinal directions for existing Door entities
        // Since entities are in a list, this might be slow if we scan all entities.
        // Optimization: Check the grid for entities if Level supports it, or just scan nearby.
        // For now, let's look at the entities list filtered by position.
        
        const neighbors = [
            {x: x+1, y: y}, {x: x-1, y: y},
            {x: x, y: y+1}, {x: x, y: y-1}
        ];

        for (const n of neighbors) {
            const entities = level.getEntitiesAt(n.x, n.y);
            if (entities.some((e: any) => e instanceof Door)) {
                return true;
            }
        }
        return false;
    }
}
