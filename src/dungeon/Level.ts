import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';
import { WorldItemEntity } from '../items/WorldItemEntity';
import { Room } from './Room';
import { BiomeDefinition } from '../data/biomes';
import { TerrainType } from '../data/terrain';
import { Trigger } from '../core/Trigger';
import { Logger } from '../core/Logger';

export class Level {
    public width: number;
    public height: number;
    
    // Layers
    public floorMap: ex.TileMap; // Z = -1
    public objectMap: ex.TileMap; // Z = 0 (Collision)

    public mobs: GameActor[] = [];
    public actors: GameActor[] = [];
    public triggers: Trigger[] = [];
    public items: WorldItemEntity[] = [];
    public rooms: Room[] = [];
    public spawnPoints: ex.Vector[] = [];
    public exitPoint: ex.Vector | null = null;
    public terrainData: TerrainType[][] = [];
    public biome: BiomeDefinition;
    public scene: ex.Scene;

    constructor(width: number, height: number, biome: BiomeDefinition, scene: ex.Scene) {
        this.width = width;
        this.height = height;
        this.biome = biome;
        this.scene = scene;

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

    public updateTileGraphics() {
        // Initialize sprite sheet if needed
        if (this.biome.visuals.tileset && !this.tilesetSpriteSheet) {
            this.tilesetSpriteSheet = ex.SpriteSheet.fromImageSource({
                image: this.biome.visuals.tileset,
                grid: {
                    rows: 3,
                    columns: 8,
                    spriteWidth: 32,
                    spriteHeight: 32
                }
            });
        }

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const terrainType = this.terrainData[x][y];
                const biomeGraphics = this.biome.visuals.tileGraphics[terrainType];
                
                // Update Floor Layer - always show floor
                const floorTile = this.floorMap.getTile(x, y);
                if (floorTile) {
                    floorTile.clearGraphics();
                    
                    // Use floor graphics from biome
                    const floorGraphics = this.biome.visuals.tileGraphics[TerrainType.Floor];
                    
                    if (this.tilesetSpriteSheet && floorGraphics.spriteIndex !== undefined) {
                         const col = floorGraphics.spriteIndex % 8;
                         const row = Math.floor(floorGraphics.spriteIndex / 8);
                         const sprite = this.tilesetSpriteSheet.getSprite(col, row);
                         if (sprite) floorTile.addGraphic(sprite);
                    } else if (floorGraphics.color) {
                        const rect = new ex.Rectangle({
                            width: 32,
                            height: 32,
                            color: floorGraphics.color
                        });
                        floorTile.addGraphic(rect);
                    }
                    floorTile.solid = false; // Floor is never solid
                }

                // Update Object Layer - show terrain features
                const objectTile = this.objectMap.getTile(x, y);
                if (objectTile) {
                    objectTile.clearGraphics();
                    
                    // Only add graphics for non-floor terrain
                    if (terrainType !== TerrainType.Floor && biomeGraphics) {
                        if (this.tilesetSpriteSheet && biomeGraphics.spriteIndex !== undefined) {
                             const col = biomeGraphics.spriteIndex % 8;
                             const row = Math.floor(biomeGraphics.spriteIndex / 8);
                             const sprite = this.tilesetSpriteSheet.getSprite(col, row);
                             if (sprite) objectTile.addGraphic(sprite);
                        } else if (biomeGraphics.color) {
                            const rect = new ex.Rectangle({
                                width: 32,
                                height: 32,
                                color: biomeGraphics.color
                            });
                            objectTile.addGraphic(rect);
                        }
                    }
                    
                    // Collision is now handled by CollisionSystem via events
                    // Just mark tiles as non-solid since collision logic is event-driven
                    objectTile.solid = false;
                }
            }
        }
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
}
