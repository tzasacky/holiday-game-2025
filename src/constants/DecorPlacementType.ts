export enum DecorPlacementType {
    // Wall placements
    OnWall = 'on_wall',               // ON actual wall tiles (torches, paintings)
    AdjacentToWall = 'adjacent_wall', // Floor tiles next to walls (bookshelves, cabinets)
    WallTop = 'wall_top',             // Legacy: top wall only
    WallBottom = 'wall_bottom',       // Legacy: bottom wall only
    
    // Floor placements
    FloorCenter = 'floor_center',
    FloorRandom = 'floor_random',
    FloorCorners = 'floor_corners',
    FloorPerimeter = 'floor_perimeter', // Inner ring of floor
    
    // Special
    Linear = 'linear' // Line-based placement (fences, etc)
}
