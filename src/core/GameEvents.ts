import * as ex from 'excalibur';
import { Actor } from '../actors/Actor';
import { Item } from '../items/Item';
import { DamageType } from '../mechanics/DamageType';

// Event Names Constants
export const GameEventNames = {
    // Combat
    Attack: 'attack',
    Damage: 'damage',
    Heal: 'heal',
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
    GameOver: 'gameover'
} as const;

// Event Classes

// --- Combat Events ---
export class AttackEvent extends ex.GameEvent<Actor> {
    constructor(
        public attacker: Actor,
        public target: Actor,
        public damage: number
    ) {
        super();
        this.target = target; // Excalibur GameEvent target
    }
}

export class DamageEvent extends ex.GameEvent<Actor> {
    constructor(
        public target: Actor,
        public damage: number,
        public type: DamageType,
        public source?: Actor
    ) {
        super();
        this.target = target;
    }
}

export class HealEvent extends ex.GameEvent<Actor> {
    constructor(
        public target: Actor,
        public amount: number,
        public source?: Actor
    ) {
        super();
        this.target = target;
    }
}

export class DieEvent extends ex.GameEvent<Actor> {
    constructor(
        public actor: Actor,
        public killer?: Actor
    ) {
        super();
        this.target = actor;
    }
}

// --- Item Events ---
export class ItemPickupEvent extends ex.GameEvent<Actor> {
    constructor(
        public actor: Actor,
        public item: Item
    ) {
        super();
        this.target = actor;
    }
}

export class ItemDropEvent extends ex.GameEvent<Actor> {
    constructor(
        public actor: Actor,
        public item: Item
    ) {
        super();
        this.target = actor;
    }
}

export class ItemUseEvent extends ex.GameEvent<Actor> {
    constructor(
        public actor: Actor,
        public item: Item
    ) {
        super();
        this.target = actor;
    }
}

export class ItemEquipEvent extends ex.GameEvent<Actor> {
    constructor(
        public actor: Actor,
        public item: Item,
        public slot: string
    ) {
        super();
        this.target = actor;
    }
}

export class ItemUnequipEvent extends ex.GameEvent<Actor> {
    constructor(
        public actor: Actor,
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
export class HealthChangeEvent extends ex.GameEvent<Actor> {
    constructor(
        public actor: Actor,
        public current: number,
        public max: number,
        public delta: number
    ) {
        super();
        this.target = actor;
    }
}

export class WarmthChangeEvent extends ex.GameEvent<Actor> {
    constructor(
        public actor: Actor,
        public current: number,
        public max: number,
        public delta: number
    ) {
        super();
        this.target = actor;
    }
}

export class XpGainEvent extends ex.GameEvent<Actor> {
    constructor(
        public actor: Actor,
        public amount: number
    ) {
        super();
        this.target = actor;
    }
}

export class LevelUpEvent extends ex.GameEvent<Actor> {
    constructor(
        public actor: Actor,
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
};
