import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';
import { WorldItemEntity } from '../items/WorldItemEntity';
import { Room } from './Room';
import { BiomeDefinition, MaterialType } from '../data/biomes';
import { TerrainType, TerrainDefinitions } from '../data/terrain';
import { Trigger } from '../core/Trigger';
import { Logger } from '../core/Logger';
import { InteractableEntity } from '../entities/InteractableEntity';
import { SerializedLevel, SerializedActor, SerializedItem, SerializedInteractable } from '../core/GameState';
import { ActorFactory } from '../factories/ActorFactory';
import { ItemFactory } from '../factories/ItemFactory';
import { DataManager } from '../core/DataManager';
import { InteractableDefinition } from '../data/interactables';
import { BiomeDefinitions } from '../data/biomes';
import { BiomeID } from '../constants/BiomeID';

export class Level {
    public width: number;
    public height: number;
    public levelId: string;
    public floorNumber: number;
    
    // Layers
    public floorMap: ex.TileMap; // Z = -1
    public objectMap: ex.TileMap; // Z = 0 (Collision)

    public mobs: GameActor[] = [];
    public actors: GameActor[] = [];
    public triggers: Trigger[] = [];
    public items: WorldItemEntity[] = [];
    public rooms: Room[] = [];
    public entrancePoint: ex.Vector; // Where hero spawns (stairs up on floor 2+, entrance on floor 1)
    public exitPoint: ex.Vector | null = null; // Stairs down
    public terrainData: TerrainType[][] = [];
    public materialData: MaterialType[][] = []; // [NEW] Stores material for each tile
    public biome: BiomeDefinition;
    public scene: ex.Scene | null = null;
    
    // Compatibility properties
    public depth: number = 1;
    public seed: number = 0;
    public explored: any = false;
    public get terrain(): TerrainType[][] { return this.terrainData; }
    public set terrain(v: TerrainType[][]) { this.terrainData = v; }
    
    // Fog-of-war tracking
    public discoveredTiles: Set<string> = new Set(); // Tiles player has seen (persists)
    public visibleTiles: Set<string> = new Set();    // Tiles currently visible (updates each turn)

    constructor(width: number, height: number, biome: BiomeDefinition, levelId: string = 'level_1') {
        this.width = width;
        this.height = height;
        this.biome = biome;
        this.levelId = levelId;
        // Extract floor number from levelId (e.g. "level_1" -> 1)
        const match = levelId.match(/level_(\d+)/);
        this.floorNumber = match ? parseInt(match[1]) : 1;
        this.entrancePoint = ex.vec(0, 0); // Will be set by generator

        // Floor Layer (Background)
        this.floorMap = new ex.TileMap({
            rows: height,
            columns: width,
            tileWidth: 32,
            tileHeight: 32,
        });
        this.floorMap.z = -1;

        // Object Layer (Walls, Doors, Collision)
        this.objectMap = new ex.TileMap({
            rows: height,
            columns: width,
            tileWidth: 32,
            tileHeight: 32,
        });
        this.objectMap.z = 0;
        
        // Initialize terrain data
        this.terrainData = new Array(width).fill(null).map(() => new Array(height).fill(TerrainType.Wall));
        
        // Initialize material data (default to biome default or Stone)
        const defaultMaterial = biome.visuals.defaultMaterial || MaterialType.Stone; 
        this.materialData = new Array(width).fill(null).map(() => new Array(height).fill(defaultMaterial));
    }

    public addToScene(scene: ex.Scene) {
        this.scene = scene;
        scene.add(this.floorMap);
        scene.add(this.objectMap);
        
        // Entities are added by GameScene.setupLevel, but we can ensure they are tracked here if needed
    }

    private tilesetSpriteSheet?: ex.SpriteSheet;

    public async updateTileGraphics(): Promise<void> {
        const graphics = await import('../graphics/TileGraphicsManager').then(m => m.TileGraphicsManager);
        
        // Ensure TileGraphicsManager is initialized
        if (!graphics.instance.isInitialized()) {
            Logger.info('[Level] TileGraphicsManager not initialized, initializing now...');
            await graphics.instance.initialize();
        }

        Logger.info('[Level] Updating tile graphics using TileGraphicsManager');

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const terrainType = this.terrainData[x][y];
                
                // Update Floor Layer - always show floor
                const floorTile = this.floorMap.getTile(x, y);
                if (floorTile) {
                    floorTile.clearGraphics();
                    
                    // Get floor graphics from TileGraphicsManager
                    const material = this.materialData[x][y];
                    const floorGraphic = graphics.instance.getTileGraphic(TerrainType.Floor, this.biome, x, y, material);
                    floorTile.addGraphic(floorGraphic);
                    floorTile.solid = false; // Floor is never solid
                }

                // Update Object Layer - show terrain features
                const objectTile = this.objectMap.getTile(x, y);
                if (objectTile) {
                    objectTile.clearGraphics();
                    
                    // Only add graphics for non-floor terrain
                    if (terrainType !== TerrainType.Floor) {
                        const material = this.materialData[x][y];
                        const objectGraphic = graphics.instance.getTileGraphic(terrainType, this.biome, x, y, material);
                        objectTile.addGraphic(objectGraphic);
                    }
                    
                    // Collision is now handled by CollisionSystem via events
                    // Just mark tiles as non-solid since collision logic is event-driven
                    objectTile.solid = false;
                }
            }
        }
        
        Logger.info('[Level] Tile graphics update complete');
    }

    public interactables: InteractableEntity[] = [];

    public addMob(mob: GameActor) {
        this.mobs.push(mob);
        this.actors.push(mob);
        // Don't add to scene here - GameScene.onActivate will add all actors
        // Don't register with TurnManager here - GameScene will do it
        Logger.info(`[Level] Added mob ${mob.name || 'unnamed'} to level mobs and actors lists`);
    }

    public addItem(item: WorldItemEntity) {
        this.items.push(item);
        if (this.scene) {
            this.scene.add(item);
        }
        Logger.info(`[Level] Added item ${item.name || 'unnamed'} to level`);
    }
    
    public removeItem(item: WorldItemEntity) {
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
            Logger.info(`[Level] Removed item ${item.name || 'unnamed'} from level items list`);
        }
    }


    public addActor(actor: GameActor) {
        this.actors.push(actor);
        // Don't add to scene here - will be added when scene becomes active in GameScene.onActivate
        // Don't register with TurnManager here either - GameScene will do it
        Logger.info(`[Level] Added actor ${actor.name || 'unnamed'} to level actors list`);
    }

    public addInteractable(entity: InteractableEntity) {
        this.interactables.push(entity);
        if (this.scene) {
            this.scene.add(entity);
        }
        Logger.info(`[Level] Added interactable ${entity.name} to level`);
    }

    public addEntity(entity: ex.Actor) {
        if (entity instanceof InteractableEntity) {
            this.addInteractable(entity);
        } else {
            if (this.scene) {
                this.scene.add(entity);
            }
        }
    }

    public addTrigger(trigger: Trigger) {
        this.triggers.push(trigger);
        if (this.scene) {
            this.scene.add(trigger);
        }
    }

    public update(engine: ex.Engine, delta: number) {
        this.triggers.forEach(trigger => {
            if (trigger.update) {
                trigger.update(engine, delta);
            }
        });
    }

    public getTile(x: number, y: number): TerrainType {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return TerrainType.Wall;
        }
        return this.terrainData[x][y];
    }

    public getEntitiesAt(x: number, y: number): ex.Actor[] {
        // This is a naive implementation. For performance, we might want a spatial hash or grid.
        // But for now, filtering the scene actors is okay if the count is low.
        // Better: filter this.actors since we maintain that list.
        return this.actors.filter(a => {
            // Check grid position match
            const gridPos = a.pos.clone().setTo(Math.floor(a.pos.x / 32), Math.floor(a.pos.y / 32));
            // Or if actors have a gridPos property (GameEntity does)
            if (a.gridPos) {
                 return a.gridPos.x === x && a.gridPos.y === y;
            }
            // Fallback to world pos check
            return Math.floor(a.pos.x / 32) === x && Math.floor(a.pos.y / 32) === y;
        });
    }

    public getInteractableAt(x: number, y: number): InteractableEntity | null {
        // Use internal list instead of scene entities
        const interactable = this.interactables.find(entity => {
            const gridPos = entity.gridPos;
            return gridPos.x === x && gridPos.y === y;
        });

        return interactable || null;
    }

    public getItemAt(x: number, y: number): WorldItemEntity | null {
        // Search through items list for items at this position
        return this.items.find(item => {
            if (item.item.gridPos) {
                return item.item.gridPos.x === x && item.item.gridPos.y === y;
            }
            return false;
        }) || null;
    }

    public getItemsAt(x: number, y: number): WorldItemEntity[] {
        // Get all items at this position
        return this.items.filter(item => {
            if (item.item.gridPos) {
                return item.item.gridPos.x === x && item.item.gridPos.y === y;
            }
            return false;
        });
    }

    // Artifact Support Methods
    public getAllEntities(): GameActor[] {
        return this.actors;
    }

    public getAllAllies(): GameActor[] {
        return this.actors.filter(a => !a.hasTag('enemy'));
    }

    public getAllEnemies(): GameActor[] {
        return this.actors.filter(a => a.hasTag('enemy'));
    }

    public getDistance(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    public getEntitiesInRadius(x: number, y: number, radius: number): GameActor[] {
        return this.actors.filter(a => this.getDistance(x, y, a.pos.x, a.pos.y) <= radius);
    }

    public addCelebrationEffects(x: number, y: number, radius: number): void {
        Logger.info(`[Level] Celebration effects at ${x},${y} radius ${radius} - TODO: Implement with effect system`);
    }

    public revealFutureEvents(actor: GameActor): void {
        Logger.info(`[Level] Revealing future events to ${actor.name} - TODO: Implement with UI system`);
    }
    public getActorById(id: string): GameActor | undefined {
        return this.actors.find(a => a.id.toString() === id || a.entityId === id || a.name === id);
    }

    // ===== CENTRALIZED COLLISION API =====
    // These methods provide synchronous, fast collision checks for movement and spawning

    /**
     * Check if position is within level bounds
     */
    public inBounds(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    /**
     * Get actor at specific grid position (fast lookup)
     * @param x Grid X coordinate
     * @param y Grid Y coordinate
     * @returns GameActor at position or null
     */
    public getActorAt(x: number, y: number): GameActor | null {
        for (const actor of this.actors) {
            // Skip killed actors
            if (actor.isKilled && actor.isKilled()) {
                continue;
            }
            if (actor.gridPos.x === x && actor.gridPos.y === y) {
                return actor;
            }
        }
        return null;
    }

    /**
     * Check if a position is walkable (not blocked by terrain or actors)
     * @param x Grid X coordinate
     * @param y Grid Y coordinate
     * @param excludeActorId Optional actor ID to exclude from check (for self-movement)
     * @returns true if position is walkable
     */
    public isWalkable(x: number, y: number, excludeActorId?: string): boolean {
        // Check bounds
        if (!this.inBounds(x, y)) {
            return false;
        }

        // Check terrain solidity from definitions
        const terrain = this.getTile(x, y);
        const terrainDef = TerrainDefinitions[terrain];
        if (terrainDef && terrainDef.isSolid) {
            return false;
        }

        // Check for actors at this position
        const actorAtPos = this.getActorAt(x, y);
        if (actorAtPos && actorAtPos.entityId !== excludeActorId) {
            // Regular actor - blocks movement
            return false;
        }

        // Check for interactable entities that might be blocking
        const interactableAtPos = this.getInteractableAt(x, y);
        if (interactableAtPos) {
            // If it's an interactable, check if it should block movement
            const shouldBlock = interactableAtPos.shouldBlockMovement();
            const isWalkable = !shouldBlock;
            Logger.debug(`[Level.isWalkable] ${interactableAtPos.name} at (${x},${y}) blocking: ${shouldBlock}, walkable: ${isWalkable}, state: ${interactableAtPos.currentState}`);
            return isWalkable;
        }

        return true;
    }

    /**
     * Get movement cost for a position (for pathfinding)
     * @param x Grid X coordinate
     * @param y Grid Y coordinate
     * @returns Movement cost (1 = normal, higher = slower)
     */
    public getMovementCost(x: number, y: number): number {
        if (!this.inBounds(x, y)) {
            return Infinity; // Out of bounds
        }

        const terrain = this.getTile(x, y);

        // Fallback costs for common terrain types
        switch (terrain) {
            case TerrainType.Wall:
                return Infinity; // Impassable
            case TerrainType.DeepSnow:
                return 2; // Slow
            case TerrainType.Water:
                return 2; // Slow
            case TerrainType.Ice:
                return 1; // Normal speed but slippery
            default:
                return 1; // Normal movement
        }
    }

    public setMaterial(x: number, y: number, material: MaterialType): void {
        if (this.inBounds(x, y)) {
            this.materialData[x][y] = material;
        }
    }

    public getMaterial(x: number, y: number): MaterialType {
        if (this.inBounds(x, y)) {
            return this.materialData[x][y];
        }
        return MaterialType.Stone; // Default
    }

    public serialize(): SerializedLevel {
        Logger.info(`[Level] Serializing level ${this.floorNumber}`);
        
        // Serialize Actors
        const serializedActors: SerializedActor[] = [];
        for (const actor of this.actors) {
            if (!actor.isPlayer) {
                // Basic serialization for now - ideally use a method on actor
                serializedActors.push({
                    id: actor.id.toString(),
                    defName: actor.name, // Assuming name matches definition for now
                    x: actor.pos.x,
                    y: actor.pos.y,
                    time: 0,
                    actPriority: 0,
                    isPlayer: false,
                    componentData: {} // TODO: Component serialization
                });
            }
        }

        // Serialize Items
        const serializedItems = this.items.map(itemEntity => ({
            x: itemEntity.item.gridPos?.x || 0,
            y: itemEntity.item.gridPos?.y || 0,
            item: {
                id: itemEntity.item.id,
                name: itemEntity.item.definition.name,
                count: itemEntity.item.count,
                identified: itemEntity.item.identified,
                enchantments: itemEntity.item.enchantments,
                curses: itemEntity.item.curses,
                stackable: itemEntity.item.definition.stackable
            }
        }));

        // Serialize Interactables
        const serializedInteractables: SerializedInteractable[] = this.interactables.map(entity => ({
            id: entity.id.toString(),
            type: entity.definition.id,
            x: entity.gridPos.x,
            y: entity.gridPos.y,
            state: entity.currentState,
            customState: {} // TODO: Custom state
        }));

        return {
            seed: this.seed,
            depth: this.floorNumber,
            width: this.width,
            height: this.height,
            biomeId: this.biome.id,
            terrain: this.terrainData,
            materials: this.materialData,
            actors: serializedActors,
            items: serializedItems,
            interactables: serializedInteractables,
            explored: this.explored || [],
            entrancePoint: this.entrancePoint ? { x: this.entrancePoint.x, y: this.entrancePoint.y } : undefined,
            exitPoint: this.exitPoint ? { x: this.exitPoint.x, y: this.exitPoint.y } : undefined
        };
    }

    public static async deserialize(data: SerializedLevel): Promise<Level> {
        Logger.info(`[Level] Deserializing level ${data.depth}`);
        
        // Restore Biome
        const biome = BiomeDefinitions[data.biomeId as BiomeID] || BiomeDefinitions[BiomeID.SnowyVillage];
        
        // Create Level
        // Create Level
        const level = new Level(data.width, data.height, biome, `level_${data.depth}`);
        level.seed = data.seed;
        level.terrainData = data.terrain;
        level.materialData = data.materials || level.materialData; // Fallback if missing
        level.explored = data.explored;
        
        // Restore entrance and exit points
        if (data.entrancePoint) {
            level.entrancePoint = new ex.Vector(data.entrancePoint.x, data.entrancePoint.y);
        }
        if (data.exitPoint) {
            level.exitPoint = new ex.Vector(data.exitPoint.x, data.exitPoint.y);
        }

        // Restore Actors
        for (const actorData of data.actors) {
             const pos = new ex.Vector(actorData.x, actorData.y);
             // Try to create actor using factory
             const actor = ActorFactory.instance.createActor(actorData.defName, pos);
             if (actor) {
                 level.addActor(actor);
             } else {
                 Logger.warn(`[Level] Failed to restore actor ${actorData.defName} at ${pos}`);
             }
        }
        
        // Restore Items
        for (const itemData of data.items) {
            const pos = new ex.Vector(itemData.x, itemData.y);
            const itemEntity = ItemFactory.instance.createAt(itemData.item.id, pos, itemData.item.count);
            if (itemEntity) {
                // Restore properties
                itemEntity.identified = itemData.item.identified ?? true;
                itemEntity.enchantments = itemData.item.enchantments || [];
                itemEntity.curses = itemData.item.curses || [];
                
                // Create WorldItemEntity
                const worldItem = new WorldItemEntity(pos, itemEntity);
                level.addItem(worldItem);
            }
        }

        // Restore Interactables
        for (const interactableData of data.interactables) {
             const definition = DataManager.instance.query<InteractableDefinition>('interactable', interactableData.type);
             if (definition) {
                 const pos = new ex.Vector(interactableData.x, interactableData.y);
                 const entity = new InteractableEntity(pos, definition, { levelId: level.levelId });
                 entity.setState(interactableData.state);
                 level.addInteractable(entity);
             } else {
                 Logger.warn(`[Level] Failed to restore interactable ${interactableData.type}`);
             }
        }

        await level.updateTileGraphics();
        return level;
    }
}
