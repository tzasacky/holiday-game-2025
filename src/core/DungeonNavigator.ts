import * as ex from 'excalibur';
import { EventBus } from './EventBus';
import { GameEventNames, LevelTransitionEvent, LevelTransitionRequestEvent } from './GameEvents';
import { Level } from '../dungeon/Level';
import { GameActor } from '../components/GameActor';
import { SerializedLevel } from './GameState';
import { Logger } from './Logger';
import { AdvancedLevelGenerator } from '../dungeon/algorithms/AdvancedLevelGenerator';
import { getBiomesForFloor } from '../data/biomes';
import { ActorFactory } from '../factories/ActorFactory';
import { LevelManager } from './LevelManager';

export interface FloorState {
    floorNumber: number;
    level: SerializedLevel;
    playerPosition: ex.Vector;
    discovered: boolean;
    lastVisited: number;
    isLoaded: boolean;
}

export class DungeonNavigator {
    private static _instance: DungeonNavigator;
    private floorRegistry: Map<number, FloorState> = new Map();
    private currentFloor: number = 1;
    private loadedLevels: Map<number, Level> = new Map();
    private maxLoadedLevels: number = 3; // Current + 1 up + 1 down

    private constructor() {
        this.setupEventListeners();
    }

    public static get instance(): DungeonNavigator {
        if (!this._instance) {
            this._instance = new DungeonNavigator();
        }
        return this._instance;
    }

    private setupEventListeners(): void {
        EventBus.instance.on(GameEventNames.LevelTransitionRequest, (event: LevelTransitionRequestEvent) => {
            this.handleTransitionRequest(event);
        });
    }

    private async handleTransitionRequest(event: LevelTransitionRequestEvent): Promise<void> {
        Logger.info(`[DungeonNavigator] *** TRANSITION REQUEST RECEIVED *** Direction: ${event.direction}, Actor: ${event.actorId}, Source: ${event.source}`);
        
        try {
            if (event.direction === 'up') {
                Logger.info(`[DungeonNavigator] Going UP from floor ${this.currentFloor}`);
                await this.goUp();
            } else if (event.direction === 'down') {
                Logger.info(`[DungeonNavigator] Going DOWN from floor ${this.currentFloor}`);
                await this.goDown();
            }
        } catch (error) {
            Logger.error(`[DungeonNavigator] Transition failed: ${error}`);
        }
    }

    public async goUp(): Promise<boolean> {
        if (this.currentFloor <= 1) {
            Logger.warn('[DungeonNavigator] Already at top floor');
            return false;
        }

        const targetFloor = this.currentFloor - 1;
        return this.transitionToFloor(targetFloor, 'up');
    }

    public async goDown(): Promise<boolean> {
        const targetFloor = this.currentFloor + 1;
        return this.transitionToFloor(targetFloor, 'down');
    }

    private async transitionToFloor(targetFloor: number, direction: 'up' | 'down'): Promise<boolean> {
        Logger.info(`[DungeonNavigator] Transitioning from floor ${this.currentFloor} to ${targetFloor}`);

        // Save current level state
        await this.saveCurrentLevel();

        // Load or generate target level
        const level = await this.loadLevel(targetFloor);
        if (!level) {
            Logger.error(`[DungeonNavigator] Failed to load level ${targetFloor}`);
            return false;
        }

        // Update current floor
        const fromFloor = this.currentFloor;
        this.currentFloor = targetFloor;

        // Mark floor as discovered
        this.discoverFloor(targetFloor);

        // Emit transition event
        EventBus.instance.emit(GameEventNames.LevelTransition, new LevelTransitionEvent(
            direction,
            fromFloor,
            targetFloor
        ));

        // Clean up distant levels
        this.cleanupDistantLevels();

        Logger.info(`[DungeonNavigator] Successfully transitioned to floor ${targetFloor}`);
        return true;
    }

    public async loadLevel(floorNumber: number): Promise<Level | null> {
        // Check if already loaded
        if (this.loadedLevels.has(floorNumber)) {
            return this.loadedLevels.get(floorNumber)!;
        }

        // Check if floor state exists
        const floorState = this.floorRegistry.get(floorNumber);
        
        let level: Level;
        
        if (floorState && floorState.level) {
            // Deserialize existing level
            level = await this.deserializeLevel(floorState.level);
        } else {
            // Generate new level
            level = await this.generateNewLevel(floorNumber);
        }

        // Cache the level
        this.loadedLevels.set(floorNumber, level);
        
        return level;
    }

    private async saveCurrentLevel(): Promise<void> {
        const currentLevel = this.loadedLevels.get(this.currentFloor);
        if (!currentLevel) return;

        // TODO: Implement level serialization
        const serializedLevel: SerializedLevel = {
            seed: 0, // TODO: Get from level generation
            depth: this.currentFloor,
            width: currentLevel.width,
            height: currentLevel.height,
            terrain: currentLevel.terrain as any,
            actors: [], // TODO: Serialize actors
            items: [], // TODO: Serialize items
            explored: Array(currentLevel.width).fill(null).map(() => Array(currentLevel.height).fill(true)) // TODO: Implement explored map
        };

        const floorState: FloorState = {
            floorNumber: this.currentFloor,
            level: serializedLevel,
            playerPosition: this.getPlayerPosition(),
            discovered: true,
            lastVisited: Date.now(),
            isLoaded: true
        };

        this.floorRegistry.set(this.currentFloor, floorState);
        Logger.info(`[DungeonNavigator] Saved state for floor ${this.currentFloor}`);
    }

    private async deserializeLevel(serializedLevel: SerializedLevel): Promise<Level> {
        // TODO: Implement proper level deserialization
        Logger.warn('[DungeonNavigator] Level deserialization not fully implemented');
        
        // For now, create a basic level structure - need scene and biome
        // TODO: Properly restore scene and biome from serialized data
        const tempScene = new ex.Scene();
        const tempBiome = { name: 'default' } as any; // TODO: Get proper biome
        const level = new Level(serializedLevel.width || 40, serializedLevel.height || 30, null as any, null as any);
        level.seed = serializedLevel.seed;
        level.depth = serializedLevel.depth;
        level.terrain = serializedLevel.terrain as any;
        // TODO: Implement proper explored map handling
        // level.explored = serializedLevel.explored;
        
        return level;
    }

    private async generateNewLevel(floorNumber: number): Promise<Level> {
        Logger.info(`[DungeonNavigator] *** GENERATING NEW LEVEL *** Floor ${floorNumber}`);
        
        // Get appropriate biome for this floor
        const biomes = getBiomesForFloor(floorNumber);
        const biome = biomes[Math.floor(Math.random() * biomes.length)];
        
        // Create a temporary scene for level generation - GameScene will reconnect it later
        const tempScene = new ex.Scene();
        
        // Use the same level generation system as the main game
        const generator = new AdvancedLevelGenerator();
        const level = generator.generate(40, 40, biome, tempScene, floorNumber);
        
        // Set level properties
        level.depth = floorNumber;
        level.seed = Math.floor(Math.random() * 1000000);
        
        // Add player to the new level at entrance point
        const player = LevelManager.instance.getPlayer();
        if (player) {
            const spawnPos = level.entrancePoint || new ex.Vector(20, 20);
            
            // Update player position
            player.pos = new ex.Vector(spawnPos.x * 32, spawnPos.y * 32);
            player.gridPos = spawnPos.clone();
            
            // Add player to new level
            level.addActor(player);
            
            Logger.info(`[DungeonNavigator] Added player to new level at entrance: ${spawnPos.x}, ${spawnPos.y}`);
        } else {
            Logger.warn(`[DungeonNavigator] No player found in LevelManager to add to new level`);
        }
        
        // Initialize the level's tile graphics
        await level.updateTileGraphics();
        
        Logger.info(`[DungeonNavigator] Generated level ${floorNumber} with ${level.actors.length} actors and ${level.rooms.length} rooms`);
        return level;
    }

    private getPlayerPosition(): ex.Vector {
        const player = LevelManager.instance.getPlayer();
        if (player && player.gridPos) {
            return player.gridPos.clone();
        }
        return new ex.Vector(20, 20); // Default center position
    }

    private cleanupDistantLevels(): void {
        const levelsToKeep = new Set([
            this.currentFloor - 1,
            this.currentFloor,
            this.currentFloor + 1
        ]);

        for (const [floorNumber] of this.loadedLevels) {
            if (!levelsToKeep.has(floorNumber)) {
                this.loadedLevels.delete(floorNumber);
                
                // Update floor state to mark as unloaded
                const floorState = this.floorRegistry.get(floorNumber);
                if (floorState) {
                    floorState.isLoaded = false;
                    this.floorRegistry.set(floorNumber, floorState);
                }
                
                Logger.info(`[DungeonNavigator] Unloaded distant floor ${floorNumber}`);
            }
        }
    }

    public discoverFloor(floorNumber: number): void {
        const existing = this.floorRegistry.get(floorNumber);
        if (existing) {
            existing.discovered = true;
            existing.lastVisited = Date.now();
        } else {
            const newFloorState: FloorState = {
                floorNumber,
                level: {} as SerializedLevel, // Will be populated when saved
                playerPosition: new ex.Vector(0, 0),
                discovered: true,
                lastVisited: Date.now(),
                isLoaded: false
            };
            this.floorRegistry.set(floorNumber, newFloorState);
        }
        
        Logger.info(`[DungeonNavigator] Floor ${floorNumber} discovered`);
    }

    public isFloorDiscovered(floorNumber: number): boolean {
        const floorState = this.floorRegistry.get(floorNumber);
        return floorState?.discovered ?? false;
    }

    public getAvailableFloors(): number[] {
        return Array.from(this.floorRegistry.keys())
            .filter(floor => this.isFloorDiscovered(floor))
            .sort((a, b) => a - b);
    }

    public getCurrentFloor(): number {
        return this.currentFloor;
    }

    public getCurrentLevel(): Level | null {
        return this.loadedLevels.get(this.currentFloor) || null;
    }

    public getFloorState(floorNumber: number): FloorState | null {
        return this.floorRegistry.get(floorNumber) || null;
    }

    // Serialization methods for save/load
    public saveNavigatorState(): any {
        return {
            currentFloor: this.currentFloor,
            floorRegistry: Array.from(this.floorRegistry.entries())
        };
    }

    public loadNavigatorState(data: any): void {
        this.currentFloor = data.currentFloor || 1;
        this.floorRegistry = new Map(data.floorRegistry || []);
        this.loadedLevels.clear(); // Force reload of levels
    }
}