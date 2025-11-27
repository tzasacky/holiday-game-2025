# Holiday Game 2025: Architecture Documentation

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
│  │  - hp, maxHp, strength, dexterity      │ │
│  │  - Handles: stat changes, buffs        │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  CombatComponent                       │ │
│  │  - weapon, damage calculation          │ │
│  │  - Handles: attacks, damage dealt      │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  MovementComponent                     │ │
│  │  - speed, pathfinding                  │ │
│  │  - Handles: movement requests          │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  AIComponent (enemies)                  │ │
│  │  - behavior: wander_attack, hit_and_run│ │
│  │  - Handles: AI decision making         │ │
│  └────────────────────────────────────────┘ │
│       OR                                     │
│  ┌────────────────────────────────────────┐ │
│  │  PlayerInputComponent (hero)            │ │
│  │  - Handles keyboard/mouse input        │ │
│  │  - Converts to movement/action events  │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  InventoryComponent                     │ │
│  │  - items: ItemDefinition[]             │ │
│  │  - Handles: pickup, drop, use          │ │
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
│  Component   │   │  Component   │         │  Manager     │
└──────────────┘   └──────────────┘         └──────────────┘
 listen for         listen for              listen for
 "move:request"     "stat:changed"          "stat:changed"

 Execute movement   Deduct warmth           Update HUD
```

---

## Data Flow: Actor Creation

### Step-by-Step Flow

```
1. Game Code
   ↓
   ActorFactory.createHero(pos)

2. Factory delegates to System
   ↓
   ActorSpawnSystem.spawnActor('Hero', pos)

3. System queries data
   ↓
   DataManager.query('actor', 'Hero')
   ↓
   Returns: ActorDefinitions['Hero']

4. System creates actor container
   ↓
   actor = new GameActor(pos, 'Hero')

5. System creates components from definition
   ↓
   definition.components.forEach(componentDef => {
     component = ComponentRegistry.create(componentDef.type, actor, config)
     actor.addComponent(componentDef.type, component)
   })

6. System emits spawn event
   ↓
   EventBus.emit('actor:spawned', { actor, definition })

7. Return to game code
   ↓
   level.addActor(actor)
   scene.add(actor)
```

---

## Data Flow: Item Usage

### Consumable Example (Fruitcake)

```
1. Player triggers use
   ↓
   UIManager.useItem('fruitcake')

2. Get item definition
   ↓
   itemDef = DataManager.query('item', 'fruitcake')
   // Returns: {
   //   effects: [
   //     { type: 'heal', value: 25 },
   //     { type: 'strength_boost', value: 2, duration: 50 }
   //   ]
   // }

3. Emit use event
   ↓
   EventBus.emit('item:use', { itemId: 'fruitcake', userId: hero.entityId })

4. EffectExecutor listens and processes
   ↓
   itemDef.effects.forEach(effect => {
     if (effect.type === 'heal') {
       EventBus.emit('stat:change', {
         actorId: userId,
         stat: 'hp',
         delta: +25
       })
     }
     if (effect.type === 'strength_boost') {
       EventBus.emit('buff:apply', {
         actorId: userId,
         buffId: 'strength',
         value: 2,
         duration: 50
       })
     }
   })

5. StatsComponent listens and applies
   ↓
   StatsComponent hears 'stat:change'
   → Updates hp: 75 → 100
   → Emits 'stat:changed' for UI

6. UI updates
   ↓
   HUD hears 'stat:changed'
   → Displays "HP: 100/100"

   GameJournal hears 'item:use'
   → Displays "You ate the Fruitcake! (+25 HP, +2 STR)"
```

---

## Directory Structure Deep Dive

### `/src/core/` - Engine Core

**Purpose:** Fundamental systems that everything else depends on

```
/src/core/
├── EventBus.ts           # Singleton event dispatcher
├── GameEvents.ts         # Event type definitions
├── DataManager.ts        # Unified data registry access
├── Component.ts          # Base component class (ALL components extend this)
├── GameEntity.ts         # Excalibur entity with grid position
├── TurnManager.ts        # Turn-based game loop
├── GameState.ts          # Save/load serialization
└── Logger.ts             # Logging utility
```

**Key Rule:** Core files should have ZERO dependencies on game logic (actors, items, etc.)

### `/src/data/` - Pure Configuration

**Purpose:** JSON-like data definitions with NO logic

```
/src/data/
├── actors.ts             # ActorDefinitions (Hero, Snowman, etc.)
├── items.ts              # ItemDefinitions (weapons, armor, consumables)
├── abilities.ts          # AbilityDefinitions (spells, skills)
├── effects.ts            # EffectDefinitions (buffs, debuffs, conditions)
├── enchantments.ts       # EnchantmentData & CurseData
├── mechanics.ts          # Game mechanics (damage types, combat formulas)
├── loot.ts               # LootTables & drop rates
├── interactables.ts      # InteractableDefinitions (chests, doors, NPCs)
├── terrain.ts            # TerrainDefinitions (wall, floor, door)
├── balance.ts            # Difficulty & scaling config
└── graphics.ts           # GraphicsManager (sprite configs)
```

**Key Rule:** All exports should be `Record<string, SomeDefinition>` or utility functions that operate on data

### `/src/config/` - Engine Configuration

**Purpose:** Excalibur-specific configuration and resource loading

```
/src/config/
├── resources.ts          # Excalibur ImageSource loading
└── LootTable.ts          # Legacy loot config (TO BE MOVED to /src/data/)
```

**Key Rule:** Only Excalibur resources and engine settings go here

### `/src/components/` - Game Components

**Purpose:** Composable behavior units that attach to actors

```
/src/components/
├── ActorComponent.ts         # Base class for all actor components
├── GameActor.ts              # Minimal actor container with component map
├── StatsComponent.ts         # HP, strength, dexterity, etc.
├── CombatComponent.ts        # Attack, defend, damage calculation
├── MovementComponent.ts      # Pathfinding, movement
├── AIComponent.ts            # Enemy AI behaviors
├── PlayerInputComponent.ts   # Keyboard/mouse input handling
├── InventoryComponent.ts     # Item storage and management
├── ActorSpawnSystem.ts       # Component assembly system
└── ComponentFactory.ts       # Component registry and creation
```

**Key Rule:** Components communicate ONLY via EventBus, never direct method calls to other components

### `/src/factories/` - High-Level APIs

**Purpose:** Clean public interfaces for creating game entities

```
/src/factories/
└── ActorFactory.ts           # Public API for actor creation
```

**Why separate from systems?** Factories are what game code uses, systems are implementation details.

### `/src/systems/` (TO BE CREATED)

**Purpose:** Game logic executors that operate on data

```
/src/systems/ (planned)
├── EffectExecutor.ts         # Applies effects from definitions
├── AbilityExecutor.ts        # Casts abilities from definitions
├── LootGenerator.ts          # Generates loot from tables
└── EnchantmentApplicator.ts  # Applies enchantments to items
```

---

## Event System Design

### Event Categories

#### 1. **Actor Events**

```typescript
"actor:spawned"; // New actor created
"actor:turn"; // Actor's turn to act
"actor:death"; // Actor died
"actor:move"; // Actor moved
```

#### 2. **Combat Events**

```typescript
"damage:dealt"; // Damage applied
"damage:received"; // Actor took damage
"attack:hit"; // Attack succeeded
"attack:miss"; // Attack failed
```

#### 3. **Stat Events**

```typescript
"stat:changed"; // Any stat changed
"hp:changed"; // HP specifically changed
"warmth:changed"; // Warmth changed
"buff:applied"; // Buff added
"buff:expired"; // Buff removed
```

#### 4. **Item Events**

```typescript
"item:pickup"; // Item picked up
"item:drop"; // Item dropped
"item:use"; // Item consumed/activated
"item:equip"; // Item equipped
"item:unequip"; // Item unequipped
```

#### 5. **UI Events**

```typescript
"ui:log"; // Log message to journal
"ui:update"; // UI needs refresh
"inventory:open"; // Inventory opened
"inventory:close"; // Inventory closed
```

#### 6. **System Events**

```typescript
"level:loaded"; // New level generated
"turn:start"; // Turn started
"turn:end"; // Turn ended
"registry:query"; // Data requested
"registry:reload"; // Data hot-reloaded
```

### Event Flow Example: Combat

```
Player presses SPACE to attack
         ↓
┌────────────────────┐
│ PlayerInput        │
│ Component          │
└────────────────────┘
    emit('input:attack')
         ↓
┌────────────────────┐
│ CombatComponent    │ ← listens to 'input:attack'
└────────────────────┘
    Calculates damage, checks range
    emit('attack:attempt', { targetId, damage })
         ↓
┌────────────────────┐
│ CombatComponent    │ ← enemy's component listens
│ (Enemy)            │
└────────────────────┘
    Applies defense calculation
    emit('damage:dealt', { victimId, finalDamage })
         ↓
┌────────────────────┐
│ StatsComponent     │ ← listens to 'damage:dealt'
│ (Enemy)            │
└────────────────────┘
    Reduces HP
    emit('stat:changed', { actorId, stat: 'hp', oldValue, newValue })
         ↓
    ┌──────────────┐        ┌──────────────┐
    │ HUD          │        │ GameJournal  │
    │ (UI)         │        │ (UI)         │
    └──────────────┘        └──────────────┘
    Shows HP bar            Logs "Snowman takes 5 damage!"
```

---

## Type Safety & Data Validation

### Data Definition Type Pattern

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
    id: "fruitcake", // ✅ Type-checked
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

### Runtime Validation (Future Enhancement)

```typescript
// Use Zod or similar for runtime validation
import { z } from "zod";

const ItemDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["weapon", "armor", "consumable", "artifact", "misc"]),
  effects: z
    .array(
      z.object({
        type: z.string(),
        value: z.number(),
      })
    )
    .optional(),
  tags: z.array(z.string()),
});

// Validate at load time
Object.values(ItemDefinitions).forEach((def) => {
  ItemDefinitionSchema.parse(def); // Throws if invalid
});
```

---

## Hot Reload System (Advanced)

### Development Workflow

```typescript
// 1. Edit data file
// /src/data/items.ts
ItemDefinitions["fruitcake"].effects[0].value = 50; // Was 25

// 2. Save file

// 3. Hot reload (dev mode)
DataManager.instance.updateDefinition("item", "fruitcake", newDef);

// 4. EventBus automatically notifies all listeners
EventBus.instance.emit("registry:reload", {
  system: "item",
  key: "fruitcake",
  definition: newDef,
});

// 5. Game updates without restart
// Next time player uses fruitcake, heals for 50 instead of 25
```

### Implementation (Future)

```typescript
// Watch for file changes in dev mode
import chokidar from "chokidar";

if (process.env.NODE_ENV === "development") {
  chokidar.watch("src/data/**/*.ts").on("change", (path) => {
    // Clear require cache
    delete require.cache[require.resolve(path)];

    // Reload data
    const { ItemDefinitions } = require(path);

    // Update DataManager
    Object.entries(ItemDefinitions).forEach(([id, def]) => {
      DataManager.instance.updateDefinition("item", id, def);
    });

    console.log("✅ Hot reloaded:", path);
  });
}
```

---

## Testing Strategy

### Unit Testing Components

```typescript
describe("StatsComponent", () => {
  it("should listen to stat:change events", () => {
    const actor = new GameActor(ex.vec(0, 0), "TestActor");
    const stats = new StatsComponent(actor, { hp: 100, maxHp: 100 });

    EventBus.instance.emit("stat:change", {
      actorId: actor.entityId,
      stat: "hp",
      delta: -25,
    });

    expect(stats.getStat("hp")).toBe(75);
  });
});
```

### Integration Testing

```typescript
describe("Combat System", () => {
  it("should handle full attack flow", () => {
    const hero = ActorFactory.instance.createHero(ex.vec(0, 0));
    const enemy = ActorFactory.instance.createSnowman(ex.vec(1, 0));

    // Trigger attack
    EventBus.instance.emit("input:attack", {
      attackerId: hero.entityId,
      targetId: enemy.entityId,
    });

    // Verify enemy took damage
    expect(enemy.hp).toBeLessThan(enemy.maxHp);
  });
});
```

---

## Performance Considerations

### Component Update Optimization

```typescript
// ❌ BAD: Update every component every frame
onPreUpdate(delta) {
    this.components.forEach(c => c.update(delta));
}

// ✅ GOOD: Only update components that need it
onPreUpdate(delta) {
    this.components.forEach(c => {
        if (c.onTick) c.onTick(delta);
    });
}
```

### Event Batching

```typescript
// ❌ BAD: Emit event for every stat change
for (let i = 0; i < 100; i++) {
  EventBus.emit("stat:changed", { stat: "hp", value: i });
}

// ✅ GOOD: Batch changes
const changes = [];
for (let i = 0; i < 100; i++) {
  changes.push({ stat: "hp", value: i });
}
EventBus.emit("stats:changed:batch", changes);
```

### Spatial Queries

```typescript
// For Level.getEntitiesAt(), consider adding spatial hash
// Current: O(n) scan through all actors
// Optimized: O(1) lookup in grid hash
```

---

## Migration Path Summary

```
Phase 0: Fix Compilation ✅
  └─ Delete wrong ActorComponent, fix type references

Phase 1-2: Items & Mechanics (Parallel Work)
  ├─ Create ItemFactory from ItemDefinitions
  ├─ Create EffectExecutor from EffectDefinitions
  └─ Create AbilityExecutor from AbilityDefinitions

Phase 3: Dungeon Generation
  ├─ Update Level.ts type references
  ├─ Update Spawner to use ActorSpawnSystem
  └─ Update generators to use ActorFactory

Phase 4: Integration
  ├─ Wire up EventBus for all new systems
  ├─ Update UI to listen to new events
  └─ Update save/load for new data structures

Phase 5: Testing
  └─ Verify full game loop works

Phase 6: Cleanup
  └─ Delete all old OOP classes
```

---

## Questions & Decisions Log

### Why EventBus instead of direct method calls?

- **Decoupling**: Components don't need to know about each other
- **Hot-reload**: Can swap implementations without changing consumers
- **Testing**: Easy to mock events
- **Debugging**: Central point to log all interactions

### Why Record<ENUM, Definition> instead of classes?

- **Serialization**: Plain objects are trivial to save/load
- **Hot-reload**: Can change data without restarting game
- **Modding**: Users can edit JSON files to mod the game
- **Performance**: No class instantiation overhead

### Why keep both Factory and SpawnSystem?

- **Encapsulation**: Game code uses simple Factory API
- **Flexibility**: Can change spawning implementation without breaking game code
- **Testing**: Can mock Factory for tests, use real SpawnSystem in game

### Can I still have unique behaviors?

- **Yes!** Create custom components for unique actors/items
- Example: `KrampusBossComponent` with special attack patterns
- Attach via definition: `components: [{ type: 'krampus_boss' }]`

---

## Next Steps

1. ✅ Review this document
2. ⏳ Complete Phase 0 in MIGRATION_CHECKLIST.md
3. ⏳ Start Phase 1 (Item Migration)
4. ⏳ Keep team in sync with PARALLEL_ARCHITECTURE_PLAN.md

**Last Updated:** 2025-11-26
