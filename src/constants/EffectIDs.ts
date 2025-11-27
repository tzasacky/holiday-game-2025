/**
 * EffectID enum - All effect definition IDs
 */
export enum EffectID {
    // Damage Effects
    Physical = 'physical',
    Fire = 'fire',
    Ice = 'ice',
    Poison = 'poison',
    Holy = 'holy',
    Dark = 'dark',
    Cold = 'cold',
    YellowSnow = 'yellow_snow',
    FallingIcicle = 'falling_icicle',
    TrapSpike = 'trap_spike',
    ColdDamage = 'cold_damage',
    ThinIce = 'thin_ice',
    
    // Combat Effects
    BaseDamage = 'base_damage',
    Accuracy = 'accuracy',
    CriticalHit = 'critical_hit',
    ArmorReduction = 'armor_reduction',
    
    // Scaling Effects
    EnemyHealthScaling = 'enemy_health_scaling',
    EnemyDamageScaling = 'enemy_damage_scaling',
    PlayerStatRequirements = 'player_stat_requirements',
    LootQualityScaling = 'loot_quality_scaling',
    WarmthDecayScaling = 'warmth_decay_scaling',
    
    // Buff Effects
    StrengthBoost = 'strength_boost',
    DefenseBoost = 'defense_boost',
    SpeedBoost = 'speed_boost',
    WarmthRegen = 'warmth_regen',
    HealthRegen = 'health_regen',
    
    // Debuff Effects
    Slow = 'slow',
    Stun = 'stun',
    Freeze = 'freeze',
    Burn = 'burn',
    PoisonDOT = 'poison',
    Blind = 'blind',
    
    // Environmental/Terrain Effects
    Wet = 'wet',
    SlipperyMovement = 'slippery_movement',
    SlowMovement = 'slow_movement',
    Warmth = 'warmth',
    
    // Utility Effects
    Heal = 'heal',
    WarmthRestore = 'warmth_restore',
    RevealMap = 'reveal_map',
    TeleportRandom = 'teleport_random',
    Identify = 'identify',
    RemoveCurse = 'remove_curse',
}
