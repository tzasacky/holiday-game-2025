import * as ex from 'excalibur';
import { Resources } from '../config/resources';
import { ActorID } from '../constants/ActorIDs';
import { ItemID } from '../constants/ItemIDs';
import { LootTableID } from '../constants/LootTableIDs';
import { Tags } from '../constants/Tags';
import { Difficulty } from './balance';

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
            maxHp: Difficulty.playerStartingHP,        // Doubled starting health - matches updated balance
            maxWarmth: Difficulty.playerStartingWarmth,    // Reduced warmth capacity
            strength: 3,      // Very low starting damage - MUST find equipment
            defense: 0,       // No starting defense
            accuracy: 85,     // Reduced accuracy without equipment
            critRate: 2       // Lower crit rate
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
            startingItems: [ItemID.HotCocoa, ItemID.WeakSword]
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
            maxHp: 6,        // Very fragile tutorial enemy
            strength: 2,     // Very low damage for tutorial
            defense: 0,      // No defense - true glass cannon
            accuracy: 95,    // High accuracy to ensure hits
            critRate: 15     // High crit for glass cannon feel
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
            fleeThreshold: 75
        },
        tags: [Tags.Enemy, 'fast', 'cold_immune', 'elemental', 'glass_cannon'],
        lootTableId: LootTableID.SnowSpriteLoot,
        dropChance: 0.15
    },
    
    [ActorID.KRAMPUS]: {
        graphics: createStandardGraphics(Resources.KrampusPng),
        baseStats: {
            maxHp: 150,       // Nerfed for Floor 5 Boss
            strength: 12,     // Manageable for mid-gear
            defense: 4,       // Vulnerable to basic upgrades
            accuracy: 90,
            critRate: 15
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { behaviorComposition: 'Aggressive', viewDistance: 12 } }
        ],
        ai: {
            type: 'aggressive_boss',
            viewDistance: 12,
            aggroRange: 10
        },
        tags: [Tags.Enemy, 'boss', 'evil', Tags.Unique],
        lootTableId: LootTableID.KrampusLoot,
        dropChance: 0.85,
        inventory: {
            size: 10,
            startingItems: [ItemID.GoldKey]
        }
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
            { type: 'ai', config: { behaviorComposition: 'Default', viewDistance: 6 } }
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
            maxHp: 95,       // Tank archetype - very high HP
            strength: 8,     // Low damage for tank role
            defense: 8,      // Very high defense
            accuracy: 70,    // Low accuracy - slow and clunky
            critRate: 5      // Low crit rate
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { behaviorComposition: 'Territorial', viewDistance: 8 } }
        ],
        ai: {
            type: 'wander_attack',
            viewDistance: 8,
            aggroRange: 7
        },
        tags: [Tags.Enemy, 'giant', 'cold_immune', 'miniboss', 'tank'],
        lootTableId: LootTableID.FrostGiantLoot,
        dropChance: 0.40
    },
    
    [ActorID.EVIL_ELF]: {
        graphics: createStandardGraphics(Resources.EvilElfPng),
        baseStats: {
            maxHp: 8,        // Glass cannon - very low HP
            strength: 7,     // High damage to compensate for fragility
            defense: 0,      // No defense - true glass cannon
            accuracy: 100,   // Perfect accuracy for hit-and-run
            critRate: 25     // Very high crit rate
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { behaviorComposition: 'Aggressive', viewDistance: 7 } }
        ],
        ai: {
            type: 'hit_and_run',
            viewDistance: 7,
            aggroRange: 5,
            fleeThreshold: 60
        },
        tags: [Tags.Enemy, 'fast', 'humanoid', 'glass_cannon'],
        lootTableId: LootTableID.EvilElfLoot,
        dropChance: 0.18
    },
    
    [ActorID.GINGERBREAD_GOLEM]: {
        graphics: createStandardGraphics(Resources.GingerbreadGolemPng),
        baseStats: {
            maxHp: 45,       // High HP tank archetype
            strength: 4,     // Low damage - tank role
            defense: 6,      // Very high defense for early floors
            accuracy: 75,    // Low accuracy - slow and clunky
            critRate: 0      // No crits - reliable tank
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { behaviorComposition: 'Territorial', viewDistance: 6 } }
        ],
        ai: {
            type: 'wander_attack',
            viewDistance: 6,
            aggroRange: 4
        },
        tags: [Tags.Enemy, 'construct', 'holiday', 'guardian', 'tank'],
        lootTableId: LootTableID.GingerbreadGolemLoot,
        dropChance: 0.22
    },
    
    [ActorID.NUTCRACKER_SOLDIER]: {
        graphics: createStandardGraphics(Resources.NutcrackerSoldierPng),
        baseStats: {
            maxHp: 28,       // Balanced archetype - moderate HP
            strength: 8,     // Higher damage than tank, lower than glass cannon
            defense: 4,      // Moderate defense
            accuracy: 90,    // Good accuracy
            critRate: 12     // Moderate crit rate
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { behaviorComposition: 'Territorial', viewDistance: 8 } }
        ],
        ai: {
            type: 'wander_attack',
            viewDistance: 8,
            aggroRange: 6
        },
        tags: [Tags.Enemy, 'construct', 'armored', 'holiday', 'miniboss', 'balanced'],
        lootTableId: LootTableID.NutcrackerSoldierLoot,
        dropChance: 0.28
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
            { type: 'ai', config: { behaviorComposition: 'Aggressive', viewDistance: 6 } }
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
            { type: 'ai', config: { behaviorComposition: 'Default', viewDistance: 8 } }
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
            { type: 'ai', config: { behaviorComposition: 'Default', viewDistance: 10 } }
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
            maxHp: 15,       // Glass cannon archetype - very fragile
            strength: 12,    // High damage for mid-tier
            defense: 0,      // No defense - speed-based survival
            accuracy: 98,    // High accuracy
            critRate: 30     // Very high crit - deadly but fragile
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { behaviorComposition: 'Aggressive', viewDistance: 7 } }
        ],
        ai: {
            type: 'wander_attack',
            viewDistance: 7,
            aggroRange: 5
        },
        tags: [Tags.Enemy, 'venomous', 'ice', 'pack', 'glass_cannon'],
        lootTableId: LootTableID.IceSpiderLoot,
        dropChance: 0.20
    },
    
    [ActorID.ICE_WRAITH]: {
        graphics: createStandardGraphics(Resources.IceWraithPng),
        baseStats: {
            maxHp: 35,       // Balanced archetype - moderate survivability
            strength: 10,    // Good damage
            defense: 3,      // Moderate defense due to incorporeal nature
            accuracy: 85,    // Moderate accuracy
            critRate: 18     // Decent crit rate
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { behaviorComposition: 'Territorial', viewDistance: 9 } }
        ],
        ai: {
            type: 'wander_attack',
            viewDistance: 9,
            aggroRange: 7
        },
        tags: [Tags.Enemy, 'incorporeal', 'ice', 'undead', 'miniboss', 'balanced'],
        lootTableId: LootTableID.IceWraithLoot,
        dropChance: 0.32
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
            { type: 'ai', config: { behaviorComposition: 'Territorial', viewDistance: 8 } }
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
            maxHp: 250,       // Set for Floor 10 Boss
            strength: 18,     // Heavy hitter but survivable
            defense: 7,       // Requires armor penetration/high dmg
            accuracy: 85,
            critRate: 20
        },
        components: [
            { type: 'stats' },
            { type: 'combat' },
            { type: 'ai', config: { behaviorComposition: 'Aggressive', viewDistance: 12 } }
        ],
        ai: {
            type: 'aggressive_boss',
            viewDistance: 12,
            aggroRange: 10
        },
        tags: [Tags.Enemy, 'boss', 'corrupted', 'final_boss', Tags.Legendary],
        lootTableId: LootTableID.CorruptedSantaLoot,
        dropChance: 1.0,
        inventory: {
            size: 10,
            startingItems: [ItemID.GoldKey]
        }
    },
    
    [ActorID.ICE_DRAGON]: {
        graphics: createStandardGraphics(Resources.BlizzardElementalPng),
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
            { type: 'ai', config: { behaviorComposition: 'Aggressive', viewDistance: 14 } }
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
