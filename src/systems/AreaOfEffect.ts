import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';

export class AreaOfEffect {
    static apply(actors: GameActor[], center: ex.Vector, radius: number, onHit: (actor: GameActor) => void) {
        // Find all actors within radius
        // Simple distance check
        actors.forEach(actor => {
            if (actor.pos.distance(center) <= radius) {
                onHit(actor);
            }
        });
    }
}
