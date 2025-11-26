import * as ex from 'excalibur';
import { GameEntity } from '../../core/GameEntity';
import { Interactable } from '../../mechanics/Interactable';
import { Actor } from '../../actors/Actor';
import { Door } from './Door';

export class SecretDoor extends GameEntity implements Interactable {
    public isDiscovered: boolean = false;

    constructor(gridPos: ex.Vector) {
        super(gridPos, { width: 32, height: 32, collisionType: ex.CollisionType.Fixed });
    }

    onInitialize(engine: ex.Engine) {
        super.onInitialize(engine);
        // Looks like a wall initially
        const rect = new ex.Rectangle({
            width: 32,
            height: 32,
            color: ex.Color.Gray // Wall color
        });
        this.graphics.use(rect);
    }

    interact(actor: Actor): boolean {
        if (!this.isDiscovered) {
            // Maybe searching reveals it?
            this.discover();
            return true;
        }
        return false;
    }

    public discover() {
        if (this.isDiscovered) return;
        this.isDiscovered = true;
        console.log("Secret door discovered!");
        
        // Replace with actual Door
        if (this.scene && (this.scene as any).level) {
            const level = (this.scene as any).level;
            const door = new Door(this.gridPos);
            level.addEntity(door);
            this.kill();
        }
    }
}
