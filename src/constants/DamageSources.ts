/**
 * DamageSource enum - Sources of damage and effects
 */
export enum DamageSource {
    // Environmental
    ChasmFall = 'chasm_fall',
    TerrainFireplace = 'terrain_fireplace',
    
    // Terrain
    Stairs = 'stairs',
    Trap = 'trap',
    
    // Combat
    MeleeAttack = 'melee_attack',
    RangedAttack = 'ranged_attack',
    MagicAttack = 'magic_attack',
    
    // Status Effects
    Burning = 'burning',
    Poison = 'poison',
    Freezing = 'freezing',
    
    // Other
    Unknown = 'unknown',
}
