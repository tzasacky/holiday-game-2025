// TODO: Implement this system
// import { AbilityID } from '../constants';
// import { EffectID } from '../constants';
// export enum AbilityType {
//     HEALING = 'healing',
//     DAMAGE = 'damage',
//     BUFF = 'buff',
//     DEBUFF = 'debuff',
//     UTILITY = 'utility',
//     MOVEMENT = 'movement',
//     SUMMONING = 'summoning'
// }

// export enum TargetType {
//     SELF = 'self',
//     SINGLE_ENEMY = 'single_enemy',
//     SINGLE_ALLY = 'single_ally',
//     SINGLE_ANY = 'single_any',
//     ALL_ENEMIES = 'all_enemies',
//     ALL_ALLIES = 'all_allies',
//     AREA = 'area',
//     LINE = 'line',
//     NONE = 'none'
// }

// export interface AbilityEffect {
//     type: string; // AbilityID.Heal, 'damage', 'buff_stat', 'debuff_stat', 'apply_condition', etc.
//     value: number;
//     duration?: number;
//     damageType?: string;
//     statName?: string;
//     conditionId?: string;
//     scaling?: {
//         stat: string; // What stat to scale with
//         ratio: number; // Multiplier
//     };
// }

// export interface AbilityCost {
//     type: 'energy' | 'health' | 'warmth' | 'item';
//     amount: number;
//     itemId?: string;
// }

// export interface AbilityDefinition {
//     id: string;
//     name: string;
//     description: string;
//     type: AbilityType;
//     targetType: TargetType;
    
//     // Costs and limitations
//     costs: AbilityCost[];
//     cooldown: number;
//     range?: number;
//     areaRadius?: number;
    
//     // Effects
//     effects: AbilityEffect[];
    
//     // Requirements
//     requiredLevel?: number;
//     requiredClass?: string;
//     requiredItems?: string[];
    
//     // Visual/Audio
//     animation?: string;
//     sound?: string;
//     particleEffect?: string;
    
//     // Availability
//     tags: string[];
//     learnableByClasses?: string[];
//     scrollable?: boolean; // Can be used from scroll
//     artifactBound?: boolean; // Requires specific artifact
// }

// // Data-driven ability definitions
// export const AbilityDefinitions: Record<AbilityID, AbilityDefinition> = {
//     // Healing abilities
//     [AbilityID.Heal]: {
//         id: AbilityID.Heal,
//         name: 'Heal',
//         description: 'Restores health to the target',
//         type: AbilityType.HEALING,
//         targetType: TargetType.SINGLE_ANY,
//         costs: [{ type: 'energy', amount: 10 }],
//         cooldown: 5,
//         range: 3,
//         effects: [
//             {
//                 type: AbilityID.Heal,
//                 value: 15,
//                 scaling: { stat: 'intelligence', ratio: 0.5 }
//             }
//         ],
//         animation: 'heal_sparkle',
//         sound: 'heal_chime',
//         tags: ['healing', 'basic', 'utility'],
//         learnableByClasses: ['Hero'],
//         scrollable: true
//     },

//     AbilityID.GreaterHeal: {
//         id: AbilityID.GreaterHeal,
//         name: 'Greater Heal',
//         description: 'Powerful healing that restores significant health',
//         type: AbilityType.HEALING,
//         targetType: TargetType.SINGLE_ANY,
//         costs: [{ type: 'energy', amount: 25 }],
//         cooldown: 8,
//         range: 3,
//         effects: [
//             {
//                 type: AbilityID.Heal,
//                 value: 40,
//                 scaling: { stat: 'intelligence', ratio: 1.0 }
//             }
//         ],
//         requiredLevel: 5,
//         animation: 'greater_heal_glow',
//         sound: 'greater_heal_chime',
//         tags: ['healing', 'advanced', 'utility'],
//         learnableByClasses: ['Hero'],
//         scrollable: true
//     },

//     // Damage abilities
//     AbilityID.Fireball: {
//         id: AbilityID.Fireball,
//         name: 'Fireball',
//         description: 'Hurls a ball of fire at an enemy',
//         type: AbilityType.DAMAGE,
//         targetType: TargetType.SINGLE_ENEMY,
//         costs: [{ type: 'energy', amount: 20 }],
//         cooldown: 8,
//         range: 6,
//         effects: [
//             {
//                 type: 'damage',
//                 value: 15,
//                 damageType: EffectID.Fire,
//                 scaling: { stat: 'intelligence', ratio: 0.8 }
//             }
//         ],
//         animation: 'fireball_projectile',
//         sound: 'fireball_cast',
//         particleEffect: 'fire_explosion',
//         tags: ['damage', EffectID.Fire, 'projectile'],
//         learnableByClasses: ['Hero'],
//         scrollable: true
//     },

//     AbilityID.IceShard: {
//         id: AbilityID.IceShard,
//         name: 'Ice Shard',
//         description: 'Launches a piercing shard of ice',
//         type: AbilityType.DAMAGE,
//         targetType: TargetType.SINGLE_ENEMY,
//         costs: [{ type: 'energy', amount: 15 }],
//         cooldown: 6,
//         range: 5,
//         effects: [
//             {
//                 type: 'damage',
//                 value: 12,
//                 damageType: EffectID.Ice,
//                 scaling: { stat: 'intelligence', ratio: 0.6 }
//             },
//             {
//                 type: 'apply_condition',
//                 conditionId: 'slowed',
//                 duration: 3
//             }
//         ],
//         animation: 'ice_shard_projectile',
//         sound: 'ice_crack',
//         tags: ['damage', EffectID.Ice, 'debuff', 'projectile'],
//         learnableByClasses: ['Hero'],
//         scrollable: true
//     },

//     // Area abilities
//     AbilityID.Blizzard: {
//         id: AbilityID.Blizzard,
//         name: 'Blizzard',
//         description: 'Creates a freezing storm that damages all nearby enemies',
//         type: AbilityType.DAMAGE,
//         targetType: TargetType.AREA,
//         costs: [{ type: 'energy', amount: 35 }],
//         cooldown: 12,
//         range: 4,
//         areaRadius: 2,
//         effects: [
//             {
//                 type: 'damage',
//                 value: 8,
//                 damageType: EffectID.Ice
//             },
//             {
//                 type: 'apply_condition',
//                 conditionId: 'frozen',
//                 duration: 2
//             }
//         ],
//         requiredLevel: 8,
//         animation: 'blizzard_swirl',
//         sound: 'blizzard_howl',
//         particleEffect: 'snow_storm',
//         tags: ['damage', EffectID.Ice, 'aoe', 'debuff', 'advanced'],
//         learnableByClasses: ['Hero'],
//         scrollable: true
//     },

//     // Buff abilities
//     AbilityID.ChristmasSpirit: {
//         id: AbilityID.ChristmasSpirit,
//         name: 'Christmas Spirit',
//         description: 'Fills you with holiday joy, boosting all stats temporarily',
//         type: AbilityType.BUFF,
//         targetType: TargetType.SELF,
//         costs: [{ type: 'energy', amount: 20 }],
//         cooldown: 20,
//         effects: [
//             {
//                 type: 'buff_stat',
//                 statName: 'strength',
//                 value: 5,
//                 duration: 15
//             },
//             {
//                 type: 'buff_stat',
//                 statName: 'dexterity',
//                 value: 5,
//                 duration: 15
//             },
//             {
//                 type: 'buff_stat',
//                 statName: 'intelligence',
//                 value: 5,
//                 duration: 15
//             }
//         ],
//         animation: 'christmas_sparkle',
//         sound: 'jingle_bells',
//         particleEffect: 'festive_stars',
//         tags: ['buff', 'self', 'festive', 'temporary'],
//         learnableByClasses: ['Hero']
//     },

//     // Utility abilities
//     AbilityID.Identify: {
//         id: AbilityID.Identify,
//         name: 'Identify',
//         description: 'Reveals the properties of an unknown item',
//         type: AbilityType.UTILITY,
//         targetType: TargetType.NONE,
//         costs: [{ type: 'energy', amount: 5 }],
//         cooldown: 0,
//         effects: [
//             {
//                 type: 'identify_item',
//                 value: 1
//             }
//         ],
//         animation: 'identify_glow',
//         sound: 'magical_chime',
//         tags: ['utility', 'identification'],
//         learnableByClasses: ['Hero'],
//         scrollable: true
//     },

//     AbilityID.Teleport: {
//         id: AbilityID.Teleport,
//         name: 'Teleport',
//         description: 'Instantly move to a nearby location',
//         type: AbilityType.MOVEMENT,
//         targetType: TargetType.AREA,
//         costs: [{ type: 'energy', amount: 15 }],
//         cooldown: 10,
//         range: 4,
//         effects: [
//             {
//                 type: AbilityID.Teleport,
//                 value: 1
//             }
//         ],
//         requiredLevel: 3,
//         animation: 'teleport_flash',
//         sound: 'magical_whoosh',
//         particleEffect: 'magic_sparkles',
//         tags: ['movement', 'utility', 'escape'],
//         learnableByClasses: ['Hero'],
//         scrollable: true
//     },

//     // Holiday-themed abilities
//     AbilityID.SummonSnowman: {
//         id: AbilityID.SummonSnowman,
//         name: 'Summon Snowman',
//         description: 'Creates a friendly snowman to fight alongside you',
//         type: AbilityType.SUMMONING,
//         targetType: TargetType.AREA,
//         costs: [{ type: 'energy', amount: 30 }],
//         cooldown: 25,
//         range: 3,
//         effects: [
//             {
//                 type: 'summon',
//                 value: 1,
//                 scaling: { stat: 'intelligence', ratio: 0.2 }
//             }
//         ],
//         requiredLevel: 6,
//         animation: 'snowman_build',
//         sound: 'snow_packing',
//         particleEffect: 'snow_swirl',
//         tags: ['summoning', 'ally', 'festive', 'advanced'],
//         learnableByClasses: ['Hero']
//     },

//     AbilityID.GiftOfWarmth: {
//         id: AbilityID.GiftOfWarmth,
//         name: 'Gift of Warmth',
//         description: 'Shares your warmth with nearby allies',
//         type: AbilityType.HEALING,
//         targetType: TargetType.ALL_ALLIES,
//         costs: [{ type: 'warmth', amount: 20 }],
//         cooldown: 15,
//         range: 4,
//         effects: [
//             {
//                 type: 'restore_warmth',
//                 value: 30
//             },
//             {
//                 type: 'apply_condition',
//                 conditionId: 'warmth_aura',
//                 duration: 10
//             }
//         ],
//         animation: 'warmth_glow',
//         sound: 'crackling_fire',
//         particleEffect: 'warm_light',
//         tags: ['healing', 'warmth', 'aura', 'support'],
//         learnableByClasses: ['Hero']
//     }
// };

// // Ability learning and progression
// export const AbilityProgression: Record<string, {
//     level: number;
//     abilities: string[];
// }> = {
//     'Hero': {
//         level: 1,
//         abilities: [AbilityID.Heal, AbilityID.Identify]
//     },
//     'level_3': {
//         level: 3,
//         abilities: [AbilityID.IceShard, AbilityID.Teleport]
//     },
//     'level_5': {
//         level: 5,
//         abilities: [AbilityID.GreaterHeal, AbilityID.Fireball]
//     },
//     'level_6': {
//         level: 6,
//         abilities: [AbilityID.SummonSnowman]
//     },
//     'level_8': {
//         level: 8,
//         abilities: [AbilityID.Blizzard, AbilityID.ChristmasSpirit]
//     },
//     'level_10': {
//         level: 10,
//         abilities: [AbilityID.GiftOfWarmth]
//     }
// };

// // Ability categories for UI organization
// export const AbilityCategories = {
//     getCombat: () => Object.values(AbilityDefinitions).filter(ability => 
//         ability.type === AbilityType.DAMAGE || ability.tags.includes('combat')),
    
//     getHealing: () => Object.values(AbilityDefinitions).filter(ability => 
//         ability.type === AbilityType.HEALING),
    
//     getUtility: () => Object.values(AbilityDefinitions).filter(ability => 
//         ability.type === AbilityType.UTILITY || ability.type === AbilityType.MOVEMENT),
    
//     getBuffs: () => Object.values(AbilityDefinitions).filter(ability => 
//         ability.type === AbilityType.BUFF),
    
//     getScrollable: () => Object.values(AbilityDefinitions).filter(ability => 
//         ability.scrollable === true),
    
//     getByLevel: (level: number) => Object.values(AbilityDefinitions).filter(ability => 
//         !ability.requiredLevel || ability.requiredLevel <= level),
    
//     getByTag: (tag: string) => Object.values(AbilityDefinitions).filter(ability => 
//         ability.tags.includes(tag))
// };