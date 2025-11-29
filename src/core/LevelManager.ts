import * as ex from 'excalibur';
import { EventBus } from './EventBus';
import { GameEventNames } from './GameEvents';
import { Level } from '../dungeon/Level';
import { GameActor } from '../components/GameActor';
import { DungeonNavigator } from './DungeonNavigator';
import { Logger } from './Logger';
import { StatsComponent } from '../components/StatsComponent';

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
        // Level transitions are handled by GameScene and DungeonNavigator
    }

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
    
    // Helper to ensure player is available for scene transitions
    public hasPlayer(): boolean {
        return !!this.player;
    }

    public saveManagerState(): any {
        return {
            currentLevelId: this.currentLevel?.levelId,
            playerStats: this.player ? this.player.getGameComponent<StatsComponent>('stats') : null // Basic stat persistence
        };
    }

    public loadManagerState(state: any): void {
        if (state && state.currentLevelId) {
            Logger.info(`[LevelManager] Restoring state for level ${state.currentLevelId}`);
            // Note: Actual level loading happens via DungeonNavigator
        }
    }
}