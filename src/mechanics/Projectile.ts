import * as ex from 'excalibur';
import { Actor } from '../actors/Actor';
import { GameEntity } from '../core/GameEntity';
import { DamageType } from './DamageType';

export class Projectile extends GameEntity {
    public speed: number = 300;
    public damage: number = 1;
    public damageType: DamageType = DamageType.Physical;
    public owner: Actor | null = null;

    constructor(pos: ex.Vector, target: ex.Vector, sprite: ex.Graphic, owner?: Actor) {
        super(pos);
        this.graphics.use(sprite);
        this.owner = owner || null;

        // Calculate velocity
        const dir = target.sub(pos).normalize();
        this.vel = dir.scale(this.speed);
        
        // Rotate sprite to face direction
        this.rotation = dir.toAngle();
        
        // Set collision
        this.body.collisionType = ex.CollisionType.Passive;
    }

    onInitialize(engine: ex.Engine) {
        this.on('collisionstart', (evt) => this.onCollision(evt));
    }

    onCollision(evt: ex.CollisionStartEvent) {
        const other = evt.other;
        const otherActor = other.owner as Actor; // Assuming Collider's owner is the Actor
        
        // Ignore owner
        if (otherActor === this.owner) return;

        // Hit Actor
        if (otherActor instanceof Actor) {
            otherActor.takeDamage(this.damage, this.damageType);
            this.kill();
            return;
        }
        
        // Hit Wall (TileMap)
        // If it's not an actor and it's fixed, it's likely a wall
        if (other.owner instanceof ex.TileMap || (other.owner && (other.owner as any).body?.collisionType === ex.CollisionType.Fixed)) {
            this.kill();
        }
    }
}
