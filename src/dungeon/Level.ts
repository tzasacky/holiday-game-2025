import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';
import { WorldItemEntity } from '../items/WorldItemEntity';
import { Room } from './Room';
import { BiomeDefinition } from '../data/biomes';
import { TerrainType } from '../data/terrain';
import { Trigger } from '../core/Trigger';
import { Logger } from '../core/Logger';
import { CommonTiles } from '../data/commonTiles';
import { InteractableEntity } from '../entities/InteractableEntity';

export class Level {
    public width: number;
    public height: number;
    public levelId: string;
    
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
    public biome: BiomeDefinition;
    public scene: ex.Scene;
    
    // Compatibility properties
    public depth: number = 1;
    public seed: number = 0;
    public explored: any = false;
    public get terrain(): TerrainType[][] { return this.terrainData; }
    public set terrain(v: TerrainType[][]) { this.terrainData = v; }

    constructor(width: number, height: number, biome: BiomeDefinition, scene: ex.Scene, levelId: string = 'level_1') {
        this.width = width;
        this.height = height;
        this.biome = biome;
        this.scene = scene;
        this.levelId = levelId;
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


        scene.add(this.floorMap);
        scene.add(this.objectMap);
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
                    const floorGraphic = graphics.instance.getTileGraphic(TerrainType.Floor, this.biome);
                    floorTile.addGraphic(floorGraphic);
                    floorTile.solid = false; // Floor is never solid
                }

                // Update Object Layer - show terrain features
                const objectTile = this.objectMap.getTile(x, y);
                if (objectTile) {
                    objectTile.clearGraphics();
                    
                    // Only add graphics for non-floor terrain
                    if (terrainType !== TerrainType.Floor) {
                        const objectGraphic = graphics.instance.getTileGraphic(terrainType, this.biome);
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

    public addMob(mob: GameActor) {
        this.mobs.push(mob);
        this.actors.push(mob);
        // Don't add to scene here - GameScene.onActivate will add all actors
        // Don't register with TurnManager here - GameScene will do it
        Logger.info(`[Level] Added mob ${mob.name || 'unnamed'} to level mobs and actors lists`);
    }

    public addItem(item: WorldItemEntity) {
        this.items.push(item);
        this.scene.add(item);
        Logger.info(`[Level] Added item ${item.name || 'unnamed'} to level`);
    }

    public addActor(actor: GameActor) {
        this.actors.push(actor);
        // Don't add to scene here - will be added when scene becomes active in GameScene.onActivate
        // Don't register with TurnManager here either - GameScene will do it
        Logger.info(`[Level] Added actor ${actor.name || 'unnamed'} to level actors list`);
    }

    public addEntity(entity: ex.Actor) {
        this.scene.add(entity);
    }

    public addTrigger(trigger: Trigger) {
        this.triggers.push(trigger);
        this.scene.add(trigger);
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
            if ((a as any).gridPos) {
                 return (a as any).gridPos.x === x && (a as any).gridPos.y === y;
            }
            // Fallback to world pos check
            return Math.floor(a.pos.x / 32) === x && Math.floor(a.pos.y / 32) === y;
        });
    }

    public getInteractableAt(x: number, y: number): InteractableEntity | null {
        // Get all entities from the scene at this position
        const allEntities = this.scene.entities.filter(entity => {
            if (entity instanceof InteractableEntity) {
                const gridPos = entity.gridPos;
                return gridPos.x === x && gridPos.y === y;
            }
            return false;
        });

        return allEntities.length > 0 ? (allEntities[0] as InteractableEntity) : null;
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
        return this.actors.filter(a => !(a as any).isEnemy);
    }

    public getAllEnemies(): GameActor[] {
        return this.actors.filter(a => (a as any).isEnemy);
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
        return this.actors.find(a => a.id.toString() === id || (a as any).entityId === id || a.name === id);
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

        // Check terrain - walls are always solid
        const terrain = this.getTile(x, y);
        if (terrain === TerrainType.Wall) {
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
}
