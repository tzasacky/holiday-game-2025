import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';
import { ItemEntity } from '../factories/ItemFactory';
import { AbilityID, DamageType } from '../constants';
import { Level } from '../dungeon/Level';

// Event Names Enum
export enum GameEventNames {
    // Core
    Log = 'log',
    
    // Input
    Input = 'input',
    PlayerInput = 'player:input',
    PlayerAction = 'player:action',
    InteractionRequest = 'interaction:request',
    
    // Turn System
    TurnStart = 'turn:start',
    TurnEnd = 'turn:end',
    ActorTurn = 'actor:turn',
    ActorSpendTime = 'actor:spend_time',
    ActorSpawned = 'actor:spawned',
    
    // Combat
    Attack = 'combat:attack',
    Damage = 'combat:damage',
    DamageDealt = 'combat:damage_dealt',
    Heal = 'combat:heal',
    Death = 'combat:death',
    Die = 'combat:death', // Alias for legacy support
    
    // Abilities
    AbilityCast = 'ability:cast',
    AbilityCastSuccess = 'ability:cast_success',
    AbilityCheckUsable = 'ability:check_usable',
    AbilityCheckResult = 'ability:check_result',
    AbilityEffect = 'ability:effect',
    
    // Stats
    StatGet = 'stat:get',
    StatResponse = 'stat:response',
    StatSet = 'stat:set',
    StatModify = 'stat:modify',
    StatChange = 'stat:change',
    EffectApply = 'effect:apply',
    EffectRemove = 'effect:remove',
    BuffApply = 'buff:apply',
    ConditionApply = 'condition:apply',
    PermanentEffectApply = 'permanent_effect:apply',
    HealthChange = 'healthchange',
    WarmthChange = 'warmthchange',
    StatsRecalculate = 'stats:recalculate',
    XpGain = 'xpgain',
    LevelUp = 'levelup',
    
    // Items
    ItemPickup = 'item:pickup',
    ItemDrop = 'item:drop',
    ItemUse = 'item:use',
    ItemEquip = 'item:equip',
    ItemUnequip = 'item:unequip',
    ItemSpawnRequest = 'item:spawn_request',
    InventoryChange = 'inventorychange',
    ItemDestroyed = 'item:destroyed',
    ItemCreated = 'item:created',
    InventoryAddStartingItems = 'inventory:add_starting_items',
    
    // Equipment
    EquipmentEquipped = 'equipment:equipped',
    EquipmentUnequipped = 'equipment:unequipped',
    EquipmentUnequipRequest = 'equipment:unequip_request',
    
    // Enchantments
    EnchantmentApplied = 'enchantment:applied',
    EnchantmentRemoved = 'enchantment:removed',
    
    // Level
    LevelGenerated = 'level:generated',
    LevelTransitionRequest = 'level:transition_request',
    LevelTransition = 'level:transition',
    LevelChange = 'levelchange',
    
    // Prefabs
    PrefabPlaceRequest = 'prefab:place_request',
    PrefabPlaced = 'prefab:placed',
    
    // Factories
    InteractableCreate = 'interactable:create',
    InteractableCreated = 'interactable:created',
    InteractableInteract = 'interactable:interact',
    ActorCreate = 'actor:create',
    ItemCreate = 'item:create',
    
    // Audio
    SoundPlay = 'sound:play',
    
    // Terrain
    TerrainInteract = 'terrain:interact',
    
    // Movement (new synchronous system)
    Movement = 'movement',
    MoveBlocked = 'movement:blocked',
    
    // System
    Save = 'save',
    Load = 'load',
    GameStart = 'gamestart',
    GameOver = 'gameover',
    SystemReady = 'system:ready',
    ComponentDataRequest = 'component:data_request',
    ComponentDataResponse = 'component:data_response',
    
    // Registry
    RegistryQuery = 'registry:query',
    RegistryResponse = 'registry:response',
    RegistryReload = 'registry:reload',
    RegistryError = 'registry:error',
    TerrainQuery = 'terrain:query',
    ActorConfigQuery = 'actor:config:query',
    ItemSpriteQuery = 'item:sprite:query',
    EnchantmentQuery = 'enchantment:query',
    LootQuery = 'loot:query',
    TerrainModify = 'terrain:modify',
    ActorConfigModify = 'actor:config:modify',
    BalanceModify = 'balance:modify',
    
    // Loot
    LootRequest = 'loot:request',
    LootGenerated = 'loot:generated',
    
    // Item Pickup Specifics
    ItemPickupAttempt = 'item:pickup_attempt',
    ItemPickupResult = 'item:pickup_result'
}

// Event Classes

// --- Combat Events ---
export class AttackEvent extends ex.GameEvent<GameActor> {
    constructor(
        public attacker: GameActor,
        public target: GameActor,
        public damage: number,
        public isCounterAttack: boolean = false
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
        public source?: GameActor,
        public isCounterAttack: boolean = false
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

export class ItemDestroyedEvent extends ex.GameEvent<any> {
    constructor(public item: ItemEntity) { super(); }
}

export class ItemCreatedEvent extends ex.GameEvent<any> {
    constructor(public item: ItemEntity) { super(); }
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
        public requestId?: string
    ) {
        super();
    }
}

export class RegistryResponseEvent extends ex.GameEvent<any> {
    constructor(
        public system: string,
        public key: string,
        public data: any,
        public requestId?: string
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

// --- Movement Events (new synchronous system) ---
export class MovementEvent extends ex.GameEvent<GameActor> {
    constructor(
        public actorId: string,
        public actor: GameActor,
        public from: ex.Vector,
        public to: ex.Vector
    ) {
        super();
        this.target = actor;
    }
}

export class MoveBlockedEvent extends ex.GameEvent<GameActor> {
    constructor(
        public actor: GameActor,
        public attemptedPosition: ex.Vector,
        public reason: string,
        public blocker?: GameActor
    ) {
        super();
        this.target = actor;
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

// --- Actor Events ---
export class ActorSpendTimeEvent extends ex.GameEvent<any> {
    constructor(
        public actorId: string,
        public time: number
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
    [GameEventNames.EquipmentEquipped]: ItemEquipEvent;
    [GameEventNames.EquipmentUnequipped]: ItemUnequipEvent;
    [GameEventNames.EquipmentUnequipRequest]: EquipmentUnequipRequestEvent;
    [GameEventNames.InventoryChange]: InventoryChangeEvent;
    
    [GameEventNames.EnchantmentApplied]: EnchantmentAppliedEvent;
    [GameEventNames.EnchantmentRemoved]: EnchantmentRemovedEvent;

    [GameEventNames.HealthChange]: HealthChangeEvent;
    [GameEventNames.WarmthChange]: WarmthChangeEvent;
    [GameEventNames.XpGain]: XpGainEvent;
    [GameEventNames.LevelUp]: LevelUpEvent;
    [GameEventNames.StatsRecalculate]: StatsRecalculateEvent;
    [GameEventNames.StatGet]: StatGetEvent;
    [GameEventNames.StatResponse]: StatResponseEvent;
    [GameEventNames.StatSet]: StatSetEvent;
    
    [GameEventNames.Log]: LogEvent;
    [GameEventNames.Save]: SaveEvent;
    [GameEventNames.Load]: LoadEvent;
    [GameEventNames.LevelChange]: LevelChangeEvent;
    [GameEventNames.GameStart]: ex.GameEvent<any>;
    [GameEventNames.GameOver]: ex.GameEvent<any>;

    // Registry Events
    // Registry Events
    [GameEventNames.RegistryQuery]: RegistryQueryEvent;
    [GameEventNames.RegistryResponse]: RegistryResponseEvent;
    [GameEventNames.ActorConfigQuery]: RegistryQueryEvent;
    [GameEventNames.ItemSpriteQuery]: RegistryQueryEvent;
    [GameEventNames.EnchantmentQuery]: RegistryQueryEvent;
    [GameEventNames.LootQuery]: RegistryQueryEvent;

    [GameEventNames.TerrainModify]: RegistryModifyEvent;
    [GameEventNames.ActorConfigModify]: RegistryModifyEvent;
    [GameEventNames.BalanceModify]: RegistryModifyEvent;

    [GameEventNames.RegistryReload]: RegistryReloadEvent;
    [GameEventNames.RegistryError]: RegistryErrorEvent;

    [GameEventNames.ActorCreate]: FactoryCreateEvent;
    [GameEventNames.ItemCreate]: FactoryCreateEvent;
    [GameEventNames.InteractableCreate]: FactoryCreateEvent;
    
    [GameEventNames.LootRequest]: LootRequestEvent;
    [GameEventNames.LootGenerated]: LootGeneratedEvent;
    
    [GameEventNames.TerrainInteract]: TerrainInteractEvent;
    
    [GameEventNames.Movement]: MovementEvent;
    [GameEventNames.MoveBlocked]: MoveBlockedEvent;
    
    [GameEventNames.EffectApply]: EffectApplyEvent;
    [GameEventNames.EffectRemove]: EffectRemoveEvent;
    
    [GameEventNames.LevelTransition]: LevelTransitionEvent;
    [GameEventNames.LevelTransitionRequest]: LevelTransitionRequestEvent;
    
    [GameEventNames.SoundPlay]: SoundPlayEvent;
    [GameEventNames.ActorSpendTime]: ActorSpendTimeEvent;
    [GameEventNames.ActorTurn]: ActorTurnEvent;
    [GameEventNames.ActorSpawned]: ActorSpawnedEvent;
    
    [GameEventNames.ItemSpawnRequest]: ItemSpawnRequestEvent;
    [GameEventNames.InventoryAddStartingItems]: InventoryAddStartingItemsEvent;
    
    // Missing / Loose Type Fixes
    [GameEventNames.ItemPickupAttempt]: ItemPickupAttemptEvent;
    [GameEventNames.ItemPickupResult]: ItemPickupResultEvent;
    [GameEventNames.AbilityCheckResult]: AbilityCheckResultEvent;
    [GameEventNames.AbilityCastSuccess]: AbilityCastSuccessEvent;
    [GameEventNames.AbilityCast]: AbilityCastEvent;
    [GameEventNames.AbilityCheckUsable]: AbilityCheckUsableEvent;
    [GameEventNames.StatModify]: StatModifyEvent;
    [GameEventNames.StatChange]: StatChangeEvent;
    [GameEventNames.DamageDealt]: DamageDealtEvent;
    [GameEventNames.BuffApply]: BuffApplyEvent;
    [GameEventNames.ConditionApply]: ConditionApplyEvent;
    [GameEventNames.PermanentEffectApply]: PermanentEffectApplyEvent;
    [GameEventNames.PrefabPlaced]: PrefabPlacedEvent;
    [GameEventNames.PrefabPlaceRequest]: PrefabPlaceRequestEvent;
    [GameEventNames.LevelGenerated]: LevelGeneratedEvent;
    [GameEventNames.InteractableCreated]: InteractableCreatedEvent;
    [GameEventNames.InteractableInteract]: InteractableInteractEvent;
    [GameEventNames.SystemReady]: SystemReadyEvent;
    [GameEventNames.ComponentDataResponse]: ComponentDataResponseEvent;
    [GameEventNames.ComponentDataRequest]: ComponentDataRequestEvent;
    [GameEventNames.ItemDestroyed]: ItemDestroyedEvent;
    [GameEventNames.ItemCreated]: ItemCreatedEvent;
    
    // Input Events
    [GameEventNames.PlayerInput]: PlayerInputEvent;
    [GameEventNames.PlayerAction]: PlayerActionEvent;
    [GameEventNames.InteractionRequest]: InteractionRequestEvent;
};

// --- New Event Classes ---

export class RegistryErrorEvent extends ex.GameEvent<any> {
    constructor(public message: string, public error: any) { super(); }
}

export class ActorTurnEvent extends ex.GameEvent<GameActor> {
    constructor(public actor: GameActor) { super(); this.target = actor; }
}

export class ActorSpawnedEvent extends ex.GameEvent<GameActor> {
    constructor(public actor: GameActor) { super(); this.target = actor; }
}

export class ItemSpawnRequestEvent extends ex.GameEvent<any> {
    constructor(public itemData: any, public position: ex.Vector) { super(); }
}

export class InventoryAddStartingItemsEvent extends ex.GameEvent<GameActor> {
    constructor(public actor: GameActor, public items: string[]) { super(); this.target = actor; }
}

export class PathfindingRequestEvent extends ex.GameEvent<any> {
    constructor(
        public start: ex.Vector, 
        public end: ex.Vector, 
        public actorId: string,
        public level: any, // Level type
        public options?: any
    ) { super(); }
}

export class PathfindingResultEvent extends ex.GameEvent<any> {
    constructor(
        public path: ex.Vector[], 
        public actorId: string, 
        public success: boolean,
        public reason?: string,
        public cost?: number
    ) { super(); }
}

export class ItemPickupAttemptEvent extends ex.GameEvent<GameActor> {
    constructor(public actor: GameActor, public item: ItemEntity) { super(); this.target = actor; }
}

export class ItemPickupResultEvent extends ex.GameEvent<GameActor> {
    constructor(public actor: GameActor, public item: ItemEntity, public success: boolean, public reason?: string) { super(); this.target = actor; }
}

export class AbilityCheckResultEvent extends ex.GameEvent<any> {
    constructor(public abilityId: string, public canUse: boolean, public reason?: string) { super(); }
}

export class AbilityCastSuccessEvent extends ex.GameEvent<any> {
    constructor(public actor: GameActor, public abilityId: string, public abilityTarget?: GameActor | ex.Vector) { super(); this.target = actor; }
}

export class AbilityCastEvent extends ex.GameEvent<any> {
    constructor(public actor: GameActor, public abilityId: string, public abilityTarget?: GameActor | ex.Vector) { super(); this.target = actor; }
}

export class AbilityEffectEvent extends ex.GameEvent<any> {
    constructor(public caster: GameActor, public target: GameActor, public effect: any) { super(); }
}

export class AbilityCheckUsableEvent extends ex.GameEvent<any> {
    constructor(public abilityId: string, public actorId: string, public requestId?: string) { super(); }
}

export class StatModifyEvent extends ex.GameEvent<GameActor> {
    constructor(public actor: GameActor, public stat: string, public value: number, public type: 'flat' | 'percent') { super(); this.target = actor; }
}

export class StatChangeEvent extends ex.GameEvent<GameActor> {
    constructor(public actor: GameActor, public stat: string, public oldValue: number, public newValue: number) { super(); this.target = actor; }
}

export class StatGetEvent extends ex.GameEvent<GameActor> {
    constructor(public actor: GameActor, public stat: string, public requestId?: string) { super(); this.target = actor; }
}

export class StatResponseEvent extends ex.GameEvent<GameActor> {
    constructor(public actor: GameActor, public stat: string, public value: number, public requestId?: string) { super(); this.target = actor; }
}

export class StatSetEvent extends ex.GameEvent<GameActor> {
    constructor(public actor: GameActor, public stat: string, public value: number) { super(); this.target = actor; }
}

export class DamageDealtEvent extends ex.GameEvent<GameActor> {
    constructor(public target: GameActor, public amount: number, public source?: GameActor, public type?: DamageType) { super(); this.target = target; }
}

export class BuffApplyEvent extends ex.GameEvent<GameActor> {
    constructor(public target: GameActor, public buffId: string, public duration: number, public stat?: string, public value?: number) { super(); this.target = target; }
}

export class ConditionApplyEvent extends ex.GameEvent<GameActor> {
    constructor(public target: GameActor, public conditionId: string, public duration: number, public value?: number) { super(); this.target = target; }
}

export class PermanentEffectApplyEvent extends ex.GameEvent<GameActor> {
    constructor(public target: GameActor, public effectId: string, public value?: number) { super(); this.target = target; }
}

export class PrefabPlacedEvent extends ex.GameEvent<any> {
    constructor(public request: any, public result: any) { super(); }
}

export class PrefabPlaceRequestEvent extends ex.GameEvent<any> {
    constructor(
        public prefabId: string, 
        public position: ex.Vector,
        public level: any,
        public floorNumber: number,
        public room?: any
    ) { super(); }
}

export class LevelGeneratedEvent extends ex.GameEvent<any> {
    constructor(public levelNumber: number, public rooms: any[], public level: Level) { super(); }
}

export class InteractableCreatedEvent extends ex.GameEvent<any> {
    constructor(public interactable: any) { super(); }
}

export class InteractableInteractEvent extends ex.GameEvent<GameActor> {
    constructor(public actor: GameActor, public interactable: any) { super(); this.target = actor; }
}

export class SystemReadyEvent extends ex.GameEvent<any> {
    constructor(
        public timestamp: number,
        public registeredSystems: string[],
        public componentTypes: string[]
    ) { super(); }
}

export class ComponentDataResponseEvent extends ex.GameEvent<any> {
    constructor(public componentId: string, public data: any) { super(); }
}

export class ComponentDataRequestEvent extends ex.GameEvent<any> {
    constructor(public system: string, public key: string, public requestId: string) { super(); }
}

export class PlayerInputEvent extends ex.GameEvent<any> {
    constructor(public actionType: any) { super(); }
}

export class PlayerActionEvent extends ex.GameEvent<any> {
    constructor(public actorId: string, public action: any) { super(); }
}

export class InteractionRequestEvent extends ex.GameEvent<any> {
    constructor(public actorId: string, public targetId?: string) { super(); }
}

export class StatsRecalculateEvent extends ex.GameEvent<any> {
    constructor(public actorId: string, public reason?: string) { super(); }
}

export class EquipmentUnequipRequestEvent extends ex.GameEvent<any> {
    constructor(public actorId: string, public slot: string) { super(); }
}

