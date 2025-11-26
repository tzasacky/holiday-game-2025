import { GameEntity } from '../core/GameEntity';
import * as ex from 'excalibur';
import { Resources } from '../config/resources';

export class Wreath extends GameEntity {
    public destination: ex.Vector;

    constructor(gridPos: ex.Vector, destination: ex.Vector) {
        super(gridPos, { width: 32, height: 32, collisionType: ex.CollisionType.Passive });
        this.destination = destination;
        
        // Visuals
        const sheet = ex.SpriteSheet.fromImageSource({
            image: Resources.SnowyVillageTilesPng,
            grid: { spriteWidth: 32, spriteHeight: 32, rows: 3, columns: 8 }
        });
        // Using "Green Carpet" (Row 2, Col 3) as placeholder for Wreath
        this.graphics.use(sheet.getSprite(3, 1)); 
    }

    onInitialize(engine: ex.Engine) {
        super.onInitialize(engine);
        this.on('collisionstart', (evt) => this.handleCollision(evt));
    }

    handleCollision(evt: ex.CollisionStartEvent) {
        if (evt.other.owner instanceof GameEntity) {
            const actor = evt.other.owner;
            // Teleport
            console.log(`${actor.name} teleported by Wreath!`);
            actor.gridPos = this.destination.clone();
            actor.pos = this.destination.scale(32);
            
            // Optional: Play sound or effect
        }
    }
}
