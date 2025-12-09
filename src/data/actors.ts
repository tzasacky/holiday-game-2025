import * as ex from 'excalibur';
import { Resources } from '../config/resources';
import { ActorID } from '../constants/ActorIDs';
import { ItemID } from '../constants/ItemIDs';
import { LootTableID } from '../constants/LootTableIDs';
import { Tags } from '../constants/Tags';

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
            strength: 100,
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
        tags: [Tags.Player, ActorID.HERO],
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
        tags: [Tags.Enemy, 'cold_immune', 'snowfolk'],
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
        tags: [Tags.Enemy, 'fast', 'cold_immune', 'elemental'],
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
            { type: 'ai', config: { composition: 'Aggressive', viewDistance: 12 } }
        ],
        ai: {
            type: 'aggressive_boss',
            viewDistance: 12,
            aggroRange: 10
        },
        tags: [Tags.Enemy, 'boss', 'evil', Tags.Unique],
        lootTableId: LootTableID.KrampusLoot,
        dropChance: 0.85
    },
    
    // Missing mob definitions
    [ActorID.SNOW_GOLEM]: {
        graphics: createStandardGraphics(Resources.SnowGolemPng),
        baseStats: {
            maxHp: 50,
            strength: 8,
            defense: 5,
            accuracy: 85,
            critRate: 0
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { composition: 'Default', viewDistance: 6 } }
        ],
        ai: {
            type: 'wander_attack',
            viewDistance: 6,
            aggroRange: 5
        },
        tags: [Tags.Enemy, 'construct', 'cold_immune'],
        lootTableId: LootTableID.SnowGolemLoot,
        dropChance: 0.18
    },
    
    [ActorID.FROST_GIANT]: {
        graphics: createStandardGraphics(Resources.FrostGiantPng),
        baseStats: {
            maxHp: 120,
            strength: 15,
            defense: 6,
            accuracy: 80,
            critRate: 5
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { composition: 'Territorial', viewDistance: 8 } }
        ],
        ai: {
            type: 'wander_attack',
            viewDistance: 8,
            aggroRange: 7
        },
        tags: [Tags.Enemy, 'giant', 'cold_immune', 'miniboss'],
        lootTableId: LootTableID.FrostGiantLoot,
        dropChance: 0.35
    },
    
    [ActorID.EVIL_ELF]: {
        graphics: createStandardGraphics(Resources.EvilElfPng),
        baseStats: {
            maxHp: 15,
            strength: 4,
            defense: 1,
            accuracy: 95,
            critRate: 15
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { composition: 'Aggressive', viewDistance: 7 } }
        ],
        ai: {
            type: 'hit_and_run',
            viewDistance: 7,
            aggroRange: 5,
            fleeThreshold: 40
        },
        tags: [Tags.Enemy, 'fast', 'humanoid'],
        lootTableId: LootTableID.EvilElfLoot,
        dropChance: 0.12
    },
    
    [ActorID.GINGERBREAD_GOLEM]: {
        graphics: createStandardGraphics(Resources.GingerbreadGolemPng),
        baseStats: {
            maxHp: 40,
            strength: 7,
            defense: 3,
            accuracy: 85,
            critRate: 0
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { composition: 'Territorial', viewDistance: 6 } }
        ],
        ai: {
            type: 'wander_attack',
            viewDistance: 6,
            aggroRange: 4
        },
        tags: [Tags.Enemy, 'construct', 'holiday', 'guardian'],
        lootTableId: LootTableID.GingerbreadGolemLoot,
        dropChance: 0.20
    },
    
    [ActorID.NUTCRACKER_SOLDIER]: {
        graphics: createStandardGraphics(Resources.NutcrackerSoldierPng),
        baseStats: {
            maxHp: 35,
            strength: 9,
            defense: 4,
            accuracy: 90,
            critRate: 8
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { composition: 'Territorial', viewDistance: 8 } }
        ],
        ai: {
            type: 'wander_attack',
            viewDistance: 8,
            aggroRange: 6
        },
        tags: [Tags.Enemy, 'construct', 'armored', 'holiday', 'miniboss'],
        lootTableId: LootTableID.NutcrackerSoldierLoot,
        dropChance: 0.25
    },
    
    [ActorID.CANDY_CANE_SPIDER]: {
        graphics: createStandardGraphics(Resources.CandyCaneSpiderPng),
        baseStats: {
            maxHp: 12,
            strength: 6,
            defense: 0,
            accuracy: 100,
            critRate: 20
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { composition: 'Aggressive', viewDistance: 6 } }
        ],
        ai: {
            type: 'hit_and_run',
            viewDistance: 6,
            aggroRange: 4,
            fleeThreshold: 30
        },
        tags: [Tags.Enemy, 'fast', 'pack', 'holiday'],
        lootTableId: LootTableID.CandyCaneSpiderLoot,
        dropChance: 0.15
    },
    
    [ActorID.FROST_WISP]: {
        graphics: createStandardGraphics(Resources.FrostWispPng),
        baseStats: {
            maxHp: 18,
            strength: 5,
            defense: 0,
            accuracy: 95,
            critRate: 10
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { composition: 'Default', viewDistance: 8 } }
        ],
        ai: {
            type: 'hit_and_run',
            viewDistance: 8,
            aggroRange: 6,
            fleeThreshold: 50
        },
        tags: [Tags.Enemy, 'elemental', 'ice', 'incorporeal'],
        lootTableId: LootTableID.FrostWispLoot,
        dropChance: 0.14
    },
    
    [ActorID.WINTER_WOLF]: {
        graphics: createStandardGraphics(Resources.WinterWolfPng),
        baseStats: {
            maxHp: 30,
            strength: 8,
            defense: 2,
            accuracy: 90,
            critRate: 12
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { composition: 'Default', viewDistance: 10 } }
        ],
        ai: {
            type: 'wander_attack',
            viewDistance: 10,
            aggroRange: 8
        },
        tags: [Tags.Enemy, 'beast', 'pack', 'ice'],
        lootTableId: LootTableID.WinterWolfLoot,
        dropChance: 0.16
    },
    
    [ActorID.ICE_SPIDER]: {
        graphics: createStandardGraphics(Resources.IceSpiderPng),
        baseStats: {
            maxHp: 25,
            strength: 7,
            defense: 1,
            accuracy: 95,
            critRate: 18
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { composition: 'Aggressive', viewDistance: 7 } }
        ],
        ai: {
            type: 'wander_attack',
            viewDistance: 7,
            aggroRange: 5
        },
        tags: [Tags.Enemy, 'venomous', 'ice', 'pack'],
        lootTableId: LootTableID.IceSpiderLoot,
        dropChance: 0.18
    },
    
    [ActorID.ICE_WRAITH]: {
        graphics: createStandardGraphics(Resources.IceWraithPng),
        baseStats: {
            maxHp: 45,
            strength: 10,
            defense: 2,
            accuracy: 85,
            critRate: 25
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { composition: 'Territorial', viewDistance: 9 } }
        ],
        ai: {
            type: 'wander_attack',
            viewDistance: 9,
            aggroRange: 7
        },
        tags: [Tags.Enemy, 'incorporeal', 'ice', 'undead', 'miniboss'],
        lootTableId: LootTableID.IceWraithLoot,
        dropChance: 0.30
    },
    
    [ActorID.BLIZZARD_ELEMENTAL]: {
        graphics: createStandardGraphics(Resources.BlizzardElementalPng),
        baseStats: {
            maxHp: 60,
            strength: 12,
            defense: 4,
            accuracy: 80,
            critRate: 10
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { composition: 'Territorial', viewDistance: 8 } }
        ],
        ai: {
            type: 'aggressive_boss',
            viewDistance: 8,
            aggroRange: 6
        },
        tags: [Tags.Enemy, 'elemental', 'ice', 'miniboss'],
        lootTableId: LootTableID.BlizzardElementalLoot,
        dropChance: 0.32
    },
    
    [ActorID.CORRUPTED_SANTA]: {
        graphics: createStandardGraphics(Resources.CorruptedSantaPng),
        baseStats: {
            maxHp: 300,
            strength: 25,
            defense: 10,
            accuracy: 85,
            critRate: 20
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { composition: 'Aggressive', viewDistance: 12 } }
        ],
        ai: {
            type: 'aggressive_boss',
            viewDistance: 12,
            aggroRange: 10
        },
        tags: [Tags.Enemy, 'boss', 'corrupted', 'final_boss', Tags.Legendary],
        lootTableId: LootTableID.CorruptedSantaLoot,
        dropChance: 1.0
    },
    
    [ActorID.ICE_DRAGON]: {
        graphics: createStandardGraphics(Resources.IceDragonPng),
        baseStats: {
            maxHp: 250,
            strength: 22,
            defense: 8,
            accuracy: 80,
            critRate: 18
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { composition: 'Aggressive', viewDistance: 14 } }
        ],
        ai: {
            type: 'aggressive_boss',
            viewDistance: 14,
            aggroRange: 12
        },
        tags: [Tags.Enemy, 'boss', 'dragon', 'ice', Tags.Legendary],
        lootTableId: LootTableID.IceDragonLoot,
        dropChance: 0.95
    }
};
