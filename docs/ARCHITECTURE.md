# Holiday Game 2025: System Design

This document describes the architecture and system design of the Holiday Game 2025 codebase.

## System Architecture Overview

### The Three Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      GAME LOGIC LAYER                        │
│  (What developers interact with)                            │
│                                                              │
│  ActorFactory.createHero(pos)                               │
│  ItemFactory.create('fruitcake')                            │
│  AbilityExecutor.cast('fireball', caster, target)           │
│                                                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     SYSTEM LAYER                             │
│  (How things work under the hood)                           │
│                                                              │
│  ActorSpawnSystem.spawnActor(defName, pos)                  │
│  ComponentRegistry.create(componentType, actor, config)     │
│  EventBus.emit('damage:dealt', data)                        │
│  DataManager.query('item', 'fruitcake')                     │
│                                                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
│  (Pure configuration - no logic)                            │
│                                                              │
│  ActorDefinitions['Hero'] = { baseStats, components, ... }  │
│  ItemDefinitions['fruitcake'] = { effects, graphics, ... }  │
│  AbilityDefinitions['fireball'] = { damage, cost, ... }     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Component System Architecture

### Actor Composition

```
┌──────────────────────────────────────────────┐
│              GameActor                       │
│  (Minimal container)                         │
│                                              │
│  + entityId: string                          │
│  + isPlayer: boolean                         │
│  + components: Map<string, ActorComponent>   │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  StatsComponent                        │ │
│  │  - hp, maxHp, strength, defense        │ │
│  │  - accuracy, critRate                  │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  CombatComponent                       │ │
│  │  - weapon, damage calculation          │ │
│  │  - Handles: attacks, damage dealt      │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  EquipmentComponent                    │ │
│  │  - Equipped weapon, armor, rings       │ │
│  │  - Handles: equip/unequip, stat mods   │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  AIComponent (enemies)                 │ │
│  │  - behavior: wander_attack, hit_and_run│ │
│  │  - Handles: AI decision making         │ │
│  └────────────────────────────────────────┘ │
│       OR                                     │
│  ┌────────────────────────────────────────┐ │
│  │  PlayerInputComponent (hero)           │ │
│  │  - Handles keyboard/mouse input        │ │
│  │  - Converts to movement/action events  │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  InventoryComponent                    │ │
│  │  - items: ItemDefinition[]             │ │
│  │  - Handles: pickup, drop, use          │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  StatusEffectComponent                 │ │
│  │  - Active buffs/debuffs                │ │
│  │  - Tick-based effect processing        │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### Component Communication (Event-Driven)

```
┌──────────────┐         ┌──────────────┐
│ PlayerInput  │         │  EventBus    │
│  Component   │────────▶│              │
└──────────────┘  emit   └──────────────┘
 "I want to              │  │  │  │  │
  move north"            │  │  │  │  │
                         │  │  │  │  │
        ┌────────────────┘  │  │  │  └────────────────┐
        │                   │  │  │                   │
        ▼                   ▼  ▼  ▼                   ▼
┌──────────────┐   ┌──────────────┐         ┌──────────────┐
│  Movement    │   │  Stats       │         │  UI          │
│  Processor   │   │  Component   │         │  Manager     │
└──────────────┘   └──────────────┘         └──────────────┘
 listen for         listen for              listen for
 "move:request"     "stat:changed"          "stat:changed"

 Execute movement   Update stats            Update HUD
```

---

## Directory Structure

### `/src/core/` - Engine Core

**Purpose:** Fundamental systems that everything else depends on

```
/src/core/
├── EventBus.ts                    # Singleton event dispatcher
├── GameEvents.ts                  # Event type definitions (880+ lines)
├── DataManager.ts                 # Unified data registry access
├── Component.ts                   # Base component class
├── GameEntity.ts                  # Excalibur entity with grid position
├── TurnManager.ts                 # Turn-based game loop
├── GameState.ts                   # Save/load serialization
├── Logger.ts                      # Logging utility
├── InputManager.ts                # Keyboard/mouse input handling
├── Pathfinding.ts                 # A* pathfinding with blocked tile handling
├── Visibility.ts                  # FOV and line-of-sight calculations
├── DungeonNavigator.ts            # Level transitions and floor management
├── GameInitializer.ts             # Staged game initialization
├── UnifiedSystemInit.ts           # System initialization orchestration
├── InteractableStatePersistence.ts # Interactable state save/load
├── LevelManager.ts                # Level lifecycle management
├── PriorityQueue.ts               # Priority queue data structure
├── ResourceManager.ts             # Asset loading management
└── Trigger.ts                     # Trigger zone utilities
```

**Key Rule:** Core files should have ZERO dependencies on game logic (actors, items, etc.)

### `/src/data/` - Pure Configuration

**Purpose:** JSON-like data definitions with NO logic

```
/src/data/
├── actors.ts             # ActorDefinitions (Hero, enemies, bosses)
├── items.ts              # ItemDefinitions (60+ weapons, armor, consumables)
├── abilities.ts          # AbilityDefinitions (spells, skills)
├── effects.ts            # EffectDefinitions (buffs, debuffs, conditions)
├── enchantments.ts       # EnchantmentData & CurseData (25+ enchants, 15+ curses)
├── mechanics.ts          # Game mechanics (damage types, combat formulas)
├── loot.ts               # LootTables & drop rates
├── interactables.ts      # InteractableDefinitions (chests, doors, stairs)
├── terrain.ts            # TerrainDefinitions (wall, floor, door)
├── balance.ts            # Difficulty & scaling config
├── graphics.ts           # GraphicsManager (sprite configs)
├── biomes.ts             # BiomeDefinitions (Snowy Village, Frozen Depths)
├── decor.ts              # DecorDefinitions (furniture, decorations)
├── flavorText.ts         # Flavor text templates for journal
├── roomTemplates.ts      # Pre-designed room layouts
└── spawnTables.ts        # Enemy spawn configuration per floor
```

**Key Rule:** All exports should be `Record<string, SomeDefinition>` or utility functions

### `/src/components/` - Game Components

**Purpose:** Composable behavior units that attach to actors

```
/src/components/
├── ActorComponent.ts         # Base class for all actor components
├── GameActor.ts              # Actor container with component map
├── StatsComponent.ts         # HP, strength, defense, accuracy, critRate
├── CombatComponent.ts        # Attack, defend, damage calculation
├── EquipmentComponent.ts     # Weapon/armor slot management
├── AIComponent.ts            # Enemy AI behaviors
├── PlayerInputComponent.ts   # Keyboard/mouse input handling
├── InventoryComponent.ts     # Item storage and management
├── StatusEffectComponent.ts  # Buff/debuff tracking
├── InteractableComponent.ts  # Interactable object behaviors
├── ActorSpawnSystem.ts       # Component assembly system
└── ComponentFactory.ts       # Component registry and creation
```

**Key Rule:** Components communicate ONLY via EventBus, never direct method calls

### `/src/systems/` - Game Logic Executors

**Purpose:** Game logic executors that operate on data

```
/src/systems/
├── EffectExecutor.ts         # Applies effects from definitions (57KB)
├── AbilityExecutor.ts        # Casts abilities from definitions
├── LootSystem.ts             # Generates loot from tables
├── LootSpawner.ts            # Spawns loot in the world
├── EnchantmentSystem.ts      # Applies enchantments to items
├── EquipmentSystem.ts        # Equipment stat calculations
├── IdentificationSystem.ts   # Item identification mechanics
├── WarmthSystem.ts           # Cold/warmth survival mechanic
├── GameBalanceSystem.ts      # Difficulty scaling
├── MovementProcessor.ts      # Handles actor movement
├── CollisionSystem.ts        # Collision detection
├── FogOfWarRenderer.ts       # FOW rendering
├── InteractableSpawner.ts    # Spawns interactables
├── ItemPickupHandler.ts      # Item pickup logic
├── ItemSpawnHandler.ts       # Item spawning
├── PrefabExecutor.ts         # Prefab room instantiation
├── RoomGenerationExecutor.ts # Room generation algorithms
├── SpawnTableExecutor.ts     # Enemy spawning from tables
├── ParticleSystem.ts         # Visual effects
└── ProgressionSystem.ts      # Level progression
```

### `/src/dungeon/` - Level Generation

**Purpose:** Procedural dungeon generation

```
/src/dungeon/
├── Level.ts                  # Level data structure and queries
├── Room.ts                   # Room data structure
├── Spawner.ts                # Entity spawning orchestration
├── DecorSystem.ts            # Decor placement logic (55KB)
├── TilePropertyGrid.ts       # Tile property management
└── algorithms/
    ├── AdvancedLevelGenerator.ts  # Main generation algorithm
    ├── BSPDungeonGenerator.ts     # Binary space partition
    ├── FloodFill.ts               # Flood fill utilities
    ├── SpatialHash.ts             # Spatial partitioning
    └── CorridorGenerator.ts       # Corridor algorithms
```

### `/src/factories/` - High-Level APIs

**Purpose:** Clean public interfaces for creating game entities

```
/src/factories/
├── ActorFactory.ts           # Public API for actor creation
└── ItemFactory.ts            # Public API for item creation
```

**Why separate from systems?** Factories are what game code uses, systems are implementation details.

### `/src/ui/` - User Interface

**Purpose:** All UI components and managers

```
/src/ui/
├── UIManager.ts              # Central UI coordination
├── HUD.ts                    # Health, warmth, stats display
├── InventoryUI.ts            # Inventory grid and management
├── HotbarUI.ts               # Quick-access item bar
├── GameJournal.ts            # Combat log and messages
├── MinimapUI.ts              # Dungeon minimap
├── InteractableInventoryUI.ts # Chest/container UI
├── UITheme.ts                # Visual styling constants
├── SpriteMapper.ts           # Sprite lookup for UI
└── ui.css                    # UI stylesheets
```

---

## Event System Design

### Event Categories

Events are defined in `GameEvents.ts` with strongly-typed event classes.

#### 1. Core Events

- `Log` - Log messages
- `GameOver` - Game end state

#### 2. Turn System Events

- `TurnStart` / `TurnEnd` - Turn lifecycle
- `TurnAI` - AI actor's turn
- `ActorEndTurn` - Actor finished turn

#### 3. Combat Events

- `Attack` - Attack initiated
- `Damage` - Damage applied
- `Heal` - Health restored
- `Die` - Actor death
- `Miss` - Attack missed
- `Crit` - Critical hit

#### 4. Item Events

- `ItemPickup` / `ItemDrop` - Inventory changes
- `ItemUse` / `ItemThrow` - Item actions
- `ItemEquip` / `ItemUnequip` - Equipment changes
- `ItemIdentify` - Item identified

#### 5. Effect Events

- `EffectApply` / `EffectRemove` - Status effects
- `PermanentEffectApply` - Permanent upgrades
- `HealthChange` / `WarmthChange` - Stat changes

#### 6. Level Events

- `LevelLoaded` - New level generated
- `LevelTransition` - Moving between floors
- `FloorChange` - Floor number changed

#### 7. Movement Events

- `Movement` - Actor moved
- `MoveBlocked` - Movement blocked

### Event Flow Example: Combat

```
Player presses SPACE to attack
         ↓
┌────────────────────┐
│ PlayerInput        │
│ Component          │
└────────────────────┘
    emit('attack')
         ↓
┌────────────────────┐
│ CombatComponent    │ ← handles attack
└────────────────────┘
    Calculates hit chance, damage
    emit('damage', { target, amount, type })
         ↓
┌────────────────────┐
│ StatsComponent     │ ← target's component
│ (Enemy)            │
└────────────────────┘
    Reduces HP
    emit('healthChange', { actor, oldValue, newValue })
         ↓
    ┌──────────────┐        ┌──────────────┐
    │ HUD          │        │ GameJournal  │
    └──────────────┘        └──────────────┘
    Shows HP bar            Logs "Snowman takes 5 damage!"
```

---

## Game Flow

### Initialization Sequence

```
1. main.ts creates Excalibur Engine
2. loader loads all image resources
3. GameInitializer.initializeGame():
   a. UnifiedSystemInit initializes all systems
   b. DungeonNavigator creates Level 1
   c. GameScene registered with engine
4. Engine starts, goes to 'level_1' scene
```

### Turn Cycle

```
┌─────────────────┐
│   TurnManager   │
└────────┬────────┘
         │
         ▼
   ┌─────────────┐
   │ Player Turn │ ←── Wait for input
   └─────┬───────┘
         │
         ▼
   ┌─────────────┐
   │  AI Turns   │ ←── Each enemy acts
   └─────┬───────┘
         │
         ▼
   ┌─────────────┐
   │  End Turn   │ ←── Process effects, warmth
   └─────┬───────┘
         │
         └──────────▶ Next turn
```

### Level Transition

```
1. Player steps on stairs
2. InteractableComponent emits 'interactable:use'
3. DungeonNavigator receives event
4. If new floor:
   a. Generate new Level
   b. Create GameScene
   c. Switch scene with fade transition
5. If returning to visited floor:
   a. Restore saved Level
   b. Restore interactable states
   c. Position hero at correct stairs
```

---

## Type Safety & Data Patterns

### Data Definition Pattern

```typescript
// 1. Define the shape
export interface ItemDefinition {
  id: string;
  name: string;
  type: ItemType;
  effects?: ItemEffect[];
  stats?: ItemStats;
  tags: string[];
}

// 2. Create the registry with autocomplete
export const ItemDefinitions: Record<string, ItemDefinition> = {
  fruitcake: {
    id: "fruitcake",
    name: "Fruitcake",
    type: ItemType.CONSUMABLE,
    effects: [{ type: "heal", value: 25 }],
    tags: ["consumable", "food"],
  },
};

// 3. Query with type safety
const item = DataManager.instance.query<ItemDefinition>("item", "fruitcake");
//    ^^^^  Type is ItemDefinition | null
```

### ID Enums Pattern

All entity IDs are defined as string literal types in `/src/constants/`:

```typescript
// ItemIDs.ts
export type ItemID = "candy_cane_spear" | "icicle_dagger_melting" | "fruitcake";
// ... 60+ items

// ActorIDs.ts
export type ActorID =
  | "HERO"
  | "SNOWMAN"
  | "SNOW_SPRITE"
  | "KRAMPUS"
  | "CORRUPTED_SANTA";
// ...
```

---

## Performance Considerations

### Component Update Optimization

```typescript
// Only update components that need it
onPreUpdate(delta) {
    this.components.forEach(c => {
        if (c.onTick) c.onTick(delta);
    });
}
```

### Spatial Queries

Level uses O(n) scan through actors for position queries. For larger levels, consider spatial hashing.

---

## Design Decisions

### Why EventBus instead of direct method calls?

- **Decoupling**: Components don't need to know about each other
- **Testing**: Easy to mock events
- **Debugging**: Central point to log all interactions

### Why Record<ID, Definition> instead of classes?

- **Serialization**: Plain objects are trivial to save/load
- **Hot-reload**: Can change data without restarting game
- **Performance**: No class instantiation overhead

### Why keep both Factory and System?

- **Encapsulation**: Game code uses simple Factory API
- **Flexibility**: Can change spawning implementation without breaking game code
- **Testing**: Can mock Factory for tests, use real System in game

---

**Last Updated:** 2025-12-19
