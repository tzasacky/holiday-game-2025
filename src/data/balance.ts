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
    playerStartingHP: 100,       // Starting health
    playerStartingWarmth: 100,   // Starting warmth
    warmthDecayRate: 0.8,        // Lose warmth at slower rate to allow for strategic play
    enemyDamageMultiplier: 1.0,  // Enemies hit hard
    enemyHealthMultiplier: 1.2,  // Enemies are tanky
    enemySpawnRate: 1.3,         // More enemies spawn
    lootScarcity: 2.0,           // Loot is twice as rare
    foodScarcity: 3.0,           // Food is very rare
    curseFrequency: 1.8,         // Curses are more common
    trapDensity: 1.5,            // More traps
    bossHealthMultiplier: 2.0,   // Bosses are very tough
    permadeathEnabled: true      // One life only
};

// Base stat requirements for survival at different floors - BRUTAL scaling
export const StatRequirementsByFloor: Record<number, {minDamage: number, minDefense: number, minWarmth: number, minHP: number}> = {
    3:  { minDamage: 5,  minDefense: 2,  minWarmth: 70,  minHP: 30 },   // Early pressure
    5:  { minDamage: 8,  minDefense: 5,  minWarmth: 85,  minHP: 40 },   // Increased requirements
    10: { minDamage: 15, minDefense: 10, minWarmth: 110, minHP: 65 },   // Much higher
    15: { minDamage: 25, minDefense: 18, minWarmth: 140, minHP: 90 },   // Very high
    20: { minDamage: 40, minDefense: 28, minWarmth: 180, minHP: 120 }   // Near-impossible without progression
};

// Enemy scaling by floor (brutal progression)
export const EnemyScaling = {
    damagePerFloor: 2.2,         // +120% damage per floor - MUCH more aggressive
    healthPerFloor: 1.8,         // +80% health per floor - tankier enemies
    accuracyPerFloor: 3,         // +3 accuracy per floor - more hits
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
