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
        const x = 0;
        let y = 0;
        
        // LAYER 1: Background panel (drawn FIRST, behind everything)
        const panelWidth = this.BAR_WIDTH + 20;
        const panelHeight = 100;
        ctx.drawRectangle(
            ex.vec(x - 10, y - 10),
            panelWidth,
            panelHeight,
            UITheme.Colors.background,
            UITheme.Colors.border,
            UITheme.Layout.borderWidth.thin
        );
        
        // LAYER 2: Health section
        const healthLabel = UITheme.createText('❤️ Health', 'heading');
        healthLabel.draw(ctx, x, y);
        y += 20;
        
        // Health bar background
        ctx.drawRectangle(
            ex.vec(x, y),
            this.BAR_WIDTH,
            this.BAR_HEIGHT,
            UITheme.Colors.panel,
            UITheme.Colors.border,
            UITheme.Layout.borderWidth.medium
        );
        
        // Health bar fill (on top of background)
        const healthPercent = Math.max(0, this.hero.hp / this.hero.maxHp);
        const healthFillWidth = (this.BAR_WIDTH - 4) * healthPercent;
        ctx.drawRectangle(
            ex.vec(x + 2, y + 2),
            healthFillWidth,
            this.BAR_HEIGHT - 4,
            UITheme.getHealthColor(healthPercent)
        );
        
        // Health text (on top of bars)
        this.hpText.text = `${Math.ceil(this.hero.hp)}/${this.hero.maxHp}`;
        const hpTextWidth = this.hpText.width || 0;
        this.hpText.draw(ctx, x + (this.BAR_WIDTH - hpTextWidth) / 2, y + 6);
        
        y += 35;
        
        // LAYER 3: Warmth section  
        const warmthLabel = UITheme.createText('🔥 Warmth', 'heading');
        warmthLabel.draw(ctx, x, y);
        y += 20;
        
        // Warmth bar background
        ctx.drawRectangle(
            ex.vec(x, y),
            this.BAR_WIDTH,
            this.BAR_HEIGHT,
            UITheme.Colors.panel,
            UITheme.Colors.border,
            UITheme.Layout.borderWidth.medium
        );
        
        // Warmth bar fill (on top of background)
        const warmthPercent = Math.max(0, this.hero.warmth / this.hero.maxWarmth);
        const warmthFillWidth = (this.BAR_WIDTH - 4) * warmthPercent;
        ctx.drawRectangle(
            ex.vec(x + 2, y + 2),
            warmthFillWidth,
            this.BAR_HEIGHT - 4,
            UITheme.getWarmthColor(warmthPercent)
        );
        
        // Warmth text (on top of bars)
        this.warmthText.text = `${Math.floor(this.hero.warmth)}/${this.hero.maxWarmth}`;
        const warmthTextWidth = this.warmthText.width || 0;
        this.warmthText.draw(ctx, x + (this.BAR_WIDTH - warmthTextWidth) / 2, y + 6);
    }
}
