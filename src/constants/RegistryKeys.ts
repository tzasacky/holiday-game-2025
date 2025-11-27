/**
 * Centralized registry key constants for DataManager
 * Use these instead of magic strings when querying/registering data
 */
export enum RegistryKey {
    // Terrain system
    TERRAIN = 'terrain',
    
    // Enchantment system
    ENCHANTMENT = 'enchantment',
    CURSE = 'curse',
    
    // Balance system
    DIFFICULTY = 'difficulty',
    ENEMY_SCALING = 'enemy_scaling',
    STAT_REQUIREMENTS = 'stat_requirements',
    RESOURCE_SCALING = 'resource_scaling',
    VICTORY = 'victory',
    
    // Actor definitions
    ACTOR = 'actor',
    
    // Item definitions
    ITEM = 'item',
    ITEM_CATEGORIES = 'item_categories',
    
    // Interactable definitions
    INTERACTABLE = 'interactable',
    INTERACTABLE_CATEGORIES = 'interactable_categories',
    
    // Loot definitions
    LOOT_TABLES = 'loot_tables',
    RARITY_WEIGHTS = 'rarity_weights',
    FLOOR_SCALING = 'floor_scaling',
    
    // Effects definitions
    EFFECTS = 'effects',
    EFFECT_CATEGORIES = 'effect_categories',
    EFFECT_INTERACTIONS = 'effect_interactions',
    
    // Game mechanics
    DAMAGE_TYPES = 'damage_types',
    ENVIRONMENTAL_HAZARDS = 'environmental_hazards',
    COMBAT_MECHANICS = 'combat_mechanics',
    PROGRESSION_RULES = 'progression_rules',
    STATUS_MECHANICS = 'status_mechanics',
    MECHANICS_HELPERS = 'mechanics_helpers',
    
    // Spawn tables
    SPAWN_TABLE = 'spawn_table',
    
    // Room templates
    ROOM_TEMPLATE = 'room_template',
    
    // Prefab definitions
    PREFAB = 'prefab',
    
    // Biome definitions
    BIOME = 'biome'
}
