export interface DifficultySettings {
    playerStartingHP: number;
    playerStartingWarmth: number;
    warmthDecayRate: number;
    enemyDamageMultiplier: number;
    enemyHealthMultiplier: number;
    enemySpawnRate: number;
    lootScarcity: number; // Higher = rarer loot
    foodScarcity: number;
    curseFrequency: number;
    trapDensity: number;
    bossHealthMultiplier: number;
    permadeathEnabled: boolean;
}

// Brutal difficulty settings - most runs should end in death
export const Difficulty: DifficultySettings = {
    playerStartingHP: 25,        // Low starting health
    playerStartingWarmth: 60,    // Moderate starting warmth
    warmthDecayRate: 0.8,        // Lose warmth at slower rate to allow for strategic play
    enemyDamageMultiplier: 1.4,  // Enemies hit hard
    enemyHealthMultiplier: 1.2,  // Enemies are tanky
    enemySpawnRate: 1.3,         // More enemies spawn
    lootScarcity: 2.0,           // Loot is twice as rare
    foodScarcity: 3.0,           // Food is very rare
    curseFrequency: 1.8,         // Curses are more common
    trapDensity: 1.5,            // More traps
    bossHealthMultiplier: 2.0,   // Bosses are very tough
    permadeathEnabled: true      // One life only
};

// Base stat requirements for survival at different floors
export const StatRequirementsByFloor: Record<number, {minDamage: number, minDefense: number, minWarmth: number, minHP: number}> = {
    5:  { minDamage: 6,  minDefense: 4,  minWarmth: 80,  minHP: 35 },
    10: { minDamage: 10, minDefense: 7,  minWarmth: 100, minHP: 50 },
    15: { minDamage: 15, minDefense: 10, minWarmth: 120, minHP: 70 },
    20: { minDamage: 22, minDefense: 15, minWarmth: 150, minHP: 90 }
};

// Enemy scaling by floor (brutal progression)
export const EnemyScaling = {
    damagePerFloor: 1.8,         // +80% damage per floor
    healthPerFloor: 1.6,         // +60% health per floor
    accuracyPerFloor: 2,         // +2 accuracy per floor
    speedBonusEvery5Floors: 1    // +1 speed every 5 floors
};

// Resource scarcity scaling
export const ResourceScaling = {
    warmthSourcesPerFloor: -0.1,  // Fewer warmth sources each floor
    foodSpawnChance: 0.08,        // Only 8% chance per room
    healingItemChance: 0.05,      // Only 5% chance per room
    scrollChance: 0.03            // Rare utility items
};

// Victory conditions (what constitutes "winning")
export const VictoryConditions = {
    reachFloor: 25,              // Reaching floor 25 is a major achievement
    defeatFinalBoss: true,       // Must defeat Santa's Workshop boss
    collectArtifacts: 3,         // Must have collected at least 3 artifacts
    minimumStats: {              // Must meet minimum power level
        damage: 25,
        defense: 18,
        warmth: 180,
        hp: 100
    }
};
