import { Hero } from '../actors/Hero';
import { Level } from '../dungeon/Level';
import { EventBus } from './EventBus';
import { GameEventNames, LogEvent, HealthChangeEvent, WarmthChangeEvent } from './GameEvents';
import { Item } from '../items/Item';
import { EnhancedEquipment } from '../mechanics/EquipmentSystem';
import { Actor } from '../actors/Actor';
import { ItemFactory } from '../items/ItemFactory';
import * as ex from 'excalibur';

// Serialization Interfaces
export interface SerializedItem {
    id: string;
    name: string;
    count: number;
    stats?: any;
    enchantments?: string[];
    curses?: string[];
    identified?: boolean;
    stackable?: boolean;
}

export interface SerializedActor {
    id: number;
    type: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    warmth: number;
    maxWarmth: number;
    stats: any;
    inventory: (SerializedItem | null)[];
    equipment: {
        weapon: SerializedItem | null;
        armor: SerializedItem | null;
    };
    isPlayer: boolean;
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

export class GameState {
    private static _instance: GameState;
    
    // Runtime references
    private hero: Hero | null = null;
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

    public registerHero(hero: Hero) {
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

    // --- Helper Methods for Serialization ---

    private serializeItem(item: Item | null): SerializedItem | null {
        if (!item) return null;
        
        const serialized: SerializedItem = {
            id: item.id || item.name, // Fallback if no ID
            name: item.name,
            count: item.count,
            stackable: item.stackable
        };

        if (item instanceof EnhancedEquipment) {
            serialized.stats = { ...item.baseStats, ...item.bonusStats }; // Combine stats
            serialized.enchantments = item.enchantments;
            serialized.curses = item.curses;
            serialized.identified = item.identified;
        }

        return serialized;
    }

    private serializeActor(actor: Actor): SerializedActor {
        const actorAny = actor as any;
        return {
            id: actor.id,
            type: actor.name, // Or a specific type field
            x: actor.gridPos.x,
            y: actor.gridPos.y,
            hp: actor.hp,
            maxHp: actor.maxHp,
            warmth: actor.warmth,
            maxWarmth: actor.maxWarmth,
            stats: { ...actor.stats }, // Clone stats
            isPlayer: actor.isPlayer,
            inventory: actorAny.inventory ? actorAny.inventory.items.map((i: any) => this.serializeItem(i)) : [],
            equipment: {
                weapon: this.serializeItem(actor.weapon),
                armor: this.serializeItem(actor.armor)
            }
        };
    }

    public save(): void {
        if (!this.hero || !this.level) {
            console.warn('[GameState] Cannot save: Hero or Level not registered');
            return;
        }

        try {
            // Serialize Level
            const serializedLevel: SerializedLevel = {
                seed: 0, // TODO: Get actual seed from Level
                depth: 1, // TODO: Get actual depth
                width: this.level.width,
                height: this.level.height,
                terrain: [], // TODO: Serialize terrain grid if dynamic
                explored: [], // TODO: Serialize explored state
                actors: this.level.mobs.map(mob => this.serializeActor(mob)),
                items: this.level.items.map(item => {
                    const itemAny = item as any;
                    return {
                        x: itemAny.gridPos ? itemAny.gridPos.x : 0,
                        y: itemAny.gridPos ? itemAny.gridPos.y : 0,
                        item: this.serializeItem(item)!
                    };
                }).filter(i => i.item !== null)
            };

            const data: GameSaveData = {
                hero: this.serializeActor(this.hero),
                level: serializedLevel,
                globalVars: {},
                timestamp: Date.now(),
                version: 1
            };

            console.log('[GameState] Saving game...', data);
            localStorage.setItem('holiday_roguelike_save', JSON.stringify(data));
            EventBus.instance.emit(GameEventNames.Log, new LogEvent('Game Saved', 'System', 'green'));
        } catch (e) {
            console.error('[GameState] Save failed:', e);
            EventBus.instance.emit(GameEventNames.Log, new LogEvent('Save Failed!', 'System', 'red'));
        }
    }

    public load(): void {
        const json = localStorage.getItem('holiday_roguelike_save');
        if (!json) {
            console.warn('[GameState] No save found');
            EventBus.instance.emit(GameEventNames.Log, new LogEvent('No save game found.', 'System', 'yellow'));
            return;
        }

        try {
            const data: GameSaveData = JSON.parse(json);
            console.log('[GameState] Loading game...', data);
            
            if (this.hero) {
                // Restore Hero Stats
                this.hero.hp = data.hero.hp;
                this.hero.maxHp = data.hero.maxHp;
                this.hero.warmth = data.hero.warmth;
                this.hero.maxWarmth = data.hero.maxWarmth;
                this.hero.gridPos = ex.vec(data.hero.x, data.hero.y);
                this.hero.pos = this.hero.gridPos.scale(32).add(ex.vec(16, 16));

                // Restore Inventory
                if (this.hero.inventory) {
                    this.hero.inventory.items = data.hero.inventory.map(serializedItem => {
                        if (!serializedItem) return null;
                        return ItemFactory.createItem(serializedItem);
                    });
                }
                
                // Restore Equipment
                if (data.hero.equipment.weapon) {
                    const weapon = ItemFactory.createItem(data.hero.equipment.weapon);
                    if (weapon instanceof EnhancedEquipment) {
                        this.hero.weapon = weapon;
                    }
                } else {
                    this.hero.weapon = null;
                }

                if (data.hero.equipment.armor) {
                    const armor = ItemFactory.createItem(data.hero.equipment.armor);
                    if (armor instanceof EnhancedEquipment) {
                        this.hero.armor = armor;
                    }
                } else {
                    this.hero.armor = null;
                }
                
                // Trigger updates
                EventBus.instance.emit(GameEventNames.HealthChange, new HealthChangeEvent(this.hero, this.hero.hp, this.hero.maxHp, 0));
                EventBus.instance.emit(GameEventNames.WarmthChange, new WarmthChangeEvent(this.hero, this.hero.warmth, this.hero.maxWarmth, 0));
                // Force inventory update
                // We might need a generic "Refresh" event or just emit InventoryChange for each item?
                // Or just one big update.
                // For now, let's assume UI listens to InventoryChange and we might need to trigger it manually or add a "Refresh" type.
                // Actually, let's just emit a dummy change to force refresh
                EventBus.instance.emit(GameEventNames.InventoryChange, { inventory: this.hero.inventory, action: 'change' } as any);
            }

            if (this.level) {
                // Restore Level State
                // Clear existing mobs and items
                // Re-spawn mobs from data.level.actors
                // Re-spawn items from data.level.items
                // This part is complex because it involves creating actors/entities. 
                // For MVP, we might just restore Hero state and keep the level as is (if we don't support full level persistence yet).
                // But the user asked for serialization.
                // Let's at least log that level restoration is partial.
                console.warn('[GameState] Level restoration is not fully implemented yet (requires ActorFactory)');
            }
            
            EventBus.instance.emit(GameEventNames.Log, new LogEvent('Game Loaded', 'System', 'green'));

        } catch (e) {
            console.error('[GameState] Failed to load save:', e);
            EventBus.instance.emit(GameEventNames.Log, new LogEvent('Load Failed!', 'System', 'red'));
        }
    }
}
