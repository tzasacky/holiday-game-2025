import * as ex from 'excalibur';
import { Resources } from '../config/resources';
import { ActorID } from '../constants/ActorIDs';
import { ItemID } from '../constants/ItemIDs';
import { LootTableID } from '../constants/LootTableIDs';

// Complete unified actor data system
export interface ActorAnimationConfig {
    name: string;
    frames: number[];
    duration: number;
}

export interface ActorGraphicsConfig {
    resource: ex.ImageSource;
    grid: {
        spriteWidth: number;
        spriteHeight: number;
        rows: number;
        columns: number;
    };
    animations: ActorAnimationConfig[];
    defaultAnimation: string;
}

export interface ActorStatsConfig {
    hp?: number; // Optional - will be initialized to maxHp
    maxHp: number;
    warmth?: number;
    maxWarmth?: number;
    strength: number; // Base damage + equipment requirements
    defense: number;  // Damage reduction
    accuracy?: number; // Hit chance (0-100, default 100)
    critRate?: number; // Crit chance (0-100, default 0)
}

export interface ActorAIConfig {
    type: 'idle' | 'wander_attack' | 'hit_and_run' | 'aggressive_boss' | 'player_input';
    viewDistance: number;
    aggroRange?: number;
    fleeThreshold?: number;
}

export interface ActorComponentConfig {
    type: string;
    config?: any;
}

// Unified data-first actor definition
export interface ActorDefinition {
    graphics: ActorGraphicsConfig;
    baseStats: ActorStatsConfig;
    components: ActorComponentConfig[];
    ai?: ActorAIConfig;
    tags: string[];
    inventory?: {
        size: number;
        startingItems?: string[];
    };
    lootTableId?: LootTableID;
    dropChance?: number;
}

// Standard animation template
function createStandardAnimations(): ActorAnimationConfig[] {
    return [
        // Idle
        { name: 'idle-down', frames: [0, 1], duration: 400 },
        { name: 'idle-left', frames: [2, 3], duration: 400 },
        { name: 'idle-right', frames: [4, 5], duration: 400 },
        { name: 'idle-up', frames: [6, 7], duration: 400 },
        // Walk
        { name: 'down-walk', frames: [8, 9], duration: 200 },
        { name: 'left-walk', frames: [10, 11], duration: 200 },
        { name: 'right-walk', frames: [12, 13], duration: 200 },
        { name: 'up-walk', frames: [14, 15], duration: 200 },
        // Attack
        { name: 'attack-down', frames: [16, 17], duration: 200 },
        { name: 'attack-left', frames: [18, 19], duration: 200 },
        { name: 'attack-right', frames: [20, 21], duration: 200 },
        { name: 'attack-up', frames: [22, 23], duration: 200 },
        // Hurt
        { name: 'hurt-down', frames: [24, 25], duration: 200 },
        { name: 'hurt-left', frames: [26, 27], duration: 200 },
        { name: 'hurt-right', frames: [28, 29], duration: 200 },
        { name: 'hurt-up', frames: [30, 31], duration: 200 },
        // Death
        { name: 'death', frames: [32, 33, 34, 35], duration: 200 },
    ];
}

function createStandardGraphics(resource: ex.ImageSource, defaultAnim: string = 'idle-down'): ActorGraphicsConfig {
    return {
        resource: resource,
        grid: { spriteWidth: 32, spriteHeight: 32, rows: 5, columns: 8 },
        animations: createStandardAnimations(),
        defaultAnimation: defaultAnim
    };
}

// Clean, data-first actor definitions
export const ActorDefinitions: Record<string, ActorDefinition> = {
    [ActorID.HERO]: {
        graphics: createStandardGraphics(Resources.HeroSpriteSheetPng),
        baseStats: {
            maxHp: 100,
            maxWarmth: 100,
            strength: 10,
            defense: 0,
            accuracy: 95,
            critRate: 5
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'player_input' },
            { type: 'inventory', config: { size: 20 } },
            { type: 'equipment' }
        ],
        tags: ['player', ActorID.HERO],
        inventory: { 
            size: 20,
            startingItems: [ItemID.HotCocoa, ItemID.CandyCaneSpear]
        }
    },
    
    [ActorID.SNOWMAN]: {
        graphics: createStandardGraphics(Resources.SnowmanPng),
        baseStats: {
            maxHp: 20,
            strength: 5,
            defense: 2,
            accuracy: 85,
            critRate: 0
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { type: 'wander_attack', viewDistance: 8 } }
        ],
        ai: {
            type: 'wander_attack',
            viewDistance: 8,
            aggroRange: 6
        },
        tags: ['enemy', 'cold_immune', 'snowfolk'],
        lootTableId: LootTableID.SnowmanLoot,
        dropChance: 0.15
    },
    
    [ActorID.SNOW_SPRITE]: {
        graphics: createStandardGraphics(Resources.SnowSpritePng),
        baseStats: {
            maxHp: 10,
            strength: 3,
            defense: 1,
            accuracy: 95,
            critRate: 10
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { type: 'hit_and_run', viewDistance: 6 } }
        ],
        ai: {
            type: 'hit_and_run',
            viewDistance: 6,
            aggroRange: 4,
            fleeThreshold: 50
        },
        tags: ['enemy', 'fast', 'cold_immune', 'elemental'],
        lootTableId: LootTableID.SnowSpriteLoot,
        dropChance: 0.12
    },
    
    [ActorID.KRAMPUS]: {
        graphics: createStandardGraphics(Resources.KrampusPng),
        baseStats: {
            maxHp: 200,
            strength: 20,
            defense: 8,
            accuracy: 90,
            critRate: 15
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { type: 'aggressive_boss', viewDistance: 12 } }
        ],
        ai: {
            type: 'aggressive_boss',
            viewDistance: 12,
            aggroRange: 10
        },
        tags: ['enemy', 'boss', 'evil', 'unique'],
        lootTableId: LootTableID.KrampusLoot,
        dropChance: 0.85
    }
};
