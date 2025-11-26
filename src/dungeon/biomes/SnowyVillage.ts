import { Biome } from '../Biome';
import { FloorTheme } from '../FloorTheme';
import { Level } from '../Level';
import { Room } from '../Room';
import { TerrainType } from '../Terrain';
import { IceSlipTrap } from '../Trap';
import { Wreath } from '../Wreath';
import * as ex from 'excalibur';
import { TerrainFeature } from '../features/TerrainFeature';
import { RiverFeature } from '../features/RiverFeature';
import { BlobFeature } from '../features/BlobFeature';
import { RoomDecorator } from '../decorators/RoomDecorator';
import { FireplaceRoomDecorator } from '../decorators/FireplaceRoomDecorator';

export class SnowyVillage implements Biome {
    name = "Snowy Village";
    theme: FloorTheme;
    features = {
        hasRivers: true,
        riverChance: 0.7,
        hasChasms: true,
        hasColumns: true
    };

    terrainFeatures: TerrainFeature[] = [
        new RiverFeature(),
        new BlobFeature(
            TerrainType.Chasm,
            { min: 3, max: 8 },
            { min: 2, max: 10 },
            [TerrainType.Wall]
        )
    ];

    roomDecorators: RoomDecorator[] = [
        new FireplaceRoomDecorator()
    ];

    constructor(theme: FloorTheme) {
        this.theme = theme;
    }

    decorateRoom(level: Level, room: Room, isSpecial: boolean) {
        if (isSpecial) {
            // Special room logic is now handled by RoomDecorators
            // We can add specific biome-level overrides here if needed
            // For now, we rely on the decorators
            
            // If we want to ensure a specific decorator runs for "special" rooms,
            // we might need a way to trigger them. 
            // Currently, the generator iterates all decorators.
            // Let's assume the generator will handle "special" flag or decorators will check it.
            // Actually, RoomDecorator interface doesn't take isSpecial.
            // We should update RoomDecorator to take isSpecial or handle it in the generator.
            return;
        }

        // Standard Room Decoration
        // Center decoration (Table or random)
        const cx = Math.floor(room.x + room.width / 2);
        const cy = Math.floor(room.y + room.height / 2);

        if (Math.random() < 0.3) {
            if (level.terrainData[cx][cy] === TerrainType.Floor) {
                level.terrainData[cx][cy] = TerrainType.Decoration; // Table/Statue
            }
        }

        // Random "Deep Snow" patches
        for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
            for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
                // Skip if not floor
                if (level.terrainData[x][y] !== TerrainType.Floor) continue;

                // Randomly place Deep Snow (Cost 2)
                if (Math.random() < 0.1) {
                    level.terrainData[x][y] = TerrainType.DeepSnow;
                }

                // Randomly place Ice (Slippery)
                if (Math.random() < 0.05) {
                    level.terrainData[x][y] = TerrainType.Ice;
                }
            }
        }
    }

    generateHazards(level: Level, room: Room) {
        // 10% chance for Ice Slip Trap in random spot
        if (Math.random() < 0.1) {
            const rx = Math.floor(Math.random() * (room.width - 2)) + room.x + 1;
            const ry = Math.floor(Math.random() * (room.height - 2)) + room.y + 1;
            
            // Ensure it's a floor
            if (level.terrainData[rx][ry] === TerrainType.Floor) {
                const trap = new IceSlipTrap(ex.vec(rx, ry));
                level.scene.add(trap);
                // level.addTrap(trap); // If we track traps
                console.log(`[SnowyVillage] Placed IceSlipTrap at ${rx},${ry}`);
            }
        }

        // 5% chance for Wreath (Teleporter) - Needs a pair, but for now just one that teleports to center?
        // Actually, let's make it teleport to a random spot in the SAME room for chaos
        if (Math.random() < 0.05) {
            const rx = Math.floor(Math.random() * (room.width - 2)) + room.x + 1;
            const ry = Math.floor(Math.random() * (room.height - 2)) + room.y + 1;
             if (level.terrainData[rx][ry] === TerrainType.Floor) {
                // Teleport to room center
                const dest = room.center.clone(); // Grid coords? Room center is usually pixel or grid?
                // Room.center returns grid coords in BSPGenerator context usually
                // Let's assume grid.
                const wreath = new Wreath(ex.vec(rx, ry), dest);
                level.scene.add(wreath);
                console.log(`[SnowyVillage] Placed Wreath at ${rx},${ry}`);
             }
        }
    }
}
