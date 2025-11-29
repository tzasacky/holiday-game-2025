# Dungeon Generation Enhancement Design Document

## Executive Summary

This document outlines a comprehensive plan to massively improve dungeon level generation. The primary goals are to **increase visual variety** through procedural tile usage and **enhance code maintainability** by enforcing strong typing across all data files. These improvements build upon the existing BSP generation foundation to create a rich, non-repetitive, and robust dungeon crawler experience.

## Core Pillars

1.  **Visual Excellence:** Procedural variation of tiles (floors, walls) to eliminate monotony.
2.  **Data Integrity:** Strict typing and validation to remove "magic values" and prevent runtime errors.
3.  **Gameplay Depth:** Meaningful room types, interactables, and distinct biome identities.

---

## Phase 1: Strong Typing & Data Safety (CRITICAL FOUNDATION)

**Problem:** The current codebase relies heavily on string literals (e.g., `'chest'`, `'snowy_village'`, `'basic_room'`) in data files. This leads to fragile cross-references and "magic value" bugs.

**Solution:** Implement a strict type system and registry for all game data.

### 1.1 ID Constants & Enums

Replace string literals with typed constants or enums.

```typescript
// src/constants/RoomTypeIDs.ts
export enum RoomTypeID {
  Basic = "basic_room",
  Combat = "combat_room",
  Treasure = "treasure_room",
  Boss = "boss_room",
  // ...
}

// src/constants/BiomeIDs.ts
export enum BiomeID {
  SnowyVillage = "snowy_village",
  FrozenDepths = "frozen_depths",
  KrampusLair = "krampus_lair",
}
```

**Files to Update:**

- `src/data/biomes.ts` -> Use `BiomeID`, `TerrainType`, `InteractableID`
- `src/data/roomTemplates.ts` -> Use `RoomTypeID`, `LootTableID`, `InteractableID`
- `src/data/prefabDefinitions.ts` -> Use `PrefabID`, `ActorID`, `ItemID`

### 1.2 Strict Interfaces

Update data interfaces to enforce these types.

```typescript
// src/data/biomes.ts
export interface BiomeDefinition {
  id: BiomeID; // Strict type
  // ...
  gameplay: {
    preferredSpawnTables: SpawnTableID[]; // Strict array
    lootTableOverrides?: Partial<Record<RoomTypeID, LootTableID>>; // Strict map
    interactableSet: InteractableID[];
    // ...
  };
}
```

---

## Phase 2: Visual Variety & Procedural Tile Strategy (HIGH PRIORITY)

**Problem:** Dungeons look repetitive because each `TerrainType` maps to a single sprite.
**Goal:** Use _all_ available tiles for a biome in a visually pleasing, consistent, and non-chaotic way.

### 2.1 Material-Aware Tile Variants

Instead of just mapping `TerrainType` to sprites, we map **Materials** to **Weighted Tile Sets**.
Rooms and Corridors will be assigned a primary **Material** (e.g., Stone, Wood, Ice, Snow) based on their type or biome.

```typescript
// src/data/biomes.ts

export enum MaterialType {
  Stone = "stone",
  Wood = "wood",
  Ice = "ice",
  Snow = "snow",
  Dirt = "dirt",
}

export interface TileVariant {
  spriteCoords: [number, number];
  weight: number; // Higher = more common
  tags?: string[]; // e.g., 'cracked', 'mossy', 'clean'
}

export interface BiomeVisuals {
  tileset: ex.ImageSource;
  // Map Material -> TerrainType -> Variants
  materials: Record<MaterialType, Partial<Record<TerrainType, TileVariant[]>>>;
}
```

**Application:**

- **Rooms:** A `Workshop` room might use `MaterialType.Wood` for floors and `MaterialType.Stone` for walls.
- **Corridors:** Might use `MaterialType.Ice` in `FrozenDepths` or `MaterialType.Snow` in `SnowyVillage`.

### 2.2 Procedural Selection Strategy (Perlin Noise)

To ensure organic, non-chaotic variation, we use **Perlin Noise** to select variants _within_ a material.

**Algorithm:**

```typescript
function getTileVariant(
  x: number,
  y: number,
  material: MaterialType,
  terrain: TerrainType,
  seed: number
): TileVariant {
  // 1. Get variants for this material + terrain
  const variants = biome.visuals.materials[material][terrain];

  // 2. Use Perlin noise to create "patches" of variants
  // e.g. Patches of "Cracked Stone" amidst "Clean Stone"
  const noiseVal = perlin.get(x * scale, y * scale, seed);

  // 3. Map noise value (-1 to 1) to variant list based on weights
  return selectWeightedFromNoise(variants, noiseVal);
}
```

**Use Cases:**

- **Hazards:** Patches of `Ice` (slippery) on a `Snow` floor.
- **Decor:** Patches of `Rug` tiles on `Wood` floors.
- **Texture:** Patches of `Mossy Stone` on `Clean Stone` walls.

### 2.3 Solid Interleaved Autotiling

Instead of a complex bitmask system, we use **Solid Tiles that Interleave**.

- **Design Decision:** Use 1x1 solid wall tiles that visually connect (interleave) with neighbors without needing 47-tile bitmasks.

### 2.4 Decoration Layers

Add a separate "Decoration" layer for non-blocking visual elements (overlays).

- **Wall Overlays:** Torches, banners, vines.
- **Floor Overlays:** Rugs, debris, bloodstains.
- **Placement:** Use Perlin noise (different frequency/seed) to place these naturally.

### 2.5 Advanced Feature System (Multi-Tile Features)

**Problem:** Simple tile replacement isn't enough for complex, multi-tile structures like rivers, chasms, or lava flows that need coherent paths and logic.
**Goal:** Implement a modular `TerrainFeature` system.

```typescript
// src/dungeon/features/TerrainFeature.ts

export interface FeatureContext {
  level: Level;
  rng: ex.Random;
  biome: BiomeDefinition;
}

export interface TerrainFeature {
  id: string;
  name: string;

  // Can this feature be placed? (e.g., checks for space, conflicting features)
  canPlace(context: FeatureContext): boolean;

  // Execute the placement logic
  apply(context: FeatureContext): void;
}
```

**Implementation Strategy:**

1.  **Feature Generators:** Create specific classes for complex features:
    - `RiverGenerator`: Uses pathfinding or noise to carve a continuous river from one side of the map to the other.
    - `ChasmGenerator`: Creates irregular holes in the floor, potentially using cellular automata for organic shapes.
    - `IcePatchGenerator`: Places slippery ice patches using Perlin noise thresholds.
2.  **Integration:** `AdvancedLevelGenerator` will iterate through `biome.features`, instantiate the corresponding `TerrainFeature` generator, and call `apply()`.
3.  **Masking:** Features should respect "reserved" areas (like prefab or secret rooms) if necessary, or be able to overwrite them based on priority.

---

## Phase 3: Room Architecture & Features

### 3.1 Morphology-Based Feature System

Instead of hardcoding specific features (River, Chasm), we define **Feature Morphologies** that can be configured to create various effects.

- **`LinearFeature`**: Generates a path from point A to B.
  - _Usage_: Rivers, Ravines, Lava Flows, Bridges, Carpets.
  - _Config_: `width`, `meander`, `terrainType` (e.g., Water), `properties` (e.g., frozen).
- **`PatchFeature`**: Generates scattered clusters using noise thresholds.
  - _Usage_: Ice patches, Puddles, Rubble, Vegetation, Carpets.
  - _Config_: `density`, `threshold`, `terrainType`.
- **`BlobFeature`**: Generates organic shapes using Cellular Automata or radius.
  - _Usage_: Lakes, Large Chasms, Clearings.

### 3.2 Topological Constraints & Room Placement

To ensure good gameplay flow, we must consider the dungeon's topology:

- **Critical Path**: The path from **Entrance** to **Exit**.
  - _Constraint_: No **Locked Doors** on the critical path (unless the key is guaranteed to be found earlier on the same path).
  - _Constraint_: No **Hazards** that completely block progress without a solution.
- **Leaf Nodes (Dead Ends)**: Rooms with only one connection.
  - _Usage_: **Treasure Rooms**, **Secret Rooms**, **MiniBoss Rooms** (often).
  - _Logic_: Identify leaf nodes in the BSP tree and prioritize them for special room placement.
- **Enclosure**: Rooms should feel distinct.
  - _Logic_: Ensure rooms have walls on all sides except for explicit door connections. Avoid "Swiss cheese" rooms with too many openings unless intended (e.g., Ruins).

### 3.3 Enhanced Door Logic

- **Door Types**:
  - **Standard**: Safe rooms, general connections.
  - **Locked**: Treasure/Boss rooms (only if off critical path).
  - **Secret**: Secret rooms (leaf nodes).
  - **Keys**: We must spawn a key for each locked entity (door, chest, etc.) that is on the level.
- **Placement**:
  - Doors should be placed at the _narrowest_ point of connection between a room and a corridor (chokepoint).
  - Avoid placing doors in the middle of a wide open wall if possible.

### 3.4 Interactables & Props

Populate rooms with interactables based on their template.

- **Functional**: Chests (Loot), Fireplaces (Heal), Anvils (Upgrade).
- **Decorative**: Tables, Chairs, Bookshelves (can search for lore/small loot).
- **Placement Logic**:
  - `Wall`: Snaps to wall tiles.
  - `Center`: Placed in the middle of the room.
  - `Corner`: Placed in empty corners.

---

## Phase 4: Consistency & Serialization (CRITICAL)

**Problem:** Level generation must be deterministic and state must be preserved perfectly between floor transitions.
**Goal:** Ensure `DungeonNavigator` and `LevelManager` handle state consistently.

### 4.1 Deterministic Generation

- **Seeding:** `AdvancedLevelGenerator` must accept a `seed`.
- **RNG:** All procedural decisions (Perlin noise offsets, room selection, loot rolls) must use a seeded RNG (e.g., `ex.Random`).
- **Re-generation:** Generating a level with Seed X must _always_ result in the exact same tile layout and initial actor placement.
- ** Consistency:** levels after 1 must fully work. Currently missing interactables, loot, exits and entrances, etc. Do not fix indivudally. We need to make sure the full generation flow is done every time. We also need to figure out why the second level deadlocks.

### 4.2 Serialization Strategy

- **SerializedLevel Interface:**
  ```typescript
  interface SerializedLevel {
    seed: number;
    depth: number;
    // Delta compression: Only store changes from the base seed generation
    // OR store full state if small enough
    terrainChanges: Record<string, TerrainType>; // "x,y" -> NewType
    actors: SerializedActor[]; // Current state of all actors
    items: SerializedItem[]; // Current state of all items
    interactables: SerializedInteractable[];
    explored: boolean[][]; // Fog of war state
  }
  ```
- **Workflow:**
  1.  **Enter Floor:** Check if `SerializedLevel` exists.
  2.  **If Exists:** Re-generate base geometry using `seed`, then apply `terrainChanges` and spawn `actors`/`items` from list.
  3.  **If New:** Generate fresh using new `seed`.
  4.  **Exit Floor:** Serialize current state (including destroyed walls, opened doors, dead enemies) to `SerializedLevel`.

---

## Phase 5: Implementation Roadmap

### Step 1: Data Refactor (High Priority)

1.  Create `src/constants/` enums (`BiomeID`, `RoomTypeID`, etc.).
2.  Refactor `biomes.ts`, `roomTemplates.ts`, `prefabDefinitions.ts` to use enums.
3.  Add `MaterialType` and `TileVariant` support to `BiomeDefinition`.

### Step 2: Visual System Upgrade

1.  Update `Level.ts` to support `TileVariant` selection.
2.  Implement `getTileSprite` using Perlin noise for floors/decor.
3.  Implement Material-aware rendering in `TileGraphicsManager`.

### Step 3: Generator Enhancement

1.  Update `AdvancedLevelGenerator.ts` to use the new `RoomTypeID` system.
2.  Implement `DoorSystem` for placing and managing doors.
3.  Implement `InteractableSpawner` using the strongly typed data.

### Step 4: Consistency & Serialization

1.  Update `DungeonNavigator.ts` to fully implement `saveCurrentLevel` and `deserializeLevel`.
2.  Ensure `AdvancedLevelGenerator` is fully deterministic with seeded RNG.

### Step 5: Content Expansion

1.  Create distinct visual palettes for `SnowyVillage`, `FrozenDepths`, `KrampusLair`.
2.  Design unique room templates for each biome.
3.  Add more special rooms and refine when each will appear
4.  Add loot tables and item drops.
5.  Add decor layer to rooms that is varied and interesting.

---

## Technical Considerations

- **Performance:** Noise generation is fast, but caching `Sprite` objects is crucial. Don't create new `ex.Sprite` instances every frame. Use a `SpritePool` or shared references.
- **Asset Management:** Ensure sprite sheets are loaded and indexed correctly. The `TileVariant` system relies on accurate `[col, row]` coordinates.
- **Migration:** Existing save data (if any) might break. This is a breaking change for level generation.

## User Review Required

> [!IMPORTANT] > **Breaking Changes**
> This design requires refactoring core data files. Any existing code relying on string literals for IDs will need to be updated.

> [!TIP] > **Visual Strategy**
> Using Perlin noise for floor variations is a proven technique for "organic" look. It prevents the "checkerboard" look of random noise.
