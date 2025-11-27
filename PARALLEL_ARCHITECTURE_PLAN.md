# Holiday Game 2025: Parallel Architecture Implementation Plan

## Executive Summary

This document outlines a comprehensive strategy for two developers to work in parallel on transitioning the game architecture from object-oriented to event-driven, data-configured systems. The approach minimizes merge conflicts through careful separation of concerns and leverages the existing EventBus to unify all Record<> based systems.

## Current State Analysis

### Existing Record<> Based Systems

1. **TerrainDefinitions**: `Record<TerrainType, TerrainData>` - terrain behavior configuration
2. **ActorRegistry.configs**: Graphics and animation configuration
3. **ItemRegistry.sprites**: Item sprite mappings
4. **InteractableRegistry**: Factory pattern for interactable creation
5. **EnchantmentSystem.ENCHANTMENT_DATA**: Enchantment definitions and behavior
6. **LootSystem.LOOT_TABLE**: Loot generation tables with tier/floor scaling
7. **GameBalance configuration**: Difficulty and scaling parameters
8. **FloorTheme.tiles**: Visual theme mappings
9. **Prefabs**: Room layout definitions

### Existing EventBus Infrastructure

- **EventBus**: Singleton with typed events (35+ event types)
- **GameEvents**: Comprehensive event classes for combat, items, stats, system
- **GameState**: Serialization system with event listeners

## EventBus Unification Strategy

### Phase 1: Registry Event Integration

All Record<> systems will emit events when accessed, allowing for:

- Dynamic hot-reloading of data
- Runtime modification and testing
- Centralized logging and debugging
- Plugin/mod system foundation

```typescript
// New unified registry events
export const RegistryEventNames = {
  // Data access events
  TerrainQuery: "terrain:query",
  ActorConfigQuery: "actor:config:query",
  ItemSpriteQuery: "item:sprite:query",
  EnchantmentQuery: "enchantment:query",
  LootQuery: "loot:query",

  // Data modification events
  TerrainModify: "terrain:modify",
  ActorConfigModify: "actor:config:modify",
  BalanceModify: "balance:modify",

  // System events
  RegistryReload: "registry:reload",
  RegistryError: "registry:error",

  // Factory events
  ActorCreate: "actor:create",
  ItemCreate: "item:create",
  InteractableCreate: "interactable:create",
} as const;
```

### Phase 2: Unified Data Access Layer

```typescript
// New: src/core/DataManager.ts
export class DataManager {
  private static _instance: DataManager;

  // Centralized access to all Record<> systems
  private registries = new Map<string, any>();

  public static get instance(): DataManager {
    if (!this._instance) {
      this._instance = new DataManager();
    }
    return this._instance;
  }

  constructor() {
    this.setupEventListeners();
    this.registerSystemDefaults();
  }

  // Unified query interface
  query<T>(system: string, key: string): T | null {
    const registry = this.registries.get(system);
    const result = registry?.[key] ?? null;

    // Emit query event for monitoring/debugging
    EventBus.instance.emit(RegistryEventNames.TerrainQuery, {
      system,
      key,
      result,
      timestamp: Date.now(),
    });

    return result;
  }

  // Hot-reload capability
  updateDefinition(system: string, key: string, definition: any) {
    const registry = this.registries.get(system);
    if (registry) {
      registry[key] = definition;
      EventBus.instance.emit(RegistryEventNames.RegistryReload, {
        system,
        key,
        definition,
      });
    }
  }
}
```

## Parallel Work Stream Division

### Stream A: Core Systems & Data Layer

**Developer A Focus**: Infrastructure and data systems
**Primary Files**: `src/core/`, `src/data/`, base architecture

#### 1: EventBus Enhancement & Data Manager

- **Files**:

  - `src/core/DataManager.ts` (NEW)
  - `src/core/GameEvents.ts` (EXTEND)
  - `src/core/EventBus.ts` (MINOR UPDATES)

- **Tasks**:

  1. Create DataManager singleton with unified registry access
  2. Add new registry event types to GameEvents.ts
  3. Implement hot-reload infrastructure
  4. Create development console for runtime data modification

- **Testing**: Create test suite for DataManager with mock registries

#### 2: Component System Foundation

- **Files**:

  - `src/core/Component.ts` (NEW)
  - `src/core/ComponentRegistry.ts` (NEW)
  - `src/core/ActorComponent.ts` (NEW)

- **Tasks**:
  1. Define base Component interface with lifecycle methods
  2. Create ComponentRegistry for component factory pattern
  3. Implement component attachment/detachment system
  4. Design component communication via EventBus

#### 3: Data Definition Migration

- **Files**:

  - `src/data/actors.ts` (NEW)
  - `src/data/terrain.ts` (NEW)
  - `src/data/enchantments.ts` (NEW)
  - `src/data/balance.ts` (NEW)

- **Tasks**:
  1. Extract Record<> definitions to dedicated data files
  2. Maintain backward compatibility with existing systems
  3. Implement DataManager integration
  4. Create data validation and error handling

#### 4: Factory System & Integration

- **Files**:

  - `src/factories/ActorFactory.ts` (NEW)
  - `src/factories/ItemFactory.ts` (ENHANCE EXISTING)
  - `src/factories/ComponentFactory.ts` (NEW)

- **Tasks**:
  1. Create data-driven actor factory using new definitions
  2. Enhance existing ItemFactory to use DataManager
  3. Implement component factory with dependency injection
  4. Integration testing with existing game systems

### Stream B: Actor System & UI Components

**Developer B Focus**: Actor refactoring and UI enhancement
**Primary Files**: `src/actors/`, `src/ui/`, gameplay systems

#### 1: Actor Component Implementation

- **Files**:

  - `src/components/PlayerInputComponent.ts` (NEW)
  - `src/components/AIComponent.ts` (NEW)
  - `src/components/InventoryComponent.ts` (NEW)
  - `src/components/CombatComponent.ts` (NEW)

- **Tasks**:
  1. Extract Hero input logic to PlayerInputComponent
  2. Extract Mob AI logic to AIComponent with state machine
  3. Create InventoryComponent wrapping existing Inventory
  4. Move combat logic from Actor to CombatComponent

#### 2: Actor Class Refactoring

- **Files**:

  - `src/actors/Actor.ts` (MAJOR REFACTOR)
  - `src/actors/Hero.ts` (SIMPLIFY)
  - `src/actors/Mob.ts` (SIMPLIFY)

- **Tasks**:
  1. Reduce Actor to essential properties + component container
  2. Maintain existing property getters for compatibility
  3. Delegate methods to components
  4. Preserve ActorRegistry integration

#### 3: UI System Enhancement

- **Files**:

  - `src/ui/components/DataDrivenUI.ts` (NEW)
  - `src/ui/GameJournal.ts` (ENHANCE)
  - `src/ui/InventoryScreen.ts` (ENHANCE)
  - `src/ui/HUD.ts` (ENHANCE)

- **Tasks**:
  1. Create DataDrivenUI base class for reactive components
  2. Enhance GameJournal to use EventBus for all messages
  3. Update InventoryScreen to use InventoryComponent
  4. Add real-time data modification UI for development

#### Task 4: Content Creation & Testing

- **Files**:

  - `src/content/enemies/` (ENHANCE EXISTING)
  - `src/content/items/` (ENHANCE EXISTING)
  - `src/scenes/GameScene.ts` (UPDATE)

- **Tasks**:
  1. Convert 2-3 existing enemies to data-driven approach
  2. Test compatibility between old and new systems
  3. Update GameScene to use new factory systems
  4. Performance testing and optimization

## Merge Conflict Avoidance Strategy

### File Ownership Rules

1. **Stream A owns**: `src/core/`, `src/data/`, `src/factories/`
2. **Stream B owns**: `src/actors/`, `src/ui/`, `src/components/`

### Coordination Points

Ask before touching these to make sure we're not editing in parallel.

1. **EventBus.ts**: Stream A defines new events, Stream B uses them
2. **GameEvents.ts**: Stream A adds event types, Stream B references them
3. **Actor.ts**: Stream B owns refactoring, Stream A provides component base
4. **GameScene.ts**: Stream B owns updates, coordinate with Stream A for factory usage

## Success Metrics

### Architecture Quality

- [ ] Actors actually render
- [ ] EventBus handles 100% of system communication
- [ ] Zero circular dependencies in new code
- [ ] All Record<> access goes through DataManager
- [ ] Components are fully composable and reusable

## Risk Mitigation

### Technical Risks

1. **Performance degradation**: Implement benchmarking from day 1
2. **Event system bottleneck**: Design with batching and throttling
3. **Circular dependencies**: Strict dependency graph validation
4. **Memory leaks**: Implement proper component lifecycle

## Detailed File Modification Plan

### High Conflict Risk Files

These require careful coordination:

#### src/actors/Actor.ts

- ** 1-2**: No changes (Stream B preparation only)
- ** 3**: Stream B refactors with feature flag protection
- ** 4**: Stream A adds DataManager integration

#### src/core/GameEvents.ts

- ** 1**: Stream A adds registry events
- ** 2**: Stream B adds component events
- ** 3-4**: Shared additions with review process

### Zero Conflict Files

These can be developed independently:

#### Stream A Independent Files

- `src/core/DataManager.ts`
- `src/core/Component.ts`
- `src/data/*.ts` (all new)
- `src/factories/ActorFactory.ts`

#### Stream B Independent Files

- `src/components/*.ts` (all new)
- `src/ui/components/DataDrivenUI.ts`
- Individual enemy class updates

## EventBus Message Patterns

### Query Pattern

```typescript
// Request-response pattern for data queries
EventBus.instance.emit("terrain:query", { type: "wall", requestId: uuid() });
EventBus.instance.on("terrain:response", (event) => {
  /* handle response */
});
```

### Command Pattern

```typescript
// Commands for system modifications
EventBus.instance.emit("actor:move", { actorId, direction, requestId });
EventBus.instance.emit("inventory:add", { actorId, itemId, quantity });
```

### Notification Pattern

```typescript
// Events for UI updates and system notifications
EventBus.instance.emit("stat:changed", { actorId, stat, oldValue, newValue });
EventBus.instance.emit("level:loaded", { levelId, actorCount, itemCount });
```

This architecture transformation sets the foundation for scalable, maintainable, and extensible game development while preserving all existing functionality throughout the migration process.
