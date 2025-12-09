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

    // Interactable Effects
    TogglePassage = 'toggle_passage',
    UnlockAndOpen = 'unlock_and_open',
    ChristmasBlessing = 'christmas_blessing',
    DryEquipment = 'dry_equipment',
    GrantKnowledge = 'grant_knowledge',
    OpenSmithing = 'open_smithing_interface',
    RepairEquipment = 'repair_equipment',
    OpenAlchemy = 'open_alchemy_interface',
    BrewPotions = 'brew_potions',
    FloorTravel = 'floor_travel',
    SaveProgress = 'save_progress',
    RevealAndOpen = 'reveal_and_open',
    GrantDiscovery = 'grant_discovery_bonus',
    LevelTransition = 'level_transition',
    FallDamage = 'fall_damage',

    // Item Effects
    FrostChance = 'frost_chance',
    StunChance = 'stun_chance',
    ArmorBreak = 'armor_break',
    Knockback = 'knockback',
    Damage = 'damage',
    SlowChance = 'slow_chance',
    EnchantRandom = 'enchant_random',
    MaxHpIncrease = 'max_hp_increase',
    StrengthPermanent = 'strength_permanent',
    ColdResistance = 'cold_resistance',
    FrostDamageBonus = 'frost_damage_bonus',
    WarmthGeneration = 'warmth_generation',
    MovementSpeed = 'movement_speed',
    DashCooldownReduction = 'dash_cooldown_reduction',
    StairsDetection = 'stairs_detection',
    TreasureDetection = 'treasure_detection',
    FireDamage = 'fire_damage',
    Light = 'light',
    NatureDamage = 'nature_damage',
    CharmChance = 'charm_chance',
    LightBlast = 'light_blast',
    SoundAttack = 'sound_attack',
    HealingOnHit = 'healing_on_hit',
    AoeDamage = 'aoe_damage',
    Fuel = 'fuel',
    ColdImmunity = 'cold_immunity',
    Confusion = 'confusion',
}
