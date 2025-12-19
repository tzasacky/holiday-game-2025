export enum TerrainType {
    Wall = 'wall',
    Floor = 'floor',
    Water = 'water',
    Chasm = 'chasm',
    // Holiday Specific
    Ice = 'ice', // Slippery
    DeepSnow = 'deep_snow', // Slow movement
    // Heat Sources
    HotCoals = 'hot_coals', // Floor heat source
    WarmStone = 'warm_stone', // Gentle floor warmth
}

export interface TerrainEffect {
    type: 'damage' | 'effect' | 'sound' | 'level_transition_down';
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
    warmthGeneration?: number; // Warmth generated per turn when standing on it
    lightRadius?: number; // Light radius if it's a light source
    effects?: TerrainEffect[];
}

export const TerrainDefinitions: Record<TerrainType, TerrainData> = {
    [TerrainType.Wall]: { type: TerrainType.Wall, isSolid: true, isTransparent: false, cost: 0 },
    [TerrainType.Floor]: { type: TerrainType.Floor, isSolid: false, isTransparent: true, cost: 1 },
    [TerrainType.Water]: { type: TerrainType.Water, isSolid: true, isTransparent: true, cost: 0 }, // Impassable (requires bridge)
    [TerrainType.Chasm]: { 
        type: TerrainType.Chasm, 
        isSolid: false, 
        isTransparent: true, 
        cost: 0,
        effects: [
            { type: 'damage', value: 10, damageType: 'fall' }, 
            { type: 'level_transition_down', value: 1 }
        ] 
    },
    
    [TerrainType.Ice]: { type: TerrainType.Ice, isSolid: false, isTransparent: true, cost: 1, isSlippery: true },
    [TerrainType.DeepSnow]: { type: TerrainType.DeepSnow, isSolid: false, isTransparent: true, cost: 2 },
    
    [TerrainType.HotCoals]: { 
        type: TerrainType.HotCoals, 
        isSolid: false, 
        isTransparent: true, 
        cost: 1, 
        isWarmthSource: true,
        warmthGeneration: 15,
        lightRadius: 2,
        effects: [
            { type: 'damage', value: 2, damageType: 'fire' }
        ]
    },
    [TerrainType.WarmStone]: { 
        type: TerrainType.WarmStone, 
        isSolid: false, 
        isTransparent: true, 
        cost: 1, 
        isWarmthSource: true,
        warmthGeneration: 5,
        lightRadius: 1
    }
};
