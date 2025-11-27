import { ItemID } from '../constants';
import { AbilityID } from '../constants';
import { EffectID } from '../constants';
export enum EnchantmentType {
    // Weapon Enchantments
    SHARPNESS = 'sharpness',
    FROST = 'frost',
    FIRE = EffectID.Fire,
    LIGHTNING = 'lightning',
    POISON = EffectID.Poison,
    VAMPIRIC = 'vampiric',
    STUNNING = 'stunning',
    PENETRATING = 'penetrating',
    EXPLOSIVE = 'explosive',
    HOLY = EffectID.Holy,
    VORPAL = 'vorpal',
    RETURNING = 'returning',
    
    // Armor Enchantments
    PROTECTION = 'protection',
    WARMTH = 'warmth',
    REFLECTION = 'reflection',
    REGENERATION = 'regeneration',
    STEALTH = 'stealth',
    SPEED = 'speed',
    STRENGTH = 'strength',
    MAGIC_RESISTANCE = 'magic_resistance',
    THORNS = 'thorns',
    FEATHERFALL = 'featherfall',
    WATERWALKING = 'waterwalking',
    
    // Universal Enchantments
    LUCK = 'luck',
    EXPERIENCE = 'experience',
    CHRISTMAS_SPIRIT = AbilityID.ChristmasSpirit,
    ELVEN_CRAFTED = 'elven_crafted',
    SANTA_BLESSED = 'santa_blessed'
}

export enum CurseType {
    // Weapon Curses
    DULL = 'dull',
    BRITTLE = 'brittle',
    CLUMSY = 'clumsy',
    BLOODTHIRSTY = 'bloodthirsty',
    FREEZING = 'freezing',
    HEAVY = 'heavy',
    SLIPPERY = 'slippery',
    CURSED_ACCURACY = 'cursed_accuracy',
    
    // Armor Curses
    VULNERABILITY = 'vulnerability',
    COLDNESS = 'coldness',
    WEIGHT = 'weight',
    VISIBILITY = 'visibility',
    WEAKNESS = 'weakness',
    SLOWNESS = 'slowness',
    HUNGER = 'hunger',
    EXHAUSTION = 'exhaustion',
    
    // Universal Curses
    NAUGHTY_LIST = ItemID.NaughtyList,
    BAD_LUCK = 'bad_luck',
    KRAMPUS_MARK = 'krampus_mark',
    COAL_TOUCH = 'coal_touch',
    MELTING = 'melting'
}

export interface Enchantment {
    type: EnchantmentType;
    power: number; // 1-5, determines effect strength
    name: string;
    description: string;
}

export interface Curse {
    type: CurseType;
    severity: number; // 1-5, determines negative effect strength
    name: string;
    description: string;
    hidden: boolean; // Whether curse is visible before identification
}

export const EnchantmentData: Record<EnchantmentType, {
    name: string;
    description: (power: number) => string;
    rarityWeight: number;
}> = {
    [EnchantmentType.SHARPNESS]: {
        name: 'Sharpness',
        description: (power) => `+${power * 2} damage`,
        rarityWeight: 10
    },
    [EnchantmentType.FROST]: {
        name: 'Frost',
        description: (power) => `${power * 5}% chance to freeze enemies`,
        rarityWeight: 8
    },
    [EnchantmentType.FIRE]: {
        name: 'Fire',
        description: (power) => `${power * 5}% chance to burn enemies`,
        rarityWeight: 8
    },
    [EnchantmentType.VAMPIRIC]: {
        name: 'Vampiric',
        description: (power) => `Heal ${power} HP per enemy killed`,
        rarityWeight: 4
    },
    [EnchantmentType.HOLY]: {
        name: 'Holy',
        description: (power) => `+${power * 3} damage vs undead/demons`,
        rarityWeight: 5
    },
    [EnchantmentType.PROTECTION]: {
        name: 'Protection',
        description: (power) => `+${power * 2} defense`,
        rarityWeight: 10
    },
    [EnchantmentType.WARMTH]: {
        name: 'Warmth',
        description: (power) => `+${power * 5} cold resistance`,
        rarityWeight: 9
    },
    [EnchantmentType.REGENERATION]: {
        name: 'Regeneration',
        description: (power) => `Regenerate ${power} HP every 5 turns`,
        rarityWeight: 3
    },
    [EnchantmentType.STEALTH]: {
        name: 'Stealth',
        description: (power) => `+${power * 10}% stealth chance`,
        rarityWeight: 6
    },
    [EnchantmentType.CHRISTMAS_SPIRIT]: {
        name: 'Christmas Spirit',
        description: (power) => `+${power} to all stats during December`,
        rarityWeight: 2
    },
    [EnchantmentType.SANTA_BLESSED]: {
        name: 'Santa Blessed',
        description: (power) => `+${power * 2} luck, immunity to naughty effects`,
        rarityWeight: 1
    },
    [EnchantmentType.LIGHTNING]: {
        name: 'Lightning',
        description: (power) => `${power * 4}% chance to shock enemies`,
        rarityWeight: 6
    },
    [EnchantmentType.POISON]: {
        name: 'Poison',
        description: (power) => `${power * 3}% chance to poison enemies`,
        rarityWeight: 7
    },
    [EnchantmentType.STUNNING]: {
        name: 'Stunning',
        description: (power) => `${power * 2}% chance to stun enemies`,
        rarityWeight: 5
    },
    [EnchantmentType.PENETRATING]: {
        name: 'Penetrating',
        description: (power) => `Attacks ignore ${power * 20}% armor`,
        rarityWeight: 4
    },
    [EnchantmentType.EXPLOSIVE]: {
        name: 'Explosive',
        description: (power) => `${power}% chance for AoE damage`,
        rarityWeight: 3
    },
    [EnchantmentType.VORPAL]: {
        name: 'Vorpal',
        description: (power) => `${power}% chance for instant kill on crit`,
        rarityWeight: 1
    },
    [EnchantmentType.RETURNING]: {
        name: 'Returning',
        description: (power) => `Returns when thrown, +${power} range`,
        rarityWeight: 4
    },
    [EnchantmentType.REFLECTION]: {
        name: 'Reflection',
        description: (power) => `${power * 10}% chance to reflect spells`,
        rarityWeight: 5
    },
    [EnchantmentType.SPEED]: {
        name: 'Speed',
        description: (power) => `+${power * 10}% movement speed`,
        rarityWeight: 7
    },
    [EnchantmentType.STRENGTH]: {
        name: 'Strength',
        description: (power) => `+${power * 2} strength`,
        rarityWeight: 8
    },
    [EnchantmentType.MAGIC_RESISTANCE]: {
        name: 'Magic Resistance',
        description: (power) => `${power * 15}% magic resistance`,
        rarityWeight: 6
    },
    [EnchantmentType.THORNS]: {
        name: 'Thorns',
        description: (power) => `Reflects ${power} damage to attackers`,
        rarityWeight: 6
    },
    [EnchantmentType.FEATHERFALL]: {
        name: 'Featherfall',
        description: (power) => `Negates fall damage up to ${power * 10} floors`,
        rarityWeight: 4
    },
    [EnchantmentType.WATERWALKING]: {
        name: 'Waterwalking',
        description: (power) => `Can walk on water/ice`,
        rarityWeight: 3
    },
    [EnchantmentType.LUCK]: {
        name: 'Luck',
        description: (power) => `+${power * 3} luck`,
        rarityWeight: 8
    },
    [EnchantmentType.EXPERIENCE]: {
        name: 'Experience',
        description: (power) => `+${power * 10}% experience gain`,
        rarityWeight: 5
    },
    [EnchantmentType.ELVEN_CRAFTED]: {
        name: 'Elven Crafted',
        description: (power) => `+${power} to all elven racial bonuses`,
        rarityWeight: 3
    }
};

export const CurseData: Record<CurseType, {
    name: string;
    description: (severity: number) => string;
    rarityWeight: number;
    hidden: boolean;
}> = {
    [CurseType.DULL]: {
        name: 'Dullness',
        description: (severity) => `-${severity * 2} damage`,
        rarityWeight: 10,
        hidden: false
    },
    [CurseType.VULNERABILITY]: {
        name: 'Vulnerability',
        description: (severity) => `-${severity * 2} defense`,
        rarityWeight: 10,
        hidden: false
    },
    [CurseType.BLOODTHIRSTY]: {
        name: 'Bloodthirsty',
        description: (severity) => `${severity * 10}% chance to attack allies`,
        rarityWeight: 3,
        hidden: true
    },
    [CurseType.FREEZING]: {
        name: 'Freezing',
        description: (severity) => `-${severity * 3} warmth per turn`,
        rarityWeight: 7,
        hidden: true
    },
    [CurseType.NAUGHTY_LIST]: {
        name: 'Naughty List',
        description: (severity) => `Krampus hunts you more aggressively`,
        rarityWeight: 2,
        hidden: true
    },
    [CurseType.BAD_LUCK]: {
        name: 'Bad Luck',
        description: (severity) => `-${severity * 3} luck`,
        rarityWeight: 8,
        hidden: false
    },
    [CurseType.MELTING]: {
        name: 'Melting',
        description: (severity) => `Item degrades ${severity} points per floor`,
        rarityWeight: 6,
        hidden: true
    },
    [CurseType.COAL_TOUCH]: {
        name: 'Coal Touch',
        description: (severity) => `Food becomes coal ${severity * 5}% of the time`,
        rarityWeight: 4,
        hidden: true
    },
    [CurseType.BRITTLE]: {
        name: 'Brittle',
        description: (severity) => `${severity * 10}% chance to break on use`,
        rarityWeight: 8,
        hidden: false
    },
    [CurseType.CLUMSY]: {
        name: 'Clumsy',
        description: (severity) => `-${severity * 5}% accuracy`,
        rarityWeight: 9,
        hidden: false
    },
    [CurseType.HEAVY]: {
        name: 'Heavy',
        description: (severity) => `-${severity * 2} speed`,
        rarityWeight: 7,
        hidden: false
    },
    [CurseType.SLIPPERY]: {
        name: 'Slippery',
        description: (severity) => `${severity * 3}% chance to drop on hit`,
        rarityWeight: 6,
        hidden: true
    },
    [CurseType.CURSED_ACCURACY]: {
        name: 'Cursed Accuracy',
        description: (severity) => `-${severity * 3} accuracy`,
        rarityWeight: 8,
        hidden: false
    },
    [CurseType.COLDNESS]: {
        name: 'Coldness',
        description: (severity) => `-${severity * 2} cold resistance`,
        rarityWeight: 9,
        hidden: false
    },
    [CurseType.WEIGHT]: {
        name: 'Weight',
        description: (severity) => `-${severity} speed, +${severity} stamina cost`,
        rarityWeight: 7,
        hidden: false
    },
    [CurseType.VISIBILITY]: {
        name: 'Visibility',
        description: (severity) => `-${severity * 10}% stealth`,
        rarityWeight: 6,
        hidden: false
    },
    [CurseType.WEAKNESS]: {
        name: 'Weakness',
        description: (severity) => `-${severity * 2} strength`,
        rarityWeight: 8,
        hidden: false
    },
    [CurseType.SLOWNESS]: {
        name: 'Slowness',
        description: (severity) => `-${severity * 10}% movement speed`,
        rarityWeight: 7,
        hidden: false
    },
    [CurseType.HUNGER]: {
        name: 'Hunger',
        description: (severity) => `+${severity * 20}% food consumption`,
        rarityWeight: 5,
        hidden: true
    },
    [CurseType.EXHAUSTION]: {
        name: 'Exhaustion',
        description: (severity) => `-${severity} max stamina`,
        rarityWeight: 6,
        hidden: false
    },
    [CurseType.KRAMPUS_MARK]: {
        name: 'Krampus Mark',
        description: (severity) => `Krampus tracks you relentlessly`,
        rarityWeight: 1,
        hidden: true
    }
};
