# Dungeon Generation Enhancement Design Document

## Executive Summary

The current dungeon generation system has a **solid foundation** with BSP-based layout generation, data-driven biome system, and comprehensive data definitions. However, **critical gameplay features are missing**, resulting in monotonous, featureless dungeons that lack the depth expected in a dungeon crawler.

### Current State Assessment

**✅ Strong Foundation:**

- BSP algorithm creates varied room layouts and corridors
- Data-driven biome system with visual and gameplay properties
- Comprehensive data definitions (room templates, prefabs, interactables, loot tables)
- Spawn system with floor scaling and table-based generation
- Generation context with tile reservation system
- **Existing terrain and decor sprites available** (can regenerate/modify as needed)

**❌ Critical Gaps:**

- **Zero door implementation** - all rooms are open spaces
- **No interactables** - no chests, fireplaces, decorations, or interactive objects
- **No loot placement** - items never spawn in dungeons
- **No special rooms** - all rooms are identical basic rooms
- **No decorative elements** - walls and floors only, no visual variety
- **Prefabs unused** - 6 defined prefabs never spawn
- **Room templates ignored** - 8 room types defined but only `basic_room` is selected
- **Room class minimal** - no type, template reference, or metadata
- **Weak biome features** - `applyBiomeFeature` exists but only handles simple one-tile features; needs enhancement for multi-tile features, room decorations, and corridor variety

---

## Problem Analysis

### 1. Room Monotony

**Current:** All rooms use `basic_room` template. `selectRoomTemplate()` always returns the same type.

**Impact:**

- No gameplay variation
- No strategic decisions
- Boring exploration

### 2. Missing Doors

**Current:** Corridors connect directly to rooms with no transitions.

**Impact:**

- No room boundaries
- No tactical chokepoints
- Loss of "room clearing" satisfaction
- Can't create locked/secret areas

### 3. No Interactables

**Current:** 13 interactable types defined in `interactables.ts`, but `RoomGenerationExecutor` never spawns them.

**Impact:**

- No environmental storytelling
- No warmth/healing sources (fireplaces, Christmas trees)
- No loot containers (chests, stockings)
- No crafting stations
- No traps or hazards

### 4. No Loot Drops

**Current:** Loot tables exist, but items never spawn on the ground.

**Impact:**

- No scavenging gameplay
- No exploration rewards
- Loot only from combat

### 5. Prefabs Not Integrated

**Current:** 6 prefabs defined (`small_shrine`, `storage_room`, `merchant_shop`, `treasure_vault`, `boss_arena`, `workshop`) but never spawned.

**Impact:**

- No memorable set-piece encounters
- No environmental variety
- Hand-crafted content wasted

### 6. Limited Visual Variety

**Current:** Single floor sprite, single wall sprite per biome. Weak `applyBiomeFeature` implementation that only handles one-tile features.

**Impact:**

- Visual monotony
- Hard to distinguish rooms
- Lack of atmosphere
- Corridors and rooms look identical

---

## Proposed Enhancements

### Phase 1: Room Type System (CRITICAL - Foundation)

#### 1.1 Enhanced Room Class

Upgrade `Room.ts` to store metadata:

```typescript
export class Room {
  // ... existing properties

  // NEW: Room metadata
  public roomType:
    | "normal"
    | "boss"
    | "treasure"
    | "puzzle"
    | "ambush"
    | "safe"
    | "shop";
  public template: RoomTemplate;
  public tags: string[] = [];
  public isSpecial: boolean = false;
  public entrances: ex.Vector[] = []; // Door locations
  public cleared: boolean = false;
}
```

#### 1.2 Smart Room Template Selection

Replace `selectRoomTemplate()` with weighted selection:

- Use `getRoomDistributionForFloor()` from `roomTemplates.ts`
- Respect floor restrictions (boss rooms on floor 5+, etc.)
- Enforce max special room percentage (30%)
- Minimum distance between similar types
- Required room types per floor (safe room on floor 1)

**Algorithm:**

1. Roll for special rooms first (treasure, boss, puzzle, safe)
2. Fill remaining with normal/combat rooms
3. Validate room type distribution
4. Assign templates to rooms

---

### Phase 2: Door System (HIGH PRIORITY)

#### 2.1 Door Placement Algorithm

**Corridor-to-Room Connections:**

1. When carving corridors in `createCorridor()`, track entry points
2. Before entering a room, place a door tile
3. Store door position in `room.entrances[]`
4. Mark door tiles with `TerrainType.Door` (needs adding to terrain enum)

**Door Types:**

- **Regular Door** (90%): Opens/closes, blocks movement when closed
- **Locked Door** (8%): Requires key, typically for treasure/special rooms
- **Secret Door** (2%): Hidden until discovered, placed on rare rooms

#### 2.2 Door Mechanics

Create `DoorEntity` class:

```typescript
class DoorEntity extends Interactable {
  state: "open" | "closed" | "locked";
  requiresKey?: string;

  interact(actor: GameActor) {
    if (locked && !actor.hasKey()) return;
    toggleState();
    updateCollision();
  }
}
```

---

### Phase 3: Interactable Object System (HIGH PRIORITY)

#### 3.1 Placement Rules (Per Room Template)

Room templates define `InteractablePlacement[]` with:

- `type`: InteractableID
- `probability`: 0-1 spawn chance
- `placement`: 'wall' | 'floor' | 'corner' | 'center' | 'edge'
- `minCount` / `maxCount`: Quantity range

#### 3.2 Placement Algorithm

```
For each room:
    For each interactable rule in room.template.interactables:
        Roll probability
        If success:
            Determine count (random between min/max)
            Find valid positions based on placement type
            Spawn InteractableEntity at positions
            Reserve tiles in generation context
```

**Placement Type Logic:**

- `wall`: Adjacent to wall, not corner
- `corner`: In room corners (4 positions)
- `center`: Center 3x3 area
- `edge`: Perimeter tiles, not corners
- `floor`: Anywhere on floor, not adjacent to walls

#### 3.3 Priority Interactables

**Containers (Loot):**

- Present Chest (treasure rooms, 80% spawn)
- Stocking (safe rooms, 40% spawn)
- Bookshelf (puzzle rooms, 70% spawn)

**Functional:**

- Fireplace (safe rooms, warmth generation)
- Christmas Tree (workshop rooms, healing)
- Anvil (workshop rooms, crafting)

**Doors & Secrets:**

- Locked doors on treasure/boss rooms
- Secret doors (3% on special rooms)
- Destructible walls (rare, hide shortcuts)

---

### Phase 4: Loot Distribution System (MEDIUM PRIORITY)

#### 4.1 Ground Loot Spawning

**Where:**

- Scattered in rooms (based on `room.template.loot.itemProbability`)
- Near defeated enemies (existing drop system)
- In containers (via interactables)

**Algorithm:**

```
For each room:
    lootChance = room.template.loot.itemProbability
    Roll random 0-1
    If roll < lootChance:
        Select loot table (room.template.loot.tableId or floor default)
        Roll for item from table
        Place WorldItemEntity in random floor tile
```

#### 4.2 Loot Table Integration

Connect existing loot tables:

- `FloorGeneral` for basic rooms
- `TREASURE_ROOM_LOOT` for treasure rooms
- `BOSS_LOOT` for boss rooms
- `PUZZLE_REWARD_LOOT` for puzzle rooms

---

### Phase 5: Special Room Implementation (MEDIUM PRIORITY)

#### 5.1 Room Type Behaviors

**Boss Rooms:**

- Large size (12x12+)
- Single boss spawn (use existing spawn table `boss_room`)
- Locked door until boss defeated
- Guaranteed treasure chest after clear

**Treasure Rooms:**

- Medium size (6x12)
- 2-4 chests (80% spawn rate)
- Guardian enemies (elite spawns)
- Higher loot quality

**Safe Rooms:**

- Small size (4x8)
- **Zero enemy spawns** (override spawn density)
- Fireplace + healing items
- Warm temperature theme

**Puzzle Rooms:**

- Levers, pressure plates (future implementation)
- Puzzle chest with better loot
- Low enemy count
- Requires floor 3+

**Ambush Rooms:**

- Appears empty on entry
- Trigger plate in center
- Spawns pack enemies on activation
- Hidden doors for escape

---

### Phase 6: Prefab Integration (LOW-MEDIUM PRIORITY)

#### 6.1 Prefab Spawning Strategy

**Phase in BSP Generation:**
After room creation, before populating:

```
1. Get prefabs for floor (getPrefabsForFloor())
2. For each prefab:
    Roll spawnProbability
    If success && not at maxPerLevel:
        Find suitable room (size match)
        Replace room data with prefab layout
        Mark room as prefab-sourced
        Place prefab actors/interactables/items
```

#### 6.2 Prefab Priority

**Early Floors (1-3):**

- `small_shrine` (healing, uncommon)
- `storage_room` (loot, uncommon)

**Mid Floors (4-7):**

- `merchant_shop` (rare, trading)
- `workshop` (crafting, uncommon)

**Late Floors (8+):**

- `treasure_vault` (unique, guarded)
- `boss_arena` (unique, major encounter)

#### 6.3 Implementation Plan

1. Add prefab placement phase in `AdvancedLevelGenerator.generate()`
2. Create `PrefabPlacer` utility class
3. Handle prefab layout application (terrain + legend)
4. Spawn prefab actors/interactables/items via existing systems
5. Mark prefab rooms with metadata

---

### Phase 7: Enhanced Biome Features & Decorations (MEDIUM PRIORITY)

> **Note:** The current `applyBiomeFeature` implementation is weak and only handles simple one-tile features. This phase expands it to support multi-tile features, room decorations, and corridor variety - bridging the gap between one-tile features and full rooms.

#### 7.1 Multi-Tile Feature System

**Goal:** Allow biome features to span multiple tiles and create interesting terrain patterns that work in both rooms and corridors.

**New Feature Types:**

- **Rug Patches** (safe rooms, shops): 2x3 or 3x3 decorative floor overlays
- **Ice Sheets** (corridors, rooms): Irregular 4-8 tile slippery zones
- **Snow Drifts** (corridors): Linear 3-5 tile slow zones along walls
- **Furniture Clusters** (rooms): Tables, chairs, crates in 2x2 or L-shapes
- **Pillar Rows** (large rooms): Decorative columns in patterns

**Implementation:**

```typescript
interface BiomeFeaturePattern {
  type: string;
  shape: "single" | "line" | "cluster" | "area";
  tiles: RelativePosition[]; // Offset from origin
  terrainOverrides?: Record<number, TerrainType>;
  decorSprites?: number[];
}
```

#### 7.2 Room Decoration System

**Placement Categories:**

**Wall Decorations** (10-30% of walls):

- Torches (light sources)
- Banners/flags (team colors, holiday themes)
- Mounted decorations (wreaths, icicles)
- Sconces, paintings

**Floor Decorations:**

- **Rugs** (safe rooms 40%, shops 60%): Multi-tile patterns, warm aesthetic
- **Ice patches** (existing, expand coverage)
- **Bloodstains** (combat rooms, post-battle)
- **Snow piles** (corridors, natural accumulation)
- **Leaf/debris scatter** (abandoned areas)

**Corner/Edge Props:**

- Barrels (non-blocking, can contain loot)
- Crates (stackable, destructible)
- Debris piles (rubble, broken furniture)
- Plant pots (decorative)

#### 7.3 Corridor Variety

**Problem:** Corridors are currently uniform and boring.

**Solutions:**

**Width Variation:**

- Narrow passages (1-tile chokepoints)
- Wide halls (2-3 tiles, allow maneuvering)
- Alcoves (1-2 tile side pockets for ambushes or loot)

**Decorative Elements:**

- Torch lines along walls (every 3-5 tiles)
- Snow/ice accumulation in corners
- Fallen debris (partial blockages)
- Floor pattern changes (rugs in mansion corridors)

**Hazards:**

- Ice patches (slippery movement)
- Spike traps (pressure activated)
- Collapsing ceiling markers (visual warning)

#### 7.4 Enhanced `applyBiomeFeature` Implementation

**Current Function Expansion:**

```typescript
private applyBiomeFeatures(level: Level, context: GenerationContext, biome: BiomeDefinition): void {
    // 1. Room-scale features (existing: ice_patches, chasms, rivers)
    // 2. NEW: Multi-tile decorations (rugs, furniture clusters)
    // 3. NEW: Corridor enhancements (torches, floor variation)
    // 4. NEW: Room-specific decoration based on room.template.theme
}
```

**New Methods:**

```typescript
// Multi-tile pattern placement
private placeFeaturePattern(
    level: Level,
    origin: Vector,
    pattern: BiomeFeaturePattern,
    context: GenerationContext
): void

// Room decoration pass
private decorateRoom(
    level: Level,
    room: Room,
    context: GenerationContext,
    biome: BiomeDefinition
): void

// Corridor enhancement pass
private enhanceCorridor(
    level: Level,
    corridorTiles: Vector[],
    context: GenerationContext,
    biome: BiomeDefinition
): void
```

#### 7.5 Data-Driven Decoration Rules

**Add to `BiomeDefinition`:**

```typescript
interface BiomeDefinition {
  // ... existing properties

  decorations?: {
    // Room decoration preferences
    roomWallDensity: number; // 0-1, % of walls with decor
    roomFloorDensity: number; // 0-1, % of floor with decor

    // Corridor preferences
    corridorTorchSpacing: number; // tiles between torches
    corridorFloorFeatures: string[]; // ['snow_pile', 'ice_patch']

    // Available decoration sets
    wallDecor: string[]; // ['torch', 'banner', 'wreath']
    floorDecor: string[]; // ['rug', 'bloodstain', 'debris']
    props: string[]; // ['barrel', 'crate', 'pot']
  };
}
```

#### 7.6 Implementation Priority

1. **High:** Multi-tile rug/furniture patterns (immediate visual variety)
2. **High:** Corridor torch/lighting (atmosphere + gameplay visibility)
3. **Medium:** Wall decoration system (polish)
4. **Medium:** Corridor width variation (tactical depth)
5. **Low:** Advanced prop system (nice-to-have)

---

## Additional Recommended Features

### Feature 1: Minimap & Fog of War (MUST HAVE)

**Why:** Dungeon crawlers need spatial awareness and exploration reveal.

**Implementation:**

- Track visited rooms/tiles
- Render minimap UI showing explored areas
- Mark special rooms (boss, safe, treasure) when found
- Show current position and nearby actors

**Justification:** Standard in roguelikes/dungeon crawlers (Binding of Isaac, Enter the Gungeon, Hades).

---

### Feature 2: Room Clear Indicators (RECOMMENDED)

**Why:** Provide satisfaction and clarity about progression.

**Implementation:**

- Mark room as "cleared" when all enemies defeated
- Visual indicator (glowing edges, color change)
- Spawn/unlock loot containers on clear
- Track clear % per floor

**Justification:** Encourages thorough exploration, provides feedback.

---

### Feature 3: Multi-Floor Staircases (MUST HAVE)

**Why:** Dungeons need exits and progression markers.

**Current State:** `level.exitPoint` defined but never placed.

**Implementation:**

- Place `TerrainType.StairsDown` in final room
- Interactable to descend to next floor
- Place `StairsUp` at entrance (return to previous floor)

---

### Feature 4: Environmental Hazards (RECOMMENDED)

**Why:** Adds risk and tactical complexity.

**Examples:**

- Spike traps (damage on step)
- Ice slippery floors (uncontrolled movement)
- Fire pits (damage over time)
- Poison gas vents

**Implementation:** Use biome `environmentalHazards` data already defined.

---

### Feature 5: Breakable Objects (NICE TO HAVE)

**Why:** Adds interactivity and hidden rewards.

**Examples:**

- Barrels (destroy for loot)
- Crates (blocking, can smash)
- Icicles (can fall and damage)
- Cracked walls (defined as `DestructibleWall` interactable)

---

### Feature 6: Secret Areas (RECOMMENDED)

**Why:** Rewards exploration and attention to detail.

**Implementation:**

- Secret doors hidden as walls
- Destructible walls hiding bonus rooms
- Hidden levers revealing passages
- Small secret rooms off main path (small BSP branches)

---

## Implementation Priority

### Tier 1 - Critical (Immediate Impact)

1. ✅ **Room Type Selection System** - Foundation for all other features
2. ✅ **Door Placement & Mechanics** - Defines room boundaries
3. ✅ **Interactable Spawning** - Core gameplay variety

### Tier 2 - High Priority (Major Gameplay)

4. **Loot Distribution** - Exploration rewards
5. **Special Room Behaviors** - Safe, Boss, Treasure rooms
6. **Staircases** - Level progression

### Tier 3 - Medium Priority (Polish & Depth)

7. **Enhanced Biome Features & Decorations** - Visual variety, multi-tile features, corridor enhancements
8. **Prefab Integration** - Hand-crafted content
9. **Environmental Hazards** - Biome-specific danger
10. **Room Clear System** - Feedback and progression

### Tier 4 - Nice to Have (Enhanced Experience)

11. **Minimap & Fog of War** - Navigation
12. **Secret Areas** - Exploration depth
13. **Breakable Objects** - Environmental interaction

---

## Technical Integration Points

### Files to Modify

**Core Generation:**

- [`AdvancedLevelGenerator.ts`](file:///Users/tzasacky/side_projects/holiday-game-2025/src/dungeon/algorithms/AdvancedLevelGenerator.ts) - Add door placement, prefab integration, enhanced decoration passes
- [`Room.ts`](file:///Users/tzasacky/side_projects/holiday-game-2025/src/dungeon/Room.ts) - Add type, template, metadata properties

**Systems:**

- `RoomGenerationExecutor.ts` - Implement interactable/loot spawning logic
- Create `DoorSystem.ts` - Handle door interactions and state
- Create `InteractableSpawner.ts` - Place interactables per room template rules
- Create `LootSpawner.ts` - Ground loot distribution
- Create `PrefabPlacer.ts` - Prefab room replacement
- Create `DecorationSystem.ts` - Multi-tile feature and decoration placement

**Data:**

- [`terrain.ts`](file:///Users/tzasacky/side_projects/holiday-game-2025/src/data/terrain.ts) - Add `Door`, `LockedDoor`, `SecretDoor` terrain types
- [`roomTemplates.ts`](file:///Users/tzasacky/side_projects/holiday-game-2025/src/data/roomTemplates.ts) - Already complete, just use it
- [`interactables.ts`](file:///Users/tzasacky/side_projects/holiday-game-2025/src/data/interactables.ts) - Already complete, just spawn them
- [`prefabDefinitions.ts`](file:///Users/tzasacky/side_projects/holiday-game-2025/src/data/prefabDefinitions.ts) - Fix InteractableID references (CHEST, TREASURE_CHEST, etc.)
- [`biomes.ts`](file:///Users/tzasacky/side_projects/holiday-game-2025/src/data/biomes.ts) - Add decoration configuration

**Assets:**

- **Note:** Terrain and decor sprites are already available in the project
- Can regenerate or modify sprites as needed
- Existing sprite sheets should cover most decoration needs

---

## User Review Required

> [!IMPORTANT] > **Breaking Changes**
>
> - `Room` class will gain new required properties (type, template) - may affect existing code that instantiates rooms
> - `TerrainType` enum will expand with door types - requires resource updates if using sprite indices
> - `RoomGenerationExecutor` behavior will change significantly - spawning logic will execute

> [!WARNING] > **Performance Considerations**
>
> - Spawning many interactables per room could impact load times (mitigate: batch spawning, lazy loading)
> - Prefab replacement in BSP may need room size validation to avoid layout breaks
> - Door collision checks will add pathfinding complexity (need efficient door state lookup)
> - Multi-tile decoration patterns need efficient placement validation

> [!CAUTION] > **Design Questions for User**
>
> 1. **Door mechanics:** Should doors automatically open on approach, or require explicit interaction (key press)?
> 2. **Loot density:** How much ground loot is desired? (current proposal: 30% item spawn chance per room)
> 3. **Special room frequency:** Is 30% special rooms too high/low for variety?
> 4. **Prefab priority:** Which prefabs should be most common? (affects spawn probabilities)
> 5. **Boss room placement:** Always at end of floor, or randomly placed?
> 6. **Minimap style:** Full map revealed, or fog of war?
> 7. **Decoration density:** What % of walls/floors should have decorations? (proposal: 10-30% walls, 5-15% floors)
> 8. **Corridor variety:** Should corridors have width variation and alcoves, or stay uniform?

---

## Verification Plan

### Automated Tests

1. **Room Template Selection Test**

   - Command: `npm test src/dungeon/algorithms/AdvancedLevelGenerator.test.ts`
   - Validates room type distribution matches floor rules
   - Ensures special room percentage cap enforced

2. **Door Placement Test**

   - Command: `npm test src/systems/DoorSystem.test.ts`
   - Verifies doors placed at room entrances
   - Checks door collision behavior

3. **Interactable Spawning Test**

   - Command: `npm test src/systems/InteractableSpawner.test.ts`
   - Validates placement rules (wall, corner, center logic)
   - Ensures probability rolls and quantity ranges work

4. **Decoration Pattern Test**
   - Command: `npm test src/systems/DecorationSystem.test.ts`
   - Validates multi-tile pattern placement
   - Ensures no overlap with reserved tiles

### Manual Verification

1. **Visual Inspection**

   - Run game: `npm run dev`
   - Generate new level (floor 1)
   - **Expected:** See varied room types, doors between rooms, interactables in appropriate locations, decorative elements

2. **Boss Room Test**

   - Navigate to floor 5
   - Locate boss room (large, distinct)
   - **Expected:** Boss spawn, locked door until clear, reward chest

3. **Prefab Verification**

   - Play through multiple floors
   - **Expected:** Occasional prefab rooms (shrine, storage, workshop) with unique layouts

4. **Loot Distribution Test**

   - Explore all rooms on a floor
   - **Expected:** Some items on ground, chests in treasure rooms, stockings in safe rooms

5. **Decoration Variety Test**
   - Inspect multiple rooms and corridors
   - **Expected:** Rugs in safe rooms, torches in corridors, furniture in appropriate rooms, visual variety

---

## Success Metrics

**Quantitative:**

- ✅ 8+ room types utilized (vs current 1)
- ✅ 100% of rooms have at least 1 door
- ✅ 50%+ of rooms have at least 1 interactable
- ✅ 1-2 prefabs spawn per floor
- ✅ Loot found in 30%+ of rooms (excluding containers)
- ✅ 20%+ of rooms have decorative elements
- ✅ Corridors have at least 1 decorative feature per 10 tiles

**Qualitative:**

- Dungeons feel varied and interesting to explore
- Each room has a "purpose" (combat, treasure, safe, etc.)
- Player makes tactical decisions (which door to open, clear room for chest, etc.)
- Visual variety prevents monotony
- Rooms and corridors are visually distinguishable

---

## Timeline Estimate

**Phase 1 (Room Types):** 2-3 hours
**Phase 2 (Doors):** 3-4 hours  
**Phase 3 (Interactables):** 4-5 hours
**Phase 4 (Loot):** 2-3 hours
**Phase 5 (Special Rooms):** 3-4 hours
**Phase 6 (Prefabs):** 3-4 hours
**Phase 7 (Enhanced Biome Features & Decorations):** 4-6 hours

**Total Tier 1-2:** ~15-20 hours
**Total All Phases:** ~30-35 hours

**Recommended Approach:** Implement Tier 1 critical features first, test, iterate based on user feedback, then proceed to Tier 2+.
