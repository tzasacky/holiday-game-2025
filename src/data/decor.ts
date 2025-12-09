import { DecorID } from '../constants/DecorIDs';
import { InteractableID } from '../constants/InteractableIDs';
import { GraphicType } from '../constants/GraphicType';

export enum DecorSheet {
    SnowyVillage = 'snowy_village',
    Common = 'common',
    LargeItems = 'large_items'
}

export interface DecorDefinition {
    sheet: DecorSheet;
    col: number;
    row: number;
    type?: GraphicType; // Default GraphicType.Sprite
    animation?: {
        frameCount: number;
        duration: number; // ms per frame
    };
    placement?: 'floor' | 'wall'; // Default 'floor'
    blocksMovement?: boolean;
    blocksSight?: boolean;
    width?: number; // Width in tiles (default 1)
    height?: number; // Height in tiles (default 1)
    
    // Spawn rules for placement system
    spawnRules?: {
        indoor?: boolean;       // Require indoor context
        outdoor?: boolean;      // Require outdoor context
        onlyInRooms?: boolean;  // Don't spawn in corridors
        minPerRoom?: number;
        maxPerRoom?: number;
    };
}

export const DecorDefinitions: Record<DecorID | InteractableID | string, DecorDefinition> = {
    // --- Snowy Village Decor (snowy_village_decor.png) ---
    // Row 1: Furniture
    [DecorID.WindowLit]: { sheet: DecorSheet.SnowyVillage, col: 0, row: 0 },
    [DecorID.WindowDark]: { sheet: DecorSheet.SnowyVillage, col: 1, row: 0 },
    [DecorID.BookshelfFullSnow]: { sheet: DecorSheet.SnowyVillage, col: 2, row: 0, blocksMovement: true },
    [DecorID.BookshelfEmptySnow]: { sheet: DecorSheet.SnowyVillage, col: 3, row: 0, blocksMovement: true },
    [DecorID.TableRoundSnow]: { sheet: DecorSheet.SnowyVillage, col: 4, row: 0, blocksMovement: true },
    [DecorID.TableRectSnow]: { sheet: DecorSheet.SnowyVillage, col: 5, row: 0, blocksMovement: true },
    [DecorID.ChairFrontSnow]: { sheet: DecorSheet.SnowyVillage, col: 6, row: 0, blocksMovement: true },
    [DecorID.ChairBackSnow]: { sheet: DecorSheet.SnowyVillage, col: 7, row: 0, blocksMovement: true },
    
    // Row 2: Nature
    [DecorID.RockSnow]: { sheet: DecorSheet.SnowyVillage, col: 0, row: 1, blocksMovement: true },
    [DecorID.BushFrozen]: { sheet: DecorSheet.SnowyVillage, col: 1, row: 1, blocksMovement: true },
    [DecorID.TreePineSmall]: { sheet: DecorSheet.SnowyVillage, col: 2, row: 1, blocksMovement: true, blocksSight: true },
    [DecorID.TreeDeadSmall]: { sheet: DecorSheet.SnowyVillage, col: 3, row: 1, blocksMovement: true },
    [DecorID.SnowmanProp]: { sheet: DecorSheet.SnowyVillage, col: 4, row: 1, blocksMovement: true },
    [DecorID.IceCrystalSnow]: { sheet: DecorSheet.SnowyVillage, col: 5, row: 1, blocksMovement: true },
    [DecorID.SnowMound]: { sheet: DecorSheet.SnowyVillage, col: 6, row: 1, blocksMovement: true },
    [DecorID.LogPileSnow]: { sheet: DecorSheet.SnowyVillage, col: 7, row: 1, blocksMovement: true },

    // Row 3: Fences
    [DecorID.FenceH]: { sheet: DecorSheet.SnowyVillage, col: 0, row: 2, blocksMovement: true },
    [DecorID.FenceV]: { sheet: DecorSheet.SnowyVillage, col: 1, row: 2, blocksMovement: true },
    [DecorID.FenceCorner]: { sheet: DecorSheet.SnowyVillage, col: 2, row: 2, blocksMovement: true },
    [DecorID.FencePost]: { sheet: DecorSheet.SnowyVillage, col: 3, row: 2, blocksMovement: true },
    [DecorID.WallStoneLow]: { sheet: DecorSheet.SnowyVillage, col: 4, row: 2, blocksMovement: true },
    [DecorID.WallIceLow]: { sheet: DecorSheet.SnowyVillage, col: 5, row: 2, blocksMovement: true },
    [DecorID.HedgeSnow]: { sheet: DecorSheet.SnowyVillage, col: 6, row: 2, blocksMovement: true },
    [DecorID.GateDecor]: { sheet: DecorSheet.SnowyVillage, col: 7, row: 2, blocksMovement: true },

    // Row 4: Clutter
    [DecorID.CrateSnow]: { sheet: DecorSheet.SnowyVillage, col: 0, row: 3, blocksMovement: true },
    [DecorID.BarrelSnow]: { sheet: DecorSheet.SnowyVillage, col: 1, row: 3, blocksMovement: true },
    [DecorID.SackSnow]: { sheet: DecorSheet.SnowyVillage, col: 2, row: 3, blocksMovement: true },
    [DecorID.PotSnow]: { sheet: DecorSheet.SnowyVillage, col: 3, row: 3, blocksMovement: true },
    [DecorID.LanternGround]: { sheet: DecorSheet.SnowyVillage, col: 4, row: 3, blocksMovement: true }, // Animation removed (single tile)
    [DecorID.WoodPile]: { sheet: DecorSheet.SnowyVillage, col: 5, row: 3, blocksMovement: true },
    [DecorID.BucketSnow]: { sheet: DecorSheet.SnowyVillage, col: 6, row: 3 },
    [DecorID.ShovelSnow]: { sheet: DecorSheet.SnowyVillage, col: 7, row: 3 },

    // --- Common Decor (common_decor.png) ---
    // Row 1: Furniture
    [DecorID.BedHead]: { sheet: DecorSheet.Common, col: 0, row: 0, blocksMovement: true },
    [DecorID.BedFoot]: { sheet: DecorSheet.Common, col: 1, row: 0, blocksMovement: true },
    [DecorID.TableRound]: { sheet: DecorSheet.Common, col: 2, row: 0, blocksMovement: true },
    [DecorID.TableRect]: { sheet: DecorSheet.Common, col: 3, row: 0, blocksMovement: true },
    [DecorID.ChairFront]: { sheet: DecorSheet.Common, col: 4, row: 0, blocksMovement: true },
    [DecorID.ChairBack]: { sheet: DecorSheet.Common, col: 5, row: 0, blocksMovement: true },
    [DecorID.BookshelfCommon]: { sheet: DecorSheet.Common, col: 6, row: 0, blocksMovement: true },
    [DecorID.Cabinet]: { sheet: DecorSheet.Common, col: 7, row: 0, blocksMovement: true },

    // Row 2: Holiday
    [DecorID.TreeXmas]: { sheet: DecorSheet.Common, col: 0, row: 1, blocksMovement: true, blocksSight: true }, // Animation removed
    [DecorID.SnowmanCommon]: { sheet: DecorSheet.Common, col: 1, row: 1, blocksMovement: true },
    [DecorID.Wreath]: { sheet: DecorSheet.Common, col: 2, row: 1, placement: 'wall' },
    [DecorID.StockingDecor]: { sheet: DecorSheet.Common, col: 3, row: 1, placement: 'wall' },
    [DecorID.GiftRed]: { sheet: DecorSheet.Common, col: 4, row: 1, blocksMovement: true },
    [DecorID.GiftGreen]: { sheet: DecorSheet.Common, col: 5, row: 1, blocksMovement: true },
    [DecorID.Garland]: { sheet: DecorSheet.Common, col: 6, row: 1, placement: 'wall' },
    [DecorID.Mistletoe]: { sheet: DecorSheet.Common, col: 7, row: 1, placement: 'wall' },

    // Row 3: Nature
    [DecorID.RockCommon]: { sheet: DecorSheet.Common, col: 0, row: 2, blocksMovement: true },
    [DecorID.BushCommon]: { sheet: DecorSheet.Common, col: 1, row: 2, blocksMovement: true },
    [DecorID.TreePineCommon]: { sheet: DecorSheet.Common, col: 2, row: 2, blocksMovement: true, blocksSight: true },
    [DecorID.TreeDeadCommon]: { sheet: DecorSheet.Common, col: 3, row: 2, blocksMovement: true },
    [DecorID.CrystalCommon]: { sheet: DecorSheet.Common, col: 4, row: 2, blocksMovement: true }, // Animation removed
    [DecorID.MoundCommon]: { sheet: DecorSheet.Common, col: 5, row: 2, blocksMovement: true },
    [DecorID.LogPileCommon]: { sheet: DecorSheet.Common, col: 6, row: 2, blocksMovement: true },
    [DecorID.FenceCommon]: { sheet: DecorSheet.Common, col: 7, row: 2, blocksMovement: true },

    // Row 4: Clutter
    [DecorID.Painting]: { sheet: DecorSheet.Common, col: 0, row: 3, placement: 'wall' },
    [DecorID.Mirror]: { sheet: DecorSheet.Common, col: 1, row: 3, placement: 'wall' },
    [DecorID.Clock]: { sheet: DecorSheet.Common, col: 2, row: 3, placement: 'wall' },
    [DecorID.Vase]: { sheet: DecorSheet.Common, col: 3, row: 3, blocksMovement: true },
    [DecorID.CrateCommon]: { sheet: DecorSheet.Common, col: 4, row: 3, blocksMovement: true },
    [DecorID.BarrelCommon]: { sheet: DecorSheet.Common, col: 5, row: 3, blocksMovement: true },
    [DecorID.SackCommon]: { sheet: DecorSheet.Common, col: 6, row: 3, blocksMovement: true },
    [DecorID.CandleStand]: { sheet: DecorSheet.Common, col: 7, row: 3, blocksMovement: true }, 

    // --- Large Items (large_items.png) ---
    // Row 1
    [DecorID.RugRed]: { sheet: DecorSheet.LargeItems, col: 0, row: 0, type: GraphicType.NineSlice, width: 3, height: 3 },
    [DecorID.RugGreen]: { sheet: DecorSheet.LargeItems, col: 1, row: 0, type: GraphicType.NineSlice, width: 3, height: 3 },
    [DecorID.RugIce]: { sheet: DecorSheet.LargeItems, col: 2, row: 0, type: GraphicType.NineSlice, width: 3, height: 3 },
    [DecorID.FloorOrnate]: { sheet: DecorSheet.LargeItems, col: 3, row: 0, type: GraphicType.NineSlice, width: 3, height: 3 },
    [DecorID.FloorBlue]: { sheet: DecorSheet.LargeItems, col: 4, row: 0, type: GraphicType.NineSlice, width: 3, height: 3 },
    
    // Row 2
    [DecorID.BorderGold]: { sheet: DecorSheet.LargeItems, col: 0, row: 1, type: GraphicType.NineSlice, blocksMovement: true, width: 3, height: 3 },
    [DecorID.FloorChecker]: { sheet: DecorSheet.LargeItems, col: 1, row: 1, type: GraphicType.NineSlice, width: 3, height: 3 },
    [DecorID.FloorBlue2]: { sheet: DecorSheet.LargeItems, col: 2, row: 1, type: GraphicType.NineSlice, width: 3, height: 3 },
    [DecorID.IceSheet]: { sheet: DecorSheet.LargeItems, col: 3, row: 1, type: GraphicType.NineSlice, width: 3, height: 3 },
    [InteractableID.SlipperyIce]: { sheet: DecorSheet.LargeItems, col: 3, row: 1, type: GraphicType.NineSlice, width: 3, height: 3 },
    [DecorID.SnowPatch]: { sheet: DecorSheet.LargeItems, col: 4, row: 1, type: GraphicType.NineSlice, width: 3, height: 3 },
    
    // Row 3
    [DecorID.RuneRed]: { sheet: DecorSheet.LargeItems, col: 0, row: 2, type: GraphicType.NineSlice, width: 3, height: 3 },
    [DecorID.IceCracked]: { sheet: DecorSheet.LargeItems, col: 1, row: 2, type: GraphicType.NineSlice, width: 3, height: 3 },
    [InteractableID.BreakableIce]: { sheet: DecorSheet.LargeItems, col: 1, row: 2, type: GraphicType.NineSlice, width: 3, height: 3 },
    [DecorID.RuneRed2]: { sheet: DecorSheet.LargeItems, col: 2, row: 2, type: GraphicType.NineSlice, width: 3, height: 3 },
    [DecorID.MagicCircle]: { sheet: DecorSheet.LargeItems, col: 3, row: 2, type: GraphicType.NineSlice, width: 3, height: 3 },
    [InteractableID.SummoningCircle]: { sheet: DecorSheet.LargeItems, col: 3, row: 2, type: GraphicType.NineSlice, width: 3, height: 3 },
    [DecorID.VoidHole]: { sheet: DecorSheet.LargeItems, col: 4, row: 2, type: GraphicType.NineSlice, blocksMovement: true, width: 3, height: 3 },
    [InteractableID.Chasm]: { sheet: DecorSheet.LargeItems, col: 4, row: 2, type: GraphicType.NineSlice, blocksMovement: true, width: 3, height: 3 },

    // --- New Items (Row 4 on Common/Snowy) ---
    // Lighting
    [DecorID.Torch]: { sheet: DecorSheet.Common, col: 0, row: 4, placement: 'wall' }, 
    [DecorID.Brazier]: { sheet: DecorSheet.Common, col: 1, row: 4, placement: 'floor', blocksMovement: true }, 
    [DecorID.Streetlamp]: { sheet: DecorSheet.SnowyVillage, col: 0, row: 4, placement: 'floor', blocksMovement: true, blocksSight: true },

    // Wall Items
    [DecorID.BannerRed]: { sheet: DecorSheet.Common, col: 2, row: 4, placement: 'wall' },
    [DecorID.BannerBlue]: { sheet: DecorSheet.Common, col: 3, row: 4, placement: 'wall' },
    [DecorID.ShieldDecor]: { sheet: DecorSheet.Common, col: 4, row: 4, placement: 'wall' },

    // Corridor/Dungeon
    [DecorID.Cobweb]: { sheet: DecorSheet.Common, col: 5, row: 4, placement: 'wall' }, 
    [DecorID.Rubble]: { sheet: DecorSheet.Common, col: 6, row: 4, placement: 'floor', blocksMovement: true },

    // Missing Definitions (Mapped to best available)
    [DecorID.ArmorStand]: { sheet: DecorSheet.Common, col: 4, row: 4, placement: 'floor', blocksMovement: true }, // ShieldDecor
    [DecorID.WeaponRack]: { sheet: DecorSheet.Common, col: 4, row: 4, placement: 'floor', blocksMovement: true }, // ShieldDecor
    [DecorID.BonePile]: { sheet: DecorSheet.Common, col: 6, row: 4, placement: 'floor' } // Rubble
};
