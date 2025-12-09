import { GameActor } from '../components/GameActor';
import { DamageType } from '../data/mechanics';
import { DataManager } from '../core/DataManager';
import { CombatComponent } from '../components/CombatComponent';
import { ProgressionRule } from '../data/mechanics';
import { EventBus } from '../core/EventBus';
import { GameEventNames, DamageEvent } from '../core/GameEvents';
import { LevelManager } from '../core/LevelManager';
import { TerrainDefinitions } from '../data/terrain';
import { InteractableCategories } from '../data/interactables';
import * as ex from 'excalibur';

interface HeatMap {
    width: number;
    height: number;
    grid: number[][]; // Heat intensity at each position
}

export class WarmthSystem {
    private static _instance: WarmthSystem;
    private heatMap: HeatMap | null = null;
    
    public static get instance(): WarmthSystem {
        if (!this._instance) {
            this._instance = new WarmthSystem();
        }
        return this._instance;
    }

    public initializeHeatMap(width: number, height: number): void {
        this.heatMap = {
            width,
            height,
            grid: Array(height).fill(null).map(() => Array(width).fill(0))
        };
    }

    public addHeatSource(x: number, y: number, intensity: number, radius: number): void {
        if (!this.heatMap) return;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const targetX = x + dx;
                const targetY = y + dy;
                
                // Check bounds
                if (targetX < 0 || targetX >= this.heatMap.width || 
                    targetY < 0 || targetY >= this.heatMap.height) continue;

                // Calculate distance for circular falloff
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= radius) {
                    // Linear falloff from center to edge
                    const falloffFactor = 1 - (distance / radius);
                    const heatValue = intensity * falloffFactor;
                    
                    // Add to existing heat (heat sources stack)
                    this.heatMap.grid[targetY][targetX] += heatValue;
                }
            }
        }
    }

    public removeHeatSource(x: number, y: number, intensity: number, radius: number): void {
        if (!this.heatMap) return;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const targetX = x + dx;
                const targetY = y + dy;
                
                // Check bounds
                if (targetX < 0 || targetX >= this.heatMap.width || 
                    targetY < 0 || targetY >= this.heatMap.height) continue;

                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= radius) {
                    const falloffFactor = 1 - (distance / radius);
                    const heatValue = intensity * falloffFactor;
                    
                    // Remove heat (don't go below 0)
                    this.heatMap.grid[targetY][targetX] = Math.max(0, 
                        this.heatMap.grid[targetY][targetX] - heatValue);
                }
            }
        }
    }

    public getHeatAt(x: number, y: number): number {
        if (!this.heatMap) return 0;
        if (x < 0 || x >= this.heatMap.width || y < 0 || y >= this.heatMap.height) return 0;
        return this.heatMap.grid[y][x];
    }

    public processTurn(actor: GameActor, floor: number): void {
        // Only process warmth for player
        if (!actor.isPlayer) return;

        // Only process warmth for actors with warmth stat
        if (actor.warmth === undefined || actor.warmth === null) return;

        // Get heat level at actor's position (constant time lookup!)
        const heatLevel = this.getHeatAt(actor.gridPos.x, actor.gridPos.y);
        
        // If there's significant heat, prevent warmth decay
        if (heatLevel > 3) { // Threshold for heat source effectiveness (lowered to make torches more effective)
            return; // Skip warmth decay when in heated area
        }

        // Get configuration from DataManager
        const difficulty = DataManager.instance.query<any>('difficulty', 'warmthDecayRate') || 1;
        const progression = DataManager.instance.query<ProgressionRule>('progression_rules', 'warmth_decay_scaling');
        
        // Calculate decay
        let decay = difficulty;
        if (progression && progression.scaling) {
             const base = progression.scaling.baseValue || 0;
             const coeff = progression.scaling.coefficient || 0;
             decay = base + (coeff * floor);
        }

        // Apply decay
        const currentWarmth = actor.warmth;
        const newWarmth = Math.max(0, currentWarmth - decay);
        actor.warmth = newWarmth;

        // Check for freezing damage
        if (newWarmth <= 0) {
            const combat = actor.getGameComponent('combat') as CombatComponent;
            if (combat) {
                // Emit damage event
                EventBus.instance.emit(GameEventNames.Damage, new DamageEvent(
                    actor,
                    1,
                    DamageType.Ice,
                    undefined // No source actor
                ));
            }
        }
    }
}
