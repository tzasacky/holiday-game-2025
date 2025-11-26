import * as ex from 'excalibur';

export enum TerrainType {
    Wall = 'wall',
    Floor = 'floor',
    // Deprecated: Use GameEntity Door instead
    DoorOpen = 'door_open',
    DoorClosed = 'door_closed',
    DoorLocked = 'door_locked',
    Water = 'water',
    Chasm = 'chasm',
    // Holiday Specific
    Ice = 'ice', // Slippery
    DeepSnow = 'deep_snow', // Slow movement
    Fireplace = 'fireplace', // Warmth source
    Decoration = 'decoration', // Blocker but visual
    StairsDown = 'stairs_down', // Exit to next level
    Bridge = 'bridge' // Walkable over water
}

export interface TerrainData {
    type: TerrainType;
    isSolid: boolean;
    isTransparent: boolean;
    cost: number; // Movement cost (1 = normal, 2 = slow)
    isSlippery?: boolean;
    isWarmthSource?: boolean;
}

export const TerrainDefinitions: Record<TerrainType, TerrainData> = {
    [TerrainType.Wall]: { type: TerrainType.Wall, isSolid: true, isTransparent: false, cost: 0 },
    [TerrainType.Floor]: { type: TerrainType.Floor, isSolid: false, isTransparent: true, cost: 1 },
    [TerrainType.DoorOpen]: { type: TerrainType.DoorOpen, isSolid: false, isTransparent: true, cost: 1 },
    [TerrainType.DoorClosed]: { type: TerrainType.DoorClosed, isSolid: true, isTransparent: false, cost: 0 }, // Interact to open
    [TerrainType.DoorLocked]: { type: TerrainType.DoorLocked, isSolid: true, isTransparent: false, cost: 0 }, // Needs key
    [TerrainType.Water]: { type: TerrainType.Water, isSolid: false, isTransparent: true, cost: 2 }, // Wading? Or solid for now? Let's say walkable but slow/wet
    [TerrainType.Chasm]: { type: TerrainType.Chasm, isSolid: true, isTransparent: true, cost: 0 },
    
    [TerrainType.Ice]: { type: TerrainType.Ice, isSolid: false, isTransparent: true, cost: 1, isSlippery: true },
    [TerrainType.DeepSnow]: { type: TerrainType.DeepSnow, isSolid: false, isTransparent: true, cost: 2 },
    [TerrainType.Fireplace]: { type: TerrainType.Fireplace, isSolid: true, isTransparent: true, cost: 0, isWarmthSource: true },
    [TerrainType.Decoration]: { type: TerrainType.Decoration, isSolid: true, isTransparent: true, cost: 0 },
    [TerrainType.StairsDown]: { type: TerrainType.StairsDown, isSolid: false, isTransparent: true, cost: 1 },
    [TerrainType.Bridge]: { type: TerrainType.Bridge, isSolid: false, isTransparent: true, cost: 1 }
};
