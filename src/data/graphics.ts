import * as ex from 'excalibur';
import { Resources } from '../config/resources';
import { AppConfig } from '../main';
import { ActorDefinitions } from './actors';
import { ItemDefinitions } from './items';

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
        console.log(`[GraphicsManager] configureActor called for: ${actor.name}`);
        
        // Check if we should use fallback rendering
        if (AppConfig.UseFallbackRendering) {
            this.addFallbackActorGraphics(actor);
            return;
        }
        
        const definition = ActorDefinitions[actor.name];
        if (!definition) {
            console.warn(`[GraphicsManager] No definition for ${actor.name}, using fallback`);
            this.addFallbackActorGraphics(actor);
            return;
        }
        
        const config = definition.graphics;
        try {
            const spriteSheet = ex.SpriteSheet.fromImageSource({
                image: config.resource,
                grid: config.grid
            });
            
            console.log(`[GraphicsManager] SpriteSheet created for ${actor.name}, sprite count: ${spriteSheet.sprites.length}`);
            
            if (spriteSheet.sprites.length === 0) {
                console.warn(`[GraphicsManager] No sprites in sheet for ${actor.name}`);
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
            console.error(`[GraphicsManager] Error configuring ${actor.name}:`, error);
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
            'Merchant': ex.Color.Yellow
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
    private itemSpriteSheet: ex.SpriteSheet;
    private itemSprites: Map<string, ex.Graphic> = new Map();
    
    private initializeItemGraphics(): void {
        if (this.itemSpriteSheet) return; // Already initialized
        
        this.itemSpriteSheet = ex.SpriteSheet.fromImageSource({
            image: Resources.ItemsPng,
            grid: {
                rows: 8,
                columns: 8,
                spriteWidth: 32,
                spriteHeight: 32
            }
        });
        
        // Register sprites from data definitions
        Object.values(ItemDefinitions).forEach(item => {
            if (item.graphics.spriteIndex !== undefined) {
                const col = item.graphics.spriteIndex % 8;
                const row = Math.floor(item.graphics.spriteIndex / 8);
                const sprite = this.itemSpriteSheet.getSprite(col, row);
                if (sprite) {
                    this.itemSprites.set(item.id, sprite);
                }
            }
        });
        
        console.log(`[GraphicsManager] Item sprites registered: ${this.itemSprites.size}`);
    }
    
    public getItemSprite(itemId: string): ex.Graphic {
        this.initializeItemGraphics();
        
        const sprite = this.itemSprites.get(itemId);
        if (sprite) return sprite;
        
        // Fallback
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