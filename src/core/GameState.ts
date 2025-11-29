import { GameActor } from '../components/GameActor';
import { Level } from '../dungeon/Level';
import { EventBus } from './EventBus';
import { GameEventNames, LogEvent } from './GameEvents';
import { ComponentSaveState } from './Component';
import { DungeonNavigator } from './DungeonNavigator';
import { LevelManager } from './LevelManager';
import * as ex from 'excalibur';
import { Logger } from './Logger';
import { TerrainType } from '../data/terrain';
import { MaterialType } from '../data/biomes';

// Serialization Interfaces
export interface SerializedItem {
    id: string;
    name: string;
    count: number;
    stats?: any;
    enchantments?: string[];
    curses?: string[]
;
    identified?: boolean;
    stackable?: boolean;
}

export interface SerializedActor {
    id: string; // Changed from number to string for entityId
    defName: string; // Definition name (e.g., 'Hero', 'Snowman')
    x: number;
    y: number;
    time: number;
    actPriority: number;
    isPlayer: boolean;
    // Component-based data
    componentData: Record<string, any>; // Serialized component states
}

export interface SerializedInteractable {
    id: string;
    type: string; // InteractableID
    x: number;
    y: number;
    state: string; // 'active', 'inactive', 'looted', etc.
    customState?: any; // For specific interactable data (e.g. chest contents)
}

export interface SerializedLevel {
    seed: number;
    depth: number;
    width: number;
    height: number;
    biomeId: string; // BiomeID
    terrain: TerrainType[][]; // TerrainType[][]
    materials: MaterialType[][]; // MaterialType[][]
    actors: SerializedActor[];
    items: { x: number; y: number; item: SerializedItem }[];
    interactables: SerializedInteractable[];
    explored: boolean[][];
    entrancePoint?: { x: number; y: number }; // Stairs Up position
    exitPoint?: { x: number; y: number }; // Stairs Down position
}

export interface GameSaveData {
    hero: SerializedActor;
    dungeonNavigator: any;
    levelManager: any;
    globalVars: any;
    timestamp: number;
    version: number;
}

/**
 * GameState - Manages save/load serialization for the component-based system
 * 
 * NOTE: This is a transitional implementation. Full serialization requires:
 * - Component serialization protocol
 * - ActorFactory integration for deserialization
 * - ItemFactory integration
 * 
 * For now, this provides the structure for future implementation.
 */
export class GameState {
    private static _instance: GameState;
    
    // Runtime references
    private hero: GameActor | null = null;
    private level: Level | null = null;

    private constructor() {
        this.setupListeners();
    }

    public static get instance(): GameState {
        if (!this._instance) {
            this._instance = new GameState();
        }
        return this._instance;
    }

    public registerHero(hero: GameActor) {
        this.hero = hero;
    }

    public registerLevel(level: Level) {
        this.level = level;
    }

    private setupListeners() {
        const bus = EventBus.instance;
        bus.on(GameEventNames.Save, () => this.save());
        bus.on(GameEventNames.Load, () => this.load());
    }

    // --- Serialization Methods (Component-based system) ---

    public save(): void {
        try {
            Logger.info('[GameState] Starting save operation...');
            
            const saveData: GameSaveData = {
                hero: this.serializeHero(),
                dungeonNavigator: DungeonNavigator.instance.saveNavigatorState(),
                levelManager: LevelManager.instance.saveManagerState(),
                globalVars: this.getGlobalVars(),
                timestamp: Date.now(),
                version: 1
            };
            
            const saveJson = JSON.stringify(saveData, null, 2);
            localStorage.setItem('holiday-game-save', saveJson);
            
            Logger.info('[GameState] Game saved successfully');
            EventBus.instance.emit(GameEventNames.Log, new LogEvent('Game saved successfully', 'System', 'green'));
            
        } catch (error) {
            Logger.error(`[GameState] Save failed: ${error}`);
            EventBus.instance.emit(GameEventNames.Log, new LogEvent('Save failed', 'System', 'red'));
        }
    }

    public load(): void {
        try {
            Logger.info('[GameState] Starting load operation...');
            
            const saveJson = localStorage.getItem('holiday-game-save');
            if (!saveJson) {
                Logger.warn('[GameState] No save file found');
                EventBus.instance.emit(GameEventNames.Log, new LogEvent('No save file found', 'System', 'yellow'));
                return;
            }
            
            const saveData: GameSaveData = JSON.parse(saveJson);
            
            // Load navigator state
            DungeonNavigator.instance.loadNavigatorState(saveData.dungeonNavigator);
            
            // Load level manager state
            LevelManager.instance.loadManagerState(saveData.levelManager);
            
            // Load hero state
            this.deserializeHero(saveData.hero);
            
            // Load global vars
            this.setGlobalVars(saveData.globalVars);
            
            Logger.info('[GameState] Game loaded successfully');
            EventBus.instance.emit(GameEventNames.Log, new LogEvent('Game loaded successfully', 'System', 'green'));
            
        } catch (error) {
            Logger.error(`[GameState] Load failed: ${error}`);
            EventBus.instance.emit(GameEventNames.Log, new LogEvent('Load failed', 'System', 'red'));
        }
    }

    private serializeHero(): SerializedActor {
        if (!this.hero) {
            throw new Error('No hero registered for serialization');
        }
        
        // Serialize hero components
        const componentData: Record<string, any> = {};
        
        this.hero.gameComponents.forEach((component, name) => {
            try {
                componentData[name] = component.saveState();
            } catch (error) {
                Logger.error(`[GameState] Failed to serialize component ${name}: ${error}`);
            }
        });
        
        return {
            id: this.hero.id.toString(),
            defName: 'Hero',
            x: this.hero.pos.x,
            y: this.hero.pos.y,
            time: this.hero.time,
            actPriority: this.hero.actPriority,
            isPlayer: this.hero.isPlayer,
            componentData
        };
    }

    private deserializeHero(heroData: SerializedActor): void {
        if (!this.hero) {
            Logger.warn('[GameState] No hero registered for deserialization');
            return;
        }
        
        // Restore hero position
        this.hero.pos = new ex.Vector(heroData.x, heroData.y);
        this.hero.gridPos = new ex.Vector(Math.floor(heroData.x / 32), Math.floor(heroData.y / 32));
        this.hero.time = heroData.time;
        this.hero.actPriority = heroData.actPriority;
        
        // Restore component states
        if (heroData.componentData) {
            Object.entries(heroData.componentData).forEach(([name, data]) => {
                const component = this.hero!.getGameComponent(name);
                if (component) {
                    try {
                        component.loadState(data);
                    } catch (error) {
                        Logger.error(`[GameState] Failed to deserialize component ${name}: ${error}`);
                    }
                }
            });
        }
        
        Logger.info('[GameState] Hero state restored');
    }

    private getGlobalVars(): any {
        // TODO: Implement global variable system
        return {};
    }

    private setGlobalVars(vars: any): void {
        // TODO: Implement global variable system
        Logger.debug('[GameState] Global variables restored');
    }

    // Component serialization utilities
    public serializeComponents(components: ComponentSaveState[]): Record<string, any> {
        const componentData: Record<string, any> = {};
        
        for (const component of components) {
            try {
                const componentName = component.constructor.name;
                componentData[componentName] = component.saveState();
            } catch (error) {
                Logger.error(`[GameState] Failed to serialize component ${component.constructor.name}: ${error}`);
            }
        }
        
        return componentData;
    }

    public deserializeComponents(components: ComponentSaveState[], componentData: Record<string, any>): void {
        for (const component of components) {
            try {
                const componentName = component.constructor.name;
                const data = componentData[componentName];
                
                if (data) {
                    component.loadState(data);
                }
            } catch (error) {
                Logger.error(`[GameState] Failed to deserialize component ${component.constructor.name}: ${error}`);
            }
        }
    }
}
