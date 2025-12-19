import * as ex from 'excalibur';
import { Level } from '../Level';
import { Room } from '../Room';
import { TerrainType } from '../../data/terrain';
import { BiomeDefinition, MaterialType } from '../../data/biomes';
import { GenerationContext, TileReservation } from './GenerationContext';
import { BSPGenerator, BSPNode } from './BSPGenerator';
import { RoomGenerationExecutor } from '../../systems/RoomGenerationExecutor';
import { getRoomTemplatesForFloor, getRoomDistributionForFloor, RoomTemplate, RoomGenerationRules } from '../../data/roomTemplates';
import { LevelGenerator } from './LevelGenerator';
import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';
import { GameEventNames, FactoryCreateEvent } from '../../core/GameEvents';
import { LootTableID } from '../../constants/LootTableIDs';
import { FeatureMorphology, FeatureConfig } from '../features/FeatureTypes';
import { LinearFeatureGenerator } from '../features/LinearFeatureGenerator';
import { PatchFeatureGenerator } from '../features/PatchFeatureGenerator';
import { RoomTypeID } from '../../constants/RoomTypeID';
import { InteractableID } from '../../constants/InteractableIDs';
import { ActorID } from '../../constants/ActorIDs';
import { DecorSystem } from '../DecorSystem';

export class AdvancedLevelGenerator implements LevelGenerator {
    private rooms: Room[] = [];
    private lockedRooms: Room[] = []; // Track rooms with locked doors
    private minRoomSize: number = 6;

    generate(width: number, height: number, biome: BiomeDefinition, floorNumber: number = 1): Level {
        const levelId = `floor_${floorNumber}_${biome.name}`;
        const level = new Level(width, height, biome, levelId);
        const context = new GenerationContext(level);
        this.rooms = [];
        this.lockedRooms = [];

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
            // Determine room material based on room type or random selection
            const material = this.getRoomMaterial(room, biome, context);
            
            // Carve room and paint walls
            // We iterate from x-1 to width+1 to cover the walls
            for (let x = room.x - 1; x < room.x + room.width + 1; x++) {
                for (let y = room.y - 1; y < room.y + room.height + 1; y++) {
                    if (!level.inBounds(x, y)) continue;

                    // If inside room, carve floor
                    if (x >= room.x && x < room.x + room.width && 
                        y >= room.y && y < room.y + room.height) {
                        level.terrainData[x][y] = TerrainType.Floor;
                        level.setMaterial(x, y, material);
                        context.reserve(x, y, TileReservation.Structure);
                    } else {
                        // It's a wall (or corner)
                        // Only set material if it's a wall (don't overwrite existing floors from other rooms)
                        if (level.terrainData[x][y] === TerrainType.Wall) {
                            level.setMaterial(x, y, material);
                        }
                    }
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

        // 10. Assign room templates (needed for decor rules)
        this.assignRoomTemplates(level, context);
        
        // 10b. Re-assign room materials now that templates/room types are known
        // This is needed because initial material assignment happens before templates
        this.reassignRoomMaterials(level, biome, context);
        
        // 11. Paint Decor (Floors, Rugs, Basic Furniture)
        // We do this BEFORE populating rooms so that interactables (like chests) spawn ON TOP of rugs/floors
        this.paintDecor(level, biome);

        // 12. Room population - spawns interactables, enemies from templates
        // 12. Room population - spawns interactables, enemies from templates
        this.populateRoomsFromTemplates(level, context);

        // 12a. Explicit Boss Spawning for boss floors (removes dependency on Summoning Circle)
        if (floorNumber === 5 || floorNumber === 10) {
            this.spawnBossInBossRoom(level, floorNumber, context);
        }

        // 12b. Spawn Guaranteed Progression Item
        this.spawnGuaranteedProgressionItem(level, context);
        
        // 11. Place exit staircase
        this.placeExitStaircase(level, context);

        // 11b. Place entrance staircase (Stairs Up)
        if (floorNumber > 1) {
            this.placeEntranceStaircase(level, context);
        }

        // 12. Spawn Keys
        this.spawnKeys(level, context);

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
        // Track connections for topological analysis
        if (!r1.connections.includes(r2)) r1.connections.push(r2);
        if (!r2.connections.includes(r1)) r2.connections.push(r1);

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
        const width = biome.corridorWidth || 1;
        const halfWidth = Math.floor(width / 2);

        for (let x = start; x <= end; x++) {
            for (let w = -halfWidth; w < width - halfWidth; w++) {
                // Determine if this is the "primary" path (center-ish)
                // For width 2 (w=-1, 0), we treat 0 as center.
                // For width 3 (w=-1, 0, 1), 0 is center.
                const isCenter = (w === 0);
                this.carvePoint(level, x, yInt + w, context, biome, isCenter);
            }
        }
    }

    private carveV(level: Level, y1: number, y2: number, x: number, context: GenerationContext, biome: BiomeDefinition) {
        const start = Math.floor(Math.min(y1, y2));
        const end = Math.floor(Math.max(y1, y2));
        const xInt = Math.floor(x);
        const width = biome.corridorWidth || 1;
        const halfWidth = Math.floor(width / 2);

        for (let y = start; y <= end; y++) {
            for (let w = -halfWidth; w < width - halfWidth; w++) {
                const isCenter = (w === 0);
                this.carvePoint(level, xInt + w, y, context, biome, isCenter);
            }
        }
    }

    private carvePoint(level: Level, x: number, y: number, context: GenerationContext, biome: BiomeDefinition, isCenter: boolean) {
        if (x < 0 || x >= level.width || y < 0 || y >= level.height) return;
        
        // Check if we are hitting a room wall
        // If so, only carve if we are the "center" of the corridor path
        // This ensures 1-wide entrances even for wide corridors
        if (level.terrainData[x][y] === TerrainType.Wall && this.isPointInRoomFootprint(x, y)) {
            if (!isCenter) return;
        }

        // Only carve if not Locked
        if (context.isAvailable(x, y, TileReservation.Structure)) {
            level.terrainData[x][y] = TerrainType.Floor;
            
            // CRITICAL: Mark corridor tiles as protected so decor won't block them
            level.protectCorridorTile(x, y);
            
            // Corridors get the default material for the biome
            const corridorMaterial = biome.visuals.defaultMaterial || MaterialType.Stone;
            level.setMaterial(x, y, corridorMaterial);
            
            // Also paint neighbors (walls) with the same material
            // This ensures the corridor walls match the floor
            const neighbors = [
                {x: x+1, y: y}, {x: x-1, y: y}, 
                {x: x, y: y+1}, {x: x, y: y-1},
                {x: x+1, y: y+1}, {x: x-1, y: y-1}, // Diagonals too for corners
                {x: x+1, y: y-1}, {x: x-1, y: y+1}
            ];
            
            for (const n of neighbors) {
                if (level.inBounds(n.x, n.y) && level.terrainData[n.x][n.y] === TerrainType.Wall) {
                    // Only update if it's a wall
                    // CRITICAL: Do NOT overwrite walls that belong to a Room
                    if (!this.isPointInRoomFootprint(n.x, n.y)) {
                        level.setMaterial(n.x, n.y, corridorMaterial);
                    }
                }
            }
            
            context.reserve(x, y, TileReservation.Structure);
        }
    }

    /**
     * Checks if a point is within the expanded footprint (floor + walls) of any room
     */
    private isPointInRoomFootprint(x: number, y: number): boolean {
        for (const room of this.rooms) {
            // Check bounds including the 1-tile wall border
            if (x >= room.x - 1 && x <= room.x + room.width &&
                y >= room.y - 1 && y <= room.y + room.height) {
                return true;
            }
        }
        return false;
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
        // Check if door already exists at this position
        const existingDoor = level.getInteractableAt(position.x, position.y);
        if (existingDoor) {
            Logger.debug(`[AdvancedLevelGenerator] Skipping door at ${position} - already occupied`);
            return;
        }
        
        // Keep terrain as floor for movement
        level.terrainData[position.x][position.y] = TerrainType.Floor;
        
        // Determine door type based on room type
        let doorId: InteractableID = InteractableID.Door;
        
        // Scale lock chance with floor depth (risk/reward)
        // Floor 1: 0% bonus, Floor 10: 18% bonus
        const depthBonus = Math.min(0.2, (level.floorNumber - 1) * 0.02);
        
        if (room.roomType === RoomTypeID.Boss) {
            // Boss rooms always locked
            doorId = InteractableID.LockedDoor;
        } else if (room.roomType === RoomTypeID.Exit && (level.floorNumber === 5 || level.floorNumber === 10)) {
            // Boss Floor Exit Rooms are locked by BossDoor
            doorId = InteractableID.BossDoor;
        } else if (room.roomType === RoomTypeID.Treasure) {
            // Treasure rooms mostly locked, increasing with depth
            const lockChance = 0.7 + depthBonus;
            doorId = context.random.next() < lockChance ? InteractableID.LockedDoor : InteractableID.Door;
        } else if (room.roomType === RoomTypeID.Library) { 
            // Secret rooms have secret doors
            doorId = InteractableID.SecretDoor;
        } else if (room.isSpecial) {
            // Chance for locked doors on other special rooms increases with depth
            const lockChance = 0.1 + depthBonus;
            doorId = context.random.next() < lockChance ? InteractableID.LockedDoor : InteractableID.Door;
        }
        
        // Create door as interactable entity
        this.createDoorEntity(level, position, doorId);
        room.entrances.push(position);
        
        // Protect adjacent floor tiles to prevent blocking decor from blocking the door
        const adjacentPositions = [
            { x: position.x - 1, y: position.y },
            { x: position.x + 1, y: position.y },
            { x: position.x, y: position.y - 1 },
            { x: position.x, y: position.y + 1 }
        ];
        
        for (const adj of adjacentPositions) {
            if (level.inBounds(adj.x, adj.y) && level.getTile(adj.x, adj.y) === TerrainType.Floor) {
                level.protectTile(adj.x, adj.y);
            }
        }
        
        if (doorId === InteractableID.LockedDoor) {
            this.lockedRooms.push(room);
        }
        
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
        if (biome.featureGenerators) {
            biome.featureGenerators.forEach(feature => {
                const shouldApply = Math.random() < feature.probability;
                if (shouldApply) {
                    this.applyBiomeFeature(level, context, feature, biome);
                }
            });
        }
    }

    private applyBiomeFeature(level: Level, context: GenerationContext, feature: FeatureConfig, biome: BiomeDefinition): void {
        switch (feature.morphology) {
            case FeatureMorphology.Linear:
                new LinearFeatureGenerator().apply({ level, rng: context.random, biome }, feature);
                break;
            case FeatureMorphology.Patch:
                new PatchFeatureGenerator().apply({ level, rng: context.random, biome }, feature);
                break;
            default:
                Logger.warn(`[AdvancedLevelGenerator] Unknown feature morphology: ${feature.morphology}`);
        }
    }



    private getRoomMaterial(room: Room, biome: BiomeDefinition, context: GenerationContext): MaterialType {
        // 0. Check Room Template Preference (Data-Driven)
        if (room.template && room.template.materials) {
            // Prefer floor material if defined, otherwise wall material, otherwise fallback
            if (room.template.materials.floor) {
                return room.template.materials.floor as MaterialType;
            }
        }

        // Default to Wood for Snowy Village as it's cozy
        let material = MaterialType.Wood;
        
        // 1. Check for Room Type specific preferences (Legacy Hardcoded Fallback)
        switch (room.roomType) {
            case RoomTypeID.Entrance:
                return MaterialType.Wood; // Cozy entrance
            case RoomTypeID.Exit:
                return MaterialType.Stone; // Sturdy exit
            case RoomTypeID.Treasure:
                return MaterialType.Stone;
            case RoomTypeID.Boss:
                return MaterialType.Stone; // Epic stone for boss
            case RoomTypeID.Shop:
                return MaterialType.Brick; // Brick for shops
            case RoomTypeID.Library:
                return MaterialType.Wood;
            case RoomTypeID.Armory:
                return MaterialType.Stone;
            case RoomTypeID.Kitchen:
                return MaterialType.Brick;
            case RoomTypeID.Bedroom:
                return MaterialType.Wood;
        }

        // 2. Random selection from available biome materials
        // We can weight these: Wood (40%), Brick (30%), Carpet (20%), Stone (10%) for Snowy Village
        if (biome.visuals.materials) {
            const roll = context.random.next();
            if (roll < 0.4) return MaterialType.Wood;
            if (roll < 0.7) return MaterialType.Brick;
            if (roll < 0.9) return MaterialType.Ice;
            return MaterialType.Stone;
        }
        
        return material;
    }

    /**
     * Phase 1: Assign templates to rooms based on room type and floor distribution
     * Must be called before paintDecor so decorRules are available
     */
    private assignRoomTemplates(level: Level, context: GenerationContext): void {
        const floorNumber = level.floorNumber;
        const availableTemplates = getRoomTemplatesForFloor(floorNumber);
        
        if (availableTemplates.length === 0) {
            console.log('[AdvancedLevelGenerator] No templates available for floor', floorNumber);
            return;
        }

        // Assign room types using smart selection
        this.assignRoomTypes(this.rooms, availableTemplates, floorNumber, context, level);
        
        console.log(`[AdvancedLevelGenerator] Assigned templates to ${this.rooms.filter(r => r.template).length}/${this.rooms.length} rooms`);
    }
    
    /**
     * Re-assign room materials after templates are known
     * This ensures indoor rooms (wood/brick/stone) are correctly identified for decor filtering
     */
    private reassignRoomMaterials(level: Level, biome: BiomeDefinition, context: GenerationContext): void {
        for (const room of this.rooms) {
            // Get the correct material now that roomType is known
            const correctMaterial = this.getRoomMaterial(room, biome, context);
            
            // Re-paint the room with the correct material
            for (let x = room.x; x < room.x + room.width; x++) {
                for (let y = room.y; y < room.y + room.height; y++) {
                    if (level.inBounds(x, y)) {
                        level.setMaterial(x, y, correctMaterial);
                    }
                }
            }
            
            // Also paint walls around room
            for (let x = room.x - 1; x <= room.x + room.width; x++) {
                for (let y = room.y - 1; y <= room.y + room.height; y++) {
                    if (level.inBounds(x, y) && level.getTile(x, y) === TerrainType.Wall) {
                        level.setMaterial(x, y, correctMaterial);
                    }
                }
            }
        }
        
        console.log(`[AdvancedLevelGenerator] Re-assigned materials for ${this.rooms.length} rooms`);
    }
    
    /**
     * Phase 2: Populate rooms with interactables and enemies from templates
     * Called after paintDecor so interactables spawn on top of decor
     */
    private populateRoomsFromTemplates(level: Level, context: GenerationContext): void {
        const floorNumber = level.floorNumber;
        
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

    /** @deprecated Use assignRoomTemplates and populateRoomsFromTemplates instead */
    private populateRoomsWithTemplates(level: Level, context: GenerationContext): void {
        this.assignRoomTemplates(level, context);
        this.populateRoomsFromTemplates(level, context);
    }

    private paintDecor(level: Level, biome: BiomeDefinition): void {
        this.rooms.forEach(room => {
            DecorSystem.instance.paintRoom(level, room, biome);
        });
        DecorSystem.instance.paintCorridors(level, biome);
    }

    /**
     * Analyze dungeon topology to identify leaf nodes and critical path
     */
    private analyzeTopology(rooms: Room[], startRoom: Room): { leafNodes: Room[], criticalPath: Room[] } {
        const leafNodes = rooms.filter(r => r.connections.length === 1 && r !== startRoom);
        
        // Find furthest room for critical path (Exit)
        // Simple BFS to find distances
        const distances = new Map<Room, number>();
        const previous = new Map<Room, Room>();
        const queue: Room[] = [startRoom];
        distances.set(startRoom, 0);
        
        let furthestRoom = startRoom;
        let maxDist = 0;
        
        while (queue.length > 0) {
            const current = queue.shift()!;
            const dist = distances.get(current)!;
            
            if (dist > maxDist) {
                maxDist = dist;
                furthestRoom = current;
            }
            
            for (const neighbor of current.connections) {
                if (!distances.has(neighbor)) {
                    distances.set(neighbor, dist + 1);
                    previous.set(neighbor, current);
                    queue.push(neighbor);
                }
            }
        }
        
        // Reconstruct critical path
        const criticalPath: Room[] = [];
        let curr: Room | undefined = furthestRoom;
        while (curr) {
            criticalPath.unshift(curr);
            curr = previous.get(curr);
        }
        
        return { leafNodes, criticalPath };
    }

    /**
     * Assign room types to rooms using weighted selection and constraints
     */
    /**
     * Assign room types to rooms using weighted selection and constraints
     */
    private assignRoomTypes(
        rooms: Room[], 
        templates: RoomTemplate[], 
        floorNumber: number, 
        context: GenerationContext,
        level: Level
    ): void {
        const startRoom = rooms[0];
        const { leafNodes, criticalPath } = this.analyzeTopology(rooms, startRoom);
        
        // 1. Assign Exit
        // Use the last room in the critical path as the exit room
        // If critical path failed (shouldn't happen in connected graph), fallback to furthest room logic
        let endRoom = criticalPath.length > 0 ? criticalPath[criticalPath.length - 1] : rooms[rooms.length - 1];
        endRoom.roomType = RoomTypeID.Exit;
        
        // 2. Assign Entrance (Start Room)
        // Always set start room as Entrance
        startRoom.roomType = RoomTypeID.Entrance;

        // 3. Enforce Required Room Types for this floor
        const floorKey = floorNumber as keyof typeof RoomGenerationRules.requiredRoomTypes;
        const requiredTypes = RoomGenerationRules.requiredRoomTypes[floorKey] || [];
        const unassignedRooms = rooms.filter(r => r.roomType === RoomTypeID.Basic);
        
        for (const requiredType of requiredTypes) {
            // Find a suitable room for this required type
            const suitableRoom = unassignedRooms.find(r => {
                const template = templates.find(t => t.id === requiredType);
                return template && this.isRoomSuitableForTemplate(r, template);
            });
            
            if (suitableRoom) {
                const template = templates.find(t => t.id === requiredType);
                if (template) {
                    suitableRoom.roomType = requiredType;
                    suitableRoom.template = template;
                    suitableRoom.tags = template.tags;
                    suitableRoom.isSpecial = template.category === 'special';
                    
                    // Remove from unassigned list
                    const index = unassignedRooms.indexOf(suitableRoom);
                    if (index > -1) unassignedRooms.splice(index, 1);
                    
                    Logger.debug(`[AdvancedLevelGenerator] Enforced required room type ${requiredType} on floor ${floorNumber}`);
                }
            } else {
                Logger.warn(`[AdvancedLevelGenerator] Could not place required room type ${requiredType} on floor ${floorNumber} - no suitable rooms`);
            }
        }

        // 4. Assign Special Rooms to Leaf Nodes
        // Filter out Exit room, Start room, and already assigned required rooms from leaves
        const availableLeaves = leafNodes.filter(r => r !== endRoom && r !== startRoom && r.roomType === RoomTypeID.Basic);
        
        // Shuffle leaves
        for (let i = availableLeaves.length - 1; i > 0; i--) {
            const j = context.random.integer(0, i);
            [availableLeaves[i], availableLeaves[j]] = [availableLeaves[j], availableLeaves[i]];
        }

        // Get Special templates (Boss, Treasure, Workshop, etc.)
        // Filter by floor restrictions - this prevents boss rooms on inappropriate floors
        const specialTemplates = templates.filter(t => {
            if (t.category !== 'special' || t.id === RoomTypeID.Entrance || t.id === RoomTypeID.Exit) {
                return false;
            }
            
            // Check floor restrictions
            if (t.floorRestrictions) {
                if (t.floorRestrictions.minFloor && floorNumber < t.floorRestrictions.minFloor) {
                    return false;
                }
                if (t.floorRestrictions.maxFloor && floorNumber > t.floorRestrictions.maxFloor) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Track placed counts
        const placedCounts = new Map<string, number>();

        // Try to place Special rooms in available leaves
        // Limit total special rooms to avoid overcrowding (e.g. max 2-3 per floor)
        const maxSpecialRooms = Math.max(2, Math.floor(rooms.length * 0.3));
        let currentSpecialRooms = 0;

        // Sort special templates by some priority? Or just random weighted?
        // Let's use weighted selection to pick WHICH special room to place
        
        while (availableLeaves.length > 0 && currentSpecialRooms < maxSpecialRooms) {
            // Filter candidates that haven't hit their limit (default limit 1 for special)
            const candidates = specialTemplates.filter(t => {
                const count = placedCounts.get(t.id) || 0;
                return count < 1; // Hardcoded limit of 1 per special type per floor
            });
            
            if (candidates.length === 0) break;

            const template = this.selectWeightedTemplate(candidates, context, floorNumber, level);
            if (!template) break;

            const leaf = availableLeaves.shift()!;
            leaf.roomType = template.id;
            leaf.template = template;
            leaf.tags = template.tags;
            leaf.isSpecial = true;
            
            placedCounts.set(template.id, (placedCounts.get(template.id) || 0) + 1);
            currentSpecialRooms++;
            Logger.debug(`[AdvancedLevelGenerator] Assigned Special ${template.name} to leaf node`);
        }
        
        // 5. Assign Flavor Rooms to remaining leaves (and potentially other spots?)
        // Any remaining leaves should ideally be Flavor rooms (Library, Armory) rather than Basic
        const flavorTemplates = templates.filter(t => t.category === 'flavor');
        
        while (availableLeaves.length > 0) {
            const leaf = availableLeaves.shift()!;
            
            // Pick a flavor template
            const template = this.selectWeightedTemplate(flavorTemplates, context, floorNumber, level);
            
            if (template) {
                leaf.roomType = template.id;
                leaf.template = template;
                leaf.tags = template.tags;
                // Flavor rooms are not "special" in the sense of needing keys, but they are interesting
            } else {
                // Fallback to basic if no flavor fits?
                // Should not happen if we have flavor templates
            }
        }
        
        // 6. Assign rooms using floor-based distribution (loot table system)
        // Get the floor distribution weights for this floor
        const floorDistribution = getRoomDistributionForFloor(floorNumber);
        console.log(`[AdvancedLevelGenerator] Floor distribution for floor ${floorNumber}:`, floorDistribution);
        
        for (const room of rooms) {
            if (room.roomType !== RoomTypeID.Basic) continue; // Skip already assigned
            
            // Use floor distribution to select room type
            const template = this.selectTemplateByFloorDistribution(
                templates, 
                floorDistribution, 
                context, 
                floorNumber, 
                level
            );
            
            console.log(`[AdvancedLevelGenerator] Room at (${room.x},${room.y}) type=${room.roomType}, selected template:`, template?.id || 'null');
            
            if (template) {
                room.template = template;
                room.roomType = template.id;
                room.tags = template.tags;
                console.log(`[AdvancedLevelGenerator] Assigned template ${template.id} to room at (${room.x},${room.y})`);
            } else {
                console.log(`[AdvancedLevelGenerator] ⚠️ NO TEMPLATE for room at (${room.x},${room.y})`);
            }
        }
        
        Logger.info(`[AdvancedLevelGenerator] Assigned room types. Leaves: ${leafNodes.length}, Critical Path: ${criticalPath.length}`);
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
     * Calculate the weight of a template for the current context
     */
    private calculateTemplateWeight(template: RoomTemplate, floorNumber: number, biomeId: string): number {
        const config = template.placement;
        let weight = 1.0; // Default base weight

        if (config) {
            // Apply depth scaling
            if (config.depthScaling) {
                const { startFloor, endFloor, weightMultiplier } = config.depthScaling;
                if (floorNumber >= startFloor) {
                    const progress = Math.min(1, (floorNumber - startFloor) / (endFloor - startFloor));
                    const scale = 1 + (weightMultiplier - 1) * progress;
                    weight *= scale;
                }
            }

            // Apply biome weights
            if (config.biomeWeights && config.biomeWeights[biomeId]) {
                weight *= config.biomeWeights[biomeId];
            }
        }

        return weight;
    }

    /**
     * Select a template using floor-based distribution (room loot table system)
     */
    private selectTemplateByFloorDistribution(
        templates: RoomTemplate[],
        floorDistribution: Record<string, number>,
        context: GenerationContext,
        floorNumber: number,
        level: Level
    ): RoomTemplate | null {
        // Get total weight
        const totalWeight = Object.values(floorDistribution).reduce((sum, weight) => sum + weight, 0);
        if (totalWeight <= 0) return null;

        // Roll for room type
        let randomValue = context.random.next() * totalWeight;
        let selectedRoomType: string | null = null;

        for (const [roomType, weight] of Object.entries(floorDistribution)) {
            randomValue -= weight;
            if (randomValue <= 0) {
                selectedRoomType = roomType;
                break;
            }
        }

        if (!selectedRoomType) {
            selectedRoomType = Object.keys(floorDistribution)[0]; // Fallback
        }

        // Find available templates for this room type
        const availableTemplates = templates.filter(t => t.id === selectedRoomType);
        
        if (availableTemplates.length === 0) {
            // If no template found for selected type, fall back to any available basic template
            const basicTemplates = templates.filter(t => t.category === 'basic');
            return basicTemplates.length > 0 ? basicTemplates[context.random.integer(0, basicTemplates.length - 1)] : null;
        }

        // If multiple templates exist for the same type, pick one
        return availableTemplates[context.random.integer(0, availableTemplates.length - 1)];
    }

    /**
     * Select a template using weighted distribution
     */
    private selectWeightedTemplate(
        templates: RoomTemplate[], 
        context: GenerationContext,
        floorNumber: number,
        level: Level
    ): RoomTemplate | null {
        const biomeId = level.biome.id;
        
        // Calculate weights for all candidates
        const candidates = templates.map(t => ({
            template: t,
            weight: this.calculateTemplateWeight(t, floorNumber, biomeId)
        })).filter(c => c.weight > 0);

        if (candidates.length === 0) return null;

        const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
        let randomValue = context.random.next() * totalWeight;
        
        for (const candidate of candidates) {
            randomValue -= candidate.weight;
            if (randomValue <= 0) {
                return candidate.template;
            }
        }
        
        return candidates[candidates.length - 1].template;
    }
    
    /**
     * Place exit staircase in the furthest room from entrance
     */
    private placeExitStaircase(level: Level, context: GenerationContext): void {
        // Find the room marked as Exit
        const exitRoom = level.rooms.find(r => r.roomType === RoomTypeID.Exit);
        
        if (!exitRoom) {
            Logger.warn('[AdvancedLevelGenerator] No Exit room found, defaulting to last room');
            if (level.rooms.length > 0) {
                const lastRoom = level.rooms[level.rooms.length - 1];
                lastRoom.roomType = RoomTypeID.Exit;
                this.createStaircaseEntity(level, lastRoom.center, InteractableID.StairsDown);
            }
            return;
        }
        
        // Place staircase at center of exit room
        const exitPos = exitRoom.center;
        
        // Keep terrain as floor for movement
        level.terrainData[exitPos.x][exitPos.y] = TerrainType.Floor;
        
        // Create interactable entity
        this.createStaircaseEntity(level, exitPos, InteractableID.StairsDown);
        
        // Set exitPoint for level transitions
        level.exitPoint = exitPos;
        
        Logger.info(`[AdvancedLevelGenerator] Placed exit stairs at ${exitPos} in room type ${exitRoom.roomType}`);
    }

    /**
     * Spawn keys for locked rooms
     * Logic: For every locked room, place a key in a reachable (non-locked) room
     */
    private spawnKeys(level: Level, context: GenerationContext): void {
        if (this.lockedRooms.length === 0) return;
        
        // Get all reachable rooms (not locked)
        // A simple heuristic: rooms that are NOT in the lockedRooms list are candidates
        // Ideally we'd do a reachability check from start room, but this is a good approximation
        const candidateRooms = this.rooms.filter(r => !this.lockedRooms.includes(r) && r.roomType !== RoomTypeID.Entrance && r.roomType !== RoomTypeID.Exit);
        
        if (candidateRooms.length === 0) {
            Logger.warn('[AdvancedLevelGenerator] No candidate rooms for key placement!');
            return;
        }
        
        for (const lockedRoom of this.lockedRooms) {
            // Pick a random candidate room
            const keyRoom = candidateRooms[context.random.integer(0, candidateRooms.length - 1)];
            
            // Place key in center or random spot
            const keyPos = keyRoom.center;
            
            // Determine key type based on room? For now just generic 'gold_key'
            // We need an InteractableID for Key or just an Item?
            // Usually keys are Items, but we might want them to be Interactables for visibility?
            // Let's assume they are Items for now and use a helper to spawn them
            // But wait, we don't have a spawnItem method anymore. 
            // We should spawn an Interactable 'Key' or use the LootSystem.
            // Let's spawn a 'GroundItem' interactable if we have one, or just a raw entity.
            
            // Actually, we should use the LootSystem to drop a specific item.
            // Or just create a simple entity for now.
            
            // Let's assume we have an ItemID.KeyGold
            // We need to spawn it. 
            // Since we don't have a direct "Spawn Item" method here, let's use EventBus to request item spawn
            // or use a specific InteractableID if we have one for "KeyPickup".
            
            // For now, let's assume we spawn a 'chest' containing the key, or just the key on the floor.
            // Let's use a specialized InteractableID.Chest if we want it in a chest, 
            // or we need to add a "Key" interactable.
            
            // Checking InteractableIDs... we don't have 'Key'.
            // Let's use a small chest or just a "Treasure" interactable that gives a key.
            // Or better, let's add a simple "Key" interactable to InteractableIDs later.
            // For now, I will spawn a "PresentChest" (Gift) that contains the key.
            
            this.createKeyEntity(level, keyPos, 'gold_key');
            
            Logger.info(`[AdvancedLevelGenerator] Placed Key for locked room at ${keyPos} in ${keyRoom.roomType}`);
        }
    }

    private createKeyEntity(level: Level, position: ex.Vector, keyId: string): void {
        // Spawn key as an Item using ItemCreate event
        EventBus.instance.emit(GameEventNames.ItemCreate, new FactoryCreateEvent(
            keyId, // e.g., 'gold_key' which matches ItemID.GoldKey
            { position, config: { count: 1 }, level }
        ));
        Logger.debug(`[AdvancedLevelGenerator] Spawned key "${keyId}" at (${position.x}, ${position.y})`);
    }

    /**
     * Place entrance staircase (Stairs Up) in the entrance room
     */
    private placeEntranceStaircase(level: Level, context: GenerationContext): void {
        // Find the room marked as Entrance
        const entranceRoom = level.rooms.find(r => r.roomType === RoomTypeID.Entrance);
        
        if (!entranceRoom) {
            Logger.warn('[AdvancedLevelGenerator] No Entrance room found for Stairs Up!');
            return;
        }
        
        // Place staircase at center of entrance room
        const entrancePos = entranceRoom.center;
        
        // Keep terrain as floor for movement
        level.terrainData[entrancePos.x][entrancePos.y] = TerrainType.Floor;
        
        // Create interactable entity
        this.createStaircaseEntity(level, entrancePos, InteractableID.StairsUp);
        
        Logger.info(`[AdvancedLevelGenerator] Placed entrance stairs (Up) at ${entrancePos} in room type ${entranceRoom.roomType}`);
    }

    private createStaircaseEntity(level: Level, position: ex.Vector, stairId: string): void {
        EventBus.instance.emit(GameEventNames.InteractableCreate, new FactoryCreateEvent(
            stairId,
            { position, level }
        ));
    }

    /**
     * Spawn a guaranteed progression item (Star Cookie or Liquid Courage)
     * Ensures player has access to sustain/stat items on every floor
     */
    private spawnGuaranteedProgressionItem(level: Level, context: GenerationContext): void {
        const { random: rng } = context;
        
        // Pick a random room (excluding small rooms or boss rooms if we had tags, but random is fine for now)
        const rooms = level.rooms;
        if (rooms.length === 0) return;
        
        let spawned = false;
        let attempts = 0;
        const maxAttempts = 50;

        while (!spawned && attempts < maxAttempts) {
            attempts++;
            const room = rooms[rng.integer(0, rooms.length - 1)];
            
            // Find a valid floor tile in the room
            const x = rng.integer(room.x + 1, room.x + room.width - 2);
            const y = rng.integer(room.y + 1, room.y + room.height - 2);
            
            // Strict validation: Must be floor and NOT occupied
            if (level.terrainData[x][y] !== TerrainType.Floor) continue;
            if (level.isOccupied(x, y)) continue;

             // Decide item
            const itemId = rng.next() > 0.5 ? 'star_cookie' : 'liquid_courage';
            const position = ex.vec(x, y);
            
            // Use EventBus to spawn item
            EventBus.instance.emit(GameEventNames.ItemSpawnRequest, {
                itemId: itemId,
                position: position,
                level: level,
                count: 1
            });
            
            Logger.info(`[AdvancedLevelGenerator] Spawned guaranteed progression item ${itemId} at ${x},${y} (Attempt ${attempts})`);
            spawned = true;
        }

        if (!spawned) {
            Logger.warn(`[AdvancedLevelGenerator] FAILED to spawn guaranteed progression item after ${maxAttempts} attempts.`);
        }
    }

    /**
     * Explicitly spawn boss actor in boss room
     * Called on boss floors (5 for Krampus, 10 for Corrupted Santa)
     */
    private spawnBossInBossRoom(level: Level, floorNumber: number, context: GenerationContext): void {
        // Find the boss room
        const bossRoom = level.rooms.find(r => r.roomType === RoomTypeID.Boss);
        
        if (!bossRoom) {
            Logger.warn(`[AdvancedLevelGenerator] No Boss room found on floor ${floorNumber}, spawning boss in Exit room`);
            // Fallback to exit room if no boss room exists
            const exitRoom = level.rooms.find(r => r.roomType === RoomTypeID.Exit);
            if (!exitRoom) {
                Logger.error(`[AdvancedLevelGenerator] No Exit room found either, cannot spawn boss`);
                return;
            }
            this.spawnBossActor(level, exitRoom.center, floorNumber);
            return;
        }
        
        // Spawn boss at center of boss room
        this.spawnBossActor(level, bossRoom.center, floorNumber);
    }

    private spawnBossActor(level: Level, position: ex.Vector, floorNumber: number): void {
        // Determine which boss to spawn based on floor
        const bossId = floorNumber === 5 ? ActorID.KRAMPUS : ActorID.CORRUPTED_SANTA;
        
        Logger.info(`[AdvancedLevelGenerator] Spawning ${bossId} at ${position} on floor ${floorNumber}`);
        
        // Use ActorCreate event to spawn the boss
        // FactoryCreateEvent expects (type, instance) where instance has defName and gridPos
        EventBus.instance.emit(GameEventNames.ActorCreate, new FactoryCreateEvent(
            bossId,
            { 
                defName: bossId,
                gridPos: position,
                options: { level: level }
            }
        ));
    }
}
