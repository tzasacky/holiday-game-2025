import { RoomDecorator } from './RoomDecorator';
import { GenerationContext, TileReservation } from '../generators/GenerationContext';
import { Room } from '../Room';
import { TerrainType } from '../Terrain';

export class FireplaceRoomDecorator implements RoomDecorator {
    decorate(context: GenerationContext, room: Room, isSpecial: boolean): void {
        if (!isSpecial) return;

        const level = context.level;
        const cx = Math.floor(room.center.x);
        const cy = Math.floor(room.center.y);

        // Lock the room area
        for (let x = room.x; x < room.x + room.width; x++) {
            for (let y = room.y; y < room.y + room.height; y++) {
                context.reserve(x, y, TileReservation.Locked);
            }
        }

        // Fireplace at top center
        // Check if there is a wall at the top
        if (level.terrainData[cx][room.y] === TerrainType.Wall) {
            // Place inside against the wall
            level.terrainData[cx][room.y + 1] = TerrainType.Fireplace;
        } else {
            // Just place in center if no wall (unlikely for top edge)
            level.terrainData[cx][cy] = TerrainType.Fireplace;
        }

        // Rugs in center
        for (let x = cx - 1; x <= cx + 1; x++) {
            for (let y = cy - 1; y <= cy + 1; y++) {
                if (level.terrainData[x][y] === TerrainType.Floor) {
                    level.terrainData[x][y] = TerrainType.Decoration; // Rug
                }
            }
        }
        
        console.log(`Decorated Fireplace Room at ${room.x},${room.y}`);
    }
}
