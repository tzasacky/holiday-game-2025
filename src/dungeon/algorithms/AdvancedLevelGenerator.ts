import * as ex from 'excalibur';
import { Level } from '../Level';
import { Room } from '../Room';
import { TerrainType } from '../../data/terrain';
import { BiomeDefinition } from '../../data/biomes';
import { GenerationContext, TileReservation } from './GenerationContext';
import { BSPGenerator, BSPNode } from './BSPGenerator';
import { RoomGenerationExecutor } from '../../systems/RoomGenerationExecutor';
import { getRoomTemplatesForFloor, getRoomDistributionForFloor, RoomTemplate } from '../../data/roomTemplates';
import { LevelGenerator } from './LevelGenerator';
import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';
import { GameEventNames, FactoryCreateEvent } from '../../core/GameEvents';

export class AdvancedLevelGenerator implements LevelGenerator {
    private rooms: Room[] = [];
    private minRoomSize: number = 6;

    generate(width: number, height: number, biome: BiomeDefinition, scene: ex.Scene, floorNumber: number = 1): Level {
        const levelId = `floor_${floorNumber}_${biome.name}`;
        const level = new Level(width, height, biome, scene, levelId);
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

        // Set entrance to first room center (stairs up / starting point)
        if (level.rooms.length > 0) {
            level.entrancePoint = level.rooms[0].center;
            Logger.info(`[AdvancedLevelGenerator] Set entrance at ${level.entrancePoint}`);
        }

        // 10. Room population using RoomGenerationExecutor
        this.populateRoomsWithTemplates(level, context);
        
        // 11. Place exit staircase
        this.placeExitStaircase(level, context);

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
        
        // Place doors at room entrances
        this.placeDoors(level, r1, r2, context);
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
    
    /**
     * Place doors in corridors leading to room entrances
     * Places doors in the corridor, not at the room perimeter
     */
    private placeDoors(level: Level, room1: Room, room2: Room, context: GenerationContext): void {
        // Find corridor positions leading to each room
        const doorPos1 = this.findCorridorDoorPosition(level, room1);
        const doorPos2 = this.findCorridorDoorPosition(level, room2);
        
        // Place door in corridor leading to room1
        if (doorPos1) {
            this.placeDoorAt(level, room1, doorPos1, context);
            room1.entrances.push(doorPos1);
        }
        
        // Place door in corridor leading to room2 (if different position)
        if (doorPos2 && (!doorPos1 || !doorPos1.equals(doorPos2))) {
            this.placeDoorAt(level, room2, doorPos2, context);  
            room2.entrances.push(doorPos2);
        }
    }
    
    /**
     * Find a corridor position where a door should be placed leading to this room
     */
    private findCorridorDoorPosition(level: Level, room: Room): ex.Vector | null {
        // Check room perimeter for corridor connections
        for (let x = room.x; x < room.x + room.width; x++) {
            for (let y = room.y; y < room.y + room.height; y++) {
                // Skip interior tiles
                if (x > room.x && x < room.x + room.width - 1 &&
                    y > room.y && y < room.y + room.height - 1) {
                    continue;
                }
                
                // Check if this perimeter tile has a corridor connection
                if (this.hasCorridorConnection(level, room, x, y)) {
                    // Found room entrance, now find the corridor position for the door
                    return this.findCorridorPositionNearEntrance(level, room, ex.vec(x, y));
                }
            }
        }
        
        return null;
    }
    
    /**
     * Find a corridor position near the room entrance where a door should be placed
     */
    private findCorridorPositionNearEntrance(level: Level, room: Room, entrancePos: ex.Vector): ex.Vector | null {
        const directions = [
            ex.vec(-1, 0), ex.vec(1, 0),  // Left, Right
            ex.vec(0, -1), ex.vec(0, 1)   // Up, Down
        ];
        
        // Look for corridor positions adjacent to the entrance
        for (const dir of directions) {
            const checkX = entrancePos.x + dir.x;
            const checkY = entrancePos.y + dir.y;
            
            // Skip if checking inside the room
            if (room.contains(checkX, checkY)) continue;
            
            // Check if this position is in a corridor (floor tile outside the room)
            if (level.getTile(checkX, checkY) === TerrainType.Floor) {
                // Check if this creates a chokepoint (only one way around)
                if (this.isChokepoint(level, room, checkX, checkY)) {
                    return ex.vec(checkX, checkY);
                }
            }
        }
        
        // Fallback: use the first corridor tile we find
        for (const dir of directions) {
            const checkX = entrancePos.x + dir.x;
            const checkY = entrancePos.y + dir.y;
            
            if (!room.contains(checkX, checkY) && level.getTile(checkX, checkY) === TerrainType.Floor) {
                return ex.vec(checkX, checkY);
            }
        }
        
        return null;
    }

    /**
     * Check if a room perimeter tile connects to a corridor
     */
    private hasCorridorConnection(level: Level, room: Room, x: number, y: number): boolean {
        const terrain = level.getTile(x, y);
        if (terrain !== TerrainType.Floor) return false;
        
        // Check adjacent tiles (outside the room) for floor tiles
        const directions = [
            ex.vec(-1, 0), ex.vec(1, 0),  // Left, Right
            ex.vec(0, -1), ex.vec(0, 1)   // Up, Down
        ];
        
        for (const dir of directions) {
            const checkX = x + dir.x;
            const checkY = y + dir.y;
            
            // Skip if checking inside the room
            if (room.contains(checkX, checkY)) continue;
            
            // If there's a floor tile outside the room, this is a corridor connection
            if (level.getTile(checkX, checkY) === TerrainType.Floor) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Check if a position creates a chokepoint (blocking this position would force a detour)
     */
    private isChokepoint(level: Level, room: Room, x: number, y: number): boolean {
        // Simple heuristic: if there are walls/room boundaries on opposite sides, it's likely a chokepoint
        const hasNorthSouthWalls = (level.getTile(x, y - 1) === TerrainType.Wall || room.contains(x, y - 1)) &&
                                  (level.getTile(x, y + 1) === TerrainType.Wall || room.contains(x, y + 1));
        const hasEastWestWalls = (level.getTile(x - 1, y) === TerrainType.Wall || room.contains(x - 1, y)) &&
                                (level.getTile(x + 1, y) === TerrainType.Wall || room.contains(x + 1, y));
        
        return hasNorthSouthWalls || hasEastWestWalls;
    }
    
    /**
     * Place a door at a specific position
     */
    private placeDoorAt(level: Level, room: Room, position: ex.Vector, context: GenerationContext): void {
        // Keep terrain as floor for movement
        level.terrainData[position.x][position.y] = TerrainType.Floor;
        
        // Determine door type
        const roll = context.random.next();
        let doorId: string;
        
        if (roll < 0.02) {
            // 2% secret door
            doorId = 'secret_door';
        } else if (roll < 0.10 && room.isSpecial) {
            // 8% locked door (only on special rooms)
            doorId = 'locked_door';
        } else {
            // 90% regular door
            doorId = 'door';
        }
        
        // Create door as interactable entity
        this.createDoorEntity(level, position, doorId);
        room.entrances.push(position);
        
        Logger.debug(`[AdvancedLevelGenerator] Placed ${doorId} entity at ${position} for room type ${room.roomType}`);
    }

    /**
     * Create a door as an interactable entity
     */
    private createDoorEntity(level: Level, position: ex.Vector, doorId: string): void {
        EventBus.instance.emit(GameEventNames.InteractableCreate, new FactoryCreateEvent(
            doorId,
            { position, config: { state: 'closed' }, level }
        ));
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
        const width = 50;
        const height = 50;
        const bspDepth = 4; // Increased from 3 - generates ~8-12 rooms
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

        // Assign room types using smart selection
        this.assignRoomTypes(this.rooms, availableTemplates, floorNumber, context);

        // Populate each room with its template
        this.rooms.forEach(room => {
            if (room.template) {
                const request = {
                    room: room,
                    template: room.template,
                    floorNumber: floorNumber,
                    level: level
                };
                
                RoomGenerationExecutor.instance.populateRoom(request);
            }
        });
    }

    /**
     * Assign room types to rooms using weighted selection and constraints
     */
    private assignRoomTypes(
        rooms: Room[], 
        templates: RoomTemplate[], 
        floorNumber: number, 
        context: GenerationContext
    ): void {
        const distribution = getRoomDistributionForFloor(floorNumber);
        const maxSpecialRoomPercent = 0.3; // 30% max special rooms
        const maxSpecialRooms = Math.floor(rooms.length * maxSpecialRoomPercent);
        let specialRoomCount = 0;

        // First pass: Assign special rooms (treasure, boss, puzzle, safe, etc.)
        const specialTemplates = templates.filter(t => t.type !== 'normal');
        const shuffledRooms = [...rooms].sort(() => context.random.next() - 0.5);

        for (const room of shuffledRooms) {
            if (specialRoomCount >= maxSpecialRooms) break;

            // Roll for special room based on distribution
            const roll = context.random.next();
            let cumulative = 0;

            for (const [templateId, weight] of Object.entries(distribution)) {
                cumulative += weight;
                
                if (roll < cumulative) {
                    const template = templates.find(t => t.id === templateId);
                    
                    if (template && template.type !== 'normal') {
                        // Check if room size is suitable
                        if (this.isRoomSuitableForTemplate(room, template)) {
                            room.template = template;
                            room.roomType = template.type as any;
                            room.tags = template.tags;
                            room.isSpecial = true;
                            specialRoomCount++;
                            break;
                        }
                    }
                    break;
                }
            }
        }

        // Second pass: Fill remaining rooms with normal/combat rooms
        const normalTemplates = templates.filter(t => t.type === 'normal');
        
        for (const room of rooms) {
            if (!room.template) {
                // Use weighted selection for normal rooms
                const template = this.selectWeightedTemplate(normalTemplates, distribution, context);
                
                if (template) {
                    room.template = template;
                    room.roomType = template.type as any;
                    room.tags = template.tags;
                }
            }
        }

        Logger.info(`[AdvancedLevelGenerator] Assigned ${specialRoomCount} special rooms out of ${rooms.length} total`);
    }

    /**
     * Check if a room is suitable for a template (size constraints)
     */
    private isRoomSuitableForTemplate(room: Room, template: RoomTemplate): boolean {
        return room.width >= template.minSize.width && 
               room.height >= template.minSize.height &&
               room.width <= template.maxSize.width &&
               room.height <= template.maxSize.height;
    }

    /**
     * Select a template using weighted distribution
     */
    private selectWeightedTemplate(
        templates: RoomTemplate[], 
        distribution: Record<string, number>,
        context: GenerationContext
    ): RoomTemplate | null {
        if (templates.length === 0) return null;

        // Build weighted array
        const weighted: RoomTemplate[] = [];
        
        for (const template of templates) {
            const weight = distribution[template.id] || 0.1;
            const count = Math.max(1, Math.floor(weight * 100));
            for (let i = 0; i < count; i++) {
                weighted.push(template);
            }
        }

        if (weighted.length === 0) return templates[0];

        const index = context.random.integer(0, weighted.length - 1);
        return weighted[index];
    }
    
    /**
     * Place exit staircase in the furthest room from entrance
     */
    private placeExitStaircase(level: Level, context: GenerationContext): void {
        if (level.rooms.length === 0) {
            Logger.warn('[AdvancedLevelGenerator] No rooms for exit placement');
            return;
        }
        
        const entranceRoom = level.rooms[0];
        
        // Find the room furthest from entrance
        let furthestRoom = level.rooms[0];
        let maxDistance = 0;
        
        for (const room of level.rooms) {
            const distance = room.distanceTo(entranceRoom);
            if (distance > maxDistance) {
                maxDistance = distance;
                furthestRoom = room;
            }
        }
        
        // Place staircase at center of furthest room
        const exitPos = furthestRoom.center;
        
        // Keep terrain as floor for movement
        level.terrainData[exitPos.x][exitPos.y] = TerrainType.Floor;
        level.exitPoint = exitPos;
        
        // Create staircase as interactable entity
        this.createStaircaseEntity(level, exitPos, 'stairs_down');
        
        Logger.info(`[AdvancedLevelGenerator] Placed exit stairs entity at ${exitPos} in furthest room`);
    }

    /**
     * Create a staircase as an interactable entity
     */
    private createStaircaseEntity(level: Level, position: ex.Vector, stairId: string): void {
        EventBus.instance.emit(GameEventNames.InteractableCreate, new FactoryCreateEvent(
            stairId,
            { position, config: {}, level }
        ));
    }
}
