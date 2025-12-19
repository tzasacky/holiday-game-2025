import * as ex from 'excalibur';
import { Level } from './Level';
import { Room } from './Room';
import { BiomeDefinition, DecorConfig, MaterialType } from '../data/biomes';
import { GraphicsManager } from '../data/graphics';
import { GraphicType } from '../constants/GraphicType';
import { Logger } from '../core/Logger';
import { TerrainType } from '../data/terrain';
import { InteractableID } from '../constants/InteractableIDs';
import { DecorID } from '../constants/DecorIDs';
import { EventBus } from '../core/EventBus';
import { GameEventNames, FactoryCreateEvent } from '../core/GameEvents';
import { DecorEntity } from '../entities/DecorEntity';
import { InteractableEntity } from '../entities/InteractableEntity';
import { DataManager } from '../core/DataManager';
import { DecorDefinitions } from '../data/decor';
import { InteractableDefinition } from '../data/interactables';
import { DecorPlacementType } from '../constants/DecorPlacementType';
import { DecorPlacementRule, PrefabConfig } from '../data/roomTemplates';
import { ActorID } from '../constants/ActorIDs';
import { ItemID } from '../constants/ItemIDs';

export class DecorSystem {
    private static _instance: DecorSystem;

    public static get instance(): DecorSystem {
        if (!this._instance) {
            this._instance = new DecorSystem();
        }
        return this._instance;
    }

    /**
     * Paint decor into a room based on biome and room template
     * Path protection is handled by Level.isPlaceableForDecor() using Level.protectedTiles
     */
    public paintRoom(level: Level, room: Room, biome: BiomeDefinition): void {
        console.log(`[DecorSystem.paintRoom] Room type: ${room.roomType}, has template: ${!!room.template}, has decorRules: ${!!room.template?.decorRules}, decorRules count: ${room.template?.decorRules?.length || 0}`);
        
        // 1. Prefab Painting (Overrides everything if present)
        if (room.template && room.template.prefab) {
            this.paintPrefab(level, room, room.template.prefab);
            return; // Prefabs are self-contained
        }

        // 2. Room Template Decor Rules (Data-driven specific decor)
        if (room.template && room.template.decorRules) {
            console.log(`[DecorSystem.paintRoom] Calling paintDecorRules with ${room.template.decorRules.length} rules`);
            this.paintDecorRules(level, room, room.template.decorRules);
        }

        // 3. Biome-Specific Decor (Generic fallback/filler)
        if (biome.decor) {
            this.paintDecorConfig(level, room, biome.decor);
        }
    }

    private paintDecorRules(level: Level, room: Room, rules: DecorPlacementRule[]): void {
        console.log(`[DecorSystem.paintDecorRules] Called with ${rules.length} rules for room ${room.roomType}`);
        Logger.info(`[DecorSystem] Painting ${rules.length} decor rules for room ${room.roomType} at (${room.x},${room.y})`);
        
        for (const rule of rules) {
            // OnWall rules should always be processed - placement logic handles spacing
            if (rule.placementType === DecorPlacementType.OnWall) {
                this.placeOnWall(level, room, rule.items, 1.0);
                continue;
            }
            
            // Check probability for other rules
            if (Math.random() > rule.probability) continue;

            const count = rule.count || 1;
            const items = rule.items;

            switch (rule.placementType) {
                case DecorPlacementType.AdjacentToWall:
                    // Place items on floor tiles adjacent to walls (bookshelves, cabinets)
                    this.placeAdjacentToWall(level, room, items, rule.probability);
                    break;
                case DecorPlacementType.WallTop:
                    this.placeAgainstSpecificWall(level, room, items, 0, count);
                    break;
                case DecorPlacementType.WallBottom:
                    this.placeAgainstSpecificWall(level, room, items, 1, count);
                    break;
                case DecorPlacementType.FloorCenter:
                    // For center, we place one item or a small cluster
                    // We assume the first item is the main one if multiple
                    const centerItem = items[Math.floor(Math.random() * items.length)];
                    this.placeItemInCenter(level, room, centerItem, 1); // Size handled by definition
                    break;
                case DecorPlacementType.FloorRandom:
                    this.placeRandomClutter(level, room, items, 1.0, count);
                    break;
                case DecorPlacementType.FloorCorners:
                    this.placeCornerDecor(level, room, items, 1.0);
                    break;
                case DecorPlacementType.FloorPerimeter:
                    // Place items along the inner floor perimeter (near walls)
                    this.placeAlongFloorPerimeter(level, room, items, count);
                    break;
                case DecorPlacementType.Linear:
                    this.placeLinearDecor(level, room, items, rule);
                    break;
            }
        }
    }

    private checkConstraints(level: Level, x: number, y: number, rule: DecorPlacementRule): boolean {
        // Terrain Constraint
        if (rule.requiresTerrain) {
            const tile = level.getTile(x, y);
            if (!rule.requiresTerrain.includes(tile)) return false;
        }

        // Wall Constraint
        if (rule.requiresWall) {
            if (!this.hasAdjacentWall(level, x, y)) return false;
        }

        // Min Distance Constraint
        if (rule.minDistance) {
            // This is expensive, maybe skip for now or implement spatial hash later
            // For now, just check nearby tiles
            const r = rule.minDistance;
            for (let dx = -r; dx <= r; dx++) {
                for (let dy = -r; dy <= r; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const decor = level.getDecorAt(x + dx, y + dy);
                    if (decor.length > 0) return false; // Too close to ANY decor
                }
            }
        }

        return true;
    }

    private placeLinearDecor(level: Level, room: Room, items: string[], rule: DecorPlacementRule): void {
        // Simple linear placement: Pick two points and connect them
        // For fences, we might want to span the room or cut across a corner
        
        const startX = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
        const startY = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
        
        // Random direction and length
        const length = Math.floor(Math.random() * (Math.min(room.width, room.height) / 2)) + 3;
        const dir = Math.random() > 0.5 ? 'H' : 'V';
        
        const endX = dir === 'H' ? startX + length : startX;
        const endY = dir === 'V' ? startY + length : startY;

        this.manhattanLine(startX, startY, endX, endY, (x, y) => {
            if (this.isAreaClear(level, x, y, 1, 1) && this.checkConstraints(level, x, y, rule)) {
                // Pick item based on direction/context if possible
                // For now just random
                const item = items[Math.floor(Math.random() * items.length)];
                this.placeUnifiedItem(level, x, y, item);
            }
        });
    }

    private computeProtectedTiles(level: Level, room: Room): Set<string> {
        const protectedTiles = new Set<string>();
        
        // Identify entrances
        const entrances: {x: number, y: number}[] = [];
        
        if (room.entrances && room.entrances.length > 0) {
            entrances.push(...room.entrances);
        } else {
            // Fallback: scan perimeter
             // Top (y-1)
            for (let x = room.x; x < room.x + room.width; x++) {
                if (level.getTile(x, room.y-1) === TerrainType.Floor) entrances.push({x, y: room.y});
            }
            // Bottom (y+h)
            for (let x = room.x; x < room.x + room.width; x++) {
                if (level.getTile(x, room.y+room.height) === TerrainType.Floor) entrances.push({x, y: room.y+room.height-1});
            }
            // Left (x-1)
            for (let y = room.y; y < room.y + room.height; y++) {
                if (level.getTile(room.x-1, y) === TerrainType.Floor) entrances.push({x: room.x, y});
            }
            // Right (x+w)
            for (let y = room.y; y < room.y + room.height; y++) {
                if (level.getTile(room.x+room.width, y) === TerrainType.Floor) entrances.push({x: room.x+room.width-1, y});
            }
        }

        // If no entrances found, protect center
        if (entrances.length === 0) {
            const cx = room.x + Math.floor(room.width/2);
            const cy = room.y + Math.floor(room.height/2);
            protectedTiles.add(`${cx},${cy}`);
            return protectedTiles;
        }

        // Connect all entrances to a central point using BFS
        const cx = room.x + Math.floor(room.width/2);
        const cy = room.y + Math.floor(room.height/2);
        
        // Add path from each entrance to center
        for (const ent of entrances) {
            const path = this.findPath(level, ent, {x: cx, y: cy});
            for (const p of path) {
                protectedTiles.add(`${p.x},${p.y}`);
            }
            // Also protect the entrance tile itself
            protectedTiles.add(`${ent.x},${ent.y}`);
        }
        
        // Also connect entrances to each other (optional, but good for flow)
        // For simple rooms, center connection is usually enough.

        return protectedTiles;
    }

    /**
     * Find a walkable path between two points using BFS
     * Avoids walls, water, chasms (but includes Floor, DeepSnow, Ice)
     */
    private findPath(level: Level, start: {x: number, y: number}, end: {x: number, y: number}): {x: number, y: number}[] {
        // Optimization: direct check if start/end are same
        if (start.x === end.x && start.y === end.y) return [{x: start.x, y: start.y}];

        const queue: {x: number, y: number, path: {x: number, y: number}[]}[] = [];
        queue.push({x: start.x, y: start.y, path: []});
        
        const visited = new Set<string>();
        visited.add(`${start.x},${start.y}`);
        
        // Limit BFS search depth/size to prevent hanging on weird maps
        let steps = 0;
        const maxSteps = 500; 
        
        while (queue.length > 0 && steps < maxSteps) {
            steps++;
            const current = queue.shift()!;
            const {x, y, path} = current;
            
            // Check if reached target (or adjacent to target if target is solid?) 
            // Assuming target is walkable center
            if (x === end.x && y === end.y) {
                return [...path, {x, y}];
            }
            
            // Neighbors (4-way)
            const neighbors = [
                {x: x+1, y: y}, {x: x-1, y: y},
                {x: x, y: y+1}, {x: x, y: y-1}
            ];
            
            for (const n of neighbors) {
                const key = `${n.x},${n.y}`;
                if (visited.has(key)) continue;
                
                if (n.x < 0 || n.x >= level.width || n.y < 0 || n.y >= level.height) continue;
                
                // Terrain check - specific to Decor placement needs
                // We want to pathfind through WALKABLE tiles.
                // Water/Chasm/Wall are NOT walkable.
                const terrain = level.getTile(n.x, n.y);
                if (terrain === TerrainType.Wall || 
                    terrain === TerrainType.Water || 
                    terrain === TerrainType.Chasm) {
                    continue;
                }
                
                visited.add(key);
                queue.push({x: n.x, y: n.y, path: [...path, {x, y}]});
            }
        }
        
        // If we failed to find a path, fall back to Manhattan (maybe they are disconnected by design or bad gen)
        // But for "Protected Tiles", if there's no path, there's nothing to protect.
        return [];
    }

    /**
     * @deprecated Replaced by findPath BFS
     */
    private manhattanLine(x0: number, y0: number, x1: number, y1: number, callback: (x: number, y: number) => void) {
        // ... kept for compatibility if needed, but unused now
    }

    private paintDecorConfig(level: Level, room: Room, configs: DecorConfig[]): void {
        Logger.debug(`[DecorSystem] Painting decor for room ${room.roomType} at ${room.x},${room.y}`);
        const spawnMultiplier = 2.5; // Increase spawn rate by 150% for better decoration density
        
        // Determine if room is indoor or outdoor based on center tile material
        const centerX = room.x + Math.floor(room.width / 2);
        const centerY = room.y + Math.floor(room.height / 2);
        const roomMaterial = level.getMaterial(centerX, centerY);
        const isOutdoor = roomMaterial === MaterialType.Snow || roomMaterial === MaterialType.Ice;
        
        // Items that should only appear outdoors
        const outdoorOnlyItems = [
            'tree_pine', 'tree_pine_small', 'tree_dead', 'bush_frozen', 'rock_snow', 
            'snowman_prop', 'ice_crystal_snow', 'log_pile_snow', 'snow_mound', 'snow_patch',
            'streetlamp', 'shovel_snow'
        ];
        
        // Items that should only appear indoors
        const indoorOnlyItems = [
            'rug_red', 'rug_green', 'carpet', 'table', 'chair', 'bed', 'bookshelf',
            'cabinet', 'painting', 'mirror', 'clock', 'candle', 'lantern_ground'
        ];
        
        for (const config of configs) {
            // Filter out outdoor-only items from indoor rooms
            if (!isOutdoor && outdoorOnlyItems.some(outdoor => config.itemId.includes(outdoor))) {
                Logger.debug(`[DecorSystem] Skipped ${config.itemId} - outdoor item in indoor room (material: ${roomMaterial})`);
                continue;
            }
            
            // Filter out indoor-only items from outdoor rooms
            if (isOutdoor && indoorOnlyItems.some(indoor => config.itemId.includes(indoor))) {
                Logger.debug(`[DecorSystem] Skipped ${config.itemId} - indoor item in outdoor room (material: ${roomMaterial})`);
                continue;
            }
            
            // Apply multiplier, capped at 1.0
            const probability = Math.min(1.0, config.probability * spawnMultiplier);
            
            if (Math.random() > probability) {
                Logger.debug(`[DecorSystem] Skipped ${config.itemId} due to probability`);
                continue;
            }

            // Check room size constraints
            if (config.minRoomSize) {
                if (room.width < config.minRoomSize.width || room.height < config.minRoomSize.height) {
                    Logger.debug(`[DecorSystem] Skipped ${config.itemId} due to size`);
                    continue;
                }
            }

            Logger.debug(`[DecorSystem] Attempting to place ${config.itemId} (${config.type})`);
            if (config.type === 'large_item') {
                this.placeLargeItem(level, room, config);
            } else if (config.type === 'small_item') {
                this.placeSmallItem(level, room, config);
            }
        }
    }

    // --- Placement Primitives ---

    private placeLargeItem(level: Level, room: Room, config: DecorConfig): void {
        // Look up definition for size
        const def = DecorDefinitions[config.itemId as DecorID];
        const width = def?.width || 3;
        const height = def?.height || 3;
        const itemSize = Math.max(width, height);

        // Smart placement based on item type
        if (config.itemId.includes('ice') || config.itemId.includes('water')) {
            this.placeNearWater(level, room, config.itemId, itemSize);
            return;
        }

        if (config.placement === 'center') {
            this.placeItemInCenter(level, room, config.itemId, itemSize);
        } else if (config.placement === 'random') {
            this.placeItemRandomly(level, room, config.itemId, itemSize);
        }
    }

    private placeSmallItem(level: Level, room: Room, config: DecorConfig): void {
        // Smart placement overrides
        if (config.itemId.includes('ice') || config.itemId.includes('water')) {
            this.placeNearWater(level, room, config.itemId, 1);
            return;
        }

        if (config.placement === 'wall') {
            this.placeAgainstWall(level, room, [config.itemId], 1.0, 1);
        } else if (config.placement === 'corner') {
            this.placeCornerDecor(level, room, [config.itemId], 1.0);
        } else if (config.placement === 'random') {
            this.placeRandomClutter(level, room, [config.itemId], 1.0, 1);
        }
    }

    private placeNearWater(level: Level, room: Room, itemId: string, size: number): void {
        // Try to find a spot adjacent to water (or ice/chasm)
        for (let i = 0; i < 20; i++) {
            const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2 - size));
            const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2 - size));

            if (this.isAreaClear(level, x, y, size, size) && this.isAdjacentToTerrain(level, x, y, size, size, [TerrainType.Water, TerrainType.Chasm])) {
                this.placeUnifiedItem(level, x, y, itemId);
                return;
            }
        }
        // Fallback to random if no water found
        this.placeItemRandomly(level, room, itemId, size);
    }

    private placeAgainstSpecificWall(level: Level, room: Room, itemIds: string[], wallIndex: number, count: number): void {
        // wallIndex: 0=Top, 1=Bottom, 2=Left, 3=Right
        // Target the actual wall tiles (outside the floor area)
        let placed = 0;
        for (let i = 0; i < 20; i++) {
            if (placed >= count) break;
            
            let x = 0, y = 0;
            if (wallIndex === 0) { // Top Wall (y - 1)
                x = room.x + Math.floor(Math.random() * room.width);
                y = room.y - 1;
            } else if (wallIndex === 1) { // Bottom Wall (y + height)
                x = room.x + Math.floor(Math.random() * room.width);
                y = room.y + room.height;
            } else if (wallIndex === 2) { // Left Wall (x - 1)
                x = room.x - 1;
                y = room.y + Math.floor(Math.random() * room.height);
            } else { // Right Wall (x + width)
                x = room.x + room.width;
                y = room.y + Math.floor(Math.random() * room.height);
            }

            // Allow walls for wall items
            if (this.isAreaClear(level, x, y, 1, 1, undefined, true)) {
                const itemId = itemIds[Math.floor(Math.random() * itemIds.length)];
                this.placeUnifiedItem(level, x, y, itemId);
                placed++;
            }
        }
    }

    private placeItemInCenter(level: Level, room: Room, itemId: string, itemSize: number): void {
        const centerX = room.x + Math.floor(room.width / 2);
        const centerY = room.y + Math.floor(room.height / 2);
        
        const startX = centerX - Math.floor(itemSize / 2);
        const startY = centerY - Math.floor(itemSize / 2);

        if (this.isAreaClear(level, startX, startY, itemSize, itemSize)) {
            this.placeUnifiedItem(level, startX, startY, itemId);
        }
    }

    private placeItemRandomly(level: Level, room: Room, itemId: string, itemSize: number): void {
        for (let i = 0; i < 5; i++) {
            const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2 - itemSize));
            const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2 - itemSize));

            if (this.isAreaClear(level, x, y, itemSize, itemSize)) {
                this.placeUnifiedItem(level, x, y, itemId);
                return;
            }
        }
    }

    private getItemPlacement(id: string): 'floor' | 'wall' {
        if (DecorDefinitions[id as DecorID]) {
            return DecorDefinitions[id as DecorID].placement || 'floor';
        }
        const interactableDef = DataManager.instance.query<InteractableDefinition>('interactable', id);
        if (interactableDef) {
            return interactableDef.placement || 'floor';
        }
        return 'floor';
    }
    /**
     * Place items ON actual wall tiles (torches, paintings, banners)
     * For items with placement='wall' in their definition
     */
    private placeOnWall(level: Level, room: Room, itemIds: string[], probability: number): void {
        // Get wall tiles around room perimeter
        const wallPositions: {x: number, y: number}[] = [];
        
        // Top wall (y = room.y - 1)
        for (let x = room.x; x < room.x + room.width; x++) {
            const wallY = room.y - 1;
            if (level.getTile(x, wallY) === TerrainType.Wall) {
                wallPositions.push({x, y: wallY});
            }
        }
        // Bottom wall (y = room.y + room.height)
        for (let x = room.x; x < room.x + room.width; x++) {
            const wallY = room.y + room.height;
            if (level.getTile(x, wallY) === TerrainType.Wall) {
                wallPositions.push({x, y: wallY});
            }
        }
        // Left wall (x = room.x - 1)
        for (let y = room.y; y < room.y + room.height; y++) {
            const wallX = room.x - 1;
            if (level.getTile(wallX, y) === TerrainType.Wall) {
                wallPositions.push({x: wallX, y});
            }
        }
        // Right wall (x = room.x + room.width)
        for (let y = room.y; y < room.y + room.height; y++) {
            const wallX = room.x + room.width;
            if (level.getTile(wallX, y) === TerrainType.Wall) {
                wallPositions.push({x: wallX, y});
            }
        }
        
        console.log(`[DecorSystem.placeOnWall] Room (${room.x},${room.y}) size ${room.width}x${room.height}: Found ${wallPositions.length} wall positions for items: ${itemIds.join(', ')}`);
        
        // Shuffle positions for randomness
        for (let i = wallPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [wallPositions[i], wallPositions[j]] = [wallPositions[j], wallPositions[i]];
        }
        
        // Calculate target count: roughly 1 item per 3-4 wall tiles, min 2, max 8
        const targetCount = Math.max(2, Math.min(8, Math.floor(wallPositions.length / 3)));
        
        let placedCount = 0;
        let attempts = 0;
        const maxAttempts = wallPositions.length * 2; // Try each position multiple times if needed
        
        while (placedCount < targetCount && attempts < maxAttempts && wallPositions.length > 0) {
            // Pick a wall position
            const posIndex = attempts % wallPositions.length;
            const pos = wallPositions[posIndex];
            
            const itemId = itemIds[Math.floor(Math.random() * itemIds.length)];
            console.log(`[DecorSystem.placeOnWall] 🔍 Attempting to place "${itemId}" at wall position (${pos.x}, ${pos.y})`);
            const beforeCount = level.decor.length + level.interactables.length;
            this.placeUnifiedItem(level, pos.x, pos.y, itemId);
            const afterCount = level.decor.length + level.interactables.length;
            
            if (afterCount > beforeCount) {
                placedCount++;
                console.log(`[DecorSystem.placeOnWall] ✅ Placed ${itemId} on wall at grid (${pos.x}, ${pos.y}) [${placedCount}/${targetCount}]`);
                // Remove this position and nearby positions to avoid clustering
                wallPositions.splice(posIndex, 1);
                // Also remove adjacent positions
                for (let i = wallPositions.length - 1; i >= 0; i--) {
                    const otherPos = wallPositions[i];
                    if (Math.abs(otherPos.x - pos.x) <= 1 && Math.abs(otherPos.y - pos.y) <= 1) {
                        wallPositions.splice(i, 1);
                    }
                }
            } else {
                console.log(`[DecorSystem.placeOnWall] ❌ placeUnifiedItem didn't add "${itemId}" at (${pos.x}, ${pos.y})`);
                // Remove this position since it can't be used
                wallPositions.splice(posIndex, 1);
            }
            
            attempts++;
        }
        
        console.log(`[DecorSystem.placeOnWall] Total placed: ${placedCount}/${targetCount} wall items`);
    }

    /**
     * Place items on floor tiles adjacent to walls (bookshelves, cabinets)
     * For items that should be on the floor but against walls
     */
    private placeAdjacentToWall(level: Level, room: Room, itemIds: string[], probability: number): void {
        // Get floor tiles adjacent to walls (inner perimeter of room)
        const floorPositions: {x: number, y: number}[] = [];
        
        // Top edge floor tiles (y = room.y)
        for (let x = room.x; x < room.x + room.width; x++) {
            const wallY = room.y - 1;
            if (level.getTile(x, wallY) === TerrainType.Wall) {
                floorPositions.push({x, y: room.y});
            }
        }
        // Bottom edge floor tiles (y = room.y + room.height - 1)
        for (let x = room.x; x < room.x + room.width; x++) {
            const wallY = room.y + room.height;
            if (level.getTile(x, wallY) === TerrainType.Wall) {
                floorPositions.push({x, y: room.y + room.height - 1});
            }
        }
        // Left edge floor tiles (x = room.x)
        for (let y = room.y; y < room.y + room.height; y++) {
            const wallX = room.x - 1;
            if (level.getTile(wallX, y) === TerrainType.Wall) {
                floorPositions.push({x: room.x, y});
            }
        }
        // Right edge floor tiles (x = room.x + room.width - 1)
        for (let y = room.y; y < room.y + room.height; y++) {
            const wallX = room.x + room.width;
            if (level.getTile(wallX, y) === TerrainType.Wall) {
                floorPositions.push({x: room.x + room.width - 1, y});
            }
        }
        
        // Place items on floor tiles
        for (const pos of floorPositions) {
            if (Math.random() < probability) {
                const itemId = itemIds[Math.floor(Math.random() * itemIds.length)];
                this.placeUnifiedItem(level, pos.x, pos.y, itemId);
            }
        }
    }

    /**
     * @deprecated Use placeOnWall or placeAdjacentToWall instead
     */
    private placeWallPerimeter(level: Level, room: Room, itemIds: string[], probability: number): void {
        // Delegate to new methods based on item placement type
        const wallItems = itemIds.filter(id => this.getItemPlacement(id) === 'wall');
        const floorItems = itemIds.filter(id => this.getItemPlacement(id) !== 'wall');
        
        if (wallItems.length > 0) {
            this.placeOnWall(level, room, wallItems, probability);
        }
        if (floorItems.length > 0) {
            this.placeAdjacentToWall(level, room, floorItems, probability);
        }
    }

    /**
     * Place items randomly along the inner floor perimeter (the floor tiles adjacent to walls)
     * This is for furniture like cabinets, bookshelves, etc. that should be on the floor near walls
     */
    private placeAlongFloorPerimeter(level: Level, room: Room, itemIds: string[], count: number): void {
        // Collect all valid perimeter floor positions (1 tile inside the room)
        const perimeterPositions: {x: number, y: number}[] = [];
        
        // Top edge (y = room.y)
        for (let x = room.x; x < room.x + room.width; x++) {
            perimeterPositions.push({x, y: room.y});
        }
        // Bottom edge (y = room.y + room.height - 1)
        for (let x = room.x; x < room.x + room.width; x++) {
            perimeterPositions.push({x, y: room.y + room.height - 1});
        }
        // Left edge (x = room.x), excluding corners already added
        for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
            perimeterPositions.push({x: room.x, y});
        }
        // Right edge (x = room.x + room.width - 1), excluding corners already added
        for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
            perimeterPositions.push({x: room.x + room.width - 1, y});
        }
        
        // Shuffle positions
        for (let i = perimeterPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [perimeterPositions[i], perimeterPositions[j]] = [perimeterPositions[j], perimeterPositions[i]];
        }
        
        // Place up to count items
        let placed = 0;
        for (const pos of perimeterPositions) {
            if (placed >= count) break;
            
            const itemId = itemIds[Math.floor(Math.random() * itemIds.length)];
            
            // Check if we can place here (placeUnifiedItem does internal checks)
            const beforeDecorCount = level.decor.length;
            this.placeUnifiedItem(level, pos.x, pos.y, itemId);
            
            // Check if placement succeeded
            if (level.decor.length > beforeDecorCount || level.interactables.length > beforeDecorCount) {
                placed++;
                Logger.debug(`[DecorSystem] Placed ${itemId} at (${pos.x}, ${pos.y}) - ${placed}/${count}`);
            }
        }
        
        Logger.info(`[DecorSystem] FloorPerimeter: placed ${placed}/${count} items in room at (${room.x}, ${room.y})`);
    }

    private placeAgainstWall(level: Level, room: Room, itemIds: string[], probability: number, count: number = 999): void {
        let placed = 0;
        // Try random wall positions
        for (let i = 0; i < 20; i++) {
            if (placed >= count) break;
            
            // Pick a wall (Top, Bottom, Left, Right)
            const wall = Math.floor(Math.random() * 4);
            let x = 0, y = 0;
            
            if (wall === 0) { // Top (y - 1)
                x = room.x + Math.floor(Math.random() * room.width);
                y = room.y - 1;
            } else if (wall === 1) { // Bottom (y + height)
                x = room.x + Math.floor(Math.random() * room.width);
                y = room.y + room.height;
            } else if (wall === 2) { // Left (x - 1)
                x = room.x - 1;
                y = room.y + Math.floor(Math.random() * room.height);
            } else { // Right (x + width)
                x = room.x + room.width;
                y = room.y + Math.floor(Math.random() * room.height);
            }

            // if (this.isAreaClear(level, x, y, 1, 1, undefined, true)) { // Removed to allow priority
            if (Math.random() < probability) {
                const itemId = itemIds[Math.floor(Math.random() * itemIds.length)];
                this.placeUnifiedItem(level, x, y, itemId);
                placed++;
            }
            // }
        }
    }

    private placeCornerDecor(level: Level, room: Room, itemIds: string[], probability: number): void {
        // Use INNER corners (floor tiles), not room bounds (walls)
        const corners = [
            { x: room.x + 1, y: room.y + 1 },                              // Top-left inner
            { x: room.x + room.width - 2, y: room.y + 1 },                 // Top-right inner
            { x: room.x + 1, y: room.y + room.height - 2 },                // Bottom-left inner
            { x: room.x + room.width - 2, y: room.y + room.height - 2 }    // Bottom-right inner
        ];

        for (const c of corners) {
            if (Math.random() < probability) {
                // Check if placeable - this respects protected tiles (corridors)
                if (!level.isPlaceableForDecor(c.x, c.y, true, false)) continue;
                
                const itemId = itemIds[Math.floor(Math.random() * itemIds.length)];
                this.placeUnifiedItem(level, c.x, c.y, itemId);
            }
        }
    }

    private placeRandomClutter(level: Level, room: Room, itemIds: string[], probability: number, count: number = 5): void {
        for (let i = 0; i < count; i++) {
            if (Math.random() > probability) continue;
            
            const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
            const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2));

            // Trust placeUnifiedItem logic
            const itemId = itemIds[Math.floor(Math.random() * itemIds.length)];
            this.placeUnifiedItem(level, x, y, itemId);
        }
    }

    private placeSetPiece(level: Level, room: Room, type: string, probability: number): void {
        if (Math.random() > probability) return;

        if (type === 'dining_table') {
            // Table in center + chairs
            const cx = room.x + Math.floor(room.width / 2);
            const cy = room.y + Math.floor(room.height / 2);
            
            if (true) { // Was isAreaClear
                this.placeUnifiedItem(level, cx, cy, DecorID.TableRectSnow);
                // Chairs - let them try to place
                this.placeUnifiedItem(level, cx, cy-1, DecorID.ChairBackSnow);
                this.placeUnifiedItem(level, cx, cy+1, DecorID.ChairFrontSnow);
            }
        } else if (type === 'reading_nook') {
             const cx = room.x + Math.floor(room.width / 2);
             const cy = room.y + Math.floor(room.height / 2);
             if (this.isAreaClear(level, cx, cy, 1, 1)) {
                 this.placeUnifiedItem(level, cx, cy, DecorID.TableRoundSnow);
                 if (this.isAreaClear(level, cx+1, cy, 1, 1)) this.placeUnifiedItem(level, cx+1, cy, DecorID.ChairFrontSnow);
             }
        } else if (type === 'workbench') {
            const cx = room.x + Math.floor(room.width / 2);
            const cy = room.y + Math.floor(room.height / 2);
            if (this.isAreaClear(level, cx, cy, 1, 1)) {
                this.placeUnifiedItem(level, cx, cy, DecorID.TableRect);
            }
        }
    }

    private getItemPriority(id: string): number {
        // High priority: Interactables (Chests, Doors, special items)
        if (InteractableID[id as keyof typeof InteractableID] || Object.values(InteractableID).includes(id as any)) {
            // Very high priority for critical interactables
            // exit_portal is not in InteractableID yet, checking blindly for now
            if (id === InteractableID.BOSS_CHEST || id === 'exit_portal' || id === InteractableID.StairsDown || id === InteractableID.StairsUp) {
                return 100;
            }
            // Standard interactables
            return 80;
        }
        
        // Medium priority: Wall items (Torches, Paintings) and special large decor
        const decorDef = DecorDefinitions[id as DecorID];
        if (decorDef) {
            if (decorDef.placement === 'wall') return 60;
            if (decorDef.width && decorDef.width > 1) return 50; // Large items
            if (decorDef.blocksMovement) return 40; // Obstacles (crates, barrels)
        }
        
        // Low priority: Floor clutter (small rocks, pebbles, grass)
        return 10;
    }

    private placeUnifiedItem(level: Level, x: number, y: number, id: string): void {
        const newPriority = this.getItemPriority(id);

        // Check for existing entities at primary position
        const existingInteractable = level.getInteractableAt(x, y);
        const existingDecorList = level.getDecorAt(x, y);

        if (existingInteractable) {
            const existingPriority = this.getItemPriority(existingInteractable.definition.id);
            if (newPriority <= existingPriority) {
                // Logger.debug(`[DecorSystem] Skipping ${id} (P:${newPriority}) - blocked by ${existingInteractable.definition.id} (P:${existingPriority})`);
                return;
            }
            // Overwrite: Remove existing
            level.removeInteractable(existingInteractable);
            Logger.debug(`[DecorSystem] Overwriting ${existingInteractable.definition.id} with higher priority ${id}`);
        }

        if (existingDecorList.length > 0) {
            for (const d of existingDecorList) {
                const existingPriority = this.getItemPriority(d.decorId);
                if (newPriority <= existingPriority) {
                    // Logger.debug(`[DecorSystem] Skipping ${id} (P:${newPriority}) - blocked by ${d.decorId} (P:${existingPriority})`);
                    return;
                }
                // Overwrite
                level.removeDecor(d);
                Logger.debug(`[DecorSystem] Overwriting decor ${d.decorId} with higher priority ${id}`);
            }
        }


        // Check if it's a DecorID
        if (DecorDefinitions[id as DecorID]) {
            const def = DecorDefinitions[id as DecorID];
            const width = def.width || 1;

            const height = def.height || 1;
            const allowWalls = def.placement === 'wall';
            const blocksMovement = def.blocksMovement ?? false;
            
            // Check if all tiles in the area are placeable
            for (let ix = x; ix < x + width; ix++) {
                for (let iy = y; iy < y + height; iy++) {
                    if (!level.isPlaceableForDecor(ix, iy, blocksMovement, allowWalls)) {
                        console.log(`[DecorSystem.placeUnifiedItem] ❌ Can't place decor ${id} at (${ix},${iy}) - isPlaceableForDecor=false, allowWalls=${allowWalls}, blocksMovement=${blocksMovement}, terrain=${level.getTile(ix,iy)}`);
                        return; // Can't place here
                    }
                }
            }

            this.createDecorationEntity(level, x, y, width, height, id);
            console.log(`[DecorSystem.placeUnifiedItem] ✅ Placed decor ${id} at (${x},${y})`);
        } 
        // Check if it's an InteractableID
        else if (id in InteractableID || Object.values(InteractableID).includes(id as InteractableID)) {
            const def = DataManager.instance.query<InteractableDefinition>('interactable', id);
            if (def) {
                const interactableWidth = def.size?.width || 1;
                const interactableHeight = def.size?.height || 1;
                const allowWalls = def.placement === 'wall';
                const blocksMovement = def.blocking ?? false;
                
                // Check if all tiles in the area are placeable
                for (let ix = x; ix < x + interactableWidth; ix++) {
                    for (let iy = y; iy < y + interactableHeight; iy++) {
                        if (!level.isPlaceableForDecor(ix, iy, blocksMovement, allowWalls)) {
                            console.log(`[DecorSystem.placeUnifiedItem] ❌ Can't place ${id} at (${ix},${iy}) - isPlaceableForDecor=false, allowWalls=${allowWalls}, blocksMovement=${blocksMovement}, terrain=${level.getTile(ix,iy)}`);
                            return; // Can't place here
                        }
                    }
                }

                const entity = new InteractableEntity(new ex.Vector(x, y), def, { levelId: level.levelId });
                level.addInteractable(entity);
                console.log(`[DecorSystem.placeUnifiedItem] ✅ Placed interactable ${id} at (${x},${y})`);
            } else {
                Logger.warn(`[DecorSystem] Missing definition for interactable ${id}`);
            }
        } else {
            Logger.warn(`[DecorSystem] Unknown item ID for unified placement: ${id}`);
        }
    }

    // --- Interactable Helpers ---

    private spawnInteractable(level: Level, x: number, y: number, type: InteractableID): void {
        // This method is now deprecated as placeUnifiedItem handles interactables directly.
        // However, if it's still called, we'll ensure the area is clear and then emit the event.
        // For now, we'll just call placeUnifiedItem to ensure consistent logic.
        this.placeUnifiedItem(level, x, y, type);
    }

    // --- Terrain Helpers ---

    private paintTerrainPatch(level: Level, room: Room, type: TerrainType, density: number): void {
        for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
            for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
                if (Math.random() < density) {
                    level.terrainData[x][y] = type;
                }
            }
        }
    }

    private createPerimeter(level: Level, room: Room, itemIds: string[], inset: number): void {
        const x1 = room.x + inset;
        const y1 = room.y + inset;
        const x2 = room.x + room.width - 1 - inset;
        const y2 = room.y + room.height - 1 - inset;
        
        // Helper to get item ID
        const getItem = (index: number) => {
            if (itemIds.length >= 3) return itemIds[index];
            return itemIds[Math.floor(Math.random() * itemIds.length)];
        };

        // Horizontal
        for (let x = x1; x <= x2; x++) {
            this.placeUnifiedItem(level, x, y1, getItem(0)); // Top
            this.placeUnifiedItem(level, x, y2, getItem(0)); // Bottom
        }
        // Vertical
        for (let y = y1; y <= y2; y++) {
            this.placeUnifiedItem(level, x1, y, getItem(1)); // Left
            this.placeUnifiedItem(level, x2, y, getItem(1)); // Right
        }
        // Corners
        this.placeUnifiedItem(level, x1, y1, getItem(2));
        this.placeUnifiedItem(level, x2, y1, getItem(2));
        this.placeUnifiedItem(level, x1, y2, getItem(2));
        this.placeUnifiedItem(level, x2, y2, getItem(2));
    }

    private isAreaClear(level: Level, x: number, y: number, w: number, h: number, protectedTiles?: Set<string>, allowWalls: boolean = false): boolean {
        for (let ix = x; ix < x + w; ix++) {
            for (let iy = y; iy < y + h; iy++) {
                // Check bounds
                if (!level.inBounds(ix, iy)) return false;

                // Check for walls (unless allowed)
                if (!allowWalls && level.getTile(ix, iy) === TerrainType.Wall) return false;

                // Check basic occupancy (entities)
                if (level.isOccupied(ix, iy)) return false;
                
                // Check protected tiles
                if (protectedTiles && protectedTiles.has(`${ix},${iy}`)) return false;

                // Check for existing decor
                const decor = level.getDecorAt(ix, iy);
                if (decor.length > 0) return false;

                // Check for existing interactables
                const interactable = level.getInteractableAt(ix, iy);
                if (interactable) return false;
            }
        }
        return true;
    }

    private isAdjacentToTerrain(level: Level, x: number, y: number, w: number, h: number, types: TerrainType[]): boolean {
        for (let ix = x - 1; ix <= x + w; ix++) {
            for (let iy = y - 1; iy <= y + h; iy++) {
                // Skip the area itself
                if (ix >= x && ix < x + w && iy >= y && iy < y + h) continue;
                
                if (level.inBounds(ix, iy)) {
                    const tile = level.getTile(ix, iy);
                    if (types.includes(tile)) return true;
                }
            }
        }
        return false;
    }

    private createDecorationEntity(level: Level, x: number, y: number, w: number, h: number, itemId: string, isLarge: boolean = false): void {
        const definition = DecorDefinitions[itemId];
        if (!definition) {
            Logger.warn(`[DecorSystem] Missing definition for decor ${itemId}`);
            return;
        }

        // Use definition size if available, otherwise use passed size
        const widthInTiles = definition.width || w;
        const heightInTiles = definition.height || h;

        const pixelX = x * 32;
        const pixelY = y * 32;
        const pixelW = widthInTiles * 32;
        const pixelH = heightInTiles * 32;

        const actor = new DecorEntity(ex.vec(pixelX, pixelY), definition, itemId, pixelW, pixelH);
        
        // Re-run setupGraphics if size changed (for NineSlice)
        if (isLarge) {
             if (definition.type === GraphicType.NineSlice) {
                 actor.graphics.use(GraphicsManager.instance.getNineSliceSprite(itemId, pixelW, pixelH));
             }
        }

        // Add to level decor list instead of scene directly
        // This ensures it gets added to the scene when the level is fully initialized
        level.addDecor(actor);
        
        Logger.debug(`[DecorSystem] Placed ${itemId} at ${pixelX},${pixelY}`);
    }

    private paintPrefab(level: Level, room: Room, prefab: PrefabConfig): void {
        Logger.debug(`[DecorSystem] Painting prefab in room ${room.roomType}`);

        // 1. Paint Layout (Tiles)
        for (let y = 0; y < prefab.height; y++) {
            const row = prefab.layout[y];
            for (let x = 0; x < prefab.width; x++) {
                const char = row[x];
                const terrain = prefab.legend[char];
                if (terrain) {
                    // Center the prefab in the room
                    const offsetX = Math.floor((room.width - prefab.width) / 2);
                    const offsetY = Math.floor((room.height - prefab.height) / 2);
                    
                    const worldX = room.x + offsetX + x;
                    const worldY = room.y + offsetY + y;

                    if (level.inBounds(worldX, worldY)) {
                        level.terrainData[worldX][worldY] = terrain;
                    }
                }
            }
        }

        // 2. Place Actors
        if (prefab.actors) {
            for (const actorDef of prefab.actors) {
                const offsetX = Math.floor((room.width - prefab.width) / 2);
                const offsetY = Math.floor((room.height - prefab.height) / 2);
                const worldX = room.x + offsetX + actorDef.position.x;
                const worldY = room.y + offsetY + actorDef.position.y;
                
                EventBus.instance.emit(GameEventNames.ActorCreate, new FactoryCreateEvent(
                    actorDef.actorId,
                    { position: ex.vec(worldX, worldY), level, properties: actorDef.properties }
                ));
            }
        }

        // 3. Place Interactables
        if (prefab.interactables) {
            for (const intDef of prefab.interactables) {
                const offsetX = Math.floor((room.width - prefab.width) / 2);
                const offsetY = Math.floor((room.height - prefab.height) / 2);
                const pos = intDef.position;
                const wx = room.x + offsetX + pos.x;
                const wy = room.y + offsetY + pos.y;

                EventBus.instance.emit(GameEventNames.InteractableCreate, new FactoryCreateEvent(
                    intDef.interactableId,
                    { position: ex.vec(wx, wy), level, properties: intDef.properties }
                ));
            }
        }

        // 4. Place Items
        if (prefab.items) {
             for (const itemDef of prefab.items) {
                if (itemDef.probability && Math.random() > itemDef.probability) continue;

                const offsetX = Math.floor((room.width - prefab.width) / 2);
                const offsetY = Math.floor((room.height - prefab.height) / 2);
                const pos = itemDef.position;
                const wx = room.x + offsetX + pos.x;
                const wy = room.y + offsetY + pos.y;

                // Spawn item entity
                EventBus.instance.emit(GameEventNames.ItemCreate, new FactoryCreateEvent(
                    itemDef.itemId,
                    { position: ex.vec(wx, wy), level, count: itemDef.count }
                ));
             }
        }
    }



    public paintCorridors(level: Level, biome: BiomeDefinition): void {
        // Use biome-specific corridor rules if available
        if (biome.corridorRules) {
            // We need to identify corridor tiles first
            const corridorTiles: {x: number, y: number}[] = [];
            for (let x = 0; x < level.width; x++) {
                for (let y = 0; y < level.height; y++) {
                    if (level.getTile(x, y) === TerrainType.Floor) {
                        let inRoom = false;
                        for (const room of level.rooms) {
                            if (room.contains(x, y)) {
                                inRoom = true;
                                break;
                            }
                        }
                        if (!inRoom) {
                            corridorTiles.push({x, y});
                        }
                    }
                }
            }

            // Apply rules to corridor tiles
            // Note: Rules are usually per-room, but here we treat the entire corridor network as one "area"
            // or we iterate per tile?
            // Existing rules are "WallPerimeter", "FloorRandom", etc.
            // "FloorRandom" works well for scattered items.
            // "WallPerimeter" is tricky for corridors.
            
            // Simplified approach: Iterate tiles and apply rules per tile with low probability
            // OR: Adapt paintDecorRules to work on a list of tiles?
            
            // Let's stick to the per-tile iteration for now, but use the rules to define WHAT to place
            
            for (const tile of corridorTiles) {
                this.paintCorridorTileFromRules(level, tile.x, tile.y, biome.corridorRules);
            }
        } else {
            // Fallback to legacy hardcoded logic
            for (let x = 0; x < level.width; x++) {
                for (let y = 0; y < level.height; y++) {
                    if (level.getTile(x, y) === TerrainType.Floor) {
                        let inRoom = false;
                        for (const room of level.rooms) {
                            if (room.contains(x, y)) {
                                inRoom = true;
                                break;
                            }
                        }
                        if (!inRoom) {
                            this.paintCorridorTile(level, x, y);
                        }
                    }
                }
            }
        }
    }

    private paintCorridorTileFromRules(level: Level, x: number, y: number, rules: DecorPlacementRule[]): void {
        for (const rule of rules) {
            if (Math.random() > rule.probability) continue;

            const items = rule.items;
            const item = items[Math.floor(Math.random() * items.length)];

            // Check constraints
            if (!this.checkConstraints(level, x, y, rule)) continue;

            if (rule.placementType === DecorPlacementType.OnWall || rule.placementType === DecorPlacementType.WallTop) {
                 // Check for adjacent walls
                 if (this.hasAdjacentWall(level, x, y)) {
                    this.placeUnifiedItem(level, x, y, item);
                }
            } else if (rule.placementType === DecorPlacementType.FloorRandom || rule.placementType === DecorPlacementType.FloorCenter) {
                if (this.isAreaClear(level, x, y, 1, 1)) {
                    // CRITICAL: Ensure we don't block the path in corridors
                    const def = DecorDefinitions[item as DecorID];
                    const blocks = def?.blocksMovement || false;
                    
                    if (blocks) {
                        // Heuristic: If x%2 === 0 && y%2 === 0, don't place blocking? (Checkerboard pattern preserves paths)
                        if ((x + y) % 2 === 0) {
                             this.placeUnifiedItem(level, x, y, item);
                        }
                    } else {
                        this.placeUnifiedItem(level, x, y, item);
                    }
                }
            } else if (rule.placementType === DecorPlacementType.Linear) {
                // Linear in corridors? Maybe just place single items for now as "Linear" implies a structure
                // But for corridors, we are iterating tiles.
                // If we want linear fences in corridors, we should probably handle it at the corridor level, not tile level.
                // But for now, let's just treat it as random placement if it matches constraints
                 if (this.isAreaClear(level, x, y, 1, 1)) {
                    this.placeUnifiedItem(level, x, y, item);
                 }
            }
        }
    }

    private paintCorridorTile(level: Level, x: number, y: number): void {
        // Determine if outdoor or indoor based on material
        const material = level.getMaterial(x, y);
        const isOutdoor = material === MaterialType.Snow || material === MaterialType.Ice || material === MaterialType.Dirt;
        
        if (isOutdoor) {
            // Outdoor corridor (path)
            if (Math.random() < 0.05) {
                const items = [DecorID.RockSnow, DecorID.BushFrozen, DecorID.Streetlamp];
                const item = items[Math.floor(Math.random() * items.length)];
                if (this.isAreaClear(level, x, y, 1, 1)) {
                    this.placeUnifiedItem(level, x, y, item);
                }
            }
        } else {
            // Indoor corridor (dungeon/building)
            if (Math.random() < 0.05) {
                const items = [DecorID.Rubble, DecorID.Torch, DecorID.Cobweb];
                const item = items[Math.floor(Math.random() * items.length)];
                
                // Cobwebs on walls/corners
                if (item === DecorID.Cobweb) {
                    // Check for adjacent walls
                    if (this.hasAdjacentWall(level, x, y)) {
                        this.placeUnifiedItem(level, x, y, item);
                    }
                } else if (item === DecorID.Torch) {
                     if (this.hasAdjacentWall(level, x, y)) {
                        this.placeUnifiedItem(level, x, y, item);
                    }
                } else {
                    // Rubble on floor
                    if (this.isAreaClear(level, x, y, 1, 1)) {
                        this.placeUnifiedItem(level, x, y, item);
                    }
                }
            }
        }
    }

    private hasAdjacentWall(level: Level, x: number, y: number): boolean {
        return level.getTile(x+1, y) === TerrainType.Wall ||
               level.getTile(x-1, y) === TerrainType.Wall ||
               level.getTile(x, y+1) === TerrainType.Wall ||
               level.getTile(x, y-1) === TerrainType.Wall;
    }
}
