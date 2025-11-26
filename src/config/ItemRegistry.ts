import * as ex from 'excalibur';
import { Resources } from './resources';
import { ItemID } from '../content/items/ItemIDs';

export class ItemRegistry {
    private static instance: ItemRegistry;
    private spriteSheet: ex.SpriteSheet;
    private sprites: Partial<Record<ItemID, ex.Graphic>> = {};

    private constructor() {
        // Initialize SpriteSheet
        this.spriteSheet = ex.SpriteSheet.fromImageSource({
            image: Resources.ItemsPng,
            grid: {
                rows: 8,
                columns: 8,
                spriteWidth: 32,
                spriteHeight: 32
            }
        });

        this.registerSprites();
    }

    public static getInstance(): ItemRegistry {
        if (!ItemRegistry.instance) {
            ItemRegistry.instance = new ItemRegistry();
        }
        return ItemRegistry.instance;
    }

    private registerSprites() {
        // Helper to get sprite by row/col (8x8 grid)
        const get = (row: number, col: number) => {
            return this.spriteSheet.getSprite(col, row);
        };

        // ROW 1 (Weapons - Daggers & Hammers)
        this.sprites[ItemID.CandyCaneSpear] = get(0, 0);
        this.sprites[ItemID.MeltingIcicleDagger] = get(0, 1);
        this.sprites[ItemID.SharpIcicleDagger] = get(0, 2);
        this.sprites[ItemID.PerfectIcicleDagger] = get(0, 3);
        this.sprites[ItemID.BrokenToyHammer] = get(0, 4);
        this.sprites[ItemID.WoodenToyHammer] = get(0, 5);
        this.sprites[ItemID.SteelToyHammer] = get(0, 6);
        this.sprites[ItemID.NutcrackerHammer] = get(0, 7);

        // ROW 2 (Weapons - Whips & Wands)
        this.sprites[ItemID.TangledChristmasLights] = get(1, 0);
        this.sprites[ItemID.LEDChristmasLights] = get(1, 1);
        this.sprites[ItemID.MagicalChristmasLights] = get(1, 2);
        this.sprites[ItemID.SparklerWand] = get(1, 3);
        this.sprites[ItemID.CandlestickWand] = get(1, 4);
        this.sprites[ItemID.HollyWand] = get(1, 5);
        this.sprites[ItemID.FireworksWand] = get(1, 6);
        this.sprites[ItemID.GrandFinaleWand] = get(1, 7);

        // ROW 3 (Armor - Santa Suits)
        this.sprites[ItemID.TornSantaSuit] = get(2, 0);
        this.sprites[ItemID.ClassicSantaSuit] = get(2, 1);
        this.sprites[ItemID.LuxurySantaSuit] = get(2, 2);
        this.sprites[ItemID.MagnificentSantaSuit] = get(2, 3);
        this.sprites[ItemID.CozySweater] = get(2, 4);
        this.sprites[ItemID.MeltingIcePlate] = get(2, 5);
        this.sprites[ItemID.ThickIcePlate] = get(2, 6);
        this.sprites[ItemID.EternalIcePlate] = get(2, 7);

        // ROW 4 (Cloaks & Rings)
        this.sprites[ItemID.ElfCloak] = get(3, 0);
        this.sprites[ItemID.MasterElfCloak] = get(3, 1);
        this.sprites[ItemID.ReindeerHideCloak] = get(3, 2);
        this.sprites[ItemID.RingOfFrost] = get(3, 3);
        this.sprites[ItemID.RingOfHaste] = get(3, 4);
        this.sprites[ItemID.RingOfWarmth] = get(3, 5);
        this.sprites[ItemID.RingOfChristmasSpirit] = get(3, 6);
        this.sprites[ItemID.RingOfElvenGrace] = get(3, 7);

        // ROW 5 (Artifacts & Special Items)
        this.sprites[ItemID.SnowGlobe] = get(4, 0);
        this.sprites[ItemID.ReindeerBell] = get(4, 1);
        this.sprites[ItemID.NaughtyList] = get(4, 2);
        this.sprites[ItemID.ChristmasCandle] = get(4, 3);
        this.sprites[ItemID.NewYearsClock] = get(4, 4);
        this.sprites[ItemID.ChampagneFlute] = get(4, 5);
        this.sprites[ItemID.CountdownCalendar] = get(4, 6);
        this.sprites[ItemID.ChristmasWishBone] = get(4, 7);

        // ROW 6 (Consumables - Projectiles)
        this.sprites[ItemID.Snowball] = get(5, 0);
        this.sprites[ItemID.Iceball] = get(5, 1);
        this.sprites[ItemID.YellowSnowball] = get(5, 2);
        this.sprites[ItemID.CoalSnowball] = get(5, 3);
        this.sprites[ItemID.GlassOrnamentGrenade] = get(5, 4);
        this.sprites[ItemID.GoldOrnamentGrenade] = get(5, 5);
        this.sprites[ItemID.HotCocoa] = get(5, 6);
        this.sprites[ItemID.Fruitcake] = get(5, 7);

        // ROW 7 (Scrolls & Potions)
        this.sprites[ItemID.ScrollOfMapping] = get(6, 0);
        this.sprites[ItemID.ScrollOfChristmasSpirit] = get(6, 1);
        this.sprites[ItemID.ScrollOfSnowStorm] = get(6, 2);
        this.sprites[ItemID.ScrollOfSantasBlessing] = get(6, 3);
        this.sprites[ItemID.UnlabeledPotion] = get(6, 4);
        this.sprites[ItemID.StarCookie] = get(6, 5);
        this.sprites[ItemID.LiquidCourage] = get(6, 6);
        this.sprites[ItemID.WrappedGift] = get(6, 7);

        // ROW 8 (Misc & Keys)
        this.sprites[ItemID.Gold] = get(7, 0);
        this.sprites[ItemID.ChristmasKey] = get(7, 1);
        this.sprites[ItemID.SilverKey] = get(7, 2);
        this.sprites[ItemID.GoldKey] = get(7, 3);
        this.sprites[ItemID.BoneKey] = get(7, 4);
        this.sprites[ItemID.WeakSword] = get(7, 5);
        this.sprites[ItemID.MagicStocking] = get(7, 6);
        this.sprites[ItemID.FrozenHeart] = get(7, 7);
        
        console.log(`[ItemRegistry] Total sprites registered: ${Object.keys(this.sprites).length}`);
    }

    public getSprite(id: ItemID): ex.Graphic {
        return this.sprites[id] || new ex.Rectangle({ width: 32, height: 32, color: ex.Color.Magenta });
    }
}
