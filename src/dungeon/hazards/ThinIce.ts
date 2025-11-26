import * as ex from 'excalibur';
import { Trigger } from '../../mechanics/Trigger';
import { Actor } from '../../actors/Actor';
import { TerrainType } from '../Terrain';
import { Level } from '../Level';

export class ThinIce extends Trigger {
    private cracks: number = 0;
    private maxCracks: number = 1; // Breaks on 2nd entry (0 -> 1 -> Break)

    constructor(pos: ex.Vector, private level: Level) {
        super(pos, "Thin Ice");
    }

    onEnter(actor: Actor): void {
        console.log(`${actor.name} stepped on Thin Ice!`);
        this.cracks++;
        
        if (this.cracks > this.maxCracks) {
            this.breakIce(actor);
        } else {
            // Visual feedback: Cracking sound/sprite
            console.log("CRACK!");
        }
    }

    onStay(actor: Actor): void {
        // Maybe chance to break if staying too long?
    }

    onExit(actor: Actor): void {
        // Nothing
    }

    private breakIce(actor: Actor) {
        console.log("The ice breaks!");
        // Change terrain to Water
        const gridX = Math.floor(this.pos.x / 16); // Assuming 16x16
        const gridY = Math.floor(this.pos.y / 16);
        
        if (gridX >= 0 && gridX < this.level.width && gridY >= 0 && gridY < this.level.height) {
            this.level.terrainData[gridX][gridY] = TerrainType.Water;
            this.level.updateTileGraphics(); // Heavy operation, maybe optimize?
            
            // Apply effect to actor (wet/cold/falling)
            // For now, just log
            console.log(`${actor.name} falls into the water!`);
        }
        
        // Remove this trigger
        this.kill();
    }
}
