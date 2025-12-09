import * as ex from 'excalibur';
import { Resources } from '../config/resources';
import { AppConfig } from '../main';
import { Logger } from '../core/Logger';
import { DecorID } from '../constants/DecorIDs';
import { ActorDefinitions } from './actors';
import { ItemDefinitions } from './items';
import { ItemID } from '../constants/ItemIDs';
import { DecorDefinitions, DecorSheet } from './decor';
import { GraphicType } from '../constants/GraphicType';

// Unified graphics management system
export class GraphicsManager {
    private static _instance: GraphicsManager;
    
    public static get instance(): GraphicsManager {
        if (!this._instance) {
            this._instance = new GraphicsManager();
        }
        return this._instance;
    }
    
    // Actor graphics configuration
    public configureActor(actor: ex.Actor): void {
        Logger.debug(`[GraphicsManager] configureActor called for: ${actor.name}`);
        
        // Check if we should use fallback rendering
        if (AppConfig.UseFallbackRendering) {
            this.addFallbackActorGraphics(actor);
            return;
        }
        
        const definition = ActorDefinitions[actor.name];
        if (!definition) {
            Logger.warn(`[GraphicsManager] No definition for ${actor.name}, using fallback`);
            this.addFallbackActorGraphics(actor);
            return;
        }
        
        const config = definition.graphics;
        try {
            const spriteSheet = ex.SpriteSheet.fromImageSource({
                image: config.resource,
                grid: config.grid
            });
            
            Logger.debug(`[GraphicsManager] SpriteSheet created for ${actor.name}, sprite count: ${spriteSheet.sprites.length}`);
            
            if (spriteSheet.sprites.length === 0) {
                Logger.warn(`[GraphicsManager] No sprites in sheet for ${actor.name}`);
                this.addFallbackActorGraphics(actor);
                return;
            }

            config.animations.forEach((animConfig) => {
                const animation = ex.Animation.fromSpriteSheet(
                    spriteSheet,
                    animConfig.frames,
                    animConfig.duration
                );
                actor.graphics.add(animConfig.name, animation);
            });
            actor.graphics.use(config.defaultAnimation);
            
            // Ensure visibility
            actor.graphics.isVisible = true;
            actor.graphics.opacity = 1.0;
            
        } catch (error) {
            Logger.error(`[GraphicsManager] Error configuring ${actor.name}:`, error);
            this.addFallbackActorGraphics(actor);
        }
    }
    
    private addFallbackActorGraphics(actor: ex.Actor): void {
        const colors: { [key: string]: ex.Color } = {
            'Hero': ex.Color.Blue,
            'Snowman': ex.Color.White,
            'Krampus': ex.Color.Red,
            'Snow Sprite': ex.Color.Cyan,
            'Elite Snow Sprite': ex.Color.Chartreuse,
        };
        
        const color = colors[actor.name] || ex.Color.Gray;
        const label = actor.name.charAt(0).toUpperCase() || '?';
        
        // Background rectangle
        const rect = new ex.Rectangle({
            width: 28,
            height: 28,
            color: color
        });
        
        // Text label
        const text = new ex.Text({
            text: label,
            color: ex.Color.Black,
            font: new ex.Font({
                size: 16,
                bold: true
            })
        });
        
        // Combine graphics
        const group = new ex.GraphicsGroup({
            members: [
                { graphic: rect, offset: ex.vec(0, 0) },
                { graphic: text, offset: ex.vec(0, 0) }
            ]
        });
        
        actor.graphics.add('default', group);
        actor.graphics.use('default');
        
        // Ensure visibility
        actor.graphics.isVisible = true;
        actor.graphics.opacity = 1.0;
    }
    
    public getActorSprite(name: string): ex.Graphic {
        const definition = ActorDefinitions[name];
        if (definition) {
            const config = definition.graphics;
            const spriteSheet = ex.SpriteSheet.fromImageSource({
                image: config.resource,
                grid: config.grid
            });
            // Return first frame of default animation or first frame of sheet
            const defaultAnim = config.animations.find(a => a.name === config.defaultAnimation);
            const frameIndex = defaultAnim ? defaultAnim.frames[0] : 0;
            return spriteSheet.getSprite(frameIndex, 0) || new ex.Rectangle({ width: 32, height: 32, color: ex.Color.Red });
        }
        return new ex.Rectangle({ width: 32, height: 32, color: ex.Color.Red });
    }
    
    // Item graphics system
    private itemSpriteSheets: Map<ex.ImageSource, ex.SpriteSheet> = new Map();
    
    private getItemSpriteSheet(resource: ex.ImageSource): ex.SpriteSheet {
        if (!this.itemSpriteSheets.has(resource)) {
            const cols = 8; // Items are always 8 columns
            const rows = Math.floor(resource.height / 32);
            
            this.itemSpriteSheets.set(resource, ex.SpriteSheet.fromImageSource({
                image: resource,
                grid: {
                    rows: rows,
                    columns: cols,
                    spriteWidth: 32,
                    spriteHeight: 32
                }
            }));
        }
        return this.itemSpriteSheets.get(resource)!;
    }
    
    
    public getItemSprite(itemId: string): ex.Graphic {
        const definition = ItemDefinitions[itemId as ItemID];
        if (!definition) {
            Logger.warn(`[GraphicsManager] No definition for item: ${itemId}`);
            return new ex.Rectangle({ width: 32, height: 32, color: ex.Color.Magenta });
        }
        
            const { col, row, resource } = definition.graphics;
        
        if (resource) {
            if (!resource.isLoaded()) {
                Logger.error(`[GraphicsManager] Resource NOT loaded: ${resource.path}`);
                return new ex.Rectangle({ width: 32, height: 32, color: ex.Color.Red });
            }
            
            const sheet = this.getItemSpriteSheet(resource);
            
            // Default to 0,0 if missing (shouldn't happen with strict typing)
            const spriteCol = col ?? 0;
            const spriteRow = row ?? 0;
            
            const sprite = sheet.getSprite(spriteCol, spriteRow);
            
            if (sprite) {
                return sprite;
            }
            
            Logger.warn(`[GraphicsManager] Sprite not found for item ${itemId} at ${spriteCol},${spriteRow}`);
        } else {
            Logger.warn(`[GraphicsManager] Missing graphics config for ${itemId}`);
        }
        
        // Fallback
        return new ex.Rectangle({ width: 32, height: 32, color: ex.Color.Magenta });
    }



    // Large Object (9-Slice) Graphics System
    public getNineSliceSprite(type: string, width: number, height: number): ex.Graphic {
        const def = DecorDefinitions[type];
        if (!def || def.type !== GraphicType.NineSlice) {
            Logger.warn(`[GraphicsManager] Unknown or invalid large object type: ${type}`);
            return new ex.Rectangle({ width, height, color: ex.Color.Magenta });
        }

        const resource = Resources.LargeObjectsPng;
        if (!resource.isLoaded()) {
            return new ex.Rectangle({ width, height, color: ex.Color.Red });
        }

        // Create a sprite sheet for the 32x32 tiles
        // Total image is 480x288 (15x9 tiles)
        const sheet = ex.SpriteSheet.fromImageSource({
            image: resource,
            grid: {
                rows: 9,    // 3 rows * 3 sub-rows
                columns: 15, // 5 cols * 3 sub-cols
                spriteWidth: 32,
                spriteHeight: 32
            }
        });

        // Calculate base tile indices for this object
        // Each object is 3x3 tiles, starting at col*3, row*3
        const startCol = def.col * 3;
        const startRow = def.row * 3;

        // Get the 9 sprites
        const tl = sheet.getSprite(startCol, startRow)!;
        const t  = sheet.getSprite(startCol + 1, startRow)!;
        const tr = sheet.getSprite(startCol + 2, startRow)!;
        const l  = sheet.getSprite(startCol, startRow + 1)!;
        const c  = sheet.getSprite(startCol + 1, startRow + 1)!;
        const r  = sheet.getSprite(startCol + 2, startRow + 1)!;
        const bl = sheet.getSprite(startCol, startRow + 2)!;
        const b  = sheet.getSprite(startCol + 1, startRow + 2)!;
        const br = sheet.getSprite(startCol + 2, startRow + 2)!;

        const members: { graphic: ex.Graphic, offset: ex.Vector }[] = [];

        // Helper to add sprite at pos
        const add = (graphic: ex.Graphic, x: number, y: number) => {
            members.push({ graphic, offset: ex.vec(x, y) });
        };

        const tileSize = 32;
        
        // 1. Corners
        add(tl, 0, 0);
        add(tr, width - tileSize, 0);
        add(bl, 0, height - tileSize);
        add(br, width - tileSize, height - tileSize);

        // 2. Top & Bottom Edges (Tile horizontally)
        // Start from tileSize, go up to width - tileSize
        for (let x = tileSize; x < width - tileSize; x += tileSize) {
            add(t, x, 0);
            add(b, x, height - tileSize);
        }

        // 3. Left & Right Edges (Tile vertically)
        for (let y = tileSize; y < height - tileSize; y += tileSize) {
            add(l, 0, y);
            add(r, width - tileSize, y);
        }

        // 4. Center (Tile both)
        for (let x = tileSize; x < width - tileSize; x += tileSize) {
            for (let y = tileSize; y < height - tileSize; y += tileSize) {
                add(c, x, y);
            }
        }

        return new ex.GraphicsGroup({
            members: members
        });
    }

    public getSmallDecorSprite(id: string): ex.Graphic {
        const def = DecorDefinitions[id];
        if (!def) {
            Logger.warn(`[GraphicsManager] Unknown small decor: ${id}`);
            return new ex.Rectangle({ width: 32, height: 32, color: ex.Color.Magenta });
        }

        let resource: ex.ImageSource;
        switch (def.sheet) {
            case DecorSheet.SnowyVillage:
                resource = Resources.SnowyVillageDecorPng;
                break;
            case DecorSheet.Common:
                resource = Resources.CommonDecorPng;
                break;
            default:
                Logger.warn(`[GraphicsManager] Unknown sheet for decor: ${id}`);
                return new ex.Rectangle({ width: 32, height: 32, color: ex.Color.Magenta });
        }
        
        // Handle Animations
        if (def.type === GraphicType.Animation && def.animation) {
            const sheet = ex.SpriteSheet.fromImageSource({
                image: resource,
                grid: {
                    rows: 8, // Assuming 8x8 grid for decor sheets
                    columns: 8,
                    spriteWidth: 32,
                    spriteHeight: 32
                }
            });

            // Create animation frames
            // Assuming animation frames are horizontal starting from col,row
            const frames: ex.Frame[] = [];
            for (let i = 0; i < def.animation.frameCount; i++) {
                const col = def.col + i;
                if (col < 8) { // Boundary check
                    frames.push({
                        graphic: sheet.getSprite(col, def.row)!,
                        duration: def.animation.duration
                    });
                }
            }

            if (frames.length > 0) {
                return new ex.Animation({
                    frames: frames
                });
            }
        }

        // Create static sprite
        const sprite = new ex.Sprite({
            image: resource,
            sourceView: {
                x: def.col * 32,
                y: def.row * 32,
                width: 32,
                height: 32
            }
        });

        return sprite;
    }
}

// Export for backward compatibility with existing systems
export const ActorRegistry = {
    getInstance: () => GraphicsManager.instance,
    configureActor: (actor: ex.Actor) => GraphicsManager.instance.configureActor(actor),
    getSprite: (name: string) => GraphicsManager.instance.getActorSprite(name)
};

export const ItemRegistry = {
    getInstance: () => GraphicsManager.instance,
    getSprite: (itemId: string) => GraphicsManager.instance.getItemSprite(itemId)
};