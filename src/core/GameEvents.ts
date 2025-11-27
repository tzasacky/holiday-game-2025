import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';
import { ItemEntity } from '../factories/ItemFactory';
import { AbilityID, DamageType } from '../constants';

// Event Names Enum
export enum GameEventNames {
    // Combat
    Attack = 'attack',
    Damage = 'damage',
    Heal = 'heal',
    Die = 'die',
    
    // Items
    ItemPickup = 'itempickup',
    ItemDrop = 'itemdrop',
    ItemUse = 'itemuse',
    ItemEquip = 'itemequip',
    ItemUnequip = 'itemunequip',
    InventoryChange = 'inventorychange',
    ItemDestroyed = 'item:destroyed',
    ItemCreated = 'item:created',
    
    // Equipment
    EquipmentEquipped = 'equipment:equipped',
    EquipmentUnequipped = 'equipment:unequipped',
    EquipmentUnequipRequest = 'equipment:unequip_request',
    
    // Enchantments
    EnchantmentApplied = 'enchantment:applied',
    EnchantmentRemoved = 'enchantment:removed',

    // Stats
    HealthChange = 'healthchange',
    WarmthChange = 'warmthchange',
    StatsRecalculate = 'stats:recalculate',
    XpGain = 'xpgain',
    LevelUp = 'levelup',
    
    // System
    Log = 'log',
    Save = 'save',
    Load = 'load',
    LevelChange = 'levelchange',
    GameStart = 'gamestart',
    GameOver = 'gameover',

    // Registry Events
    TerrainQuery = "terrain:query",
    ActorConfigQuery = "actor:config:query",
    ItemSpriteQuery = "item:sprite:query",
    EnchantmentQuery = "enchantment:query",
    LootQuery = "loot:query",

    // Data modification events
    TerrainModify = "terrain:modify",
    ActorConfigModify = "actor:config:modify",
    BalanceModify = "balance:modify",

    // Registry System events
    RegistryReload = "registry:reload",
    RegistryError = "registry:error",

    // Factory events
    ActorCreate = "actor:create",
    ItemCreate = "item:create",
    InteractableCreate = "interactable:create",
    
    // Loot Events
    LootRequest = "loot:request",
    LootGenerated = "loot:generated",
    
    // Collision Events
    CollisionCheck = "collision:check",
    CollisionResult = "collision:result",
    TerrainInteract = "terrain:interact",
    
    // Movement Events
    MovementRequest = "movement:request",
    MovementResult = "movement:result",
    
    // Effect Events
    EffectApply = "effect:apply",
    EffectRemove = "effect:remove",
    
    // Level Events
    LevelTransition = "level:transition",
    LevelTransitionRequest = "level:transition_request",
    
    // Sound Events
    SoundPlay = "sound:play",
}

// Event Classes

// --- Combat Events ---
export class AttackEvent extends ex.GameEvent<GameActor> {
    constructor(
        public attacker: GameActor,
        public target: GameActor,
        public damage: number
    ) {
        super();
        this.target = target; // Excalibur GameEvent target
    }
}

export class DamageEvent extends ex.GameEvent<GameActor> {
    constructor(
        public target: GameActor,
        public damage: number,
        public type: DamageType,
        public source?: GameActor
    ) {
        super();
        this.target = target;
    }
}

export class HealEvent extends ex.GameEvent<GameActor> {
    constructor(
        public target: GameActor,
        public amount: number,
        public source?: GameActor
    ) {
        super();
        this.target = target;
    }
}

export class DieEvent extends ex.GameEvent<GameActor> {
    constructor(
        public actor: GameActor,
        public killer?: GameActor
    ) {
        super();
        this.target = actor;
    }
}

// --- Item Events ---
export class ItemPickupEvent extends ex.GameEvent<GameActor> {
    constructor(
        public actor: GameActor,
        public item: ItemEntity
    ) {
        super();
        this.target = actor;
    }
}

export class ItemDropEvent extends ex.GameEvent<GameActor> {
    constructor(
        public actor: GameActor,
        public item: ItemEntity
    ) {
        super();
        this.target = actor;
    }
}

export class ItemUseEvent extends ex.GameEvent<GameActor> {
    constructor(
        public actor: GameActor,
        public item: ItemEntity
    ) {
        super();
        this.target = actor;
    }
}

export class ItemEquipEvent extends ex.GameEvent<GameActor> {
    constructor(
        public actor: GameActor,
        public item: ItemEntity,
        public slot: string
    ) {
        super();
        this.target = actor;
    }
}

export class ItemUnequipEvent extends ex.GameEvent<GameActor> {
    constructor(
        public actor: GameActor,
        public item: ItemEntity,
        public slot: string
    ) {
        super();
        this.target = actor;
    }
}

export class InventoryChangeEvent extends ex.GameEvent<any> {
    constructor(
        public inventory: any, 
        public action: 'add' | 'remove' | 'swap' | 'change',
        public item?: ItemEntity,
        public index?: number
    ) {
        super();
    }
}

// --- Enchantment Events ---
export class EnchantmentAppliedEvent extends ex.GameEvent<any> {
    constructor(
        public item: ItemEntity,
        public enchantment: any
    ) {
        super();
    }
}

export class EnchantmentRemovedEvent extends ex.GameEvent<any> {
    constructor(
        public item: ItemEntity,
        public enchantment: any
    ) {
        super();
    }
}

// --- Stat Events ---
export class HealthChangeEvent extends ex.GameEvent<GameActor> {
    constructor(
        public actor: GameActor,
        public current: number,
        public max: number,
        public delta: number
    ) {
        super();
        this.target = actor;
    }
}

export class WarmthChangeEvent extends ex.GameEvent<GameActor> {
    constructor(
        public actor: GameActor,
        public current: number,
        public max: number,
        public delta: number
    ) {
        super();
        this.target = actor;
    }
}

export class XpGainEvent extends ex.GameEvent<GameActor> {
    constructor(
        public actor: GameActor,
        public amount: number
    ) {
        super();
        this.target = actor;
    }
}

export class LevelUpEvent extends ex.GameEvent<GameActor> {
    constructor(
        public actor: GameActor,
        public newLevel: number
    ) {
        super();
        this.target = actor;
    }
}

// --- System Events ---
export class LogEvent extends ex.GameEvent<any> {
    constructor(
        public message: string,
        public category: string = 'System',
        public color?: string
    ) {
        super();
    }
}

export class SaveEvent extends ex.GameEvent<any> {
    constructor() {
        super();
    }
}

export class LoadEvent extends ex.GameEvent<any> {
    constructor() {
        super();
    }
}

export class LevelChangeEvent extends ex.GameEvent<any> {
    constructor(
        public levelNumber: number
    ) {
        super();
    }
}

// --- Registry Events ---
export class RegistryQueryEvent extends ex.GameEvent<any> {
    constructor(
        public system: string,
        public key: string,
        public result: any,
        public timestamp: number = Date.now()
    ) {
        super();
    }
}

export class RegistryModifyEvent extends ex.GameEvent<any> {
    constructor(
        public system: string,
        public key: string,
        public definition: any
    ) {
        super();
    }
}

export class RegistryReloadEvent extends ex.GameEvent<any> {
    constructor(
        public system: string,
        public key: string,
        public definition: any
    ) {
        super();
    }
}

export class FactoryCreateEvent extends ex.GameEvent<any> {
    constructor(
        public type: string,
        public instance: any
    ) {
        super();
    }
}

export class LootRequestEvent extends ex.GameEvent<any> {
    constructor(
        public tableId: string,
        public position: ex.Vector,
        public floor: number = 1,
        public sourceId?: string
    ) {
        super();
    }
}

export class LootGeneratedEvent extends ex.GameEvent<any> {
    constructor(
        public items: any[], // GeneratedLoot[]
        public position: ex.Vector,
        public sourceId?: string
    ) {
        super();
    }
}

// --- Collision Events ---
export class CollisionCheckEvent extends ex.GameEvent<any> {
    constructor(
        public actorId: string,
        public position: ex.Vector,
        public movementType: 'walk' | 'run' | 'teleport' | 'fall',
        public level: any // Level reference
    ) {
        super();
    }
}

export class CollisionResultEvent extends ex.GameEvent<any> {
    constructor(
        public actorId: string,
        public position: ex.Vector,
        public canMove: boolean,
        public collisionType?: 'terrain' | 'actor' | 'interactable' | 'environmental',
        public interaction?: {
            type: string;
            data: any;
        },
        public consequences?: Array<{
            type: 'damage' | 'effect' | 'transition' | 'sound';
            data: any;
        }>
    ) {
        super();
    }
}

export class TerrainInteractEvent extends ex.GameEvent<any> {
    constructor(
        public actorId: string,
        public position: ex.Vector,
        public terrainType: string,
        public level: any
    ) {
        super();
    }
}

// --- Movement Events ---
export class MovementRequestEvent extends ex.GameEvent<any> {
    constructor(
        public actorId: string,
        public fromPosition: ex.Vector,
        public toPosition: ex.Vector,
        public movementType: 'walk' | 'run' | 'teleport' | 'fall'
    ) {
        super();
    }
}

export class MovementResultEvent extends ex.GameEvent<any> {
    constructor(
        public actorId: string,
        public fromPosition: ex.Vector,
        public toPosition: ex.Vector,
        public success: boolean,
        public reason?: string
    ) {
        super();
    }
}

// --- Effect Events ---
export class EffectApplyEvent extends ex.GameEvent<any> {
    constructor(
        public targetId: string,
        public effectId: string,
        public duration: number,
        public source?: string,
        public data?: any
    ) {
        super();
    }
}

export class EffectRemoveEvent extends ex.GameEvent<any> {
    constructor(
        public targetId: string,
        public effectId: string,
        public source?: string
    ) {
        super();
    }
}

// --- Level Events ---
export class LevelTransitionEvent extends ex.GameEvent<any> {
    constructor(
        public direction: 'up' | 'down',
        public fromLevel: number,
        public toLevel: number
    ) {
        super();
    }
}

export class LevelTransitionRequestEvent extends ex.GameEvent<any> {
    constructor(
        public actorId: string,
        public direction: 'up' | 'down',
        public source: string,
        public data?: any
    ) {
        super();
    }
}

// --- Sound Events ---
export class SoundPlayEvent extends ex.GameEvent<any> {
    constructor(
        public soundId: string,
        public volume?: number,
        public position?: ex.Vector
    ) {
        super();
    }
}

// Event Map Type
export type GameEventMap = {
    [GameEventNames.Attack]: AttackEvent;
    [GameEventNames.Damage]: DamageEvent;
    [GameEventNames.Heal]: HealEvent;
    [GameEventNames.Die]: DieEvent;
    
    [GameEventNames.ItemPickup]: ItemPickupEvent;
    [GameEventNames.ItemDrop]: ItemDropEvent;
    [GameEventNames.ItemUse]: ItemUseEvent;
    [GameEventNames.ItemEquip]: ItemEquipEvent;
    [GameEventNames.ItemUnequip]: ItemUnequipEvent;
    [GameEventNames.InventoryChange]: InventoryChangeEvent;
    [GameEventNames.ItemDestroyed]: ex.GameEvent<any>;
    [GameEventNames.ItemCreated]: ex.GameEvent<any>;
    
    [GameEventNames.EnchantmentApplied]: EnchantmentAppliedEvent;
    [GameEventNames.EnchantmentRemoved]: EnchantmentRemovedEvent;

    [GameEventNames.HealthChange]: HealthChangeEvent;
    [GameEventNames.WarmthChange]: WarmthChangeEvent;
    [GameEventNames.XpGain]: XpGainEvent;
    [GameEventNames.LevelUp]: LevelUpEvent;
    
    [GameEventNames.Log]: LogEvent;
    [GameEventNames.Save]: SaveEvent;
    [GameEventNames.Load]: LoadEvent;
    [GameEventNames.LevelChange]: LevelChangeEvent;
    [GameEventNames.GameStart]: ex.GameEvent<any>;
    [GameEventNames.GameOver]: ex.GameEvent<any>;

    // Registry Events
    [GameEventNames.TerrainQuery]: RegistryQueryEvent;
    [GameEventNames.ActorConfigQuery]: RegistryQueryEvent;
    [GameEventNames.ItemSpriteQuery]: RegistryQueryEvent;
    [GameEventNames.EnchantmentQuery]: RegistryQueryEvent;
    [GameEventNames.LootQuery]: RegistryQueryEvent;

    [GameEventNames.TerrainModify]: RegistryModifyEvent;
    [GameEventNames.ActorConfigModify]: RegistryModifyEvent;
    [GameEventNames.BalanceModify]: RegistryModifyEvent;

    [GameEventNames.RegistryReload]: RegistryReloadEvent;
    [GameEventNames.RegistryError]: ex.GameEvent<any>;

    [GameEventNames.ActorCreate]: FactoryCreateEvent;
    [GameEventNames.ItemCreate]: FactoryCreateEvent;
    [GameEventNames.InteractableCreate]: FactoryCreateEvent;
    
    [GameEventNames.LootRequest]: LootRequestEvent;
    [GameEventNames.LootGenerated]: LootGeneratedEvent;
    
    [GameEventNames.CollisionCheck]: CollisionCheckEvent;
    [GameEventNames.CollisionResult]: CollisionResultEvent;
    [GameEventNames.TerrainInteract]: TerrainInteractEvent;
    
    [GameEventNames.MovementRequest]: MovementRequestEvent;
    [GameEventNames.MovementResult]: MovementResultEvent;
    
    [GameEventNames.EffectApply]: EffectApplyEvent;
    [GameEventNames.EffectRemove]: EffectRemoveEvent;
    
    [GameEventNames.LevelTransition]: LevelTransitionEvent;
    [GameEventNames.LevelTransitionRequest]: LevelTransitionRequestEvent;
    
    [GameEventNames.SoundPlay]: SoundPlayEvent;
};

