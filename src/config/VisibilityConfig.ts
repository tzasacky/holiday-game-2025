/**
 * Visibility and Fog-of-War Configuration
 */
export const VisibilityConfig = {
    // Feature flags
    enabled: true,  // Master switch for visibility system
    fogOfWarEnabled: true,  // Enable fog-of-war rendering
    
    // Visibility ranges
    playerViewRadius: 8,   // Player's discovery/sight radius
    enemyViewDistance: 8,  // How far enemies can see
    
    // AI behavior timing
    spottingTimeCost: 10,  // Time cost for enemy to react when spotting player
    searchTurns: 5,        // How many turns enemy searches before giving up
    
    // Line-of-sight mechanics
    doorBlocksSight: true, // Closed doors block line-of-sight
    wallBlocksSight: true, // Walls block line-of-sight (should always be true)
    
    // Raycasting optimization
    maxRaycastDistance: 20, // Maximum distance for raycasts (performance)
    cacheRaycastResults: true, // Cache results within same frame
};

export type VisibilityConfigType = typeof VisibilityConfig;
