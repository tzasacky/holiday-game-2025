import { ItemID } from '../constants/ItemIDs';

export abstract class Item {
    public stackable: boolean = false;
    public maxStack: number = 1;
    public count: number = 1;

    constructor(
        public id: ItemID,
        public name: string,
        public description: string
    ) {}

    // Rarity / Flavor flags
    public rare: boolean = false;
    public holy: boolean = false;
    public legendary: boolean = false;
    public uncommon: boolean = false;
    public unique: boolean = false;
    public cursed: boolean = false;
    public identified: boolean = false;
    
    // Special flags
    public revivesOnDeath: boolean = false;
    public oncePerSeason: boolean = false;
    public unremovableWhenCursed: boolean = false;

    abstract use(actor: any): boolean;

    getDisplayName(): string {
        return this.name;
    }

    getSprite(): any { // Return type ex.Graphic
        const { GraphicsManager } = require('../data/graphics');
        return GraphicsManager.instance.getItemSprite(this.id);
    }
}
