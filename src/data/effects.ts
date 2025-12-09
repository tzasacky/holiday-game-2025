import { ItemID } from '../constants/ItemIDs';
import { AbilityID } from '../constants/AbilityIDs';
import { ActorID } from '../constants/ActorIDs';
import { EffectID } from '../constants/EffectIDs';
export enum EffectType {
    INSTANT = 'instant',           // Happens once immediately
    OVER_TIME = 'over_time',      // Happens every tick
    BUFF = 'buff',                // Positive temporary effect
    DEBUFF = 'debuff',            // Negative temporary effect
    AURA = 'aura',                // Affects nearby entities
    TRIGGERED = 'triggered',       // Activates on specific events
    PASSIVE = 'passive'           // Always active while equipped/learned
}

export enum EffectTrigger {
    ON_CAST = 'on_cast',
    ON_HIT = 'on_hit',
    ON_TAKE_DAMAGE = 'on_take_damage',
    ON_KILL = 'on_kill',
    ON_TURN_START = 'on_turn_start',
    ON_TURN_END = 'on_turn_end',
    ON_MOVE = 'on_move',
    ON_USE_ITEM = 'on_use_item',
    ON_EQUIP = 'on_equip',
    ON_UNEQUIP = 'on_unequip',
    ON_LOW_HEALTH = 'on_low_health',
    ON_LOW_WARMTH = 'on_low_warmth'
}

export interface EffectModifier {
    type: 'stat' | 'resistance' | 'immunity' | 'vulnerability';
    target: string; // stat name, damage type, condition name
    value: number;
    isMultiplier?: boolean;
}

export interface EffectVisuals {
    animation?: string;
    particleEffect?: string;
    sound?: string;
    colorTint?: string;
    floatingText?: string;
    screenShake?: boolean;
}

export interface EffectDefinition {
    id: string;
    name: string;
    description: string;
    type: EffectType;
    
    // Duration and timing
    duration?: number; // Turns, 0 = permanent until removed
    tickInterval?: number; // For over_time effects
    
    // Triggers for conditional effects
    triggers?: EffectTrigger[];
    triggerChance?: number; // 0-100
    
    // What the effect does
    modifiers: EffectModifier[];
    
    // Additional actions
    actions?: Array<{
        type: string; // AbilityID.Heal, 'damage', AbilityID.Teleport, 'spawn_entity', etc.
        value: number;
        target?: 'self' | 'caster' | 'nearby_allies' | 'nearby_enemies';
        range?: number;
        condition?: string;
    }>;
    
    // Stacking behavior
    stackable?: boolean;
    maxStacks?: number;
    stackType?: 'duration_refresh' | 'effect_stack' | 'no_stack';
    
    // Visual/Audio feedback
    visuals?: EffectVisuals;
    
    // Metadata
    tags: string[];
    category: 'buff' | 'debuff' | 'neutral';
    dispellable?: boolean;
    hiddenFromUI?: boolean;
}

// Data-driven effect definitions
export const EffectDefinitions: Record<string, EffectDefinition> = {
    // Basic stat modifiers
    [EffectID.StrengthBoost]: {
        id: EffectID.StrengthBoost,
        name: 'Strength Boost',
        description: '+{value} Strength',
        type: EffectType.BUFF,
        duration: 10,
        modifiers: [
            { type: 'stat', target: 'strength', value: 5 }
        ],
        stackable: true,
        maxStacks: 3,
        stackType: 'effect_stack',
        visuals: {
            colorTint: '#FF4444',
            particleEffect: 'red_sparkles'
        },
        tags: ['buff', 'combat', 'temporary'],
        category: 'buff',
        dispellable: true
    },

    'dexterity_boost': {
        id: 'dexterity_boost',
        name: 'Dexterity Boost',
        description: '+{value} Dexterity',
        type: EffectType.BUFF,
        duration: 10,
        modifiers: [
            { type: 'stat', target: 'dexterity', value: 5 }
        ],
        stackable: true,
        maxStacks: 3,
        stackType: 'effect_stack',
        visuals: {
            colorTint: '#44FF44',
            particleEffect: 'green_sparkles'
        },
        tags: ['buff', 'agility', 'temporary'],
        category: 'buff',
        dispellable: true
    },

    'intelligence_boost': {
        id: 'intelligence_boost',
        name: 'Intelligence Boost',
        description: '+{value} Intelligence',
        type: EffectType.BUFF,
        duration: 10,
        modifiers: [
            { type: 'stat', target: 'intelligence', value: 5 }
        ],
        stackable: true,
        maxStacks: 3,
        stackType: 'effect_stack',
        visuals: {
            colorTint: '#4444FF',
            particleEffect: 'blue_sparkles'
        },
        tags: ['buff', 'magic', 'temporary'],
        category: 'buff',
        dispellable: true
    },

    // Status conditions
    'frozen': {
        id: 'frozen',
        name: 'Frozen',
        description: 'Unable to move or act',
        type: EffectType.DEBUFF,
        duration: 3,
        modifiers: [
            { type: 'stat', target: 'speed', value: 0 },
            { type: 'immunity', target: 'fire_damage', value: -50 },
            { type: 'vulnerability', target: 'physical_damage', value: 25 }
        ],
        visuals: {
            colorTint: '#88CCFF',
            particleEffect: 'ice_crystals',
            sound: 'ice_crack'
        },
        tags: ['debuff', 'immobilize', EffectID.Ice],
        category: 'debuff',
        dispellable: true
    },

    'burning': {
        id: 'burning',
        name: 'Burning',
        description: 'Taking fire damage over time',
        type: EffectType.OVER_TIME,
        duration: 5,
        tickInterval: 1,
        actions: [
            {
                type: 'damage',
                value: 3,
                target: 'self'
            }
        ],
        modifiers: [
            { type: 'vulnerability', target: 'fire_damage', value: 50 },
            { type: 'immunity', target: 'ice_damage', value: -30 }
        ],
        visuals: {
            colorTint: '#FF4400',
            particleEffect: 'fire_sparks',
            sound: 'crackling_fire'
        },
        tags: ['debuff', 'damage_over_time', EffectID.Fire],
        category: 'debuff',
        dispellable: true
    },

    'poisoned': {
        id: 'poisoned',
        name: 'Poisoned',
        description: 'Taking poison damage and reduced healing',
        type: EffectType.OVER_TIME,
        duration: 8,
        tickInterval: 2,
        actions: [
            {
                type: 'damage',
                value: 2,
                target: 'self'
            }
        ],
        modifiers: [
            { type: 'stat', target: 'healing_received', value: 0.5, isMultiplier: true }
        ],
        visuals: {
            colorTint: '#44AA44',
            particleEffect: 'poison_bubbles',
            floatingText: 'POISON'
        },
        tags: ['debuff', 'damage_over_time', EffectID.Poison],
        category: 'debuff',
        dispellable: true
    },

    'slowed': {
        id: 'slowed',
        name: 'Slowed',
        description: 'Movement and action speed reduced',
        type: EffectType.DEBUFF,
        duration: 5,
        modifiers: [
            { type: 'stat', target: 'speed', value: 0.7, isMultiplier: true },
            { type: 'stat', target: 'action_speed', value: 0.8, isMultiplier: true }
        ],
        visuals: {
            colorTint: '#888888',
            particleEffect: 'slow_motion_trail'
        },
        tags: ['debuff', 'movement', 'speed'],
        category: 'debuff',
        dispellable: true
    },

    // Holiday-themed effects
    [AbilityID.ChristmasSpirit]: {
        id: AbilityID.ChristmasSpirit,
        name: 'Christmas Spirit',
        description: 'Feeling festive! All stats increased',
        type: EffectType.BUFF,
        duration: 15,
        modifiers: [
            { type: 'stat', target: 'strength', value: 3 },
            { type: 'stat', target: 'dexterity', value: 3 },
            { type: 'stat', target: 'intelligence', value: 3 },
            { type: 'stat', target: 'luck', value: 5 }
        ],
        visuals: {
            colorTint: '#FFD700',
            particleEffect: 'festive_sparkles',
            sound: 'jingle_bells'
        },
        tags: ['buff', 'festive', 'all_stats', 'temporary'],
        category: 'buff',
        dispellable: false
    },

    'warmth_aura': {
        id: 'warmth_aura',
        name: 'Warmth Aura',
        description: 'Radiating comforting warmth to nearby allies',
        type: EffectType.AURA,
        duration: 10,
        actions: [
            {
                type: 'warmth_restore',
                value: 2,
                target: 'nearby_allies',
                range: 3
            }
        ],
        modifiers: [
            { type: 'immunity', target: EffectID.ColdDamage, value: 100 },
            { type: 'resistance', target: 'ice_damage', value: 50 }
        ],
        visuals: {
            colorTint: '#FFAA44',
            particleEffect: 'warm_glow'
        },
        tags: ['buff', 'aura', 'warmth', 'support'],
        category: 'buff',
        dispellable: true
    },

    [ItemID.NaughtyList]: {
        id: ItemID.NaughtyList,
        name: 'Naughty List',
        description: 'Santa knows what you did... Krampus hunts you',
        type: EffectType.DEBUFF,
        duration: 0, // Permanent until removed
        actions: [
            {
                type: 'increase_krampus_aggro',
                value: 100,
                target: 'self'
            }
        ],
        modifiers: [
            { type: 'stat', target: 'luck', value: -10 }
        ],
        visuals: {
            colorTint: '#440000',
            particleEffect: 'dark_aura'
        },
        tags: ['curse', 'permanent', ActorID.KRAMPUS, 'unlucky'],
        category: 'debuff',
        dispellable: false,
        hiddenFromUI: false
    },

    // Triggered/conditional effects
    'berserker_rage': {
        id: 'berserker_rage',
        name: 'Berserker Rage',
        description: 'When health is low, gain massive damage bonus',
        type: EffectType.TRIGGERED,
        triggers: [EffectTrigger.ON_LOW_HEALTH],
        triggerChance: 100,
        duration: 5,
        modifiers: [
            { type: 'stat', target: 'damage', value: 2.0, isMultiplier: true },
            { type: 'vulnerability', target: 'all_damage', value: 50 }
        ],
        visuals: {
            colorTint: '#FF0000',
            particleEffect: 'rage_aura',
            screenShake: true
        },
        tags: ['triggered', 'combat', 'high_risk'],
        category: 'buff'
    },

    'vampiric_aura': {
        id: 'vampiric_aura',
        name: 'Vampiric Aura',
        description: 'Heal for a portion of damage dealt',
        type: EffectType.TRIGGERED,
        triggers: [EffectTrigger.ON_HIT],
        triggerChance: 100,
        actions: [
            {
                type: AbilityID.Heal,
                value: 0.2, // 20% of damage dealt
                target: 'self'
            }
        ],
        modifiers: [],
        visuals: {
            particleEffect: 'blood_drain'
        },
        tags: ['triggered', 'lifesteal', 'combat'],
        category: 'neutral'
    },

    // Environmental/Terrain Effects
    [EffectID.Wet]: {
        id: EffectID.Wet,
        name: 'Wet',
        description: 'Soaked with water',
        type: EffectType.DEBUFF,
        duration: 100,
        modifiers: [
            { type: 'vulnerability', target: 'cold_damage', value: 25 },
            { type: 'resistance', target: 'fire_damage', value: 50 }
        ],
        visuals: {
            colorTint: '#4488FF',
            particleEffect: 'water_drips'
        },
        tags: ['debuff', 'environmental', 'water'],
        category: 'debuff',
        dispellable: true
    },

    [EffectID.SlipperyMovement]: {
        id: EffectID.SlipperyMovement,
        name: 'Slippery',
        description: 'Movement is unpredictable on ice',
        type: EffectType.DEBUFF,
        duration: 1,
        modifiers: [
            { type: 'stat', target: 'movement_control', value: 0.5, isMultiplier: true }
        ],
        visuals: {
            colorTint: '#AADDFF',
            particleEffect: 'ice_sparkles'
        },
        tags: ['debuff', 'environmental', 'ice', 'movement'],
        category: 'debuff',
        dispellable: false
    },

    [EffectID.SlowMovement]: {
        id: EffectID.SlowMovement,
        name: 'Trudging',
        description: 'Moving slowly through deep snow',
        type: EffectType.DEBUFF,
        duration: 1,
        modifiers: [
            { type: 'stat', target: 'speed', value: 0.6, isMultiplier: true }
        ],
        visuals: {
            colorTint: '#FFFFFF',
            particleEffect: 'snow_puffs'
        },
        tags: ['debuff', 'environmental', 'snow', 'movement'],
        category: 'debuff',
        dispellable: false
    },

    [EffectID.Warmth]: {
        id: EffectID.Warmth,
        name: 'Warmth',
        description: 'Feeling warm and cozy',
        type: EffectType.BUFF,
        duration: 50,
        modifiers: [
            { type: 'resistance', target: 'cold_damage', value: 50 }
        ],
        actions: [
            {
                type: 'warmth_restore',
                value: 5,
                target: 'self'
            }
        ],
        visuals: {
            colorTint: '#FFAA44',
            particleEffect: 'warm_glow'
        },
        tags: ['buff', 'environmental', 'warmth', 'comfort'],
        category: 'buff',
        dispellable: false
    }
};

// Effect categories for organization
export const EffectCategories = {
    getBuffs: () => Object.values(EffectDefinitions).filter(effect => effect.category === 'buff'),
    getDebuffs: () => Object.values(EffectDefinitions).filter(effect => effect.category === 'debuff'),
    getTemporary: () => Object.values(EffectDefinitions).filter(effect => effect.duration && effect.duration > 0),
    getPermanent: () => Object.values(EffectDefinitions).filter(effect => !effect.duration || effect.duration === 0),
    getDispellable: () => Object.values(EffectDefinitions).filter(effect => effect.dispellable === true),
    getByType: (type: EffectType) => Object.values(EffectDefinitions).filter(effect => effect.type === type),
    getByTag: (tag: string) => Object.values(EffectDefinitions).filter(effect => effect.tags.includes(tag)),
    getTriggered: () => Object.values(EffectDefinitions).filter(effect => effect.triggers && effect.triggers.length > 0)
};

// Effect combinations and interactions
export const EffectInteractions = {
    // Effects that cancel each other
    cancellations: [
        ['frozen', 'burning'],
        ['slowed', 'hasted'],
        ['weakened', EffectID.StrengthBoost]
    ],
    
    // Effects that stack multiplicatively instead of additively
    multiplicativeStacks: [
        EffectID.SpeedBoost,
        'damage_boost',
        EffectID.DefenseBoost
    ],
    
    // Effects that have special interactions
    synergies: {
        'burning_and_oil': {
            effects: ['burning', 'oil_coating'],
            result: 'explosive_combustion'
        },
        'frozen_and_shatter': {
            effects: ['frozen', 'shatter_strike'],
            result: 'ice_explosion'
        }
    }
};