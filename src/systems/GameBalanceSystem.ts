import { DataManager } from '../core/DataManager';
import { EffectID } from '../constants/EffectIDs';

export class GameBalanceSystem {
    private static _instance: GameBalanceSystem;
    
    public static get instance(): GameBalanceSystem {
        if (!this._instance) {
            this._instance = new GameBalanceSystem();
        }
        return this._instance;
    }

    public getEnemyStatsForFloor(floor: number, baseStats: any): any {
        const damageScale = DataManager.instance.query<number>('enemy_scaling', 'damagePerFloor') || 1.8;
        const healthScale = DataManager.instance.query<number>('enemy_scaling', 'healthPerFloor') || 1.6;
        const accuracyScale = DataManager.instance.query<number>('enemy_scaling', 'accuracyPerFloor') || 2;
        const speedBonus = DataManager.instance.query<number>('enemy_scaling', 'speedBonusEvery5Floors') || 1;
        
        const scaledStats = { ...baseStats };
        scaledStats.damage = Math.floor(baseStats.damage * Math.pow(damageScale, floor / 10));
        scaledStats.maxHP = Math.floor(baseStats.maxHP * Math.pow(healthScale, floor / 10));
        scaledStats.accuracy = (baseStats.accuracy || 0) + (floor * accuracyScale);
        scaledStats.speed = (baseStats.speed || 0) + Math.floor(floor / 5) * speedBonus;
        
        return scaledStats;
    }

    public getRequiredStatsForFloor(floor: number): any {
        // We need to get all keys to find the closest floor
        // DataManager doesn't expose getKeys directly easily without querying the registry object itself if we could
        // But we can try to query specific known floors or just assume the structure matches
        // For now, let's just query specific floors we know exist or implement a way to get the registry
        // Actually, DataManager doesn't expose the registry.
        // But we know the keys are 5, 10, 15, 20.
        
        const floors = [5, 10, 15, 20];
        let targetFloor = floors[0];
        for (const f of floors) {
            if (floor >= f) targetFloor = f;
        }
        
        const baseReqs = DataManager.instance.query<any>('stat_requirements', targetFloor.toString());
        
        if (!baseReqs) return { minDamage: 5, minDefense: 0, minWarmth: 50, minHP: 20 };

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

    public getItemValue(itemStats: any, floor: number): number {
        const requirements = this.getRequiredStatsForFloor(floor);
        let value = 0;
        
        if (itemStats.damage) {
            value += (itemStats.damage / requirements.minDamage) * 40;
        }
        
        if (itemStats.defense) {
            value += (itemStats.defense / requirements.minDefense) * 25;
        }
        
        if (itemStats.warmth || itemStats.coldResist) {
            const warmthValue = (itemStats.warmth || 0) + (itemStats.coldResist || 0) * 2;
            value += (warmthValue / requirements.minWarmth) * 35;
        }
        
        return value;
    }

    public isPlayerUnderpowered(playerStats: any, floor: number): boolean {
        const requirements = this.getRequiredStatsForFloor(floor);
        
        const damageCheck = (playerStats.totalDamage || 0) < requirements.minDamage;
        const defenseCheck = (playerStats.totalDefense || 0) < requirements.minDefense;
        const warmthCheck = (playerStats.maxWarmth || 0) < requirements.minWarmth;
        const hpCheck = (playerStats.maxHP || 0) < requirements.minHP;
        
        const failedChecks = [damageCheck, defenseCheck, warmthCheck, hpCheck].filter(Boolean).length;
        return failedChecks >= 2;
    }

    public getEnvironmentalDamage(floor: number, hazardType: string): number {
        // We could query environmental_hazards from DataManager if we knew the ID
        // But here we just use hardcoded base values scaled by floor as per original code
        // Or we can query 'environmental_hazards' registry if we know the key
        
        const hazardDef = DataManager.instance.query<any>('environmental_hazards', hazardType);
        if (hazardDef && hazardDef.scaling) {
             // Use the scaling formula from definition
             const base = hazardDef.scaling.baseValue;
             const coeff = hazardDef.scaling.coefficient;
             // Assuming linear for now as per original code's simple math
             return Math.floor(base * (1 + floor * 0.15)); 
        }

        const baseDamage: Record<string, number> = {
            [EffectID.YellowSnow]: 3,
            [EffectID.FallingIcicle]: 8,
            [EffectID.TrapSpike]: 12,
            [EffectID.ColdDamage]: 2,
        };
        
        const base = baseDamage[hazardType] || 5;
        return Math.floor(base * (1 + floor * 0.15));
    }

    public getWarmthDecayForFloor(floor: number): number {
        const baseRate = DataManager.instance.query<number>('difficulty', 'warmthDecayRate') || 2.5;
        return baseRate + (floor * 0.2);
    }

    public getColdDamageForWarmth(warmth: number, maxWarmth: number): number {
        const warmthPercent = warmth / maxWarmth;
        
        if (warmthPercent <= 0.1) {
            return 8; 
        } else if (warmthPercent <= 0.25) {
            return 5; 
        } else if (warmthPercent <= 0.5) {
            return 2; 
        }
        
        return 0; 
    }

    public getBossStatsForFloor(floor: number, baseBossStats: any): any {
        const scaledStats = { ...baseBossStats };
        const bossHealthMult = DataManager.instance.query<number>('difficulty', 'bossHealthMultiplier') || 2.0;
        
        scaledStats.maxHP = Math.floor(baseBossStats.maxHP * bossHealthMult * (1 + floor * 0.3));
        scaledStats.damage = Math.floor(baseBossStats.damage * (1 + floor * 0.25));
        scaledStats.defense = baseBossStats.defense + Math.floor(floor * 0.5);
        
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

    public calculateDeathProbability(playerStats: any, floor: number): number {
        const requirements = this.getRequiredStatsForFloor(floor);
        
        let deathRisk = 0.1; 
        
        if (playerStats.totalDamage < requirements.minDamage) deathRisk += 0.3;
        if (playerStats.totalDefense < requirements.minDefense) deathRisk += 0.25;
        if (playerStats.maxWarmth < requirements.minWarmth) deathRisk += 0.4;
        if (playerStats.currentHP < playerStats.maxHP * 0.5) deathRisk += 0.2;
        if (playerStats.currentWarmth < playerStats.maxWarmth * 0.3) deathRisk += 0.3;
        
        deathRisk += floor * 0.05;
        
        return Math.min(0.95, deathRisk);
    }

    public getRecommendedLoadout(floor: number): any {
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

    public checkVictoryCondition(playerStats: any, floor: number): boolean {
        const reachFloor = DataManager.instance.query<number>('victory', 'reachFloor') || 25;
        const minStats = DataManager.instance.query<any>('victory', 'minimumStats') || { damage: 25, defense: 18, warmth: 180, hp: 100 };

        return floor >= reachFloor &&
               playerStats.totalDamage >= minStats.damage &&
               playerStats.totalDefense >= minStats.defense &&
               playerStats.maxWarmth >= minStats.warmth &&
               playerStats.maxHP >= minStats.hp;
    }

    public getDifficultyAnalysis(playerStats: any, floor: number): string {
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
