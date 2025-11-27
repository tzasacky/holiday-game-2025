# System Integration Map

## Quick Visual Reference

### Current System Status

```
✅ = Fully Implemented
⚠️ = Partially Implemented
❌ = Not Implemented
🔄 = In Progress
```

---

## Core Infrastructure

```
┌─────────────────────────────────────────────────────────┐
│                   CORE SYSTEMS                          │
├─────────────────────────────────────────────────────────┤
│ ✅ EventBus              │ Central event dispatcher      │
│ ✅ GameEvents            │ Event type definitions        │
│ ✅ DataManager           │ Unified data registry         │
│ ⚠️ Component             │ Base component (needs fix)    │
│ ✅ GameEntity            │ Excalibur entity base         │
│ ✅ TurnManager           │ Turn-based game loop          │
│ ⚠️ GameState             │ Save/load (needs update)      │
│ ✅ Logger                │ Logging utility               │
└─────────────────────────────────────────────────────────┘
```

---

## Data Definitions

```
┌─────────────────────────────────────────────────────────┐
│                 DATA LAYER (/src/data/)                 │
├─────────────────────────────────────────────────────────┤
│ ✅ actors.ts             │ 4 actors defined              │
│ ✅ items.ts              │ 8+ items defined              │
│ ✅ abilities.ts          │ 10+ abilities defined         │
│ ✅ effects.ts            │ Complete effect system        │
│ ✅ enchantments.ts       │ Enchantment + curse data      │
│ ✅ mechanics.ts          │ Combat/damage mechanics       │
│ ✅ loot.ts               │ Loot tables & scaling         │
│ ✅ interactables.ts      │ Doors, chests, NPCs           │
│ ✅ terrain.ts            │ Terrain type definitions      │
│ ✅ balance.ts            │ Difficulty & scaling          │
│ ✅ graphics.ts           │ GraphicsManager               │
└─────────────────────────────────────────────────────────┘
```

---

## Component System

```
┌─────────────────────────────────────────────────────────┐
│            COMPONENTS (/src/components/)                │
├─────────────────────────────────────────────────────────┤
│ ✅ ActorComponent.ts     │ Event-driven base class       │
│ ✅ GameActor.ts          │ Minimal actor container       │
│ ✅ StatsComponent.ts     │ HP, stats, warmth             │
│ ✅ CombatComponent.ts    │ Attack, defense, damage       │
│ ✅ MovementComponent.ts  │ Pathfinding, movement         │
│ ✅ AIComponent.ts        │ Enemy AI behaviors            │
│ ✅ PlayerInputComponent  │ Keyboard/mouse input          │
│ ✅ InventoryComponent.ts │ Item storage                  │
│ ✅ ActorSpawnSystem.ts   │ Component assembly system     │
│ ✅ ComponentFactory.ts   │ Component registry            │
└─────────────────────────────────────────────────────────┘
```

---

## Factories & Systems

```
┌─────────────────────────────────────────────────────────┐
│         FACTORIES & SYSTEMS                              │
├─────────────────────────────────────────────────────────┤
│ FACTORIES                                                │
│ ✅ ActorFactory          │ Create actors from defs       │
│ ❌ ItemFactory (data)    │ Needs rewrite for data system │
│                                                          │
│ SYSTEMS (TO BE CREATED)                                  │
│ ❌ EffectExecutor        │ Apply effects from defs       │
│ ❌ AbilityExecutor       │ Cast abilities from defs      │
│ ❌ LootGenerator         │ Generate loot from tables     │
│ ❌ EnchantmentApplicator │ Apply enchantments to items   │
└─────────────────────────────────────────────────────────┘
```

---

## Legacy Systems (Need Migration)

```
┌─────────────────────────────────────────────────────────┐
│         MECHANICS (/src/mechanics/) - LEGACY             │
├─────────────────────────────────────────────────────────┤
│ ❌ Ability.ts            │ Class-based → needs executor  │
│ ❌ Effect.ts             │ Class-based → needs executor  │
│ ✅ EnchantmentSystem     │ Moved to systems, data-driven │
│ ⚠️ EquipmentSystem       │ Needs ItemDefinition support  │
│ ✅ LootSystem            │ Moved to systems, data-driven │
│ ❌ IdentificationSystem  │ Needs new item integration    │
│ ✅ GameBalance           │ Can read from data/balance.ts │
│ ✅ WarmthSystem          │ Event-driven, OK              │
│ ❌ Interactable.ts       │ Base class → needs executor   │
└─────────────────────────────────────────────────────────┘
```

---

## Content (To Be Deleted)

```
┌─────────────────────────────────────────────────────────┐
│       CONTENT (/src/content/) - TO BE DELETED            │
├─────────────────────────────────────────────────────────┤
│ ✅ enemies/              │ DELETED (3 files)             │
│ ❌ items/consumables/    │ 8 files to migrate            │
│ ❌ items/weapons/        │ 6 files to migrate            │
│ ❌ items/armor/          │ 4 files to migrate            │
│ ❌ items/artifacts/      │ 3 files to migrate            │
│ ❌ items/misc/           │ 1 file to migrate             │
│ ✅ items/ItemIDs.ts      │ KEEP (constants)              │
└─────────────────────────────────────────────────────────┘
```

---

## Dungeon System

```
┌─────────────────────────────────────────────────────────┐
│           DUNGEON (/src/dungeon/)                        │
├─────────────────────────────────────────────────────────┤
│ ⚠️ Level.ts              │ Uses GameActor, needs type fix│
│ ❌ Spawner.ts            │ Needs ActorSpawnSystem update │
│ ❌ LevelGenerator.ts     │ Needs ActorFactory update     │
│ ❌ BSPGenerator.ts       │ Needs ActorFactory update     │
│ ❌ AdvancedLevelGen.ts   │ Needs ActorFactory update     │
│ ❌ FeatureGenerator.ts   │ Needs update                  │
│ ❌ InteractableGen.ts    │ Needs InteractableDef update  │
│ ✅ Room.ts               │ OK                            │
│ ✅ FloorTheme.ts         │ OK (uses terrain defs)        │
│ ✅ Terrain.ts            │ OK (data-driven)              │
│ ✅ Trap.ts               │ OK                            │
└─────────────────────────────────────────────────────────┘
```

---

## UI System

```
┌─────────────────────────────────────────────────────────┐
│              UI (/src/ui/)                               │
├─────────────────────────────────────────────────────────┤
│ ✅ UIManager.ts          │ Main UI coordinator           │
│ ⚠️ HUD.ts                │ Needs StatsComponent events   │
│ ⚠️ InventoryScreen.ts    │ Needs ItemDefinition support  │
│ ⚠️ Hotbar.ts             │ Needs AbilityDefinition       │
│ ⚠️ GameJournal.ts        │ Event-driven, needs more      │
│ ✅ Tooltip.ts            │ OK                            │
│ ✅ UIComponent.ts        │ Base UI component             │
└─────────────────────────────────────────────────────────┘
```

---

## Game Loop Integration

```
main.ts
  └─ GameScene.onInitialize()
      ├─ UnifiedSystemInit.initialize()
      │   └─ DataManager registers all data
      └─ Creates level

  └─ GameScene.onActivate()
      ├─ Adds actors to scene
      ├─ Registers actors with TurnManager
      └─ TurnManager.processTurns()
          └─ Calls actor.act()
              └─ Components handle logic via events
```

### Event Flow

```
User Input
    ↓
PlayerInputComponent emits 'input:attack'
    ↓
CombatComponent listens, calculates damage
    ↓
CombatComponent emits 'damage:dealt'
    ↓
StatsComponent listens, reduces HP
    ↓
StatsComponent emits 'stat:changed'
    ↓
HUD listens, updates display
```

---

## Critical Dependencies

### Must Complete in Order

```
1. Phase 0: Fix Component Base Class
   └─ Everything depends on this

2. Phase 0: Fix Type References
   └─ Required for compilation

3. Phase 1: ItemFactory + EffectExecutor
   └─ Required for item system

4. Phase 2: AbilityExecutor
   └─ Required for combat

5. Phase 3: Dungeon Generator Updates
   └─ Required for spawning
```

---

## File References Matrix

### What Needs What

| File                   | Uses                        | Needs Migration If               |
| ---------------------- | --------------------------- | -------------------------------- |
| `GameScene.ts`         | `GameActor`, `ActorFactory` | ✅ Already updated               |
| `Level.ts`             | `GameActor`                 | ⚠️ Type refs wrong               |
| `Spawner.ts`           | Old `Actor` classes         | ❌ Needs `ActorSpawnSystem`      |
| `LevelGenerator.ts`    | Old `Hero`, `Mob`           | ❌ Needs `ActorFactory`          |
| `ItemFactory.ts`       | Item classes                | ❌ Needs `ItemDefinitions`       |
| `InventoryScreen.ts`   | `Item.getSprite()`          | ⚠️ Needs new `ItemFactory`       |
| `HUD.ts`               | `Actor.hp`, `Actor.maxHp`   | ⚠️ Needs `StatsComponent` events |
| `EnchantmentSystem.ts` | `ENCHANTMENT_DATA`          | ⚠️ Has data, needs cleanup       |
| `LootSystem.ts`        | Hardcoded logic             | ⚠️ Partially migrated            |

---

## Import Path Changes

### Old Imports (BROKEN)

```typescript
❌
❌ import { Hero } from '../actors/Hero';
❌ import { Mob } from '../actors/Mob';
❌ import { ActorRegistry } from '../config/ActorRegistry';
❌ import { ItemRegistry } from '../config/ItemRegistry';
```

### New Imports (WORKING)

```typescript
✅ import { GameActor } from '../components/GameActor';
✅ import { ActorFactory } from '../factories/ActorFactory';
✅ import { ActorSpawnSystem } from '../components/ActorSpawnSystem';
✅ import { ActorDefinitions } from '../data/actors';
✅ import { ItemDefinitions } from '../data/items';
✅ import { DataManager } from '../core/DataManager';
```

---

## Quick Start: Adding New Content

### Add New Item

1. Add to `/src/data/items.ts`:

```typescript
ItemDefinitions["candy_cane"] = {
  id: "candy_cane",
  name: "Candy Cane",
  type: ItemType.CONSUMABLE,
  graphics: { spriteIndex: 25 },
  effects: [{ type: "heal", value: 10 }],
  tags: ["consumable", "festive"],
};
```

2. Done! No code changes needed.

### Add New Enemy

1. Add to `/src/data/actors.ts`:

```typescript
ActorDefinitions["Grinch"] = {
  graphics: createStandardGraphics(Resources.GrinchPng),
  baseStats: { hp: 150, maxHp: 150, strength: 15 },
  components: [
    { type: "stats" },
    { type: "combat" },
    { type: "movement" },
    { type: "ai", config: { type: "aggressive_boss" } },
  ],
  ai: { type: "aggressive_boss", viewDistance: 10 },
  tags: ["enemy", "boss", "grinch"],
};
```

2. Spawn it:

```typescript
ActorFactory.instance.createActor("Grinch", pos);
```

3. Done!

### Add New Ability

1. Add to `/src/data/abilities.ts`:

```typescript
AbilityDefinitions["snowball"] = {
  id: "snowball",
  name: "Snowball",
  description: "Throw a snowball",
  type: AbilityType.DAMAGE,
  targetType: TargetType.SINGLE_ENEMY,
  costs: [{ type: "energy", amount: 5 }],
  cooldown: 3,
  range: 4,
  effects: [{ type: "damage", value: 8, damageType: "ice" }],
  tags: ["damage", "ice", "basic"],
};
```

2. Done! (Once AbilityExecutor is implemented)

---

## Debugging Checklist

### Game Won't Compile

- [ ] Check for deleted class imports (`Actor`, `Hero`, `Mob`)
- [ ] Check for old registry imports (`ActorRegistry`, `ItemRegistry`)
- [ ] Run: `npm run build` to see all errors

### Actor Won't Spawn

- [ ] Verify definition exists in `ActorDefinitions`
- [ ] Check console for `[ActorSpawnSystem]` logs
- [ ] Verify all components in definition are registered in `ComponentRegistry`
- [ ] Check EventBus for `actor:spawned` event

### Item Won't Show

- [ ] Verify definition exists in `ItemDefinitions`
- [ ] Check `graphics.spriteIndex` is valid
- [ ] Verify `GraphicsManager` has item sprites loaded
- [ ] Check `ItemFactory` is using new definitions

### Combat Not Working

- [ ] Verify both actors have `CombatComponent`
- [ ] Check EventBus for `damage:dealt` events
- [ ] Verify `StatsComponent` is listening to damage events
- [ ] Check console logs for component errors

### UI Not Updating

- [ ] Verify UI component is listening to correct events
- [ ] Check EventBus emission with console.log
- [ ] Verify event data has correct actorId
- [ ] Check `UIManager.instance.showUI()` was called

---

## Team Workflow

### Working on Items (Phase 1)

```bash
# 1. Create ItemFactory (data-driven)
# Edit: /src/items/ItemFactory.ts

# 2. Add missing item definitions
# Edit: /src/data/items.ts

# 3. Test with one consumable
npm run dev

# 4. Migrate remaining items
# Edit each item class → add to ItemDefinitions

# 5. Delete old classes
rm -rf src/content/items/consumables/*.ts
```

### Working on Mechanics (Phase 2)

```bash
# 1. Create EffectExecutor
# Create: /src/systems/EffectExecutor.ts

# 2. Create AbilityExecutor
# Create: /src/systems/AbilityExecutor.ts

# 3. Update EnchantmentSystem
# Edit: /src/systems/EnchantmentSystem.ts

# 4. Test all systems
npm run dev
```

### Working on Dungeon (Phase 3)

```bash
# 1. Fix Level.ts types
# Edit: /src/dungeon/Level.ts

# 2. Update Spawner
# Edit: /src/dungeon/Spawner.ts

# 3. Update generators
# Edit: /src/dungeon/LevelGenerator.ts
# Edit: /src/dungeon/generators/*.ts

# 4. Test dungeon generation
npm run dev
```

---

## Common Pitfalls

### ❌ Don't Do This

```typescript
// Hardcoding values
const damage = 10;

// Direct component access
actor.statsComponent.hp -= damage;

// Synchronous logic
actor.takeDamage(damage);
```

### ✅ Do This Instead

```typescript
// Use data
const itemDef = DataManager.instance.query("item", "fruitcake");
const damage = itemDef.effects[0].value;

// Use events
EventBus.instance.emit("damage:dealt", {
  targetId: actor.entityId,
  damage: damage,
  damageType: "physical",
});

// Components handle it asynchronously
```

---

**Last Updated:** 2025-11-26

**Quick Links:**

- [Full Migration Checklist](MIGRATION_CHECKLIST.md)
- [Architecture Guide](ARCHITECTURE.md)
- [Parallel Work Plan](PARALLEL_ARCHITECTURE_PLAN.md)
