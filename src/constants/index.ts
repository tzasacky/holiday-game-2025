/**
 * Constants Index
 * 
 * Central location for all enum and constant definitions
 * Import from here for clean, consistent references
 */

// Game Entity ID Enums (individual files for discoverability)
export { ItemID } from './ItemIDs';
export { ActorID } from './ActorIDs';
export { AbilityID } from './AbilityIDs';
export { EffectID } from './EffectIDs';
export { InteractableID } from './InteractableIDs';
export { LootTableID } from './LootTableIDs';

// Re-export data enums for convenience
export { ItemType, ItemRarity } from '../data/items';
export { EnchantmentType, CurseType } from '../data/enchantments';
export { DamageType } from '../data/mechanics';
export { TerrainType } from '../data/terrain';
