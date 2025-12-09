import { Level } from './Level';
import { Room } from './Room';
import { TerrainType, TerrainDefinitions } from '../data/terrain';
import { MaterialType } from '../data/biomes';
import { Logger } from '../core/Logger';

/**
 * Properties tracked for each tile in the level.
 * Consolidates data previously scattered across WarmthSystem, Level, etc.
 */
export interface TileProperties {
    // Terrain
    isWall: boolean;
    isFloor: boolean;
    isPassable: boolean;
    
    // Occupancy
    isOccupied: boolean;        // Has decor/interactable/actor
    isProtected: boolean;       // Path/entrance that must stay clear
    
    // Warmth (integrates WarmthSystem.heatMap)
    warmthLevel: number;        // 0-100, accumulated from heat sources
    isHeatSource: boolean;
    heatGeneration: number;     // Amount generated if heat source
    
    // Visibility (integrates Level.visibleTiles/discoveredTiles)
    isVisible: boolean;         // Currently in player LOS
    isDiscovered: boolean;      // Ever been seen
    lightLevel: number;         // Ambient + source light
    isLightSource: boolean;
    
    // Context
    isIndoor: boolean;          // Based on material type
    roomId: string | null;      // Which room (null = corridor)
}

/**
 * Creates default tile properties
 */
function createDefaultTileProperties(): TileProperties {
    return {
        isWall: true,
        isFloor: false,
        isPassable: false,
        isOccupied: false,
        isProtected: false,
        warmthLevel: 0,
        isHeatSource: false,
        heatGeneration: 0,
        isVisible: false,
        isDiscovered: false,
        lightLevel: 0,
        isLightSource: false,
        isIndoor: false,
        roomId: null
    };
}

/**
 * Unified tile property tracking for placement decisions.
 * Consolidates scattered state from WarmthSystem, VisibilitySystem, Level.
 */
export class TilePropertyGrid {
    private grid: TileProperties[][];
    public readonly width: number;
    public readonly height: number;
    
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.grid = [];
        
        // Initialize grid with default properties
        for (let x = 0; x < width; x++) {
            this.grid[x] = [];
            for (let y = 0; y < height; y++) {
                this.grid[x][y] = createDefaultTileProperties();
            }
        }
    }
    
    /**
     * Initialize grid from Level's terrain and material data
     */
    public initFromLevel(level: Level): void {
        Logger.info(`[TilePropertyGrid] Initializing from level ${level.levelId}`);
        
        const outdoorMaterials = [MaterialType.Snow, MaterialType.Ice, MaterialType.Dirt];
        
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const terrain = level.terrainData[x]?.[y] ?? TerrainType.Wall;
                const material = level.materialData[x]?.[y] ?? MaterialType.Stone;
                const terrainDef = TerrainDefinitions[terrain];
                
                const props = this.grid[x][y];
                
                // Terrain properties
                props.isWall = terrain === TerrainType.Wall;
                props.isFloor = terrain === TerrainType.Floor;
                props.isPassable = !terrainDef?.isSolid;
                
                // Indoor/outdoor based on material
                props.isIndoor = !outdoorMaterials.includes(material);
                
                // Protected tiles (corridors, paths)
                props.isProtected = level.isProtectedTile(x, y);
                
                // Visibility state
                const key = `${x},${y}`;
                props.isDiscovered = level.discoveredTiles.has(key);
                props.isVisible = level.visibleTiles.has(key);
                
                // Heat sources from terrain
                if (terrainDef?.isWarmthSource) {
                    props.isHeatSource = true;
                    props.heatGeneration = terrainDef.warmthGeneration || 0;
                }
                
                // Light sources from terrain
                if (terrainDef?.lightRadius) {
                    props.isLightSource = true;
                }
            }
        }
        
        // Assign room IDs
        for (const room of level.rooms) {
            const roomId = `room_${room.x}_${room.y}`;
            for (let x = room.x; x < room.x + room.width; x++) {
                for (let y = room.y; y < room.y + room.height; y++) {
                    if (this.inBounds(x, y)) {
                        this.grid[x][y].roomId = roomId;
                    }
                }
            }
        }
        
        Logger.info(`[TilePropertyGrid] Initialized ${this.width}x${this.height} grid`);
    }
    
    // ===== Query Methods =====
    
    /**
     * Get properties at a specific tile
     */
    public getAt(x: number, y: number): TileProperties | null {
        if (!this.inBounds(x, y)) return null;
        return this.grid[x][y];
    }
    
    /**
     * Check if coordinates are within bounds
     */
    public inBounds(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    
    /**
     * Get all wall tiles
     */
    public getWallTiles(): {x: number, y: number}[] {
        const result: {x: number, y: number}[] = [];
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.grid[x][y].isWall) {
                    result.push({x, y});
                }
            }
        }
        return result;
    }
    
    /**
     * Get floor tiles that are adjacent to at least one wall tile
     */
    public getFloorTilesAdjacentToWall(): {x: number, y: number}[] {
        const result: {x: number, y: number}[] = [];
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (!this.grid[x][y].isFloor) continue;
                
                // Check if adjacent to wall
                if (this.hasAdjacentWall(x, y)) {
                    result.push({x, y});
                }
            }
        }
        return result;
    }
    
    /**
     * Check if a floor tile is adjacent to a wall
     */
    public hasAdjacentWall(x: number, y: number): boolean {
        const neighbors = [
            {dx: 0, dy: -1},  // North
            {dx: 0, dy: 1},   // South
            {dx: -1, dy: 0},  // West
            {dx: 1, dy: 0}    // East
        ];
        
        for (const n of neighbors) {
            const nx = x + n.dx;
            const ny = y + n.dy;
            if (this.inBounds(nx, ny) && this.grid[nx][ny].isWall) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Get indoor floor tiles
     */
    public getIndoorTiles(): {x: number, y: number}[] {
        const result: {x: number, y: number}[] = [];
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.grid[x][y].isFloor && this.grid[x][y].isIndoor) {
                    result.push({x, y});
                }
            }
        }
        return result;
    }
    
    /**
     * Get all tiles belonging to a specific room
     */
    public getRoomTiles(roomId: string): {x: number, y: number}[] {
        const result: {x: number, y: number}[] = [];
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.grid[x][y].roomId === roomId) {
                    result.push({x, y});
                }
            }
        }
        return result;
    }
    
    /**
     * Get wall tiles for a specific room (perimeter)
     */
    public getRoomWallTiles(room: Room): {x: number, y: number}[] {
        const result: {x: number, y: number}[] = [];
        
        // Top wall (y - 1)
        for (let x = room.x; x < room.x + room.width; x++) {
            const wallY = room.y - 1;
            if (this.inBounds(x, wallY) && this.grid[x][wallY].isWall) {
                result.push({x, y: wallY});
            }
        }
        // Bottom wall (y + height)
        for (let x = room.x; x < room.x + room.width; x++) {
            const wallY = room.y + room.height;
            if (this.inBounds(x, wallY) && this.grid[x][wallY].isWall) {
                result.push({x, y: wallY});
            }
        }
        // Left wall (x - 1)
        for (let y = room.y; y < room.y + room.height; y++) {
            const wallX = room.x - 1;
            if (this.inBounds(wallX, y) && this.grid[wallX][y].isWall) {
                result.push({x: wallX, y});
            }
        }
        // Right wall (x + width)
        for (let y = room.y; y < room.y + room.height; y++) {
            const wallX = room.x + room.width;
            if (this.inBounds(wallX, y) && this.grid[wallX][y].isWall) {
                result.push({x: wallX, y});
            }
        }
        
        return result;
    }
    
    // ===== Occupancy & Reservation =====
    
    /**
     * Mark a tile as occupied
     */
    public markOccupied(x: number, y: number): void {
        if (this.inBounds(x, y)) {
            this.grid[x][y].isOccupied = true;
        }
    }
    
    /**
     * Check if an area is available for placement
     */
    public canPlaceArea(x: number, y: number, w: number, h: number, requireFloor: boolean = true, allowWalls: boolean = false): boolean {
        for (let ix = x; ix < x + w; ix++) {
            for (let iy = y; iy < y + h; iy++) {
                if (!this.inBounds(ix, iy)) return false;
                
                const props = this.grid[ix][iy];
                
                // Check occupancy
                if (props.isOccupied) return false;
                
                // Check protected
                if (props.isProtected) return false;
                
                // Check terrain requirements
                if (requireFloor && !props.isFloor && !allowWalls) return false;
                if (!allowWalls && props.isWall) return false;
            }
        }
        return true;
    }
    
    /**
     * Reserve an area (marks all tiles as occupied)
     */
    public reserveArea(x: number, y: number, w: number, h: number): void {
        for (let ix = x; ix < x + w; ix++) {
            for (let iy = y; iy < y + h; iy++) {
                if (this.inBounds(ix, iy)) {
                    this.grid[ix][iy].isOccupied = true;
                }
            }
        }
    }
    
    // ===== Heat & Light Tracking =====
    
    /**
     * Add a heat source and propagate warmth to nearby tiles
     */
    public addHeatSource(x: number, y: number, radius: number, intensity: number): void {
        if (!this.inBounds(x, y)) return;
        
        this.grid[x][y].isHeatSource = true;
        this.grid[x][y].heatGeneration = intensity;
        
        // Propagate warmth with distance falloff
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const tx = x + dx;
                const ty = y + dy;
                if (!this.inBounds(tx, ty)) continue;
                
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= radius) {
                    const falloff = 1 - (distance / radius);
                    this.grid[tx][ty].warmthLevel += intensity * falloff;
                }
            }
        }
    }
    
    /**
     * Add a light source
     */
    public addLightSource(x: number, y: number, radius: number): void {
        if (!this.inBounds(x, y)) return;
        
        this.grid[x][y].isLightSource = true;
        
        // Propagate light with distance falloff
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const tx = x + dx;
                const ty = y + dy;
                if (!this.inBounds(tx, ty)) continue;
                
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= radius) {
                    const falloff = 1 - (distance / radius);
                    this.grid[tx][ty].lightLevel += falloff * 100;
                }
            }
        }
    }
    
    /**
     * Get heat level at a position
     */
    public getHeatAt(x: number, y: number): number {
        if (!this.inBounds(x, y)) return 0;
        return this.grid[x][y].warmthLevel;
    }
    
    // ===== Visibility Tracking =====
    
    /**
     * Update visibility for tiles based on player position
     */
    public updateVisibility(visibleTiles: Set<string>, discoveredTiles: Set<string>): void {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const key = `${x},${y}`;
                this.grid[x][y].isVisible = visibleTiles.has(key);
                this.grid[x][y].isDiscovered = discoveredTiles.has(key);
            }
        }
    }
}
