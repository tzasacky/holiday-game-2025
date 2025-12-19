/**
 * LootTableID enum - All loot table IDs
 */
export enum LootTableID {
    // Container loot
    PresentChest = 'present_chest',
    Stocking = 'stocking',
    CHEST = 'chest_loot',
    TREASURE_CHEST = 'treasure_chest_loot',
    BARREL = 'barrel_loot',

    PUZZLE_CHEST = 'puzzle_chest_loot',
    
    // New Multi-Table Chest tables
    ChestEquipment = 'chest_equipment_guaranteed',
    ChestSustain = 'chest_sustain_guaranteed',
    ChestRandom = 'chest_random_loot',
    
    // Equipment Sub-tables
    EquipmentCommon = 'equipment_common',
    EquipmentRare = 'equipment_rare',
    EquipmentEpic = 'equipment_epic',
    
    // Enemy loot
    SnowmanLoot = 'snowman_loot',
    SnowSpriteLoot = 'snow_sprite_loot',
    SnowGolemLoot = 'snow_golem_loot',
    FrostGiantLoot = 'frost_giant_loot',
    EvilElfLoot = 'evil_elf_loot',
    GingerbreadGolemLoot = 'gingerbread_golem_loot',
    NutcrackerSoldierLoot = 'nutcracker_soldier_loot',
    CandyCaneSpiderLoot = 'candy_cane_spider_loot',
    FrostWispLoot = 'frost_wisp_loot',
    WinterWolfLoot = 'winter_wolf_loot',
    IceSpiderLoot = 'ice_spider_loot',
    IceWraithLoot = 'ice_wraith_loot',
    BlizzardElementalLoot = 'blizzard_elemental_loot',
    CorruptedSantaLoot = 'corrupted_santa_loot',
    IceDragonLoot = 'ice_dragon_loot',
    KrampusLoot = 'krampus_loot',
    
    // Room/Floor loot
    FloorGeneral = 'floor_general',
    COMBAT_LOOT = 'combat_loot',
    TREASURE_ROOM_LOOT = 'treasure_room_loot',
    BOSS_LOOT = 'boss_loot',
    PUZZLE_REWARD_LOOT = 'puzzle_reward_loot',
    CRAFTING_LOOT = 'crafting_loot',
    CorruptedTreasure = 'corrupted_treasure_loot',
    KrampusBoss = 'krampus_boss_loot',
    MAGIC_LOOT = 'magic_loot',
    FINAL_BOSS_LOOT = 'final_boss_loot',
    
    // Special room loot
    WARMTH_ITEMS = 'warmth_items',
    FOOD_TABLE = 'food_table'
}
