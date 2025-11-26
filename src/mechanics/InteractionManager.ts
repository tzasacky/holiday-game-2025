import * as ex from 'excalibur';
import { Actor } from '../actors/Actor';
import { Interactable } from './Interactable';
import { Level } from '../dungeon/Level';
import { TerrainType } from '../dungeon/Terrain';

export class InteractionManager {
    constructor(private level: Level) {}

    tryInteract(actor: Actor, targetPos: ex.Vector): boolean {
        // Check for interactable entities at targetPos
        // This assumes interactables are Actors or stored in a map
        // For now, let's assume we check the level's object map or actor list
        
        // 1. Check Actors (Mobs, NPCs, Chests as Actors)
        const targetActor = this.level.actors.find(a => 
            a.gridPos.equals(targetPos) && a !== actor
        );

        if (targetActor && 'interact' in targetActor) {
            return (targetActor as any as Interactable).interact(actor);
        }

        // 2. Check Terrain/Decorations (Doors)
        const tx = Math.floor(targetPos.x);
        const ty = Math.floor(targetPos.y);
        
        if (tx >= 0 && tx < this.level.width && ty >= 0 && ty < this.level.height) {
            const terrain = this.level.terrainData[tx][ty];
            
            // Open Closed Door
            if (terrain === TerrainType.DoorClosed) {
                console.log(`${actor.name} opens a door.`);
                this.level.terrainData[tx][ty] = TerrainType.DoorOpen;
                this.level.updateTileGraphics(); // Refresh visuals
                return true;
            }
        }
        
        return false;
    }
}
