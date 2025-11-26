import * as ex from 'excalibur';

export class ParticleSystem {
    private static _instance: ParticleSystem;
    
    public static get instance(): ParticleSystem {
        if (!this._instance) {
            this._instance = new ParticleSystem();
        }
        return this._instance;
    }

    public createExplosion(scene: ex.Scene, pos: ex.Vector, color: ex.Color = ex.Color.Orange) {
        const emitter = new ex.ParticleEmitter({
            pos: pos,
            width: 5,
            height: 5,
            isEmitting: true,
            emitRate: 50,
            emitterType: ex.EmitterType.Circle,
            radius: 10,
        });

        scene.add(emitter);
        
        // Stop emitting after a short burst
        setTimeout(() => {
            emitter.isEmitting = false;
            // Remove emitter after particles die
            setTimeout(() => {
                emitter.kill();
            }, 1000);
        }, 100);
    }
}
