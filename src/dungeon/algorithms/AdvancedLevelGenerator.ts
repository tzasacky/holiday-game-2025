import * as ex from 'excalibur';
import { Level } from '../Level';
import { Room } from '../Room';
import { TerrainType } from '../../data/terrain';
import { BiomeDefinition } from '../../data/biomes';
import { GenerationContext, TileReservation } from './GenerationContext';
import { BSPGenerator, BSPNode } from './BSPGenerator';
import { RoomGenerationExecutor } from '../../systems/RoomGenerationExecutor';
import { getRoomTemplatesForFloor } from '../../data/roomTemplates';
import { LevelGenerator } from './LevelGenerator';
import { Logger } from '../../core/Logger';

export class AdvancedLevelGenerator implements LevelGenerator {
    private rooms: Room[] = [];
    private minRoomSize: number = 6;

    generate(width: number, height: number, biome: BiomeDefinition, scene: ex.Scene): Level {
        const level = new Level(width, height, biome, scene);
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
        this.connectRooms(level, root, context, biome);

        // 6. Apply Biome Features (data-driven)
        this.applyBiomeFeatures(level, context, biome);

        // 9. Spawn Points
        this.rooms.forEach(room => {
            if (room) level.spawnPoints.push(room.center);
        });

        // 10. Room population using RoomGenerationExecutor
        this.populateRoomsWithTemplates(level, context);

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

    private connectRooms(level: Level, node: BSPNode, context: GenerationContext, biome: BiomeDefinition) {
        if (node.left && node.right) {
            // Connect left and right children
            const r1 = this.getRandomRoom(node.left, context.random);
            const r2 = this.getRandomRoom(node.right, context.random);

            if (r1 && r2) {
                this.createCorridor(level, r1, r2, context, biome);
            }

            this.connectRooms(level, node.left, context, biome);
            this.connectRooms(level, node.right, context, biome);
        }
    }

    private getRandomRoom(node: BSPNode, rng: ex.Random): Room | null {
        if (node.room) return node.room;
        const rooms: Room[] = [];
        this.collectRooms(node, rooms);
        if (rooms.length === 0) return null;
        return rooms[rng.integer(0, rooms.length - 1)];
    }

    private createCorridor(level: Level, r1: Room, r2: Room, context: GenerationContext, biome: BiomeDefinition) {
        const c1 = r1.center;
        const c2 = r2.center;
        
        const xFirst = context.random.bool();

        if (xFirst) {
            this.carveH(level, c1.x, c2.x, c1.y, context, biome);
            this.carveV(level, c1.y, c2.y, c2.x, context, biome);
        } else {
            this.carveV(level, c1.y, c2.y, c1.x, context, biome);
            this.carveH(level, c1.x, c2.x, c2.y, context, biome);
        }
    }

    private carveH(level: Level, x1: number, x2: number, y: number, context: GenerationContext, biome: BiomeDefinition) {
        const start = Math.floor(Math.min(x1, x2));
        const end = Math.floor(Math.max(x1, x2));
        const yInt = Math.floor(y);
        for (let x = start; x <= end; x++) {
            this.carvePoint(level, x, yInt, context, biome);
        }
    }

    private carveV(level: Level, y1: number, y2: number, x: number, context: GenerationContext, biome: BiomeDefinition) {
        const start = Math.floor(Math.min(y1, y2));
        const end = Math.floor(Math.max(y1, y2));
        const xInt = Math.floor(x);
        for (let y = start; y <= end; y++) {
            this.carvePoint(level, xInt, y, context, biome);
        }
    }

    private carvePoint(level: Level, x: number, y: number, context: GenerationContext, biome: BiomeDefinition) {
        if (x < 0 || x >= level.width || y < 0 || y >= level.height) return;
        
        // Only carve if not Locked
        if (context.isAvailable(x, y, TileReservation.Structure)) {
            level.terrainData[x][y] = TerrainType.Floor;
            context.reserve(x, y, TileReservation.Structure);
        }
    }

    private applyBiomeFeatures(level: Level, context: GenerationContext, biome: BiomeDefinition): void {
        // Apply biome-specific terrain features
        if (biome.features) {
            biome.features.forEach(feature => {
                const shouldApply = Math.random() < feature.probability;
                if (shouldApply) {
                    this.applyBiomeFeature(level, context, feature, biome);
                }
            });
        }
    }

    private applyBiomeFeature(level: Level, context: GenerationContext, feature: any, biome: BiomeDefinition): void {
        switch (feature.type) {
            case 'ice_patches':
                this.placeIcePatches(level, context, feature);
                break;
            case 'chasm':
                this.placeChasms(level, context, feature);
                break;
            case 'river':
                this.placeRiver(level, context, feature);
                break;
            default:
                Logger.warn(`[AdvancedLevelGenerator] Unknown biome feature: ${feature.type}`);
        }
    }

    private placeIcePatches(level: Level, context: GenerationContext, feature: any): void {
        const density = feature.density || 0.1;
        const patches = Math.floor(this.rooms.length * density);
        
        for (let i = 0; i < patches; i++) {
            const room = this.rooms[Math.floor(Math.random() * this.rooms.length)];
            const x = room.x + Math.floor(Math.random() * room.width);
            const y = room.y + Math.floor(Math.random() * room.height);
            
            if (level.terrainData[x] && level.terrainData[x][y] === TerrainType.Floor) {
                level.terrainData[x][y] = TerrainType.Ice;
            }
        }
    }

    private placeChasms(level: Level, context: GenerationContext, feature: any): void {
        const density = feature.density || 0.05;
        const chasms = Math.floor(this.rooms.length * density);
        
        for (let i = 0; i < chasms; i++) {
            const room = this.rooms[Math.floor(Math.random() * this.rooms.length)];
            const x = room.x + Math.floor(Math.random() * room.width);
            const y = room.y + Math.floor(Math.random() * room.height);
            
            if (level.terrainData[x] && level.terrainData[x][y] === TerrainType.Floor) {
                level.terrainData[x][y] = TerrainType.Chasm;
            }
        }
    }

    private placeRiver(level: Level, context: GenerationContext, feature: any): void {
        // Simple river placement - could be enhanced
        const startRoom = this.rooms[0];
        const endRoom = this.rooms[this.rooms.length - 1];
        
        if (startRoom && endRoom) {
            this.carveRiver(level, startRoom.center, endRoom.center, feature.properties?.frozen);
        }
    }

    private carveRiver(level: Level, start: ex.Vector, end: ex.Vector, frozen: boolean = false): void {
        const terrainType = frozen ? TerrainType.Ice : TerrainType.Water;
        
        // Simple line algorithm
        const dx = Math.abs(end.x - start.x);
        const dy = Math.abs(end.y - start.y);
        const sx = start.x < end.x ? 1 : -1;
        const sy = start.y < end.y ? 1 : -1;
        let err = dx - dy;
        
        let x = Math.floor(start.x);
        let y = Math.floor(start.y);
        
        while (true) {
            if (x >= 0 && x < level.width && y >= 0 && y < level.height) {
                level.terrainData[x][y] = terrainType;
            }
            
            if (x === Math.floor(end.x) && y === Math.floor(end.y)) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x += sx; }
            if (e2 < dx) { err += dx; y += sy; }
        }
    }

    private spawnItems(level: Level, context: GenerationContext) {
        // Legacy method - items are now spawned via:
        // 1. InteractableGenerator (chests, containers)  
        // 2. RoomGenerationExecutor (room-specific loot)
        // 3. LootSystem (data-driven loot tables)
        
        Logger.info('[AdvancedLevelGenerator] Item spawning moved to data-driven systems');
        
        // TODO: Remove this method entirely once new system is fully integrated
    }

    private populateRoomsWithTemplates(level: Level, context: GenerationContext): void {
        const floorNumber = 1; // TODO: Get actual floor number from context
        const availableTemplates = getRoomTemplatesForFloor(floorNumber);
        
        if (availableTemplates.length === 0) {
            return;
        }

        this.rooms.forEach(room => {
            // Select appropriate room template
            const template = this.selectRoomTemplate(room, availableTemplates, context);
            
            if (template) {
                const request = {
                    room: room,
                    template: template,
                    floorNumber: floorNumber,
                    level: level
                };
                
                RoomGenerationExecutor.instance.populateRoom(request);
            }
        });
    }

    private selectRoomTemplate(room: Room, templates: any[], context: GenerationContext): any {
        // For now, select basic room template
        // TODO: Implement proper room type selection logic
        return templates.find(t => t.id === 'basic_room') || templates[0];
    }
}
