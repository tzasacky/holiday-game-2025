import * as ex from 'excalibur';
import { Trigger } from '../../mechanics/Trigger';
import { Actor } from '../../actors/Actor';
import { DamageType } from '../../mechanics/DamageType';

export class SteamVent extends Trigger {
    private damage: number = 5;
    protected isVentActive: boolean = true;
    private interval: number = 2000; // 2 seconds
    private timer: number = 0;

    constructor(pos: ex.Vector) {
        super(pos, "Steam Vent");
    }

    onInitialize(engine: ex.Engine) {
        // Visuals for steam
    }

    update(engine: ex.Engine, delta: number) {
        super.update(engine, delta);
        this.timer += delta;
        if (this.timer >= this.interval) {
            this.isVentActive = !this.isVentActive;
            this.timer = 0;
            // Toggle visual
        }
    }

    onEnter(actor: Actor): void {
        if (this.isVentActive) {
            this.burn(actor);
        }
    }

    onStay(actor: Actor): void {
        if (this.isVentActive && this.timer > 100) { // Simple check to not spam every frame
             // Ideally we track per-actor cooldowns or rely on the vent's pulse
             // For turn-based, onStay might be called once per turn?
             // If real-time, we need a debounce.
             // Let's assume real-time hybrid for now.
             if (Math.random() < 0.1) this.burn(actor);
        }
    }

    onExit(actor: Actor): void {
        // Nothing
    }

    private burn(actor: Actor) {
        console.log(`${actor.name} is scalded by steam!`);
        actor.takeDamage(this.damage, DamageType.Fire); // Or Steam type?
    }
}
