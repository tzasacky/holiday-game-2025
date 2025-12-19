# Holiday Game 2025 🎄

**A pixel-dungeon roguelike adventure where Winter is Here and danger awaits below.**

Copyright 2025 Tye Zasacky

Can you navigate through 10 treacherous floors of a frozen dungeon, survive the cold, and save the New Year's Baby from the clutches of Corrupted Santa?

## 🎮 Play Now

**[Play on GitHub Pages](https://tzasacky.github.io/holiday-game-2025/)** _(deployed on every push to main)_

## ✨ Features

- **10-Floor Progression** through 2 distinct biomes (Snowy Village → Frozen Depths)
- **Boss Battles**: Face Krampus on Floor 5 and Corrupted Santa on Floor 10
- **Turn-Based Combat** with accuracy, critical hits, and damage types
- **Warmth Mechanic**: The cold is deadly—find fires and keep moving
- **60+ Items**: Weapons, armor, consumables, artifacts, and rings
- **Enchantment & Curse System**: Discover magical properties (or curses!) on equipment
- **Identification System**: Unknown items require careful experimentation
- **Procedural Dungeons**: Every run generates unique layouts with rooms, corridors, and vaults

## 🛠️ Technology

- **Engine**: [ExcaliburJS](https://excaliburjs.com/) v0.31
- **Build**: [Vite](https://vitejs.dev/) v6
- **Language**: TypeScript
- **Architecture**: Event-driven with component-based actors

## 🚀 Quickstart

```bash
# Clone the repository
git clone https://github.com/tzasacky/holiday-game-2025.git
cd holiday-game-2025

# Install dependencies
npm install

# Start development server
npm run start

# Open http://localhost:5173 in your browser
```

## 📁 Project Structure

```
├── src/
│   ├── core/           # Engine core (EventBus, TurnManager, Pathfinding)
│   ├── components/     # Actor components (Combat, AI, Inventory, Stats)
│   ├── systems/        # Game systems (Loot, Effects, Warmth, Equipment)
│   ├── data/           # Pure data definitions (items, actors, biomes)
│   ├── dungeon/        # Level generation and dungeon algorithms
│   ├── ui/             # HUD, Inventory, Journal, Minimap
│   └── factories/      # High-level entity creation APIs
├── sprites/            # YAML sprite configuration files
├── public/assets/      # Sprite sheets and tilesets
├── tools/              # Sprite processing pipeline
└── docs/               # Architecture and design documentation
```

## 📜 Available Scripts

| Command               | Description                              |
| --------------------- | ---------------------------------------- |
| `npm run start`       | Start development server                 |
| `npm run build`       | Build for production                     |
| `npm run preview`     | Preview production build                 |
| `npm run fix-sprites` | Process raw sprites through the pipeline |

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md) — System design and code organization
- [Sprite Pipeline](docs/SPRITE_PIPELINE.md) — AI sprite generation workflow
- [Level Plan](docs/level_plan.md) — Game design and content planning

## 🎨 Credits

- **Code**: Tye Zasacky
- **Art**: Nano Banana Pro

## 📄 License

Copyright 2025 Tye Zasacky. All rights reserved.
