import * as ex from 'excalibur';

export abstract class GameEntity extends ex.Actor {
    public gridPos: ex.Vector;

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
        // Default implementation checks registry if name is set
        if (this.name) {
             const registry = require('../config/ActorRegistry').ActorRegistry.getInstance();
             return registry.getSprite(this.name);
        }
        return null;
    }
}
