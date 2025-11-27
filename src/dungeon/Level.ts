import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';
import { Item } from '../items/Item';
import { Room } from './Room';
import { FloorTheme } from './FloorTheme';
import { TerrainType } from './Terrain';
import { TurnManager } from '../core/TurnManager';
import { Trap } from './Trap';
import { Trigger } from '../mechanics/Trigger';
import { Logger } from '../core/Logger';

export class Level {
    public width: number;
    public height: number;
    
    // Layers
    public floorMap: ex.TileMap; // Z = -1
    public objectMap: ex.TileMap; // Z = 0 (Collision)

    public mobs: GameActor[] = [];
    public actors: GameActor[] = [];
    public triggers: (Trap | Trigger)[] = [];
    public items: Item[] = [];
    public rooms: Room[] = [];
    public spawnPoints: ex.Vector[] = [];
    public exitPoint: ex.Vector | null = null;
    public terrainData: TerrainType[][] = [];
    public theme: FloorTheme;
    public scene: ex.Scene;

    constructor(width: number, height: number, theme: FloorTheme, scene: ex.Scene) {
        this.width = width;
        this.height = height;
        this.theme = theme;
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

    public updateTileGraphics() {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                // Update Floor Layer
                const floorTile = this.floorMap.getTile(x, y);
                if (floorTile) {
                    floorTile.clearGraphics();
                    const graphic = this.theme.getBottomTile(x, y, this);
                    floorTile.addGraphic(graphic);
                    floorTile.solid = false; // Floor is never solid
                }

                // Update Object Layer
                const objectTile = this.objectMap.getTile(x, y);
                if (objectTile) {
                    objectTile.clearGraphics();
                    const graphic = this.theme.getTopTile(x, y, this);
                    if (graphic) {
                        objectTile.addGraphic(graphic);
                    }
                    
                    // Collision Logic based on TerrainType
                    // This assumes terrainData is the source of truth for collision
                    const type = this.terrainData[x][y];
                    // Walls and Closed Doors are solid
                    // Chasms might be solid? For now, let's say yes.
                    const isSolid = (type === TerrainType.Wall || 
                        type === TerrainType.DoorClosed || 
                        type === TerrainType.DoorLocked ||
                        type === TerrainType.Chasm);
                    
                    objectTile.solid = isSolid;
                }
            }
        }
    }

    public addMob(mob: GameActor) {
        this.mobs.push(mob);
        this.actors.push(mob);
        // Don't add to scene here - GameScene.onActivate will add all actors
        // Don't register with TurnManager here - GameScene will do it
        console.log(`[Level] Added mob ${mob.name || 'unnamed'} to level mobs and actors lists`);
    }

    public addItem(item: Item) {
        this.items.push(item);
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

    public addTrap(trap: Trap) {
        this.triggers.push(trap);
        this.scene.add(trap);
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
    public getAllEntities(): Actor[] {
        return this.actors;
    }

    public getAllAllies(): Actor[] {
        return this.actors.filter(a => !a.isEnemy);
    }

    public getAllEnemies(): Actor[] {
        return this.actors.filter(a => a.isEnemy);
    }

    public getDistance(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    public getEntitiesInRadius(x: number, y: number, radius: number): Actor[] {
        return this.actors.filter(a => this.getDistance(x, y, a.x, a.y) <= radius);
    }

    public addCelebrationEffects(x: number, y: number, radius: number): void {
        console.log(`[Level] Celebration effects at ${x},${y} radius ${radius} (Stub)`);
    }

    public revealFutureEvents(actor: Actor): void {
        console.log(`[Level] Revealing future events to ${actor.name} (Stub)`);
    }
}
