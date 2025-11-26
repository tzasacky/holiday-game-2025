import * as ex from 'excalibur';
import { Actor } from '../actors/Actor';
import { Level } from '../dungeon/Level';

export class AreaOfEffect {
    static apply(level: Level, center: ex.Vector, radius: number, onHit: (actor: Actor) => void) {
        // Find all actors within radius
        // Simple distance check
        level.actors.forEach(actor => {
            if (actor.pos.distance(center) <= radius) {
                onHit(actor);
            }
        });

        // Visuals?
        // We might want to spawn a ParticleSystem here or return a list of hit actors
    }
}
