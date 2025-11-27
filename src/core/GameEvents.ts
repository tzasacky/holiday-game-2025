import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';
import { Item } from '../items/Item';
import { DamageType } from '../core/DamageType';
import { AbilityID } from '../constants';

// Event Names Constants
export const GameEventNames = {
    // Combat
    Attack: 'attack',
    Damage: 'damage',
    Heal: AbilityID.Heal,
    Die: 'die',
    
    // Items
    ItemPickup: 'itempickup',
    ItemDrop: 'itemdrop',
    ItemUse: 'itemuse',
    ItemEquip: 'itemequip',
    ItemUnequip: 'itemunequip',
    InventoryChange: 'inventorychange',
    
    // Stats
    HealthChange: 'healthchange',
    WarmthChange: 'warmthchange',
    XpGain: 'xpgain',
    LevelUp: 'levelup',
    
    // System
    Log: 'log',
    Save: 'save',
    Load: 'load',
    LevelChange: 'levelchange',
    GameStart: 'gamestart',
    GameOver: 'gameover',

    // Registry Events
    TerrainQuery: "terrain:query",
    ActorConfigQuery: "actor:config:query",
    ItemSpriteQuery: "item:sprite:query",
    EnchantmentQuery: "enchantment:query",
    LootQuery: "loot:query",

    // Data modification events
    TerrainModify: "terrain:modify",
    ActorConfigModify: "actor:config:modify",
    BalanceModify: "balance:modify",

    // Registry System events
    RegistryReload: "registry:reload",
    RegistryError: "registry:error",

    // Factory events
    ActorCreate: "actor:create",
    ItemCreate: "item:create",
    InteractableCreate: "interactable:create",
    
    // Loot Events
    LootRequest: "loot:request",
    LootGenerated: "loot:generated",
} as const;

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
        public item: Item
    ) {
        super();
        this.target = actor;
    }
}

export class ItemDropEvent extends ex.GameEvent<GameActor> {
    constructor(
        public actor: GameActor,
        public item: Item
    ) {
        super();
        this.target = actor;
    }
}

export class ItemUseEvent extends ex.GameEvent<GameActor> {
    constructor(
        public actor: GameActor,
        public item: Item
    ) {
        super();
        this.target = actor;
    }
}

export class ItemEquipEvent extends ex.GameEvent<GameActor> {
    constructor(
        public actor: GameActor,
        public item: Item,
        public slot: string
    ) {
        super();
        this.target = actor;
    }
}

export class ItemUnequipEvent extends ex.GameEvent<GameActor> {
    constructor(
        public actor: GameActor,
        public item: Item,
        public slot: string
    ) {
        super();
        this.target = actor;
    }
}

export class InventoryChangeEvent extends ex.GameEvent<any> {
    constructor(
        public inventory: any, // Avoid circular dependency if possible, or use Inventory type
        public action: 'add' | 'remove' | 'swap' | 'change',
        public item?: Item,
        public index?: number
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
};
