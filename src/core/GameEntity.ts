import * as ex from 'excalibur';
import { GraphicsManager } from '../data/graphics';

export abstract class GameEntity extends ex.Actor {
    public gridPos: ex.Vector;
    public blocking: boolean = false;

    constructor(gridPos: ex.Vector, config?: ex.ActorArgs) {
        super(config);
        this.gridPos = gridPos;
        this.syncToGrid();
    }

    // Helper to snap to grid
    public syncToGrid(tileSize: number = 32) {
        this.pos = this.gridPos.scale(tileSize).add(ex.vec(tileSize / 2, tileSize / 2));
    }

    public getSprite(): ex.Graphic | null {
        // Default implementation checks unified graphics system
        if (this.name) {
             return GraphicsManager.instance.getActorSprite(this.name);
        }
        return null;
    }
}
