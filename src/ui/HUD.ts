import * as ex from 'excalibur';
import { Hero } from '../actors/Hero';
import { UITheme } from './UITheme';

export class HUD extends ex.ScreenElement {
    private hero: Hero;
    
    // Visual elements
    private healthBarBg!: ex.Rectangle;
    private healthBarFill!: ex.Rectangle;
    private warmthBarBg!: ex.Rectangle;
    private warmthBarFill!: ex.Rectangle;
    
    // Text elements
    private hpText!: ex.Text;
    private warmthText!: ex.Text;
    private titleFont: ex.Font;
    private statFont: ex.Font;
    
    // Layout constants
    private readonly BAR_WIDTH = 160;
    private readonly BAR_HEIGHT = 20;
    private readonly PADDING = 10;
    private readonly CORNER_RADIUS = 8;

    constructor(hero: Hero) {
        super({ 
            z: UITheme.ZIndex.HUD,
            width: 200,
            height: 100,
            anchor: ex.vec(0, 0)
        });
        this.hero = hero;
        
        // Initialize fonts using theme
        this.titleFont = UITheme.createFont('heading');
        this.statFont = UITheme.createFont('ui');
        
        this.initializeElements();
        
        // Use onPostDraw for custom rendering
        this.graphics.onPostDraw = (ctx: ex.ExcaliburGraphicsContext, delta: number) => {
             this.customDraw(ctx, delta);
        };
    }
    
    private initializeElements() {
        // Health Bar Background
        this.healthBarBg = UITheme.createRectangle(
            this.BAR_WIDTH, 
            this.BAR_HEIGHT, 
            {
                fillColor: UITheme.Colors.panel,
                strokeColor: UITheme.Colors.border,
                strokeWidth: UITheme.Layout.borderWidth.medium
            }
        );
        
        // Health Bar Fill
        this.healthBarFill = new ex.Rectangle({
            width: this.BAR_WIDTH - 4,
            height: this.BAR_HEIGHT - 4,
            color: UITheme.getHealthColor(1.0)
        });
        
        // Warmth Bar Background  
        this.warmthBarBg = UITheme.createRectangle(
            this.BAR_WIDTH, 
            this.BAR_HEIGHT,
            {
                fillColor: UITheme.Colors.panel,
                strokeColor: UITheme.Colors.border,
                strokeWidth: UITheme.Layout.borderWidth.medium
            }
        );
        
        // Warmth Bar Fill
        this.warmthBarFill = new ex.Rectangle({
            width: this.BAR_WIDTH - 4,
            height: this.BAR_HEIGHT - 4,
            color: UITheme.getWarmthColor(1.0)
        });
        
        // Text elements
        this.hpText = new ex.Text({
            text: `${Math.ceil(this.hero.hp)}/${this.hero.maxHp}`,
            font: this.statFont
        });
        
        this.warmthText = new ex.Text({
            text: `${Math.floor(this.hero.warmth)}/${this.hero.maxWarmth}`,
            font: this.statFont
        });
    }
    
    onInitialize(engine: ex.Engine) {
        console.log("[HUD] onInitialize called");
        // Position in top-left with padding
        this.pos = ex.vec(this.PADDING + 10, this.PADDING + 10);
        console.log("[HUD] Position set to:", this.pos);
    }

    onPostUpdate(engine: ex.Engine, elapsed: number) {
        // Update health bar
        const healthPercent = Math.max(0, this.hero.hp / this.hero.maxHp);
        this.healthBarFill.width = (this.BAR_WIDTH - 4) * healthPercent;
        this.healthBarFill.color = UITheme.getHealthColor(healthPercent);
        
        // Update warmth bar
        const warmthPercent = Math.max(0, this.hero.warmth / this.hero.maxWarmth);
        this.warmthBarFill.width = (this.BAR_WIDTH - 4) * warmthPercent;
        this.warmthBarFill.color = UITheme.getWarmthColor(warmthPercent);
        
        // Update text
        this.hpText.text = `${Math.ceil(this.hero.hp)}/${this.hero.maxHp}`;
        this.warmthText.text = `${Math.floor(this.hero.warmth)}/${this.hero.maxWarmth}`;
    }
    
    private customDraw(ctx: ex.ExcaliburGraphicsContext, delta: number) {
        // Debug log once per second
        if (Date.now() % 1000 < 16) {
            console.log("[HUD] customDraw called at", this.pos);
        }
        const x = 0;
        let y = 0;
        
        // Draw background panel
        const panelWidth = this.BAR_WIDTH + 20;
        const panelHeight = 100;
        
        // Semi-transparent background panel
        ctx.drawRectangle(
            ex.vec(x - 10, y - 10), 
            panelWidth, 
            panelHeight,
            UITheme.Colors.background
        );
        
        // Panel border
        ctx.drawRectangle(
            ex.vec(x - 10, y - 10), 
            panelWidth, 
            panelHeight,
            ex.Color.Transparent,
            UITheme.Colors.border,
            UITheme.Layout.borderWidth.thin
        );
        
        // Health section
        const healthLabel = UITheme.createText('❤️ Health', 'heading');
        healthLabel.draw(ctx, x, y);
        
        y += 20;
        
        // Health bar background
        this.healthBarBg.draw(ctx, x, y);
        
        // Health bar fill
        this.healthBarFill.draw(ctx, x + 2, y + 2);
        
        // Health text (centered on bar)
        const hpTextWidth = this.hpText.width || 0;
        this.hpText.draw(ctx, x + (this.BAR_WIDTH - hpTextWidth) / 2, y + 6);
        
        y += 35;
        
        // Warmth section
        const warmthLabel = UITheme.createText('🔥 Warmth', 'heading');
        warmthLabel.draw(ctx, x, y);
        
        y += 20;
        
        // Warmth bar background
        this.warmthBarBg.draw(ctx, x, y);
        
        // Warmth bar fill
        this.warmthBarFill.draw(ctx, x + 2, y + 2);
        
        // Warmth text (centered on bar)
        const warmthTextWidth = this.warmthText.width || 0;
        this.warmthText.draw(ctx, x + (this.BAR_WIDTH - warmthTextWidth) / 2, y + 6);
    }
}
