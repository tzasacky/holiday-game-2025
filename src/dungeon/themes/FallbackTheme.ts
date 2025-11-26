import * as ex from 'excalibur';
import { FloorTheme } from '../FloorTheme';
import { TerrainType } from '../Terrain';
import { Level } from '../Level';

export class FallbackTheme implements FloorTheme {
    name = "Fallback";
    tiles: Record<TerrainType, ex.Graphic>;

    constructor() {
        const makeFallback = (color: ex.Color, label: string) => {
            const rect = new ex.Rectangle({
                width: 32,
                height: 32,
                color: color
            });
            const text = new ex.Text({
                text: label,
                color: ex.Color.White,
                font: new ex.Font({ size: 10 })
            });
            
            return new ex.GraphicsGroup({
                members: [
                    { graphic: rect, offset: ex.vec(0, 0) },
                    { graphic: text, offset: ex.vec(2, 10) }
                ]
            });
        };

        this.tiles = {
            [TerrainType.Floor]: makeFallback(ex.Color.fromHex('#DDDDDD'), "Floor"),
            [TerrainType.DeepSnow]: makeFallback(ex.Color.fromHex('#AAAAAA'), "Deep"),
            [TerrainType.Ice]: makeFallback(ex.Color.Cyan, "Ice"),
            [TerrainType.Water]: makeFallback(ex.Color.Blue, "Water"),
            [TerrainType.Wall]: makeFallback(ex.Color.Gray, "Wall"),
            [TerrainType.DoorOpen]: makeFallback(ex.Color.fromHex('#8B4513'), "Open"),
            [TerrainType.DoorClosed]: makeFallback(ex.Color.fromHex('#5A2D0C'), "Shut"),
            [TerrainType.DoorLocked]: makeFallback(ex.Color.Red, "Lock"),
            [TerrainType.Chasm]: makeFallback(ex.Color.Black, "Chasm"),
            [TerrainType.Fireplace]: makeFallback(ex.Color.Red, "Fire"),
            [TerrainType.Decoration]: makeFallback(ex.Color.Green, "Deco"),
            [TerrainType.StairsDown]: makeFallback(ex.Color.Yellow, "Stairs"),
            [TerrainType.Bridge]: makeFallback(ex.Color.fromHex('#8B4513'), "Bridge"),
        };
    }

    getBottomTile(x: number, y: number, level: Level): ex.Graphic {
        // Always return floor for bottom layer in fallback
        return this.tiles[TerrainType.Floor];
    }

    getTopTile(x: number, y: number, level: Level): ex.Graphic | null {
        const type = level.terrainData[x][y];
        if (type === TerrainType.Floor) return null;
        return this.tiles[type] || null;
    }
}
