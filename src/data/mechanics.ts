import { EffectID } from '../constants';

// Enums for mechanics (used throughout the system)
export enum DamageType {
    Physical = 'physical',
    Magical = 'magical', 
    Ice = 'ice',
    Fire = 'fire'
}

// Data-driven game mechanics definitions
export interface ScalingFormula {
    type: 'linear' | 'exponential' | 'logarithmic' | 'stepwise';
    baseValue: number;
    coefficient: number;
    cap?: number;
    floor?: number;
    steps?: Array<{threshold: number, value: number}>;
}

export interface DamageTypeDefinition {
    id: string;
    name: string;
    description: string;
    color: string;
    resistanceStatName?: string;
    interactions?: Array<{
        withType: string;
        effect: 'amplify' | 'reduce' | 'nullify';
        multiplier: number;
    }>;
}

export interface EnvironmentalHazard {
    id: string;
    name: string;
    description: string;
    damageType: string;
    scaling: ScalingFormula;
    effects?: string[];
    triggerConditions?: string[];
}

export interface CombatMechanic {
    id: string;
    name: string;
    description: string;
    type: 'damage_calculation' | EffectID.Accuracy | EffectID.CriticalHit | 'status_application';
    formula: ScalingFormula;
    modifiers?: Array<{
        condition: string;
        effect: number;
        isMultiplier?: boolean;
    }>;
}

export interface ProgressionRule {
    id: string;
    name: string;
    type: 'stat_scaling' | 'equipment_requirement' | 'enemy_scaling';
    scaling: ScalingFormula;
    applicableStats?: string[];
}

// Damage type definitions
export const DamageTypes: Record<string, DamageTypeDefinition> = {
    physical: {
        id: EffectID.Physical,
        name: 'Physical',
        description: 'Direct physical damage from weapons and attacks',
        color: '#888888',
        resistanceStatName: 'defense'
    },
    
    fire: {
        id: EffectID.Fire,
        name: 'Fire',
        description: 'Burning damage that may cause ongoing fire effects',
        color: '#FF4400',
        resistanceStatName: 'fire_resistance',
        interactions: [
            { withType: EffectID.Ice, effect: 'nullify', multiplier: 0 },
            { withType: EffectID.Poison, effect: 'amplify', multiplier: 1.5 }
        ]
    },
    
    ice: {
        id: EffectID.Ice,
        name: 'Ice',
        description: 'Freezing damage that may slow or freeze targets',
        color: '#88CCFF',
        resistanceStatName: 'cold_resistance',
        interactions: [
            { withType: EffectID.Fire, effect: 'nullify', multiplier: 0 },
            { withType: 'water', effect: 'amplify', multiplier: 1.3 }
        ]
    },
    
    poison: {
        id: EffectID.Poison,
        name: 'Poison',
        description: 'Toxic damage that causes ongoing poison effects',
        color: '#44AA44',
        resistanceStatName: 'poison_resistance',
        interactions: [
            { withType: EffectID.Fire, effect: 'amplify', multiplier: 1.5 }
        ]
    },
    
    holy: {
        id: EffectID.Holy,
        name: 'Holy',
        description: 'Divine damage effective against undead and demons',
        color: '#FFDD00',
        resistanceStatName: 'magic_resistance'
    },
    
    dark: {
        id: EffectID.Dark,
        name: 'Dark',
        description: 'Shadow magic that drains life and morale',
        color: '#440044',
        resistanceStatName: 'magic_resistance'
    },
    
    cold: {
        id: EffectID.Cold,
        name: 'Cold',
        description: 'Environmental cold that drains warmth',
        color: '#AACCFF',
        resistanceStatName: 'cold_resistance'
    }
};

// Environmental hazard definitions
export const EnvironmentalHazards: Record<string, EnvironmentalHazard> = {
    yellow_snow: {
        id: EffectID.YellowSnow,
        name: 'Yellow Snow',
        description: 'Suspicious-looking snow that causes poison damage',
        damageType: EffectID.Poison,
        scaling: { type: 'linear', baseValue: 3, coefficient: 0.5 },
        effects: ['poisoned']
    },
    
    falling_icicle: {
        id: EffectID.FallingIcicle,
        name: 'Falling Icicle',
        description: 'Sharp icicles that fall from above',
        damageType: EffectID.Physical,
        scaling: { type: 'linear', baseValue: 8, coefficient: 1.2 }
    },
    
    trap_spike: {
        id: EffectID.TrapSpike,
        name: 'Spike Trap',
        description: 'Hidden spikes that trigger when stepped on',
        damageType: EffectID.Physical,
        scaling: { type: 'exponential', baseValue: 12, coefficient: 1.15, cap: 50 }
    },
    
    cold_damage: {
        id: EffectID.ColdDamage,
        name: 'Extreme Cold',
        description: 'Environmental cold that saps warmth and health',
        damageType: EffectID.Cold,
        scaling: { type: 'linear', baseValue: 2, coefficient: 0.2 },
        effects: ['slowed']
    },
    
    thin_ice: {
        id: EffectID.ThinIce,
        name: 'Thin Ice',
        description: 'Fragile ice that may break under weight',
        damageType: EffectID.Cold,
        scaling: { type: 'linear', baseValue: 5, coefficient: 0.8 },
        triggerConditions: ['heavy_equipment', 'running']
    }
};

// Combat mechanics definitions
export const CombatMechanics: Record<string, CombatMechanic> = {
    base_damage: {
        id: EffectID.BaseDamage,
        name: 'Base Damage Calculation',
        description: 'How base weapon damage is calculated',
        type: 'damage_calculation',
        formula: { type: 'linear', baseValue: 1, coefficient: 1 },
        modifiers: [
            { condition: 'strength > 10', effect: 0.1, isMultiplier: true },
            { condition: 'weapon_enchanted', effect: 1.2, isMultiplier: true }
        ]
    },
    
    accuracy: {
        id: EffectID.Accuracy,
        name: 'Attack Accuracy',
        description: 'Chance to hit calculation',
        type: EffectID.Accuracy,
        formula: { type: 'linear', baseValue: 75, coefficient: 2 }, // base 75% + 2% per dex
        modifiers: [
            { condition: 'enemy_slowed', effect: 15 },
            { condition: 'attacking_in_darkness', effect: -20 }
        ]
    },
    
    critical_hit: {
        id: EffectID.CriticalHit,
        name: 'Critical Hit Chance',
        description: 'Chance for critical hits',
        type: EffectID.CriticalHit,
        formula: { type: 'linear', baseValue: 5, coefficient: 0.5, cap: 50 }, // 5% + 0.5% per dex, max 50%
        modifiers: [
            { condition: 'flanking', effect: 10 },
            { condition: 'enemy_frozen', effect: 25 }
        ]
    },
    
    armor_reduction: {
        id: EffectID.ArmorReduction,
        name: 'Armor Damage Reduction',
        description: 'How armor reduces incoming damage',
        type: 'damage_calculation',
        formula: { type: 'logarithmic', baseValue: 1, coefficient: 0.1 }, // diminishing returns
        modifiers: [
            { condition: 'armor_piercing_attack', effect: 0.5, isMultiplier: true }
        ]
    }
};

// Progression rules for scaling
export const ProgressionRules: Record<string, ProgressionRule> = {
    enemy_health_scaling: {
        id: EffectID.EnemyHealthScaling,
        name: 'Enemy Health by Floor',
        type: 'enemy_scaling',
        scaling: { type: 'exponential', baseValue: 1, coefficient: 1.2 } // 20% per floor
    },
    
    enemy_damage_scaling: {
        id: EffectID.EnemyDamageScaling, 
        name: 'Enemy Damage by Floor',
        type: 'enemy_scaling',
        scaling: { type: 'exponential', baseValue: 1, coefficient: 1.15 } // 15% per floor
    },
    
    player_stat_requirements: {
        id: EffectID.PlayerStatRequirements,
        name: 'Player Stat Requirements by Floor',
        type: 'stat_scaling',
        scaling: { type: 'stepwise', baseValue: 1, coefficient: 1,
            steps: [
                { threshold: 5, value: 1.5 },
                { threshold: 10, value: 2.0 },
                { threshold: 15, value: 2.8 },
                { threshold: 20, value: 4.0 }
            ]
        }
    },
    
    loot_quality_scaling: {
        id: EffectID.LootQualityScaling,
        name: 'Loot Quality by Floor',
        type: 'equipment_requirement', 
        scaling: { type: 'linear', baseValue: 0, coefficient: 0.05, cap: 0.8 } // +5% better loot per floor
    },
    
    warmth_decay_scaling: {
        id: EffectID.WarmthDecayScaling,
        name: 'Warmth Decay Rate by Floor',
        type: 'stat_scaling',
        scaling: { type: 'linear', baseValue: 2.5, coefficient: 0.2 } // base 2.5 + 0.2 per floor
    }
};

// Status effect application rules
export const StatusMechanics = {
    application_rules: {
        default_duration: 3,
        resistance_scaling: 0.1, // 10% resistance reduces duration by 1 turn
        immunity_threshold: 100, // 100% resistance = immunity
        
        stacking_rules: {
            damage_over_time: 'stack_duration', // Multiple DoTs extend duration
            stat_modifiers: 'stack_effect',     // Multiple buffs stack values
            movement_impair: 'no_stack'         // Only strongest applies
        }
    },
    
    condition_interactions: {
        burning_plus_oil: 'explosion',
        frozen_plus_shatter: 'ice_explosion',
        poisoned_plus_heal: 'reduced_healing'
    }
};

// Utility functions for applying these mechanics
export const MechanicsHelpers = {
    // Calculate scaled value based on formula
    calculateScaledValue(formula: ScalingFormula, inputValue: number): number {
        let result: number;
        
        switch (formula.type) {
            case 'linear':
                result = formula.baseValue + (inputValue * formula.coefficient);
                break;
            case 'exponential':
                result = formula.baseValue * Math.pow(formula.coefficient, inputValue);
                break;
            case 'logarithmic':
                result = formula.baseValue + (Math.log(inputValue + 1) * formula.coefficient);
                break;
            case 'stepwise':
                result = formula.baseValue;
                if (formula.steps) {
                    for (const step of formula.steps) {
                        if (inputValue >= step.threshold) {
                            result = step.value;
                        }
                    }
                }
                break;
        }
        
        // Apply caps and floors
        if (formula.cap !== undefined) {
            result = Math.min(result, formula.cap);
        }
        if (formula.floor !== undefined) {
            result = Math.max(result, formula.floor);
        }
        
        return result;
    },
    
    // Calculate damage with type interactions
    calculateDamageWithInteractions(baseDamage: number, damageType: string, targetResistances: Record<string, number>): number {
        const type = DamageTypes[damageType];
        if (!type) return baseDamage;
        
        // Apply resistance
        const resistance = targetResistances[type.resistanceStatName || ''] || 0;
        let finalDamage = baseDamage * (1 - resistance / 100);
        
        // Apply damage type interactions
        if (type.interactions) {
            for (const interaction of type.interactions) {
                // This would need context about what other damage types are present
                // Implementation depends on how interactions are triggered
            }
        }
        
        return Math.max(0, Math.floor(finalDamage));
    },
    
    // Get environmental hazard damage for floor
    getEnvironmentalDamage(hazardId: string, floor: number): number {
        const hazard = EnvironmentalHazards[hazardId];
        if (!hazard) return 0;
        
        return this.calculateScaledValue(hazard.scaling, floor);
    },
    
    // Calculate combat mechanic value
    getCombatMechanicValue(mechanicId: string, inputValue: number, conditions: string[] = []): number {
        const mechanic = CombatMechanics[mechanicId];
        if (!mechanic) return 0;
        
        let baseValue = this.calculateScaledValue(mechanic.formula, inputValue);
        
        // Apply conditional modifiers
        if (mechanic.modifiers) {
            for (const modifier of mechanic.modifiers) {
                if (conditions.includes(modifier.condition)) {
                    if (modifier.isMultiplier) {
                        baseValue *= modifier.effect;
                    } else {
                        baseValue += modifier.effect;
                    }
                }
            }
        }
        
        return baseValue;
    },
    
    // Get progression-scaled value
    getProgressionValue(ruleId: string, floor: number): number {
        const rule = ProgressionRules[ruleId];
        if (!rule) return 1;
        
        return this.calculateScaledValue(rule.scaling, floor);
    }
};