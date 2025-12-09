export const Tags = {
    // General
    Player: 'player',
    Enemy: 'enemy',
    Npc: 'npc',
    BlockMovement: 'block_movement',
    BlockSight: 'block_sight',
    
    // Room/Generation
    StartRoom: 'start_room',
    EndRoom: 'end_room',
    BossRoom: 'boss_room',
    TreasureRoom: 'treasure_room',
    ShopRoom: 'shop_room',
    SecretRoom: 'secret_room',
    CombatRoom: 'combat_room',
    SafeRoom: 'safe_room',
    AmbushRoom: 'ambush_room',
    PuzzleRoom: 'puzzle_room',
    WorkshopRoom: 'workshop_room',
    LibraryRoom: 'library_room',
    ArmoryRoom: 'armory_room',
    KitchenRoom: 'kitchen_room',
    BedroomRoom: 'bedroom_room',
    GardenRoom: 'garden_room',
    ShrineRoom: 'shrine_room',
    GalleryRoom: 'gallery_room',
    StorageRoom: 'storage_room',
    SummoningRoom: 'summoning_room',
    IceChamber: 'ice_chamber',
    ChasmRoom: 'chasm_room',
    
    // Interactables
    Container: 'container',
    Door: 'door',
    Trap: 'trap',
    Portal: 'portal',
    Switch: 'switch',
    Decor: 'decor',
    LightSource: 'light_source',
    HeatSource: 'heat_source',
    
    // Items
    Weapon: 'weapon',
    Armor: 'armor',
    Consumable: 'consumable',
    Key: 'key',
    Valuable: 'valuable',
    Magic: 'magic',
    
    // Combat
    Destructible: 'destructible',
    Flammable: 'flammable',
    Freezable: 'freezable',
    
    // AI
    Aggressive: 'aggressive',
    Passive: 'passive',
    Fleeing: 'fleeing',
    
    // Special
    Quest: 'quest',
    Unique: 'unique',
    Legendary: 'legendary'
} as const;

export type Tag = typeof Tags[keyof typeof Tags];
