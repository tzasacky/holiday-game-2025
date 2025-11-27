import { Level } from './Level';
import { GameActor } from '../components/GameActor';
import { ActorSpawnSystem } from '../components/ActorSpawnSystem';
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
        const spawnSystem = ActorSpawnSystem.instance;
        
        if (roll < 0.1) {
            // 10% Chance for elite enemy
            const mob = spawnSystem.spawnSnowSprite(pos);
            mob.name = "Elite Snow Sprite";
            // TODO: Add elite modifiers via component events
            level.addMob(mob);
            console.log(`[Spawner] Spawning Elite Snow Sprite at ${pos} with unified system`);
        } else if (roll < 0.3) {
            // 20% chance for Snowman
            const mob = spawnSystem.spawnSnowman(pos);
            level.addMob(mob);
            console.log(`[Spawner] Spawning Snowman at ${pos} with unified system`);
        } else {
            // Normal Snow Sprite spawn
            const mob = spawnSystem.spawnSnowSprite(pos);
            level.addMob(mob);
            console.log(`[Spawner] Spawning Snow Sprite at ${pos} with unified system`);
        }
    }
}
