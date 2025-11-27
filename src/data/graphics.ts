import * as ex from 'excalibur';
import { Resources } from '../config/resources';
import { AppConfig } from '../main';
import { ActorDefinitions } from './actors';
import { ItemDefinitions } from './items';
import { ItemID } from '../constants/ItemIDs';
import { Logger } from '../core/Logger';

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
            this.itemSpriteSheets.set(resource, ex.SpriteSheet.fromImageSource({
                image: resource,
                grid: {
                    rows: 8,
                    columns: 8,
                    spriteWidth: 32,
                    spriteHeight: 32
                }
            }));
        }
        return this.itemSpriteSheets.get(resource)!;
    }
    
    
    public getItemSprite(itemId: string): ex.Graphic {
        console.log(`[GraphicsManager] getItemSprite called for: ${itemId}`);
        
        const definition = ItemDefinitions[itemId as ItemID];
        if (!definition) {
            console.error(`[GraphicsManager] ❌ No definition for item: ${itemId}`);
            Logger.warn(`[GraphicsManager] No definition for item: ${itemId}`);
            return new ex.Rectangle({ width: 32, height: 32, color: ex.Color.Magenta });
        }
        
        console.log(`[GraphicsManager] ✓ Found definition for ${definition.name}`);
        const { spriteIndex, resource } = definition.graphics;
        console.log(`[GraphicsManager]   - spriteIndex: ${spriteIndex}`);
        console.log(`[GraphicsManager]   - resource: ${resource?.path || 'undefined'}`);
        console.log(`[GraphicsManager]   - resource.isLoaded(): ${resource?.isLoaded() || 'N/A'}`);
        
        if (resource && spriteIndex !== undefined) {
            if (!resource.isLoaded()) {
                console.error(`[GraphicsManager] ❌ Resource NOT loaded: ${resource.path}`);
                console.error(`[GraphicsManager]   Resource state:`, {
                    path: resource.path,
                    isLoaded: resource.isLoaded(),
                    data: resource.data ? 'exists' : 'null'
                });
                return new ex.Rectangle({ width: 32, height: 32, color: ex.Color.Red });
            }
            
            console.log(`[GraphicsManager] ✓ Resource loaded, creating sprite sheet`);
            const sheet = this.getItemSpriteSheet(resource);
            const col = spriteIndex % 8;
            const row = Math.floor(spriteIndex / 8);
            console.log(`[GraphicsManager]   - Grid position: (${col}, ${row})`);
            
            const sprite = sheet.getSprite(col, row);
            
            if (sprite) {
                console.log(`[GraphicsManager] ✓ Sprite retrieved successfully for ${definition.name}`);
                return sprite;
            }
            
            console.error(`[GraphicsManager] ❌ Sprite not found at (${col}, ${row}) for ${itemId}`);
            console.error(`[GraphicsManager]   Sprite sheet info:`, {
                columns: sheet.columns,
                rows: sheet.rows,
                totalSprites: sheet.sprites.length
            });
            Logger.warn(`[GraphicsManager] Sprite not found for item ${itemId} at index ${spriteIndex}`);
        } else {
            console.error(`[GraphicsManager] ❌ Missing graphics config:`, {
                hasResource: !!resource,
                spriteIndex: spriteIndex
            });
        }
        
        // Fallback
        console.warn(`[GraphicsManager] ⚠ Returning fallback graphic for ${itemId}`);
        return new ex.Rectangle({ width: 32, height: 32, color: ex.Color.Magenta });
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