import * as ex from 'excalibur';
import { UITheme } from './UITheme';

export enum LogCategory {
    Combat = 'Combat',
    Items = 'Items', 
    Effects = 'Effects',
    Interactions = 'Interactions',
    Movement = 'Movement',
    System = 'System'
}

export interface LogEntry {
    id: string;
    message: string;
    category: LogCategory;
    timestamp: Date;
    color?: ex.Color;
}

export class GameJournal extends ex.ScreenElement {
    private engine!: ex.Engine;
    private entries: LogEntry[] = [];
    private filteredEntries: LogEntry[] = [];
    private activeFilters: Set<LogCategory> = new Set(Object.values(LogCategory));
    
    // UI State
    private isCollapsed: boolean = false;
    private isManualScrollLocked: boolean = false;
    private scrollOffset: number = 0;
    private maxScrollOffset: number = 0;
    
    // Layout Constants
    private readonly COLLAPSED_HEIGHT = 30;
    private readonly EXPANDED_HEIGHT = 200;
    private readonly WIDTH = 400;
    private readonly MAX_ENTRIES = 100;
    private readonly ENTRY_HEIGHT = 16;
    private readonly PADDING = UITheme.Layout.padding.medium;
    
    // Visual Elements
    private background!: ex.Rectangle;
    private headerBackground!: ex.Rectangle;
    private scrollbar!: ex.Rectangle;
    private scrollThumb!: ex.Rectangle;
    
    // Text Elements
    private titleText!: ex.Text;
    private toggleButton!: ex.Text;
    private filterButtons: Map<LogCategory, ex.Text> = new Map();
    
    // Fonts
    private titleFont: ex.Font;
    private entryFont: ex.Font;
    private filterFont: ex.Font;
    
    constructor() {
        super({ 
            z: 95,
            width: 400,
            height: 200,
            anchor: ex.vec(0, 0)
        }); // Below inventory, above HUD
        
        this.titleFont = UITheme.createFont('heading');
        this.entryFont = UITheme.createFont('small');
        this.filterFont = UITheme.createFont('small');
        
        this.initializeElements();
        
        // Use onPostDraw for custom rendering
        this.graphics.onPostDraw = (ctx: ex.ExcaliburGraphicsContext, delta: number) => {
             this.customDraw(ctx, delta);
        };
    }
    
    private initializeElements() {
        // Main background
        this.background = UITheme.createRectangle(
            this.WIDTH, 
            this.getHeight(),
            {
                fillColor: UITheme.Colors.background,
                strokeColor: UITheme.Colors.border,
                strokeWidth: UITheme.Layout.borderWidth.medium
            }
        );
        
        // Header background
        this.headerBackground = UITheme.createRectangle(
            this.WIDTH,
            this.COLLAPSED_HEIGHT,
            {
                fillColor: UITheme.Colors.panel,
                strokeColor: UITheme.Colors.borderLight
            }
        );
        
        // Title and toggle
        this.titleText = UITheme.createText('📜 Game Journal', 'heading');
        this.toggleButton = UITheme.createText(this.isCollapsed ? '+' : '−', 'heading');
        
        // Filter buttons
        Object.values(LogCategory).forEach(category => {
            const button = UITheme.createText(category, 'small', UITheme.Colors.textSecondary);
            this.filterButtons.set(category, button);
        });
        
        // Scrollbar elements
        this.scrollbar = new ex.Rectangle({
            width: 8,
            height: this.EXPANDED_HEIGHT - 60,
            color: UITheme.Colors.panelLight
        });
        
        this.scrollThumb = new ex.Rectangle({
            width: 6,
            height: 20,
            color: UITheme.Colors.border
        });
    }
    
    onInitialize(engine: ex.Engine) {
        this.engine = engine;
        // Position in bottom-right corner
        this.updatePosition();
        
        console.log("[GameJournal] Position set to:", this.pos);
        
        // Mouse wheel scrolling
        engine.input.pointers.primary.on('wheel', (evt) => {
            if (this.isPointInBounds(engine.input.pointers.primary.lastScreenPos) && !this.isCollapsed) {
                this.handleScroll(evt.deltaY);
                evt.cancel();
            }
        });
        
        // Click handling
        engine.input.pointers.primary.on('down', (evt) => {
            if (this.isPointInBounds(evt.screenPos)) {
                this.handleClick(evt.screenPos);
                evt.cancel();
            }
        });
    }
    
    private updatePosition() {
        if (!this.engine) return;
        
        // ScreenElements use viewport (CSS pixel) coordinates
        const viewportWidth = this.engine.screen.viewport.width;
        const viewportHeight = this.engine.screen.viewport.height;
        
        const currentHeight = this.getHeight();
        const xPos = viewportWidth - this.WIDTH - UITheme.Layout.padding.large;
        const yPos = viewportHeight - currentHeight - UITheme.Layout.padding.large;
        
        // Clamp to screen bounds to prevent bleeding off edges
        const x = Math.max(0, Math.min(xPos, viewportWidth - this.WIDTH));
        const y = Math.max(0, Math.min(yPos, viewportHeight - currentHeight));
        
        // Debug log once per second
        if (Date.now() % 1000 < 16) {
            console.log(`[GameJournal] Positioning: viewport=${viewportWidth}x${viewportHeight}, WIDTH=${this.WIDTH}, currentHeight=${currentHeight}, pos=(${x}, ${y})`);
        }
        
        this.pos = ex.vec(x, y);
    }
    
    private isPointInBounds(screenPos: ex.Vector): boolean {
        const bounds = {
            x: this.pos.x,
            y: this.pos.y,
            width: this.WIDTH,
            height: this.getHeight()
        };
        
        return screenPos.x >= bounds.x && 
               screenPos.x <= bounds.x + bounds.width &&
               screenPos.y >= bounds.y && 
               screenPos.y <= bounds.y + bounds.height;
    }
    
    private handleClick(screenPos: ex.Vector) {
        const localPos = screenPos.sub(this.pos);
        
        // Check toggle button (top-right corner)
        const toggleX = this.WIDTH - 30;
        const toggleY = 5;
        if (localPos.x >= toggleX && localPos.x <= toggleX + 20 &&
            localPos.y >= toggleY && localPos.y <= toggleY + 20) {
            this.toggle();
            return;
        }
        
        // Check filter buttons (if expanded)
        if (!this.isCollapsed) {
            let filterX = this.PADDING;
            const filterY = 35;
            
            for (const [category, button] of this.filterButtons) {
                const buttonWidth = 50; // Approximate width
                if (localPos.x >= filterX && localPos.x <= filterX + buttonWidth &&
                    localPos.y >= filterY && localPos.y <= filterY + 15) {
                    this.toggleFilter(category);
                    return;
                }
                filterX += buttonWidth + 5;
            }
        }
    }
    
    private handleScroll(deltaY: number) {
        const scrollAmount = Math.sign(deltaY) * 3; // 3 entries per scroll
        this.scrollOffset = Math.max(0, 
            Math.min(this.maxScrollOffset, this.scrollOffset + scrollAmount));
        
        // Manual scroll disables auto-scroll
        this.isManualScrollLocked = true;
        
        // Re-enable auto-scroll after 3 seconds of no scrolling
        setTimeout(() => {
            this.isManualScrollLocked = false;
        }, 3000);
    }
    
    public addEntry(message: string, category: LogCategory, color?: ex.Color) {
        const entry: LogEntry = {
            id: `${Date.now()}-${Math.random()}`,
            message,
            category,
            timestamp: new Date(),
            color
        };
        
        this.entries.push(entry);
        
        // Limit entries to prevent memory issues
        if (this.entries.length > this.MAX_ENTRIES) {
            this.entries = this.entries.slice(-this.MAX_ENTRIES);
        }
        
        this.updateFilteredEntries();
        
        // Auto-scroll to bottom if not manually locked
        if (!this.isManualScrollLocked) {
            this.scrollToBottom();
        }
    }
    
    private updateFilteredEntries() {
        this.filteredEntries = this.entries.filter(entry => 
            this.activeFilters.has(entry.category));
        
        // Update scroll limits
        const visibleLines = Math.floor((this.EXPANDED_HEIGHT - 60) / this.ENTRY_HEIGHT);
        this.maxScrollOffset = Math.max(0, this.filteredEntries.length - visibleLines);
    }
    
    private scrollToBottom() {
        this.scrollOffset = this.maxScrollOffset;
    }
    
    onPostUpdate(engine: ex.Engine, delta: number) {
        this.updatePosition();
    }

    private toggle() {
        this.isCollapsed = !this.isCollapsed;
        this.toggleButton.text = this.isCollapsed ? '+' : '−';
        this.background.height = this.getHeight();
        this.updatePosition();
    }
    
    private collapse() {
        this.isCollapsed = true;
        this.toggleButton.text = '+';
        this.background.height = this.getHeight();
        this.updatePosition();
    }
    
    private toggleFilter(category: LogCategory) {
        if (this.activeFilters.has(category)) {
            this.activeFilters.delete(category);
        } else {
            this.activeFilters.add(category);
        }
        
        this.updateFilteredEntries();
        
        // Update filter button appearance
        const button = this.filterButtons.get(category)!;
        button.color = this.activeFilters.has(category) 
                ? UITheme.Colors.text 
                : UITheme.Colors.textMuted;
    }
    
    private getHeight(): number {
        return this.isCollapsed ? this.COLLAPSED_HEIGHT : this.EXPANDED_HEIGHT;
    }
    
    private getCategoryColor(category: LogCategory): ex.Color {
        switch (category) {
            case LogCategory.Combat: return UITheme.Colors.textDanger;
            case LogCategory.Items: return UITheme.Colors.accent;
            case LogCategory.Effects: return UITheme.Colors.secondary;
            case LogCategory.Interactions: return UITheme.Colors.primary;
            case LogCategory.Movement: return UITheme.Colors.textMuted;
            case LogCategory.System: return UITheme.Colors.text;
            default: return UITheme.Colors.text;
        }
    }
    
    private formatTime(date: Date): string {
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    private customDraw(ctx: ex.ExcaliburGraphicsContext, delta: number) {
        // Debug log once per second
        if (Date.now() % 1000 < 16) {
            console.log("[GameJournal] customDraw called at", this.pos);
        }
        
        // Draw at (0, 0) - onPostDraw context is already positioned at this.pos
        const x = 0;
        let y = 0;
        
        // Draw main background
        this.background.draw(ctx, x, y);
        
        // Draw header
        this.headerBackground.draw(ctx, x, y);
        
        // Draw title
        this.titleText.draw(ctx, x + this.PADDING, y + 8);
        
        // Draw toggle button
        this.toggleButton.draw(ctx, x + this.WIDTH - 25, y + 8);
        
        // If collapsed, we're done
        if (this.isCollapsed) return;
        
        y += this.COLLAPSED_HEIGHT + 5;
        
        // Draw filter buttons
        let filterX = this.PADDING;
        Object.values(LogCategory).forEach(category => {
            const button = this.filterButtons.get(category)!;
            const isActive = this.activeFilters.has(category);
            
            // Background for active filters
            if (isActive) {
                ctx.drawRectangle(
                    ex.vec(x + filterX - 2, y - 2),
                    45, 14,
                    UITheme.Colors.hover
                );
            }
            
            button.draw(ctx, x + filterX, y);
            filterX += 50;
        });
        
        y += 20;
        
        // Draw entries
        const visibleEntries = this.filteredEntries.slice(
            this.scrollOffset,
            this.scrollOffset + Math.floor((this.EXPANDED_HEIGHT - 60) / this.ENTRY_HEIGHT)
        );
        
        visibleEntries.forEach((entry, index) => {
            const entryY = y + index * this.ENTRY_HEIGHT;
            
            // Time stamp
            const timeText = UITheme.createText(
                this.formatTime(entry.timestamp),
                'small',
                UITheme.Colors.textMuted
            );
            timeText.draw(ctx, x + this.PADDING, entryY);
            
            // Category indicator
            const categoryColor = this.getCategoryColor(entry.category);
            ctx.drawCircle(ex.vec(x + 60, entryY + 6), 3, categoryColor);
            
            // Message
            const messageColor = entry.color || UITheme.Colors.text;
            const messageText = UITheme.createText(
                entry.message.length > 45 ? entry.message.substring(0, 42) + '...' : entry.message,
                'small',
                messageColor
            );
            messageText.draw(ctx, x + 70, entryY);
        });
        
        // Draw scrollbar if needed
        if (this.maxScrollOffset > 0) {
            const scrollbarX = x + this.WIDTH - 12;
            const scrollbarY = y;
            
            this.scrollbar.draw(ctx, scrollbarX, scrollbarY);
            
            // Scroll thumb position
            const thumbProgress = this.scrollOffset / this.maxScrollOffset;
            const thumbY = scrollbarY + thumbProgress * (this.scrollbar.height - this.scrollThumb.height);
            
            this.scrollThumb.draw(ctx, scrollbarX + 1, thumbY);
        }
    }
    
    // Public API for integration
    public isExpanded(): boolean {
        return !this.isCollapsed;
    }
    
    public clear() {
        this.entries = [];
        this.filteredEntries = [];
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;
    }
    
    public getFilteredEntryCount(): number {
        return this.filteredEntries.length;
    }
}