# System Integration Map

## Quick Visual Reference

### Current System Status

```
✅ = Fully Implemented & Working
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
│ ✅ Component             │ Base component system         │
│ ✅ GameEntity            │ Excalibur entity base         │
│ ✅ TurnManager           │ Turn-based game loop          │
│ ⚠️ GameState             │ Save/load (needs update)      │
│ ✅ Logger                │ Logging utility               │
│ ✅ UnifiedSystemInit     │ Initializes all systems      │
└─────────────────────────────────────────────────────────┘
```

---

## Data Definitions (Pure Data - No Logic)

```
┌─────────────────────────────────────────────────────────┐
│                 DATA LAYER (/src/data/)                 │
├─────────────────────────────────────────────────────────┤
│ ✅ actors.ts             │ Actor definitions             │
│ ✅ items.ts              │ 154+ item definitions         │
│ ✅ abilities.ts          │ Ability definitions           │
│ ✅ effects.ts            │ Effect definitions            │
│ ✅ enchantments.ts       │ Enchantment + curse data      │
│ ✅ mechanics.ts          │ DamageType + combat rules     │
│ ✅ terrain.ts            │ TerrainType + properties      │
│ ✅ loot.ts               │ Loot tables & scaling         │
│ ✅ interactables.ts      │ Interactable definitions      │
│ ✅ balance.ts            │ Difficulty & scaling          │
│ ✅ graphics.ts           │ GraphicsManager               │
│ ✅ spawnTables.ts        │ Floor-based spawn tables      │
│ ✅ roomTemplates.ts      │ Room generation templates     │
│ ✅ prefabDefinitions.ts  │ Special room prefabs          │
│ ✅ biomes.ts             │ Unified biome/theme system    │
└─────────────────────────────────────────────────────────┘
```

---

## Component System (Event-Driven)

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
│ ✅ InventoryComponent.ts │ Data-driven item storage      │
│ ✅ EquipmentComponent.ts │ Equipment management          │
│ ✅ ActorSpawnSystem.ts   │ Component assembly system     │
│ ✅ ComponentFactory.ts   │ Component registry            │
└─────────────────────────────────────────────────────────┘
```

---

## Factories & Executors (Data → Logic)

```
┌─────────────────────────────────────────────────────────┐
│         FACTORIES (/src/factories/)                     │
├─────────────────────────────────────────────────────────┤
│ ✅ ActorFactory.ts       │ Create actors from data       │
│ ✅ ItemFactory.ts        │ Create items from data        │
│ ✅ InteractableFactory.ts│ Create interactables events   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│         SYSTEMS (/src/systems/)                         │
├─────────────────────────────────────────────────────────┤
│ ✅ EffectExecutor.ts     │ Apply effects from data       │
│ ✅ SpawnTableExecutor.ts │ Data-driven spawning          │
│ ✅ RoomGenerationExec.ts │ Template-based rooms          │
│ ✅ PrefabExecutor.ts     │ Special room placement        │
│ ✅ ItemSpawner.ts        │ Loot → world items            │
│ ✅ CollisionSystem.ts    │ Event-based collision         │
│ ✅ PathfindingSystem.ts  │ Event-based pathfinding       │
│ ✅ EnchantmentSystem.ts  │ Data-driven enchantments      │
│ ✅ LootSystem.ts         │ Data-driven loot generation   │
│ ⚠️ EquipmentSystem.ts    │ Needs ItemEntity integration  │
│ ✅ WarmthSystem.ts       │ Event-driven warmth           │
│ ⚠️ IdentificationSystem  │ Needs ItemEntity integration  │
└─────────────────────────────────────────────────────────┘
```

---

## Dungeon Generation (Data-Driven)

```
┌─────────────────────────────────────────────────────────┐
│           DUNGEON (/src/dungeon/)                       │
├─────────────────────────────────────────────────────────┤
│ CORE STRUCTURES                                         │
│ ✅ Level.ts              │ Level data structure          │
│ ✅ Room.ts               │ Room data structure           │
│ ✅ Spawner.ts            │ Data-driven mob spawning      │
│                                                         │
│ ALGORITHMS (/src/dungeon/algorithms/)                   │
│ ✅ LevelGenerator.ts     │ Abstract interface            │
│ ✅ AdvancedLevelGen.ts   │ BSP + data-driven population  │
│ ✅ BSPGenerator.ts       │ Binary space partitioning     │
│ ✅ GenerationContext.ts  │ Generation state management   │
└─────────────────────────────────────────────────────────┘
```

---

## Items System (Fully Data-Driven)

```
┌─────────────────────────────────────────────────────────┐
│              ITEMS (/src/items/)                        │
├─────────────────────────────────────────────────────────┤
│ ✅ WorldItemEntity.ts    │ Items in world (uses ItemEntity) │
│ ✅ Inventory.ts          │ Inventory system (data-driven)   │
│                                                         │
│ LEGACY CLASSES DELETED                                  │
│ ✅ Item.ts               │ ❌ DELETED (was OOP base)        │
│ ✅ Equipable.ts          │ ❌ DELETED (was OOP base)        │
│ ✅ Weapon.ts             │ ❌ DELETED (was OOP class)       │
│ ✅ Armor.ts              │ ❌ DELETED (was OOP class)       │
│ ✅ Consumable.ts         │ ❌ DELETED (was OOP class)       │
│ ✅ Artifact.ts           │ ❌ DELETED (was OOP class)       │
│ ✅ EnhancedEquipment.ts  │ ❌ DELETED (was legacy hybrid)   │
└─────────────────────────────────────────────────────────┘
```

---

## Legacy Systems Cleaned Up

```
┌─────────────────────────────────────────────────────────┐
│         MECHANICS (/src/mechanics/) - MINIMAL           │
├─────────────────────────────────────────────────────────┤
│ ⚠️ EquipmentSystem.ts    │ Needs ItemEntity integration  │
│ ✅ WarmthSystem.ts       │ Event-driven, working         │
│                                                         │
│ DELETED LEGACY CLASSES                                  │
│ ✅ Ability.ts            │ ❌ DELETED (OOP → data)          │
│ ✅ Effect.ts             │ ❌ DELETED (OOP → data)          │
│ ✅ Interactable.ts       │ ❌ DELETED (OOP → data)          │
│ ✅ IdentificationSys.ts  │ ✅ MOVED to /systems/            │
│ ✅ GameBalance.ts        │ ✅ MOVED to /systems/            │
│ ✅ ProgressionManager.ts │ ✅ MOVED to /systems/            │
│ ✅ LightSystem.ts        │ ✅ MOVED to /systems/            │
│ ✅ Trigger.ts            │ ✅ MOVED to /core/               │
│ ✅ InteractionManager.ts │ ❌ DELETED (→ event-driven)      │
└─────────────────────────────────────────────────────────┘
```

---

## Deleted Legacy Dungeon Classes

```
┌─────────────────────────────────────────────────────────┐
│       DELETED LEGACY (/src/dungeon/) - CLEANED          │
├─────────────────────────────────────────────────────────┤
│ ✅ Biome.ts              │ ❌ DELETED (→ data/biomes.ts)    │
│ ✅ FloorTheme.ts         │ ❌ DELETED (→ data/biomes.ts)    │
│ ✅ Prefab.ts             │ ❌ DELETED (→ data/prefabs.ts)   │
│ ✅ Trap.ts               │ ❌ DELETED (traps are interact.) │
│ ✅ Wreath.ts             │ ❌ DELETED (decorations)         │
│ ✅ interactables/        │ ❌ DELETED (OOP → data)          │
│ ✅ decorators/           │ ❌ DELETED (→ room templates)    │
│ ✅ features/             │ ❌ DELETED (→ biome features)    │
│ ✅ hazards/              │ ❌ DELETED (→ biome hazards)     │
│ ✅ themes/               │ ❌ DELETED (→ data/biomes.ts)    │
│ ✅ biomes/               │ ❌ DELETED (→ data/biomes.ts)    │
│ ✅ FeatureGenerator.ts   │ ❌ DELETED (→ biome features)    │
│ ✅ InteractableGen.ts    │ ❌ DELETED (→ RoomGenerationExec)│
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
│ ⚠️ InventoryScreen.ts    │ Needs new ItemEntity support  │
│ ⚠️ Hotbar.ts             │ Needs AbilityDefinition       │
│ ⚠️ GameJournal.ts        │ Event-driven, needs more      │
│ ✅ Tooltip.ts            │ OK                            │
│ ✅ UIComponent.ts        │ Base UI component             │
└─────────────────────────────────────────────────────────┘
```

---

## Architecture Transformation Complete

### OLD WAY (Deleted)
```typescript
❌ new SnowGolem(position);
❌ FireplaceRoomDecorator.decorate(room);  
❌ SnowyVillageTheme.getTile(x, y);
❌ if (pathfinding.canMove(x, y)) { ... }
❌ const damage = weapon.minDamage;
```

### NEW WAY (Data-Driven Events)
```typescript
✅ SpawnTableExecutor.rollSpawn('snow_golem', floor);
✅ RoomGenerationExecutor.populateRoom(template);
✅ const biome = DataManager.query('biome', 'snowy_village');
✅ CollisionSystem.checkMovement(actorId, pos, level);
✅ const weapon = DataManager.query('item', 'candy_cane_spear');
```

---

## Event Flow Examples

### Combat Flow
```
User Input → PlayerInputComponent 
    ↓ emits 'action:attack'
CombatComponent → calculates damage from data
    ↓ emits 'damage:deal' 
StatsComponent → applies damage
    ↓ emits 'stat:changed'
HUD → updates display
```

### Item Usage Flow  
```
User Input → InventoryComponent
    ↓ emits 'item:use'
EffectExecutor → reads ItemDefinition effects
    ↓ emits 'effect:apply'
StatsComponent → applies healing/buffs
    ↓ emits 'stat:changed'
HUD → updates display
```

### Spawning Flow
```
LevelGenerator → requests spawn
    ↓ emits 'spawn:request' 
SpawnTableExecutor → rolls from data tables
    ↓ emits 'actor:create'
ActorFactory → assembles components from data
    ↓ emits 'actor:spawned'
Level → adds to game world
```

### Collision Flow
```
MovementComponent → requests movement
    ↓ emits 'collision:check'
CollisionSystem → checks terrain + actors
    ↓ emits 'damage:deal' (if chasm fall)
    ↓ emits 'level:transition' (if chasm)
    ↓ emits 'effect:apply' (if slippery ice)
Multiple systems → handle consequences
```

---

## Directory Structure (Final)

```
src/
├── core/                   # Engine core (EventBus, DataManager, Logger)
├── data/                   # Pure data definitions (no logic)
├── components/             # Event-driven game components  
├── factories/              # Data → object creation
├── systems/                # Game logic executors
├── dungeon/                # Level generation (minimal, organized)
│   ├── Level.ts, Room.ts, Spawner.ts
│   └── algorithms/         # Generation algorithms
├── items/                  # World items, inventory (uses data)
├── ui/                     # User interface
├── scenes/                 # Game scenes
└── constants/              # Enum definitions
```

---

## Quick Reference: Adding New Content

### Add New Item
```typescript
// 1. Add to /src/data/items.ts
ItemDefinitions["candy_cane"] = {
  id: "candy_cane", name: "Candy Cane",
  type: ItemType.CONSUMABLE, rarity: ItemRarity.COMMON,
  effects: [{ type: "heal", value: 10 }],
  graphics: { spriteIndex: 25 }
};

// 2. Use anywhere
const item = ItemFactory.instance.create('candy_cane');
```

### Add New Enemy  
```typescript
// 1. Add to /src/data/actors.ts
ActorDefinitions["grinch"] = {
  baseStats: { hp: 150, maxHp: 150, strength: 15 },
  components: ["stats", "combat", "movement", "ai"],
  ai: { type: "aggressive_boss", viewDistance: 10 }
};

// 2. Add to spawn table /src/data/spawnTables.ts
{ actorId: 'grinch', weight: 5, minFloor: 8, tags: ['boss'] }

// 3. Spawns automatically via SpawnTableExecutor
```

### Add New Room Type
```typescript  
// Add to /src/data/roomTemplates.ts
RoomTemplateDefinitions["grinch_lair"] = {
  type: 'boss', name: 'Grinch Lair',
  spawns: { spawnTable: 'boss_room', guaranteedSpawns: [
    { type: 'boss', actorId: 'grinch', count: 1 }
  ]},
  interactables: [{ type: 'treasure_chest', probability: 1.0 }]
};
```

---

## Migration Status: ✅ PHASE 3 COMPLETE

**What's Working:**
- ✅ Pure data-driven architecture
- ✅ Event-based collision & pathfinding  
- ✅ Unified biome/theme system
- ✅ Complete dungeon generation pipeline
- ✅ All factories use data definitions
- ✅ Massive legacy code cleanup

**Remaining Work:**
- ⚠️ UI integration with new ItemEntity
- ⚠️ Save/load system update
- ⚠️ Equipment system ItemEntity integration

**The core architecture transformation is COMPLETE!** 🎯

---

**Last Updated:** 2025-11-27  
**Phase 3 Status:** ✅ COMPLETE