import * as ex from 'excalibur';
import { Resources } from '../config/resources';

export class SpriteDebugScene extends ex.Scene {
    private currentResourceKey: string = 'SnowyVillageTilesPng';
    private resourceKeys: string[] = [];
    private currentIndex: number = 0;
    private zoom: number = 2;

    onInitialize(engine: ex.Engine): void {
        // Filter keys for ImageSource
        this.resourceKeys = Object.keys(Resources).filter(k => (Resources as any)[k] instanceof ex.ImageSource);
        this.currentIndex = this.resourceKeys.indexOf(this.currentResourceKey);
        if (this.currentIndex === -1) this.currentIndex = 0;

        this.drawInspector();
    }

    private nextResource() {
        this.currentIndex = (this.currentIndex + 1) % this.resourceKeys.length;
        this.currentResourceKey = this.resourceKeys[this.currentIndex];
        this.drawInspector();
    }

    private prevResource() {
        this.currentIndex = (this.currentIndex - 1 + this.resourceKeys.length) % this.resourceKeys.length;
        this.currentResourceKey = this.resourceKeys[this.currentIndex];
        this.drawInspector();
    }

    private drawInspector() {
        this.clear();

        // 1. Header / Controls Info
        const header = new ex.Label({
            text: `Sprite Inspector: ${this.currentResourceKey} (Zoom: ${this.zoom}x)`,
            pos: ex.vec(10, 10),
            color: ex.Color.White,
            font: new ex.Font({ size: 20, family: 'monospace' })
        });
        this.add(header);

        // Navigation Buttons
        const prevBtn = new ex.Label({
            text: "< Prev",
            pos: ex.vec(600, 10),
            color: ex.Color.Yellow,
            font: new ex.Font({ size: 20, family: 'monospace' })
        });
        const nextBtn = new ex.Label({
            text: "Next >",
            pos: ex.vec(700, 10),
            color: ex.Color.Yellow,
            font: new ex.Font({ size: 20, family: 'monospace' })
        });

        // Make interactive
        // We need an actor wrapper for click events on labels usually, or just use Actor with text
        // But Label is an Actor.
        // Let's use a simple helper to make them clickable
        const makeClickable = (label: ex.Label, callback: () => void) => {
             // Create a hit area actor behind it because Label bounds can be tricky
             const btn = new ex.Actor({
                 pos: label.pos.add(ex.vec(0, 10)),
                 width: 80,
                 height: 30,
                 color: ex.Color.Transparent,
                 anchor: ex.vec(0, 0.5)
             });
             btn.on('pointerup', callback);
             this.add(btn);
             this.add(label);
        };

        makeClickable(prevBtn, () => this.prevResource());
        makeClickable(nextBtn, () => this.nextResource());

        // 2. Load Resource
        const resource = (Resources as any)[this.currentResourceKey];
        if (!resource || !(resource instanceof ex.ImageSource)) {
            const err = new ex.Label({ text: "Invalid Resource", pos: ex.vec(10, 40), color: ex.Color.Red });
            this.add(err);
            return;
        }

        const image = resource.image;
        const width = image.width;
        const height = image.height;
        const tileSize = 32; // Default assumption, could be configurable
        
        // 3. Draw Image Scaled
        const actor = new ex.Actor({
            pos: ex.vec(10, 50),
            anchor: ex.Vector.Zero,
            scale: ex.vec(this.zoom, this.zoom)
        });
        actor.graphics.use(resource.toSprite());
        this.add(actor);

        // 4. Draw Grid Overlay
        const cols = Math.floor(width / tileSize);
        const rows = Math.floor(height / tileSize);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = 10 + c * tileSize * this.zoom;
                const y = 50 + r * tileSize * this.zoom;
                
                // Draw Grid Lines
                const gridBox = new ex.Actor({
                    pos: ex.vec(x, y),
                    anchor: ex.Vector.Zero,
                    width: tileSize * this.zoom,
                    height: tileSize * this.zoom
                });
                // Using a transparent rect with stroke if possible, or lines
                // Excalibur's Rectangle doesn't support stroke easily in all versions. 
                // Let's use Canvas drawing for the grid to be efficient.
                
                // Label
                const label = new ex.Label({
                    text: `${c},${r}`,
                    pos: ex.vec(x + 2, y + 2),
                    color: ex.Color.Yellow,
                    font: new ex.Font({ size: 10, family: 'monospace', shadow: { blur: 2, offset: ex.vec(1,1), color: ex.Color.Black } })
                });
                this.add(label);
            }
        }

        // 5. Canvas based grid drawer (cleaner than actors)
        const gridDrawer = new ex.Actor({
            pos: ex.vec(10, 50),
            anchor: ex.Vector.Zero,
            width: width * this.zoom,
            height: height * this.zoom,
            z: 99
        });
        
        gridDrawer.graphics.onPostDraw = (ctx) => {
            const color = ex.Color.Red.clone();
            color.a = 0.5;
            
            // Draw vertical lines
            for (let c = 0; c <= cols; c++) {
                const x = c * tileSize * this.zoom;
                ctx.drawLine(ex.vec(x, 0), ex.vec(x, height * this.zoom), color, 1);
            }

            // Draw horizontal lines
            for (let r = 0; r <= rows; r++) {
                const y = r * tileSize * this.zoom;
                ctx.drawLine(ex.vec(0, y), ex.vec(width * this.zoom, y), color, 1);
            }
        };
        this.add(gridDrawer);
    }
}
