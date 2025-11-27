import { GameActor } from '../components/GameActor';
import { Level } from '../dungeon/Level';
import { EventBus } from './EventBus';
import { GameEventNames, LogEvent } from './GameEvents';
import * as ex from 'excalibur';
import { Logger } from './Logger';

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

export interface SerializedLevel {
    seed: number;
    depth: number;
    width: number;
    height: number;
    terrain: number[][]; // Simplified terrain data
    actors: SerializedActor[];
    items: { x: number; y: number; item: SerializedItem }[];
    explored: boolean[][];
}

export interface GameSaveData {
    hero: SerializedActor;
    level: SerializedLevel;
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

    // --- Serialization Methods (TO BE REIMPLEMENTED FOR COMPONENT SYSTEM) ---

    public save(): void {
        Logger.warn('[GameState] Save system needs reimplementation for component-based architecture');
        Logger.warn('[GameState] TODO: Implement component serialization protocol');
        Logger.warn('[GameState] TODO: Serialize gameComponents map with each component providing its own saveState() method');
        
        // For now, just acknowledge the request
        EventBus.instance.emit(GameEventNames.Log, new LogEvent('Save system pending migration', 'System', 'yellow'));
    }

    public load(): void {
        Logger.warn('[GameState] Load system needs reimplementation for component-based architecture');
        Logger.warn('[GameState] TODO: Implement component deserialization with ActorFactory');
        Logger.warn('[GameState] TODO: Components should provide loadState(data) method');
        
        // For now, just acknowledge the request
        EventBus.instance.emit(GameEventNames.Log, new LogEvent('Load system pending migration', 'System', 'yellow'));
    }
}
