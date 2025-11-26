import * as ex from 'excalibur';
import { Resources } from './resources';
import { AppConfig } from '../main';

export interface ActorAnimationConfig {
    name: string;
    frames: number[];
    duration: number;
}

export interface ActorGraphicsConfig {
    resource: ex.ImageSource;
    grid: {
        spriteWidth: number;
        spriteHeight: number;
        rows: number;
        columns: number;
    };
    animations: ActorAnimationConfig[];
    defaultAnimation: string;
}

export class ActorRegistry {
    private static instance: ActorRegistry;
    private configs: Map<string, ActorGraphicsConfig> = new Map();

    private constructor() {
        this.initializeConfigs();
    }

    public static getInstance(): ActorRegistry {
        if (!ActorRegistry.instance) {
            ActorRegistry.instance = new ActorRegistry();
        }
        return ActorRegistry.instance;
    }

    private initializeConfigs() {
        // Hero Configuration
        this.configs.set('Hero', this.createStandardConfig(Resources.HeroSpriteSheetPng));

        // Snowman Configuration
        this.configs.set('Snowman', this.createStandardConfig(Resources.SnowmanPng));

        // Krampus Configuration
        this.configs.set('Krampus', this.createStandardConfig(Resources.KrampusPng));

        // Snow Sprite Configuration
        this.configs.set('Snow Sprite', this.createStandardConfig(Resources.SnowSpritePng));
    }

    private createStandardConfig(resource: ex.ImageSource, defaultAnim: string = 'idle-down'): ActorGraphicsConfig {
        return {
            resource: resource,
            grid: { spriteWidth: 32, spriteHeight: 32, rows: 5, columns: 8 },
            animations: [
                // Idle
                { name: 'idle-down', frames: [0, 1], duration: 400 },
                { name: 'idle-left', frames: [2, 3], duration: 400 },
                { name: 'idle-right', frames: [4, 5], duration: 400 },
                { name: 'idle-up', frames: [6, 7], duration: 400 },
                // Walk
                { name: 'down-walk', frames: [8, 9], duration: 200 },
                { name: 'left-walk', frames: [10, 11], duration: 200 },
                { name: 'right-walk', frames: [12, 13], duration: 200 },
                { name: 'up-walk', frames: [14, 15], duration: 200 },
                // Attack
                { name: 'attack-down', frames: [16, 17], duration: 200 },
                { name: 'attack-left', frames: [18, 19], duration: 200 },
                { name: 'attack-right', frames: [20, 21], duration: 200 },
                { name: 'attack-up', frames: [22, 23], duration: 200 },
                // Hurt
                { name: 'hurt-down', frames: [24, 25], duration: 200 },
                { name: 'hurt-left', frames: [26, 27], duration: 200 },
                { name: 'hurt-right', frames: [28, 29], duration: 200 },
                { name: 'hurt-up', frames: [30, 31], duration: 200 },
                // Death
                { name: 'death', frames: [32, 33, 34, 35], duration: 200 },
            ],
            defaultAnimation: defaultAnim
        };
    }

    public configureActor(actor: ex.Actor) {
        console.log(`[ActorRegistry] Configuring actor: ${actor.name}`);
        
        // Check if we should use fallback rendering
        if (AppConfig.UseFallbackRendering) {
            console.log(`[ActorRegistry] Using fallback rendering for ${actor.name}`);
            this.addFallbackGraphics(actor);
            return;
        }
        
        const config = this.configs.get(actor.name);
        if (!config) {
            console.warn(`No configuration found for actor: ${actor.name}, using fallback`);
            this.addFallbackGraphics(actor);
            return;
        }
        console.log(`[ActorRegistry] Found config for ${actor.name}, setting up animations`);
        console.log(`[ActorRegistry] Resource loaded:`, config.resource.isLoaded());
        console.log(`[ActorRegistry] Resource data:`, config.resource.data ? 'has data' : 'no data');
        console.log(`[ActorRegistry] Grid config:`, config.grid);
        
        try {
            const spriteSheet = ex.SpriteSheet.fromImageSource({
                image: config.resource,
                grid: config.grid
            });
            console.log(`[ActorRegistry] SpriteSheet created successfully for ${actor.name}`);
            console.log(`[ActorRegistry] SpriteSheet sprite count:`, spriteSheet.sprites.length);
            
            if (spriteSheet.sprites.length === 0) {
                console.warn(`[ActorRegistry] SpriteSheet has no sprites for ${actor.name}!`);
                this.addFallbackGraphics(actor);
                return;
            }

            config.animations.forEach((animConfig, index) => {
                console.log(`[ActorRegistry] Creating animation ${index}: ${animConfig.name} with frames:`, animConfig.frames);
                try {
                    const animation = ex.Animation.fromSpriteSheet(
                        spriteSheet,
                        animConfig.frames,
                        animConfig.duration
                    );
                    console.log(`[ActorRegistry] Animation ${animConfig.name} created successfully`);
                    actor.graphics.add(animConfig.name, animation);
                    console.log(`[ActorRegistry] Animation ${animConfig.name} added to actor`);
                } catch (animError) {
                    console.error(`[ActorRegistry] Failed to create animation ${animConfig.name}:`, animError);
                }
            });

            console.log(`[ActorRegistry] Setting default animation: ${config.defaultAnimation}`);
            actor.graphics.use(config.defaultAnimation);
            console.log(`[ActorRegistry] Actor ${actor.name} graphics setup complete`);
        } catch (error) {
            console.error(`[ActorRegistry] Failed to create sprite sheet for ${actor.name}:`, error);
            this.addFallbackGraphics(actor);
        }
    }

    private addFallbackGraphics(actor: ex.Actor) {
        // Create a colored rectangle with a text label
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
        
        console.log(`[ActorRegistry] Added fallback graphics for ${actor.name} with color ${color} and label '${label}'`);
        console.log(`[ActorRegistry] Group members count:`, group.members.length);
        console.log(`[ActorRegistry] Rectangle dimensions:`, rect.width, 'x', rect.height);
        console.log(`[ActorRegistry] Text content:`, text.text);
    }

    public getSprite(name: string): ex.Graphic {
        // Fallback for UI or static usage
        const config = this.configs.get(name);
        if (config) {
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
}
