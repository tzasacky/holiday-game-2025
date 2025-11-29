import * as ex from 'excalibur';
import { Level } from '../Level';
import { Room } from '../Room';
import { TerrainType } from '../../data/terrain';
import { BiomeDefinition, MaterialType } from '../../data/biomes';
import { GenerationContext, TileReservation } from './GenerationContext';
import { BSPGenerator, BSPNode } from './BSPGenerator';
import { RoomGenerationExecutor } from '../../systems/RoomGenerationExecutor';
import { getRoomTemplatesForFloor, getRoomDistributionForFloor, RoomTemplate } from '../../data/roomTemplates';
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

        // 10. Room population using RoomGenerationExecutor
        this.populateRoomsWithTemplates(level, context);
        
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
        // Keep terrain as floor for movement
        level.terrainData[position.x][position.y] = TerrainType.Floor;
        
        // Determine door type
        // Determine door type based on room type
        let doorId: InteractableID = InteractableID.Door;
        
        // Scale lock chance with floor depth (risk/reward)
        // Floor 1: 0% bonus, Floor 10: 18% bonus
        const depthBonus = Math.min(0.2, (level.floorNumber - 1) * 0.02);
        
        if (room.roomType === RoomTypeID.Boss) {
            // Boss rooms always locked
            doorId = InteractableID.LockedDoor;
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
        // Default to Wood for Snowy Village as it's cozy
        let material = MaterialType.Wood;
        
        // 1. Check for Room Type specific preferences
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

    private spawnItems(level: Level, context: GenerationContext) {
        // Legacy method - items are now spawned via:
        // 1. InteractableGenerator (chests, containers)  
        // 2. RoomGenerationExecutor (room-specific loot)
        // 3. LootSystem (data-driven loot tables)
        
        Logger.info('[AdvancedLevelGenerator] Item spawning moved to data-driven systems');
        
        // TODO: Remove this method entirely once new system is fully integrated
    }

    private populateRoomsWithTemplates(level: Level, context: GenerationContext): void {
        const floorNumber = level.floorNumber;
        const availableTemplates = getRoomTemplatesForFloor(floorNumber);
        
        if (availableTemplates.length === 0) {
            return;
        }

        // Assign room types using smart selection
        this.assignRoomTypes(this.rooms, availableTemplates, floorNumber, context, level);

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

        // 3. Assign Special Rooms to Leaf Nodes
        // Filter out Exit room and Start room from leaves
        const availableLeaves = leafNodes.filter(r => r !== endRoom && r !== startRoom);
        
        // Shuffle leaves
        for (let i = availableLeaves.length - 1; i > 0; i--) {
            const j = context.random.integer(0, i);
            [availableLeaves[i], availableLeaves[j]] = [availableLeaves[j], availableLeaves[i]];
        }

        // Get Special templates (Boss, Treasure, Workshop, etc.)
        // Filter by floor restrictions
        const specialTemplates = templates.filter(t => t.category === 'special' && t.id !== RoomTypeID.Entrance && t.id !== RoomTypeID.Exit);
        
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
        
        // 4. Assign Flavor Rooms to remaining leaves (and potentially other spots?)
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
        
        // 5. Assign Basic/Flavor to remaining rooms
        // We can mix Basic and Flavor for the rest of the dungeon
        const basicTemplates = templates.filter(t => t.category === 'basic');
        const fillerTemplates = [...basicTemplates, ...flavorTemplates]; // Allow flavor in normal spots too?
        // Maybe just Basic + some Flavor?
        // Let's stick to Basic for corridors/hubs to keep it simple, or allow Flavor with lower weight.
        // Actually, selectWeightedTemplate handles weights. If Flavor has low weight, it appears less.
        
        for (const room of rooms) {
            if (room.roomType !== RoomTypeID.Basic) continue; // Skip already assigned
            
            // Use weighted selection from all non-special templates
            const template = this.selectWeightedTemplate(fillerTemplates, context, floorNumber, level);
            
            if (template) {
                room.template = template;
                room.roomType = template.id;
                room.tags = template.tags;
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

    /**
     * Spawn keys for locked rooms
     */
    private spawnKeys(level: Level, context: GenerationContext): void {
        if (this.lockedRooms.length === 0) return;

        Logger.info(`[AdvancedLevelGenerator] Spawning keys for ${this.lockedRooms.length} locked rooms`);

        // Get all reachable rooms (rooms that are NOT locked and NOT secret)
        // We assume locked rooms are leaf nodes, so all other rooms are reachable from start
        const reachableRooms = this.rooms.filter(r => 
            !this.lockedRooms.includes(r) && 
            r.roomType !== RoomTypeID.Library // Secret rooms
        );

        if (reachableRooms.length === 0) {
            Logger.warn('[AdvancedLevelGenerator] No reachable rooms to place keys!');
            return;
        }

        for (const lockedRoom of this.lockedRooms) {
            // Pick a random reachable room
            const keyRoom = reachableRooms[context.random.integer(0, reachableRooms.length - 1)];
            
            // Find a valid spot in the room
            const floorTiles = [];
            for (let x = keyRoom.x + 1; x < keyRoom.x + keyRoom.width - 1; x++) {
                for (let y = keyRoom.y + 1; y < keyRoom.y + keyRoom.height - 1; y++) {
                    if (level.terrainData[x][y] === TerrainType.Floor && !level.getActorAt(x, y)) {
                        floorTiles.push(ex.vec(x, y));
                    }
                }
            }

            if (floorTiles.length > 0) {
                const pos = floorTiles[context.random.integer(0, floorTiles.length - 1)];
                
                // Spawn Gold Key
                // We use ItemID.GoldKey. We need to import ItemID.
                // Assuming ItemID is available or we use string 'gold_key'
                EventBus.instance.emit(GameEventNames.ItemSpawnRequest, {
                    itemId: 'gold_key', // Hardcoded for now, should use ItemID.GoldKey
                    position: pos,
                    level: level,
                    count: 1
                });
                
                Logger.info(`[AdvancedLevelGenerator] Spawned key at ${pos} in ${keyRoom.roomType} for locked ${lockedRoom.roomType}`);
            } else {
                Logger.warn(`[AdvancedLevelGenerator] Could not find spot for key in ${keyRoom.roomType}`);
            }
        }
    }

    private createStaircaseEntity(level: Level, position: ex.Vector, stairId: string): void {
        EventBus.instance.emit(GameEventNames.InteractableCreate, new FactoryCreateEvent(
            stairId,
            { position, level }
        ));
    }
}
