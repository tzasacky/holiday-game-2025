import * as ex from 'excalibur';
import { Level } from '../dungeon/Level';
import { VisibilityConfig } from '../config/VisibilityConfig';
import { Logger } from '../core/Logger';

/**
 * Fog-of-War Renderer
 * Manages visual overlay for undiscovered and out-of-sight tiles
 */
export class FogOfWarRenderer {
    private fogCanvas: ex.Canvas;
    private dimCanvas: ex.Canvas;
    private level: Level;
    private tileSize: number = 32;
    
    constructor(level: Level, width: number, height: number) {
        this.level = level;
        
        // Create fog canvas (black for undiscovered)
        this.fogCanvas = new ex.Canvas({
            width: width * this.tileSize,
            height: height * this.tileSize,
            cache: true,
            draw: (ctx) => this.drawFog(ctx)
        });
        
        // Create dim canvas (gray for discovered but not visible)
        this.dimCanvas = new ex.Canvas({
            width: width * this.tileSize,
            height: height * this.tileSize,
            cache: true,
            draw: (ctx) => this.drawDim(ctx)
        });
    }
    
    /**
     * Create fog overlay actors for the scene
     */
    public createFogActors(scene: ex.Scene): ex.Actor[] {
        if (!VisibilityConfig.fogOfWarEnabled) return [];
        
        const actors: ex.Actor[] = [];
        
        // Fog layer (black overlay for undiscovered)
        const fogActor = new ex.Actor({
            pos: ex.vec(0, 0),
            anchor: ex.vec(0, 0),
            z: 999  // Very high z-index, above everything
        });
        fogActor.graphics.use(this.fogCanvas);
        actors.push(fogActor);
        
        // Dim layer (gray overlay for discovered but not visible)
        const dimActor = new ex.Actor({
            pos: ex.vec(0, 0),
            anchor: ex.vec(0, 0),
            z: 50  // Above game layer but below UI
        });
        dimActor.graphics.use(this.dimCanvas);
        actors.push(dimActor);
        
        return actors;
    }
    
    /**
     * Update fog based on current visibility
     */
    public update(): void {
        if (!VisibilityConfig.fogOfWarEnabled) return;
        
        // Force redraw by flagging canvases as dirty
        this.fogCanvas.flagDirty();
        this.dimCanvas.flagDirty();
    }
    
    /**
     * Draw black fog for undiscovered tiles
     */
    private drawFog(ctx: CanvasRenderingContext2D): void {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Fill with black
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        
        for (let x = 0; x < this.level.width; x++) {
            for (let y = 0; y < this.level.height; y++) {
                const key = `${x},${y}`;
                
                // If NOT discovered, draw black
                if (!this.level.discoveredTiles.has(key)) {
                    ctx.fillRect(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                }
            }
        }
    }
    
    /**
     * Draw gray dim for discovered but not visible tiles
     */
    private drawDim(ctx: CanvasRenderingContext2D): void {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Semi-transparent gray
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        
        for (let x = 0; x < this.level.width; x++) {
            for (let y = 0; y < this.level.height; y++) {
                const key = `${x},${y}`;
                
                // If discovered but NOT currently visible, draw gray
                if (this.level.discoveredTiles.has(key) && !this.level.visibleTiles.has(key)) {
                    ctx.fillRect(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                }
            }
        }
    }
}
