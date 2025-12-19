# Advanced Holiday Dungeon Generation Plan

## Goal

Create a festive, winter-themed roguelike dungeon with deep interactivity, distinct biomes, and a massive amount of concrete content (50+ features).

## Biomes & Floor Progression

The game has a **10-floor structure** with **2 biomes**:

1.  **Snowy Village** (Floors 1-5) [IMPLEMENTED]

    - _Style_: Cabins, fences, snow piles, holiday decorations
    - _Hazards_: Ice patches (slippery), deep snow, frozen water
    - _Boss_: **Krampus** on Floor 5

2.  **Frozen Depths** (Floors 6-10) [IMPLEMENTED]
    - _Style_: Ice caverns, ancient stone, crystal formations
    - _Hazards_: Chasms, slippery ice corridors, dim lighting
    - _Boss_: **Corrupted Santa** on Floor 10

## Interactive Elements (The "Toys")

6.  **Present Chests**: Loot containers. Mimics possible.
7.  **Stockings**: Wall containers for small consumables.
8.  **Campfires**: Static interactables that heal Warmth. [IMPLEMENTED]
9.  **Christmas Trees**: Destructible cover, drops ornaments.
10. **Tall Snow**: Blocks sight, trample to clear. [IMPLEMENTED]
11. **Wreaths**: Teleporters. [IMPLEMENTED]
12. **Locked Doors**: Require specific keys (Silver, Gold, Bone) - for Loot/Secrets, not Bosses.
13. **Secret Doors**: Hidden walls revealing loot rooms.
14. **Destructible Walls**: Cracked sections leading to shortcuts.
15. **Bookshelves**: Search for scrolls/recipes.
16. **Alchemy Pots**: Brew potions.
17. **Anvils**: Repair/Upgrade gear.
18. **Sleigh Stations**: Fast travel points.

## Items & Progression (Concrete Types) [FULLY IMPLEMENTED]

### Permanent Progression (Potions/Scrolls) [IMPLEMENTED]

19. **Star Cookie**: Permanently increases Strength. [IMPLEMENTED]
20. **Liquid Courage**: Permanently increases HP. [IMPLEMENTED]
21. **Scroll of Elven Craftsmanship**: Adds magical Christmas properties to gear. [IMPLEMENTED]
22. **Santa's Route Map**: Reveals the floor with Ho ho ho! [IMPLEMENTED]

### Artifacts & Rings (Trinkets) [IMPLEMENTED]

23. **Ring of Frost**: Freezes enemies on hit. [IMPLEMENTED]
24. **Ring of Haste**: Increases movement speed. [IMPLEMENTED]
25. **Ring of Warmth**: Cold resistance and warmth regen. [IMPLEMENTED]
26. **Ring of Jingle Bells**: Confuses enemies with festive sounds. [IMPLEMENTED]
27. **Ring of Christmas Spirit**: Boosts all stats during December. [IMPLEMENTED]
28. **Ring of Elven Grace**: Supernatural grace and stealth. [IMPLEMENTED]
29. **Ring of Reindeer Speed**: Legendary speed like Santa's reindeer. [IMPLEMENTED]
30. **Snow Globe**: Artifact. Shake to blizzard (AoE damage). [IMPLEMENTED]
31. **Reindeer Bell**: Artifact. Summons a spectral reindeer ally. [IMPLEMENTED]
32. **Naughty List**: Artifact. Increases damage against "Evil" mobs. [IMPLEMENTED]
33. **Christmas Candle**: Eternal flame providing warmth and light. [IMPLEMENTED]
34. **Magic Stocking**: Santa's stocking that improves luck. [IMPLEMENTED]
35. **Frozen Heart**: Ice immunity and enhanced ice magic. [IMPLEMENTED]
36. **Christmas Wish**: Crystallized wish that grants 3 miracles. [IMPLEMENTED]

### New Year's Time Manipulation Artifacts [NEW IMPLEMENTATION]

37. **New Year's Clock**: Rewind time, stop time, or accelerate. [IMPLEMENTED]
38. **Champagne Flute**: Never-ending celebration magic. [IMPLEMENTED]
39. **Countdown Calendar**: Alter fate by tearing off pages. [IMPLEMENTED]

### Weapons & Armor [IMPLEMENTED WITH MULTIPLE TIERS]

40. **Candy Cane Spear**: Reach weapon. [IMPLEMENTED]
41. **Icicle Daggers**: 4 tiers from Melting to Perfect. High crit, fragile. [IMPLEMENTED]
42. **Toy Hammers**: 5 tiers from Broken to Nutcracker. Stun chance. [IMPLEMENTED]
43. **Christmas Lights Whips**: 5 tiers, 2-tile reach with entangle. [NEW IMPLEMENTATION]
44. **Christmas Wands**: 12 varieties of magical ranged weapons. [IMPLEMENTED]
45. **Santa Suits**: 5 tiers from Torn to Magnificent. Charisma buff. [IMPLEMENTED]
46. **Ice Plates**: 5 tiers from Melting to Eternal. Defense vs mobility. [IMPLEMENTED]
47. **Christmas Cloaks**: 4 tiers of elf and reindeer themed armor. [IMPLEMENTED]
48. **Ornament Grenades**: 5 tiers of explosive Christmas ornaments. [IMPLEMENTED]
49. **Snowball Projectiles**: 5 varieties including Yellow Snow poison. [IMPLEMENTED]

### Consumables & Special Items [IMPLEMENTED]

50. **Unlabeled Potion**: 12 random effects, requires identification. [IMPLEMENTED]
51. **Wrapped Gift**: 12 random contents including traps. [IMPLEMENTED]
52. **Christmas Scrolls**: 6 festive scrolls with holiday theming. [IMPLEMENTED]
53. **Scroll of Santa's Blessing**: Removes curses with divine power. [IMPLEMENTED]
54. **Christmas Wish Bone**: Turkey bone revival item. [IMPLEMENTED]

### Advanced Systems [NEW IMPLEMENTATION]

55. **Enchantment System**: 25+ Christmas-themed enchantments. [IMPLEMENTED]
56. **Curse System**: 15+ curses including hidden ones. [IMPLEMENTED]
57. **Identification System**: 150-tick process, tick-based progression. [IMPLEMENTED]
58. **Loot Tables**: Comprehensive tier-based spawning system. [IMPLEMENTED]
59. **Equipment Enhancement**: Stat rolling, bonus generation. [IMPLEMENTED]
60. **Brutal Difficulty**: Balanced for high death rate, rare victories. [IMPLEMENTED]

## Mobs & NPCs

37. **Snowman Builder**: Creates walls.
38. **Krampus Hunter**: Chases player if "Naughty".
39. **Toy Soldier**: Dormant until triggered.
40. **Reindeer**: Neutral, stampedes if hurt.
41. **Elf Archer**: Ranged harass.
42. **Yeti**: Tanky melee.
43. **Mimic Present**: Surprise enemy.
44. **Merchant Elf**: Sells items
45. **Lost Penguin**: Escort quest NPC.
46. **Snow Sprite**: Basic enemy. [IMPLEMENTED]

## Logic & Structure

47. **Key-Gate Logic**: Keys for Treasure Rooms, Vaults, and Shortcuts.
48. **Time Limit**: Warmth mechanic forces momentum. [IMPLEMENTED]
49. **Loops**: Braided dungeon generation. [IMPLEMENTED]
50. **Symmetry**: Special "Temple" rooms.
51. **Vaults**: Premade puzzle rooms. [IMPLEMENTED]

## Implementation Plan

1.  **Sprite Normalizer**: Node.js script (`jimp`) to fix assets.
2.  **Core Systems**: Warmth, Hunger, Inventory, Identification. [IMPLEMENTED]
3.  **Content Batching**: Implement 5 items/mobs at a time. [COMPLETED - 60+ ITEMS]
4.  **Advanced Item Systems**: Enchantments, Curses, Identification. [IMPLEMENTED]
5.  **Loot System**: Tier-based generation and difficulty scaling. [IMPLEMENTED]
6.  **Holiday Theming**: Christmas and New Year's themed content. [IMPLEMENTED]

## New Level Generation Ideas (The "Brain")

52. **Rivers**: Flowing streams of water that damage warmth, must cross fragile ice that breaks after one pass
53. **Gingerbread Caves**: Organic cave structures made of dough and icing (Biome 4 variant).
54. **Toy Factory Assembly Lines**: Prefabricated conveyor belt sections that move entities automatically.
55. **Candy Cane Mazes**: Dense, labyrinthine corridors made of unbreakable candy cane bars.
56. **Snowflake Symmetry**: Procedurally generated room clusters with 6-way radial symmetry (Ice Fortress).
57. **Collapsed Chimneys**: Dead ends blocked by soot and rubble, clearable with explosives.
58. **Naughty Arenas**: Rooms that lock doors and spawn "Coal Golems" until defeated.
59. **Nutcracker Hallways**: Long corridors lined with statues that may animate or shoot darts.
60. **Ribbon Loops**: Cyclic dungeon layouts ensuring multiple paths (Braiding).
61. **Fireplace rooms**: Rooms that restore HP and warmth when waited in.

## New Special Rooms (The "Destinations")

62. **The Gift Vault**: A treasury filled with wrapped presents (loot), some of which are Mimics.
63. **The Poinsettia Garden**: A "warm" greenhouse room with healing plants and aggressive vines.
64. **The Frozen Pond**: A massive slipperyice rink room
65. **The Claus Library**: Bookshelves containing "Naughty/Nice" lists and magical scrolls.
66. **The Toy Forge**: A workshop room with anvils for repairing gear and "jack in the box" hazards.
67. **The Reindeer Stables**: Sleeping reindeer (neutral) that stampede if woken.
68. **The Spirit Shrine**: A statue of "Christmas Past/Present/Future" offering a gamble.
69. **The Elf Barracks**: High-density room with sleeping elves; high risk, high reward.

## New Terrain Features (The "Tactics")

72. **Slippery Ice Patches**: Momentum-based movement; actors slide until they hit a wall.
73. **Chimney Chutes**: Teleporters that warp actors between fireplaces.
74. **Conveyor Belts**: Move actors one tile per turn (Workshop Biome).
75. **Falling Icicles**: Shadows appear one turn before damage is dealt.
76. **Thin Ice**: Cracks when stepped on; breaks into Water if stepped on again.
77. **Chasms**: holes to the floor below that deal heavy damage if fallen into but act as shortcuts. sometimes lead to secret rooms.
