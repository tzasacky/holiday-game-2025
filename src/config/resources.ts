import { ImageFiltering, ImageSource, Loader } from "excalibur";
import { Logger } from "../core/Logger";

const heroPath = '/assets/characters/hero.png';
const tilesetPath = '/assets/tilesets/tileset.png';
const itemsPath = '/assets/items/items.png';
const snowmanPath = '/assets/enemies/snowman.png';
const krampusPath = '/assets/enemies/krampus.png';
const snowSpritePath = '/assets/enemies/snow_sprite.png';

export const Resources = {
    HeroSpriteSheetPng: new ImageSource(heroPath, false, ImageFiltering.Pixel),
    SnowyVillageTilesPng: new ImageSource('/assets/tilesets/snowy_village_tiles.png', false, ImageFiltering.Pixel),
    SnowyVillageDecorPng: new ImageSource('/assets/tilesets/snowy_village_decor.png', false, ImageFiltering.Pixel),
    CommonTilesPng: new ImageSource('/assets/tilesets/common_tiles.png', false, ImageFiltering.Pixel),
    CommonDecorPng: new ImageSource('/assets/tilesets/common_decor.png', false, ImageFiltering.Pixel),
    
    // New Item Sheets
    ItemsWeaponsPng: new ImageSource('/assets/items/items_weapons.png', false, ImageFiltering.Pixel),
    ItemsEquipmentPng: new ImageSource('/assets/items/items_equipment.png', false, ImageFiltering.Pixel),
    ItemsConsumablesPng: new ImageSource('/assets/items/items_consumables.png', false, ImageFiltering.Pixel),
    ItemsMiscPng: new ImageSource('/assets/items/items_misc.png', false, ImageFiltering.Pixel),

    SnowmanPng: new ImageSource(snowmanPath, false, ImageFiltering.Pixel),
    KrampusPng: new ImageSource(krampusPath, false, ImageFiltering.Pixel),
    SnowSpritePng: new ImageSource(snowSpritePath, false, ImageFiltering.Pixel)
}

export const loader = new Loader();
for (const [key, res] of Object.entries(Resources)) {
    Logger.info(`[Resources] Loading ${key} from ${res.path}`);
    loader.addResource(res);
}