import * as ex from 'excalibur';
import { LevelGenerator } from '../LevelGenerator';
import { Level } from '../Level';
import { FloorTheme } from '../FloorTheme';
import { Biome } from '../Biome';
import { Room } from '../Room';
import { TerrainType } from '../Terrain';
import { FeatureGenerator } from './FeatureGenerator';
import { GenerationContext, TileReservation } from './GenerationContext';
import { BSPGenerator, BSPNode } from './BSPGenerator';
// Gold and items now handled via ItemFactory and data definitions
import { SnowPile } from '../interactables/SnowPile';
import { ItemEntity } from '../../items/ItemEntity';
import { InteractableGenerator } from './InteractableGenerator';

export class AdvancedLevelGenerator implements LevelGenerator {
    private rooms: Room[] = [];
    private minRoomSize: number = 6;

    generate(width: number, height: number, biome: Biome, scene: ex.Scene): Level {
        const level = new Level(width, height, biome.theme, scene);
        const context = new GenerationContext(level);
        this.rooms = [];

        // 1. BSP Generation (Layout)
        const bsp = new BSPGenerator();
        const root = bsp.generate(width, height, 4); // Depth 4

        // 2. Create Rooms
        this.collectRooms(root, this.rooms);
        level.rooms = this.rooms;

        // 3. Fill Walls (Data only)
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                level.terrainData[x][y] = TerrainType.Wall;
            }
        }

        // 4. Carve Rooms (Reserve Structure)
        this.rooms.forEach(room => {
            for (let x = room.x; x < room.x + room.width; x++) {
                for (let y = room.y; y < room.y + room.height; y++) {
                    level.terrainData[x][y] = TerrainType.Floor;
                    context.reserve(x, y, TileReservation.Structure);
                }
            }
        });

        // 5. Connect Rooms (Corridors)
        this.connectRooms(level, root, context, biome.theme);

        // 6. Apply Room Decorators (Special Rooms first to Lock them)
        if (biome.roomDecorators) {
            this.rooms.forEach(room => {
                const isSpecial = context.random.bool(0.1); 
                biome.roomDecorators!.forEach(decorator => {
                    decorator.decorate(context, room, isSpecial);
                });
            });
        }

        // 7. Apply Terrain Features (Rivers, Chasms) - Respects Locks
        if (biome.terrainFeatures) {
            biome.terrainFeatures.forEach(feature => {
                feature.apply(context);
            });
        }

        // 8. Place Interactables (Doors, etc.)
        // InteractableGenerator.generate(level, this.rooms, biome); // DISABLED FOR DEBUGGING

        // 9. Spawn Points
        this.rooms.forEach(room => {
            if (room) level.spawnPoints.push(room.center);
        });

        // 10. Spawn Items
        this.spawnItems(level, context);

        // Final pass: Update Graphics
        level.updateTileGraphics();

        return level;
    }

    private collectRooms(node: BSPNode, rooms: Room[]) {
        if (node.room) {
            rooms.push(node.room);
        }
        if (node.left) this.collectRooms(node.left, rooms);
        if (node.right) this.collectRooms(node.right, rooms);
    }

    private connectRooms(level: Level, node: BSPNode, context: GenerationContext, theme: FloorTheme) {
        if (node.left && node.right) {
            // Connect left and right children
            const r1 = this.getRandomRoom(node.left, context.random);
            const r2 = this.getRandomRoom(node.right, context.random);

            if (r1 && r2) {
                this.createCorridor(level, r1, r2, context, theme);
            }

            this.connectRooms(level, node.left, context, theme);
            this.connectRooms(level, node.right, context, theme);
        }
    }

    private getRandomRoom(node: BSPNode, rng: ex.Random): Room | null {
        if (node.room) return node.room;
        const rooms: Room[] = [];
        this.collectRooms(node, rooms);
        if (rooms.length === 0) return null;
        return rooms[rng.integer(0, rooms.length - 1)];
    }

    private createCorridor(level: Level, r1: Room, r2: Room, context: GenerationContext, theme: FloorTheme) {
        const c1 = r1.center;
        const c2 = r2.center;
        
        const xFirst = context.random.bool();

        if (xFirst) {
            this.carveH(level, c1.x, c2.x, c1.y, context, theme);
            this.carveV(level, c1.y, c2.y, c2.x, context, theme);
        } else {
            this.carveV(level, c1.y, c2.y, c1.x, context, theme);
            this.carveH(level, c1.x, c2.x, c2.y, context, theme);
        }
    }

    private carveH(level: Level, x1: number, x2: number, y: number, context: GenerationContext, theme: FloorTheme) {
        const start = Math.floor(Math.min(x1, x2));
        const end = Math.floor(Math.max(x1, x2));
        const yInt = Math.floor(y);
        for (let x = start; x <= end; x++) {
            this.carvePoint(level, x, yInt, context, theme);
        }
    }

    private carveV(level: Level, y1: number, y2: number, x: number, context: GenerationContext, theme: FloorTheme) {
        const start = Math.floor(Math.min(y1, y2));
        const end = Math.floor(Math.max(y1, y2));
        const xInt = Math.floor(x);
        for (let y = start; y <= end; y++) {
            this.carvePoint(level, xInt, y, context, theme);
        }
    }

    private carvePoint(level: Level, x: number, y: number, context: GenerationContext, theme: FloorTheme) {
        if (x < 0 || x >= level.width || y < 0 || y >= level.height) return;
        
        // Only carve if not Locked
        if (context.isAvailable(x, y, TileReservation.Structure)) {
            level.terrainData[x][y] = TerrainType.Floor;
            context.reserve(x, y, TileReservation.Structure);
        }
    }



    private spawnItems(level: Level, context: GenerationContext) {
        // Legacy method - items are now spawned via:
        // 1. InteractableGenerator (chests, containers)  
        // 2. RoomGenerationExecutor (room-specific loot)
        // 3. LootSystem (data-driven loot tables)
        
        console.log('[AdvancedLevelGenerator] Item spawning moved to data-driven systems');
        
        // TODO: Remove this method entirely once new system is fully integrated
            
            // 20% chance for a Snow Pile (Interactable) - DISABLED FOR DEBUGGING
            // if (context.random.bool(0.2)) {
            //     const x = context.random.integer(room.x + 1, room.x + room.width - 2);
            //     const y = context.random.integer(room.y + 1, room.y + room.height - 2);
            //     if (level.terrainData[x][y] === TerrainType.Floor) {
            //         const pile = new SnowPile(ex.vec(x, y));
            //         level.addEntity(pile); 
            //     }
            // }
        });
    }
}
