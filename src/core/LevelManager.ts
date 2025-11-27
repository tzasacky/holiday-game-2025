import * as ex from 'excalibur';
import { EventBus } from './EventBus';
import { GameEventNames, LevelGeneratedEvent } from './GameEvents';
import { Level } from '../dungeon/Level';
import { GameActor } from '../components/GameActor';
import { FloorState, DungeonNavigator } from './DungeonNavigator';
import { SerializedLevel, SerializedActor } from './GameState';
import { Logger } from './Logger';
import { ActorFactory } from '../factories/ActorFactory';
import { AdvancedLevelGenerator } from '../dungeon/algorithms/AdvancedLevelGenerator';

export class LevelManager {
    private static _instance: LevelManager;
    private currentLevel: Level | null = null;
    private player: GameActor | null = null;

    private constructor() {
        this.setupEventListeners();
    }

    public static get instance(): LevelManager {
        if (!this._instance) {
            this._instance = new LevelManager();
        }
        return this._instance;
    }

    private setupEventListeners(): void {
        EventBus.instance.on(GameEventNames.LevelTransition, (event: any) => {
            this.handleLevelTransition(event);
        });
    }

    private async handleLevelTransition(event: any): Promise<void> {
        Logger.info(`[LevelManager] Handling level transition: ${event.direction} from ${event.fromLevel} to ${event.toLevel}`);
        // Level transitions are now handled by DungeonNavigator
        // LevelManager just tracks the current level
        const newLevel = DungeonNavigator.instance.getCurrentLevel();
        if (newLevel) {
            this.setCurrentLevel(newLevel);
        }
    }

    public async transferPlayerToLevel(targetFloor: number, direction: 'up' | 'down'): Promise<void> {
        if (!this.player) {
            Logger.error('[LevelManager] No player registered for transfer');
            return;
        }

        // Get the target level from DungeonNavigator
        const targetLevel = await DungeonNavigator.instance.loadLevel(targetFloor);
        if (!targetLevel) {
            Logger.error(`[LevelManager] Failed to load target level ${targetFloor}`);
            return;
        }

        // Save player state before transition
        const playerState = this.serializePlayer(this.player);
        
        // Remove player from current level
        if (this.currentLevel) {
            this.removePlayerFromLevel(this.player, this.currentLevel);
        }

        // Set new current level
        this.currentLevel = targetLevel;

        // Determine spawn position based on direction
        const spawnPosition = this.getSpawnPosition(targetLevel, direction);
        
        // Add player to new level
        this.addPlayerToLevel(this.player, targetLevel, spawnPosition);

        // Restore player state
        this.deserializePlayer(this.player, playerState);

        Logger.info(`[LevelManager] Player transferred to level ${targetFloor} at position ${spawnPosition.x}, ${spawnPosition.y}`);
    }

    private getSpawnPosition(level: Level, direction: 'up' | 'down'): ex.Vector {
        // TODO: Find actual staircase positions
        // For now, use center of level with some offset based on direction
        const centerX = Math.floor(level.width / 2);
        const centerY = Math.floor(level.height / 2);
        
        if (direction === 'up') {
            // Coming from below, spawn near down stairs
            return new ex.Vector(centerX, centerY + 2);
        } else {
            // Coming from above, spawn near up stairs
            return new ex.Vector(centerX, centerY - 2);
        }
    }

    private removePlayerFromLevel(player: GameActor, level: Level): void {
        const index = level.actors.indexOf(player);
        if (index > -1) {
            level.actors.splice(index, 1);
        }
        
        // Remove from scene if currently active
        if (player.scene) {
            player.scene.remove(player);
        }
        
        Logger.debug(`[LevelManager] Removed player from level`);
    }

    private addPlayerToLevel(player: GameActor, level: Level, position: ex.Vector): void {
        // Set player position
        player.pos = position;
        
        // Add to level actors
        if (!level.actors.includes(player)) {
            level.actors.push(player);
        }
        
        // Add to scene if level is currently active
        if (level === this.currentLevel && player.scene) {
            player.scene.add(player);
        }
        
        Logger.debug(`[LevelManager] Added player to level at position ${position.x}, ${position.y}`);
    }

    public async generateLevel(floorNumber: number, seed?: number): Promise<Level> {
        Logger.info(`[LevelManager] Generating level for floor ${floorNumber}`);
        
        const actualSeed = seed || Math.floor(Math.random() * 1000000);
        
        // Create level instance
        const tempScene = new ex.Scene();
        const tempBiome = { name: 'default' } as any;
        const level = new Level(40, 40, tempBiome, tempScene, `floor_${floorNumber}`);
        
        // Use existing level generation algorithm
        const generator = new AdvancedLevelGenerator();
        // TODO: Integrate properly with AdvancedLevelGenerator
        // For now, set basic level structure
        
        // Mark floor as discovered
        DungeonNavigator.instance.discoverFloor(floorNumber);
        
        // Emit level generated event
        EventBus.instance.emit(GameEventNames.LevelGenerated, new LevelGeneratedEvent(
            floorNumber,
            level.rooms,
            level
        ));
        
        Logger.info(`[LevelManager] Generated level ${floorNumber} with seed ${actualSeed}`);
        return level;
    }

    public async deserializeLevel(serializedLevel: SerializedLevel): Promise<Level> {
        Logger.info(`[LevelManager] Deserializing level for floor ${serializedLevel.depth}`);
        
        // Create level instance
        const level = new Level(serializedLevel.width, serializedLevel.height, null as any, null as any);
        level.seed = serializedLevel.seed;
        level.depth = serializedLevel.depth;
        level.terrain = serializedLevel.terrain as any;
        // TODO: Implement proper explored map handling
        // level.explored = serializedLevel.explored;
        
        // Deserialize actors
        for (const actorData of serializedLevel.actors) {
            try {
                const actor = await this.deserializeActor(actorData);
                if (actor) {
                    level.actors.push(actor);
                }
            } catch (error) {
                Logger.error(`[LevelManager] Failed to deserialize actor ${actorData.id}: ${error}`);
            }
        }
        
        // TODO: Deserialize items
        // TODO: Deserialize interactables
        
        Logger.info(`[LevelManager] Deserialized level ${serializedLevel.depth} with ${level.actors.length} actors`);
        return level;
    }

    public serializeLevel(level: Level): SerializedLevel {
        const levelDepth = parseInt(level.levelId.split('_')[1]) || 1;
        Logger.info(`[LevelManager] Serializing level ${levelDepth}`);
        
        const serializedActors: SerializedActor[] = [];
        
        // Serialize actors (excluding player)
        for (const actor of level.actors) {
            if (!actor.isPlayer) {
                try {
                    const serializedActor = this.serializeActor(actor);
                    serializedActors.push(serializedActor);
                } catch (error) {
                    Logger.error(`[LevelManager] Failed to serialize actor ${actor.name}: ${error}`);
                }
            }
        }
        
        const serializedLevel: SerializedLevel = {
            seed: 0, // TODO: Get from level generation
            depth: levelDepth,
            width: level.width,
            height: level.height,
            terrain: level.terrain as any,
            actors: [], // Placeholder for actors
            items: [], // TODO: Serialize items
            explored: Array(level.width).fill(null).map(() => Array(level.height).fill(true)) // TODO: Implement explored map
        };
        
        Logger.info(`[LevelManager] Serialized level ${levelDepth} with ${serializedActors.length} actors`);
        return serializedLevel;
    }

    private serializeActor(actor: GameActor): SerializedActor {
        // Get component data
        const componentData: Record<string, any> = {};
        
        // TODO: Iterate through actor's components and call saveState()
        // For now, use basic properties
        
        return {
            id: actor.id.toString(),
            defName: actor.name, // TODO: Use actual definition name
            x: actor.pos.x,
            y: actor.pos.y,
            time: 0, // TODO: Get from turn system
            actPriority: 0, // TODO: Get from turn system
            isPlayer: actor.isPlayer,
            componentData
        };
    }

    private async deserializeActor(actorData: SerializedActor): Promise<GameActor | null> {
        try {
            // TODO: Use ActorFactory to create actor from definition
            // For now, create a basic actor
            
            const actor = new GameActor(new ex.Vector(actorData.x, actorData.y), actorData.defName);
            
            actor.name = actorData.defName;
            actor.isPlayer = actorData.isPlayer;
            
            // TODO: Restore component data using loadState()
            
            return actor;
        } catch (error) {
            Logger.error(`[LevelManager] Failed to deserialize actor: ${error}`);
            return null;
        }
    }

    private serializePlayer(player: GameActor): SerializedActor {
        return this.serializeActor(player);
    }

    private deserializePlayer(player: GameActor, playerData: SerializedActor): void {
        // Restore player position
        player.pos = new ex.Vector(playerData.x, playerData.y);
        
        // TODO: Restore component states using loadState()
        
        Logger.debug(`[LevelManager] Restored player state`);
    }

    // Utility methods
    public registerPlayer(player: GameActor): void {
        this.player = player;
        Logger.info('[LevelManager] Player registered');
    }

    public setCurrentLevel(level: Level): void {
        this.currentLevel = level;
        Logger.info(`[LevelManager] Current level set to floor ${level.depth}`);
    }

    public getCurrentLevel(): Level | null {
        return this.currentLevel;
    }

    public getPlayer(): GameActor | null {
        return this.player;
    }

    // Save/Load integration
    public saveManagerState(): any {
        return {
            currentLevelDepth: this.currentLevel?.depth || 1,
            playerData: this.player ? this.serializePlayer(this.player) : null
        };
    }

    public loadManagerState(data: any): void {
        if (data.currentLevelDepth) {
            // Current level will be loaded by DungeonNavigator
            Logger.info(`[LevelManager] Will restore to level ${data.currentLevelDepth}`);
        }
        
        if (data.playerData && this.player) {
            this.deserializePlayer(this.player, data.playerData);
        }
    }
}