import { ImageFiltering, ImageSource, Loader } from "excalibur";
import { Logger } from "../core/Logger";

// Character Paths
const heroPath = 'assets/characters/hero.png';
const snowmanPath = 'assets/enemies/snowman.png';
const krampusPath = 'assets/enemies/krampus.png';
const snowSpritePath = 'assets/enemies/snow_sprite.png';

// Tileset Paths
const snowyVillageTilesPath = 'assets/tilesets/snowy_village_tiles.png';
const snowyVillageDecorPath = 'assets/items/snowy_village_decor.png';
const frozenDepthsTilesPath = 'assets/tilesets/frozen_depths_tiles.png';
const commonTilesPath = 'assets/tilesets/common_tiles.png';
const commonDecorPath = 'assets/items/common_decor.png';

// Item Paths
const itemsWeaponsPath = 'assets/items/items_weapons.png';
const itemsEquipmentPath = 'assets/items/items_equipment.png';
const itemsConsumablesPath = 'assets/items/items_consumables.png';
const itemsMiscPath = 'assets/items/items_misc.png';

export const Resources = {
    // Characters
    HeroSpriteSheetPng: new ImageSource(heroPath, false, ImageFiltering.Pixel),
    SnowmanPng: new ImageSource(snowmanPath, false, ImageFiltering.Pixel),
    KrampusPng: new ImageSource(krampusPath, false, ImageFiltering.Pixel),
    SnowSpritePng: new ImageSource(snowSpritePath, false, ImageFiltering.Pixel),
    FrostGiantPng: new ImageSource('assets/enemies/frost_giant.png', false, ImageFiltering.Pixel),
    EvilElfPng: new ImageSource('assets/enemies/evil_elf.png', false, ImageFiltering.Pixel),
    GingerbreadGolemPng: new ImageSource('assets/enemies/gingerbread_golem.png', false, ImageFiltering.Pixel),
    NutcrackerSoldierPng: new ImageSource('assets/enemies/nutcracker_soldier.png', false, ImageFiltering.Pixel),
    IceSpiderPng: new ImageSource('assets/enemies/ice_spider.png', false, ImageFiltering.Pixel),
    IceWraithPng: new ImageSource('assets/enemies/ice_wraith.png', false, ImageFiltering.Pixel),
    CorruptedSantaPng: new ImageSource('assets/enemies/corrupted_santa.png', false, ImageFiltering.Pixel),
    // IceDragonPng: new ImageSource('assets/enemies/ice_dragon.png', false, ImageFiltering.Pixel), // Kept for safety, unused

    // Tilesets
    SnowyVillageTilesPng: new ImageSource(snowyVillageTilesPath, false, ImageFiltering.Pixel),
    SnowyVillageDecorPng: new ImageSource(snowyVillageDecorPath, false, ImageFiltering.Pixel),
    FrozenDepthsTilesPng: new ImageSource(frozenDepthsTilesPath, false, ImageFiltering.Pixel),
    CommonTilesPng: new ImageSource(commonTilesPath, false, ImageFiltering.Pixel),
    CommonDecorPng: new ImageSource(commonDecorPath, false, ImageFiltering.Pixel),
    
    // Items
    ItemsWeaponsPng: new ImageSource(itemsWeaponsPath, false, ImageFiltering.Pixel),
    ItemsEquipmentPng: new ImageSource(itemsEquipmentPath, false, ImageFiltering.Pixel),
    ItemsConsumablesPng: new ImageSource(itemsConsumablesPath, false, ImageFiltering.Pixel),
    ItemsMiscPng: new ImageSource(itemsMiscPath, false, ImageFiltering.Pixel),

    // Interactables
    InteractablesPng: new ImageSource('assets/items/interactables.png', false, ImageFiltering.Pixel),
    
    // Large Objects (9-Slice)
    LargeObjectsPng: new ImageSource('./assets/tilesets/large_items.png', false, ImageFiltering.Pixel),
    
    // Placeholders for banned mobs to prevent crashes if referenced
    SnowGolemPng: new ImageSource(snowmanPath, false, ImageFiltering.Pixel),
    CandyCaneSpiderPng: new ImageSource(snowmanPath, false, ImageFiltering.Pixel),
    FrostWispPng: new ImageSource(snowmanPath, false, ImageFiltering.Pixel),
    WinterWolfPng: new ImageSource(snowmanPath, false, ImageFiltering.Pixel),
    BlizzardElementalPng: new ImageSource(snowmanPath, false, ImageFiltering.Pixel)
}

export const loader = new Loader();
for (const [key, res] of Object.entries(Resources)) {
    Logger.info(`[Resources] Loading ${key} from ${res.path}`);
    loader.addResource(res);
}