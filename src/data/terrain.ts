export enum TerrainType {
    Wall = 'wall',
    Floor = 'floor',
    Water = 'water',
    Chasm = 'chasm',
    // Holiday Specific
    Ice = 'ice', // Slippery
    DeepSnow = 'deep_snow', // Slow movement
}

export interface TerrainEffect {
    type: 'damage' | 'effect' | 'sound';
    value?: number;
    damageType?: string;
    effectId?: string;
    duration?: number;
    soundId?: string;
}

export interface TerrainData {
    type: TerrainType;
    isSolid: boolean;
    isTransparent: boolean;
    cost: number; // Movement cost (1 = normal, 2 = slow)
    isSlippery?: boolean;
    isWarmthSource?: boolean;
    effects?: TerrainEffect[];
}

export const TerrainDefinitions: Record<TerrainType, TerrainData> = {
    [TerrainType.Wall]: { type: TerrainType.Wall, isSolid: true, isTransparent: false, cost: 0 },
    [TerrainType.Floor]: { type: TerrainType.Floor, isSolid: false, isTransparent: true, cost: 1 },
    [TerrainType.Water]: { type: TerrainType.Water, isSolid: true, isTransparent: true, cost: 0 }, // Impassable (requires bridge)
    [TerrainType.Chasm]: { type: TerrainType.Chasm, isSolid: true, isTransparent: true, cost: 0 },
    
    [TerrainType.Ice]: { type: TerrainType.Ice, isSolid: false, isTransparent: true, cost: 1, isSlippery: true },
    [TerrainType.DeepSnow]: { type: TerrainType.DeepSnow, isSolid: false, isTransparent: true, cost: 2 }
};
