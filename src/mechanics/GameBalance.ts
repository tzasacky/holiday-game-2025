import { EffectID } from '../constants';
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

export class GameBalance {
    // Brutal difficulty settings - most runs should end in death
    public static readonly DIFFICULTY: DifficultySettings = {
        playerStartingHP: 25,        // Low starting health
        playerStartingWarmth: 60,    // Moderate starting warmth
        warmthDecayRate: 2.5,        // Lose warmth quickly
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
    public static readonly STAT_REQUIREMENTS_BY_FLOOR: Record<number, {minDamage: number, minDefense: number, minWarmth: number, minHP: number}> = {
        5:  { minDamage: 6,  minDefense: 4,  minWarmth: 80,  minHP: 35 },
        10: { minDamage: 10, minDefense: 7,  minWarmth: 100, minHP: 50 },
        15: { minDamage: 15, minDefense: 10, minWarmth: 120, minHP: 70 },
        20: { minDamage: 22, minDefense: 15, minWarmth: 150, minHP: 90 }
    };

    // Enemy scaling by floor (brutal progression)
    public static readonly ENEMY_SCALING = {
        damagePerFloor: 1.8,         // +80% damage per floor
        healthPerFloor: 1.6,         // +60% health per floor
        accuracyPerFloor: 2,         // +2 accuracy per floor
        speedBonusEvery5Floors: 1    // +1 speed every 5 floors
    };

    // Resource scarcity scaling
    public static readonly RESOURCE_SCALING = {
        warmthSourcesPerFloor: -0.1,  // Fewer warmth sources each floor
        foodSpawnChance: 0.08,        // Only 8% chance per room
        healingItemChance: 0.05,      // Only 5% chance per room
        scrollChance: 0.03            // Rare utility items
    };

    static getEnemyStatsForFloor(floor: number, baseStats: any): any {
        const scaledStats = { ...baseStats };
        
        scaledStats.damage = Math.floor(baseStats.damage * Math.pow(this.ENEMY_SCALING.damagePerFloor, floor / 10));
        scaledStats.maxHP = Math.floor(baseStats.maxHP * Math.pow(this.ENEMY_SCALING.healthPerFloor, floor / 10));
        scaledStats.accuracy = baseStats.accuracy + (floor * this.ENEMY_SCALING.accuracyPerFloor);
        scaledStats.speed = baseStats.speed + Math.floor(floor / 5) * this.ENEMY_SCALING.speedBonusEvery5Floors;
        
        return scaledStats;
    }

    static getRequiredStatsForFloor(floor: number): any {
        const floors = Object.keys(this.STAT_REQUIREMENTS_BY_FLOOR).map(Number).sort((a, b) => a - b);
        
        let targetFloor = floors[0];
        for (const f of floors) {
            if (floor >= f) targetFloor = f;
        }
        
        const baseReqs = this.STAT_REQUIREMENTS_BY_FLOOR[targetFloor];
        
        // Scale beyond defined floors
        if (floor > Math.max(...floors)) {
            const scaleFactor = (floor - Math.max(...floors)) / 5;
            return {
                minDamage: Math.floor(baseReqs.minDamage * (1 + scaleFactor * 0.5)),
                minDefense: Math.floor(baseReqs.minDefense * (1 + scaleFactor * 0.4)),
                minWarmth: Math.floor(baseReqs.minWarmth * (1 + scaleFactor * 0.3)),
                minHP: Math.floor(baseReqs.minHP * (1 + scaleFactor * 0.4))
            };
        }
        
        return baseReqs;
    }

    // Item value calculations for progression
    static getItemValue(itemStats: any, floor: number): number {
        const requirements = this.getRequiredStatsForFloor(floor);
        let value = 0;
        
        // Damage value (most important)
        if (itemStats.damage) {
            value += (itemStats.damage / requirements.minDamage) * 40;
        }
        
        // Defense value
        if (itemStats.defense) {
            value += (itemStats.defense / requirements.minDefense) * 25;
        }
        
        // Warmth value (critical for survival)
        if (itemStats.warmth || itemStats.coldResist) {
            const warmthValue = (itemStats.warmth || 0) + (itemStats.coldResist || 0) * 2;
            value += (warmthValue / requirements.minWarmth) * 35;
        }
        
        return value;
    }

    // Check if player is underpowered for current floor
    static isPlayerUnderpowered(playerStats: any, floor: number): boolean {
        const requirements = this.getRequiredStatsForFloor(floor);
        
        const damageCheck = (playerStats.totalDamage || 0) < requirements.minDamage;
        const defenseCheck = (playerStats.totalDefense || 0) < requirements.minDefense;
        const warmthCheck = (playerStats.maxWarmth || 0) < requirements.minWarmth;
        const hpCheck = (playerStats.maxHP || 0) < requirements.minHP;
        
        // Player is underpowered if they fail 2 or more critical checks
        const failedChecks = [damageCheck, defenseCheck, warmthCheck, hpCheck].filter(Boolean).length;
        return failedChecks >= 2;
    }

    // Environmental hazard scaling
    static getEnvironmentalDamage(floor: number, hazardType: EffectID): number {
        const baseDamage: Record<EffectID, number> = {
            [EffectID.YellowSnow]: 3,
            [EffectID.FallingIcicle]: 8,
            [EffectID.TrapSpike]: 12,
            [EffectID.ColdDamage]: 2,
        } as any; // Partial record
        
        const base = baseDamage[hazardType] || 5;
        return Math.floor(base * (1 + floor * 0.15));
    }

    // Warmth management - the core survival mechanic
    static getWarmthDecayForFloor(floor: number): number {
        return this.DIFFICULTY.warmthDecayRate + (floor * 0.2);
    }

    static getColdDamageForWarmth(warmth: number, maxWarmth: number): number {
        const warmthPercent = warmth / maxWarmth;
        
        if (warmthPercent <= 0.1) {
            return 8; // Severe hypothermia
        } else if (warmthPercent <= 0.25) {
            return 5; // Dangerous cold
        } else if (warmthPercent <= 0.5) {
            return 2; // Uncomfortable cold
        }
        
        return 0; // Safe warmth level
    }

    // Boss encounter difficulty
    static getBossStatsForFloor(floor: number, baseBossStats: any): any {
        const scaledStats = { ...baseBossStats };
        
        scaledStats.maxHP = Math.floor(baseBossStats.maxHP * this.DIFFICULTY.bossHealthMultiplier * (1 + floor * 0.3));
        scaledStats.damage = Math.floor(baseBossStats.damage * (1 + floor * 0.25));
        scaledStats.defense = baseBossStats.defense + Math.floor(floor * 0.5);
        
        // Bosses get special abilities at higher floors
        if (floor >= 10) {
            scaledStats.specialAbilities = [...(baseBossStats.specialAbilities || []), 'aoe_attack'];
        }
        if (floor >= 15) {
            scaledStats.specialAbilities.push('summon_minions');
        }
        if (floor >= 20) {
            scaledStats.specialAbilities.push('status_effects');
        }
        
        return scaledStats;
    }

    // Loot drop chances based on difficulty
    static getLootDropChance(enemyType: string, floor: number): number {
        const baseChances: Record<string, number> = {
            'weak_enemy': 0.05,
            'normal_enemy': 0.12,
            'strong_enemy': 0.20,
            'elite_enemy': 0.35,
            'boss': 0.85
        };
        
        let baseChance = baseChances[enemyType] || 0.1;
        
        // Apply scarcity modifier
        baseChance /= this.DIFFICULTY.lootScarcity;
        
        // Slightly better chances on higher floors (you need it!)
        baseChance *= (1 + floor * 0.02);
        
        return Math.min(0.5, baseChance); // Cap at 50%
    }

    // Death probability calculator (for balancing)
    static calculateDeathProbability(playerStats: any, floor: number): number {
        const requirements = this.getRequiredStatsForFloor(floor);
        
        let deathRisk = 0.1; // Base 10% death risk per floor
        
        // Increase risk based on underpoweredness
        if (playerStats.totalDamage < requirements.minDamage) {
            deathRisk += 0.3;
        }
        if (playerStats.totalDefense < requirements.minDefense) {
            deathRisk += 0.25;
        }
        if (playerStats.maxWarmth < requirements.minWarmth) {
            deathRisk += 0.4; // Warmth is critical
        }
        if (playerStats.currentHP < playerStats.maxHP * 0.5) {
            deathRisk += 0.2; // Low health is dangerous
        }
        if (playerStats.currentWarmth < playerStats.maxWarmth * 0.3) {
            deathRisk += 0.3; // Low warmth is very dangerous
        }
        
        // Floor scaling
        deathRisk += floor * 0.05;
        
        return Math.min(0.95, deathRisk); // Cap at 95%
    }

    // Recommended item distribution for survival
    static getRecommendedLoadout(floor: number): any {
        const requirements = this.getRequiredStatsForFloor(floor);
        
        return {
            weapon: {
                minTier: Math.max(1, Math.floor(floor / 4)),
                requiredDamage: requirements.minDamage,
                preferredEnchantments: ['sharpness', 'frost']
            },
            armor: {
                minTier: Math.max(1, Math.floor(floor / 5)),
                requiredDefense: requirements.minDefense,
                requiredWarmth: requirements.minWarmth,
                preferredEnchantments: ['protection', 'warmth', 'regeneration']
            },
            consumables: {
                minHealingPotions: Math.max(2, Math.floor(floor / 3)),
                minWarmthItems: Math.max(3, Math.floor(floor / 2)),
                minScrolls: Math.max(1, Math.floor(floor / 4))
            },
            artifacts: {
                recommended: floor >= 8,
                preferredTypes: ['warmth', 'survival', 'combat']
            }
        };
    }

    // Victory conditions (what constitutes "winning")
    static readonly VICTORY_CONDITIONS = {
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

    static checkVictoryCondition(playerStats: any, floor: number): boolean {
        return floor >= this.VICTORY_CONDITIONS.reachFloor &&
               playerStats.totalDamage >= this.VICTORY_CONDITIONS.minimumStats.damage &&
               playerStats.totalDefense >= this.VICTORY_CONDITIONS.minimumStats.defense &&
               playerStats.maxWarmth >= this.VICTORY_CONDITIONS.minimumStats.warmth &&
               playerStats.maxHP >= this.VICTORY_CONDITIONS.minimumStats.hp;
    }

    // Difficulty feedback for developers
    static getDifficultyAnalysis(playerStats: any, floor: number): string {
        const deathProb = this.calculateDeathProbability(playerStats, floor);
        const underpowered = this.isPlayerUnderpowered(playerStats, floor);
        const requirements = this.getRequiredStatsForFloor(floor);
        
        let analysis = `Floor ${floor} Difficulty Analysis:\n`;
        analysis += `Death Probability: ${Math.round(deathProb * 100)}%\n`;
        analysis += `Player is ${underpowered ? 'UNDERPOWERED' : 'adequately equipped'}\n\n`;
        
        analysis += `Required Stats vs Player Stats:\n`;
        analysis += `Damage: ${requirements.minDamage} (have: ${playerStats.totalDamage || 0})\n`;
        analysis += `Defense: ${requirements.minDefense} (have: ${playerStats.totalDefense || 0})\n`;
        analysis += `Warmth: ${requirements.minWarmth} (have: ${playerStats.maxWarmth || 0})\n`;
        analysis += `HP: ${requirements.minHP} (have: ${playerStats.maxHP || 0})\n`;
        
        if (deathProb > 0.7) {
            analysis += '\n⚠️  EXTREMELY DANGEROUS - Immediate upgrades needed!';
        } else if (deathProb > 0.5) {
            analysis += '\n⚠️  VERY RISKY - Consider retreating or finding better gear';
        } else if (deathProb > 0.3) {
            analysis += '\n⚠️  MODERATE RISK - Play carefully';
        } else {
            analysis += '\n✓ Manageable difficulty level';
        }
        
        return analysis;
    }
}