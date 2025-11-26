import { Level } from './Level';
import { Actor } from '../actors/Actor';
import { SnowSprite } from '../content/enemies/SnowSprite';
import { Krampus } from '../content/enemies/Krampus';
import * as ex from 'excalibur';

export class Spawner {
    static spawnMobs(level: Level) {
        // Skip the first spawn point (Hero's spot)
        for (let i = 1; i < level.spawnPoints.length; i++) {
            const spawn = level.spawnPoints[i];
            
            // 50% chance to spawn something
            if (Math.random() < 0.5) {
                this.spawnMobAt(level, spawn);
            }
        }
    }

    private static spawnMobAt(level: Level, pos: ex.Vector) {
        // Simple Rarity/Pack logic
        const roll = Math.random();
        
        if (roll < 0.1) {
            // 10% Chance for a "Pack" (2-3 enemies)
            // Need to find adjacent spots? Or just stack them?
            // For now, just spawn one strong enemy or a pack leader
            const mob = new SnowSprite(pos);
            mob.name = "Elite Snow Sprite";
            mob.color = ex.Color.Violet; // Visual distinction
            // mob.stats.hp *= 2; // Buff stats if possible
            level.addMob(mob);
            console.log(`[Spawner] Spawning Elite at ${pos}`);
        } else {
            // Normal Spawn
            const mob = new SnowSprite(pos);
            level.addMob(mob);
        }
    }
}
