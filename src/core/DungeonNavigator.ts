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
import { GameScene } from '../scenes/GameScene';

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

    private gameEngine: ex.Engine | null = null;

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

    public async initializeGame(engine: ex.Engine): Promise<string> {
        Logger.info('[DungeonNavigator] Initializing game...');
        this.gameEngine = engine;
        
        // Create Hero
        const hero = ActorFactory.instance.createHero(new ex.Vector(0, 0)); // Position will be set by level
        if (!hero) {
            throw new Error('Failed to create hero');
        }
        
        // Register Hero
        LevelManager.instance.registerPlayer(hero);
        
        // Load Level 1
        this.currentFloor = 1;
        
        // Get or create scene for Level 1
        const sceneKey = await this.getOrCreateScene(1);
        
        if (sceneKey) {
            return sceneKey;
        } else {
            throw new Error('Failed to load Level 1');
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

        // 0. Save current level state BEFORE loading the new one
        // This is critical because loading the new level (via getOrCreateScene -> deserializeLevel)
        // will update the player's position to the new level's spawn point.
        // If we wait for onDeactivate, we'll save the NEW position into the OLD level's state.
        await this.saveCurrentLevel();

        // 1. Get or Create Scene for target floor
        const sceneKey = await this.getOrCreateScene(targetFloor);
        if (!sceneKey) {
             Logger.error(`[DungeonNavigator] Failed to get/create scene for floor ${targetFloor}`);
             return false;
        }

        // 2. Update current floor (so the new scene knows what it is)
        const fromFloor = this.currentFloor;
        this.currentFloor = targetFloor;

        // 3. Mark floor as discovered
        this.discoverFloor(targetFloor);

        // 3.5. Position Player Correctly
        // If we are revisiting a level, we need to place the player at the correct entrance/exit
        const targetLevel = this.loadedLevels.get(targetFloor);
        const player = LevelManager.instance.getPlayer();
        
        Logger.info(`[DungeonNavigator] Positioning player for transition ${direction} to floor ${targetFloor}`);
        Logger.info(`[DungeonNavigator] Target level exists: ${!!targetLevel}, entrancePoint: ${targetLevel?.entrancePoint}, exitPoint: ${targetLevel?.exitPoint}`);
        
        if (targetLevel && player) {
            // Clear any pending path and stop animations to prevent glitches
            player.clearPath();
            player.actions.clearActions();
            
            if (direction === 'up') {
                // Going UP: from higher floor number to lower floor number
                // Player should spawn at Stairs Down (exitPoint) of target floor
                if (targetLevel.exitPoint) {
                    player.gridPos = targetLevel.exitPoint.clone();
                    player.pos = new ex.Vector(targetLevel.exitPoint.x * 32 + 16, targetLevel.exitPoint.y * 32 + 16);
                    Logger.info(`[DungeonNavigator] Placed player at Stairs Down (exit) of floor ${targetFloor}: ${player.gridPos}`);
                } else {
                    Logger.warn(`[DungeonNavigator] Target floor ${targetFloor} has no exitPoint! Using entrancePoint as fallback.`);
                    if (targetLevel.entrancePoint) {
                        player.gridPos = targetLevel.entrancePoint.clone();
                        player.pos = new ex.Vector(targetLevel.entrancePoint.x * 32 + 16, targetLevel.entrancePoint.y * 32 + 16);
                    }
                }
            } else {
                // Going DOWN: from lower floor number to higher floor number
                // Player should spawn at Stairs Up (entrancePoint) of target floor
                if (targetLevel.entrancePoint) {
                    player.gridPos = targetLevel.entrancePoint.clone();
                    player.pos = new ex.Vector(targetLevel.entrancePoint.x * 32 + 16, targetLevel.entrancePoint.y * 32 + 16);
                    Logger.info(`[DungeonNavigator] Placed player at Stairs Up (entrance) of floor ${targetFloor}: ${player.gridPos}`);
                } else {
                    Logger.warn(`[DungeonNavigator] Target floor ${targetFloor} has no entrancePoint!`);
                }
            }
        } else {
            Logger.error(`[DungeonNavigator] Cannot position player: targetLevel=${!!targetLevel}, player=${!!player}`);
        }

        // 4. Emit transition event (for UI, etc.)
        EventBus.instance.emit(GameEventNames.LevelTransition, new LevelTransitionEvent(
            direction,
            fromFloor,
            targetFloor
        ));
        
        // Let's add a reference to the game engine in DungeonNavigator
        if (this.gameEngine) {
             // We don't need to pass level data anymore as the scene is already initialized with it
             this.gameEngine.goToScene(sceneKey);
        } else {
             Logger.error('[DungeonNavigator] Game engine reference not set!');
             return false;
        }

        // Clean up distant levels (optional, might want to keep scenes around for a bit)
        this.cleanupDistantLevels();

        Logger.info(`[DungeonNavigator] Successfully transitioned to floor ${targetFloor}`);
        return true;
    }

    public async getOrCreateScene(floorNumber: number): Promise<string | null> {
        const sceneKey = `level_${floorNumber}`;
        
        // Check if scene already exists
        if (this.gameEngine && this.gameEngine.scenes[sceneKey]) {
            return sceneKey;
        }
        
        // Load/Generate Level
        const level = await this.loadLevel(floorNumber);
        if (!level) return null;
        
        // Create new GameScene
        const scene = new GameScene(level);
        
        // Register with Engine
        if (this.gameEngine) {
            this.gameEngine.add(sceneKey, {
                scene: scene,
                transitions: {
                    in: new ex.FadeInOut({ duration: 500, direction: 'in', color: ex.Color.Black }),
                    out: new ex.FadeInOut({ duration: 500, direction: 'out', color: ex.Color.Black })
                }
            });
            Logger.info(`[DungeonNavigator] Created and registered scene ${sceneKey}`);
            return sceneKey;
        }
        
        return null;
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

    public async saveCurrentLevel(): Promise<void> {
        const currentLevel = this.loadedLevels.get(this.currentFloor);
        if (!currentLevel) return;

        const serializedLevel = currentLevel.serialize();

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
        // Create Level without scene - GameScene will connect it later
        const level = await Level.deserialize(serializedLevel);
        
        // Don't add player to the level here - GameScene.onActivate will handle it
        // This prevents the player from being in multiple levels' actors lists simultaneously
        const player = LevelManager.instance.getPlayer();
        if (player) {
            // Get saved player position for this floor if available
            const floorState = this.floorRegistry.get(level.floorNumber);
            if (floorState && floorState.playerPosition) {
                player.gridPos = floorState.playerPosition.clone();
                player.pos = new ex.Vector(floorState.playerPosition.x * 32 + 16, floorState.playerPosition.y * 32 + 16);
            }
            
            Logger.info(`[DungeonNavigator] Restored player position for level ${level.floorNumber} at ${player.gridPos}`);
        } else {
            Logger.warn(`[DungeonNavigator] No player found to position for deserialized level ${level.floorNumber}`);
        }
        
        return level;
    }

    private async generateNewLevel(floorNumber: number): Promise<Level> {
        Logger.info(`[DungeonNavigator] *** GENERATING NEW LEVEL *** Floor ${floorNumber}`);
        
        // Get appropriate biome for this floor
        const biomes = getBiomesForFloor(floorNumber);
        const biome = biomes[Math.floor(Math.random() * biomes.length)];
        
        // Use the same level generation system as the main game
        const generator = new AdvancedLevelGenerator();
        const level = generator.generate(40, 40, biome, floorNumber);
        
        // Set level properties
        level.depth = floorNumber;
        level.seed = Math.floor(Math.random() * 1000000);
        
        // Position player at entrance point (don't add to level - GameScene.onActivate will do it)
        const player = LevelManager.instance.getPlayer();
        if (player) {
            const spawnPos = level.entrancePoint || new ex.Vector(20, 20);
            
            // Update player position (centered on tile)
            player.gridPos = spawnPos.clone();
            player.pos = new ex.Vector(spawnPos.x * 32 + 16, spawnPos.y * 32 + 16);
            
            Logger.info(`[DungeonNavigator] Positioned player for new level at entrance: ${spawnPos.x}, ${spawnPos.y}`);
        } else {
            Logger.warn(`[DungeonNavigator] No player found in LevelManager to position for new level`);
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