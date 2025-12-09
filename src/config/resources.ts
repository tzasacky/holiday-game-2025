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

    // Tilesets
    SnowyVillageTilesPng: new ImageSource(snowyVillageTilesPath, false, ImageFiltering.Pixel),
    SnowyVillageDecorPng: new ImageSource(snowyVillageDecorPath, false, ImageFiltering.Pixel),
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
    LargeObjectsPng: new ImageSource('./assets/tilesets/large_items.png', false, ImageFiltering.Pixel)
}

export const loader = new Loader();
for (const [key, res] of Object.entries(Resources)) {
    Logger.info(`[Resources] Loading ${key} from ${res.path}`);
    loader.addResource(res);
}