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

// Complete component-based stats system
export interface ActorStatsConfig {
    hp: number;
    maxHp: number;
    warmth?: number;
    maxWarmth?: number;
    strength: number;
    dexterity: number;
    intelligence?: number;
    defense: number;
    speed?: number;
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
    [ActorID.Hero]: {
        graphics: createStandardGraphics(Resources.HeroSpriteSheetPng),
        baseStats: {
            hp: 100,
            maxHp: 100,
            warmth: 100,
            maxWarmth: 100,
            strength: 10,
            dexterity: 10,
            intelligence: 10,
            defense: 0
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'movement' },
            { type: 'player_input' },
            { type: 'inventory', config: { size: 20 } },
            { type: 'equipment' }
        ],
        tags: ['player', ActorID.Hero],
        inventory: { 
            size: 20,
            startingItems: [ItemID.HotCocoa, ItemID.CandyCaneSpear]
        }
    },
    
    [ActorID.Snowman]: {
        graphics: createStandardGraphics(Resources.SnowmanPng),
        baseStats: {
            hp: 20,
            maxHp: 20,
            strength: 5,
            dexterity: 3,
            defense: 2
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'movement' },
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
    
    [ActorID.SnowSprite]: {
        graphics: createStandardGraphics(Resources.SnowSpritePng),
        baseStats: {
            hp: 10,
            maxHp: 10,
            strength: 3,
            dexterity: 15,
            defense: 1
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'movement' },
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
    
    [ActorID.Krampus]: {
        graphics: createStandardGraphics(Resources.KrampusPng),
        baseStats: {
            hp: 200,
            maxHp: 200,
            strength: 20,
            dexterity: 15,
            defense: 8
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'movement' },
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
