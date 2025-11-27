import * as ex from 'excalibur';

/**
 * Unified UI Design System for Holiday Roguelike
 * Provides consistent colors, fonts, and styling across all UI components
 */
export class UITheme {
    // Color Palette - Holiday Theme
    static readonly Colors = {
        // Primary Colors
        primary: ex.Color.fromHex('#dc2626'),        // Christmas Red
        primaryDark: ex.Color.fromHex('#991b1b'),
        secondary: ex.Color.fromHex('#16a34a'),      // Christmas Green
        secondaryDark: ex.Color.fromHex('#15803d'),
        accent: ex.Color.fromHex('#f59e0b'),         // Gold
        
        // UI Element Colors
        background: ex.Color.fromRGB(0, 0, 0, 0.85),      // Semi-transparent black
        backgroundDark: ex.Color.fromRGB(0, 0, 0, 0.95),  // More opaque
        panel: ex.Color.fromHex('#1f2937'),                // Dark gray panel
        panelLight: ex.Color.fromHex('#374151'),            // Lighter panel
        border: ex.Color.fromHex('#6b7280'),               // Gray border
        borderLight: ex.Color.fromHex('#9ca3af'),          // Light gray border
        
        // Status Colors
        health: ex.Color.fromHex('#22c55e'),        // Green
        healthLow: ex.Color.fromHex('#ef4444'),     // Red
        healthMid: ex.Color.fromHex('#f59e0b'),     // Amber
        warmth: ex.Color.fromHex('#f97316'),        // Orange
        warmthLow: ex.Color.fromHex('#06b6d4'),     // Cyan (cold)
        mana: ex.Color.fromHex('#3b82f6'),          // Blue
        
        // Item Rarity Colors
        common: ex.Color.fromHex('#9ca3af'),        // Gray
        uncommon: ex.Color.fromHex('#22c55e'),      // Green  
        rare: ex.Color.fromHex('#3b82f6'),          // Blue
        epic: ex.Color.fromHex('#8b5cf6'),          // Purple
        legendary: ex.Color.fromHex('#f59e0b'),     // Gold
        cursed: ex.Color.fromHex('#dc2626'),        // Red
        
        // Text Colors
        text: ex.Color.White,
        textSecondary: ex.Color.fromHex('#d1d5db'),
        textMuted: ex.Color.fromHex('#9ca3af'),
        textDanger: ex.Color.fromHex('#ef4444'),
        textSuccess: ex.Color.fromHex('#22c55e'),
        textWarning: ex.Color.fromHex('#f59e0b'),
        
        // Interactive States
        hover: ex.Color.fromRGB(255, 255, 255, 0.1),
        active: ex.Color.fromRGB(255, 255, 255, 0.2),
        disabled: ex.Color.fromHex('#6b7280')
    };
    
    // Typography
    static readonly Fonts = {
        title: {
            family: 'Arial',
            size: 18,
            unit: ex.FontUnit.Px,
            color: UITheme.Colors.text,
            shadow: {
                offset: ex.vec(2, 2),
                color: ex.Color.Black
            }
        } as const,
        
        heading: {
            family: 'Arial', 
            size: 14,
            unit: ex.FontUnit.Px,
            color: UITheme.Colors.text,
            shadow: {
                offset: ex.vec(1, 1),
                color: ex.Color.Black
            }
        } as const,
        
        body: {
            family: 'Arial',
            size: 12,
            unit: ex.FontUnit.Px,
            color: UITheme.Colors.text,
            shadow: {
                offset: ex.vec(1, 1),
                color: ex.Color.Black
            }
        } as const,
        
        small: {
            family: 'Arial',
            size: 10,
            unit: ex.FontUnit.Px,
            color: UITheme.Colors.textSecondary,
            shadow: {
                offset: ex.vec(1, 1),
                color: ex.Color.Black
            }
        } as const,
        
        ui: {
            family: 'Arial',
            size: 11,
            unit: ex.FontUnit.Px,
            color: UITheme.Colors.text,
            shadow: {
                offset: ex.vec(1, 1),
                color: ex.Color.Black
            }
        } as const
    };
    
    // Layout Constants
    static readonly Layout = {
        padding: {
            small: 8,
            medium: 16,
            large: 32,
            xlarge: 64
        },
        
        borderRadius: {
            small: 8,
            medium: 16,
            large: 32
        },
        
        borderWidth: {
            thin: 2,
            medium: 4,
            thick: 8
        },
        
        spacing: {
            xs: 2,
            sm: 4,
            md: 8,
            lg: 12,
            xl: 16,
            xxl: 24
        },
        
        sizes: {
            slotSize: 40,
            hotbarSlotSize: 44,
            iconSize: 16,
            barHeight: 20,
            barWidth: 160,
            buttonHeight: 32,
            inputHeight: 28
        }
    };
    
    // Component Styles
    static readonly Styles = {
        panel: {
            backgroundColor: UITheme.Colors.panel,
            borderColor: UITheme.Colors.border,
            borderWidth: UITheme.Layout.borderWidth.medium,
            padding: UITheme.Layout.padding.large
        },
        
        button: {
            backgroundColor: UITheme.Colors.primary,
            backgroundColorHover: UITheme.Colors.primaryDark,
            borderColor: UITheme.Colors.borderLight,
            textColor: UITheme.Colors.text,
            height: UITheme.Layout.sizes.buttonHeight,
            padding: UITheme.Layout.padding.medium
        },
        
        slot: {
            backgroundColor: UITheme.Colors.panelLight,
            borderColor: UITheme.Colors.border,
            borderWidth: UITheme.Layout.borderWidth.thin,
            size: UITheme.Layout.sizes.slotSize
        },
        
        tooltip: {
            backgroundColor: UITheme.Colors.backgroundDark,
            borderColor: UITheme.Colors.borderLight,
            maxWidth: 250,
            padding: UITheme.Layout.padding.medium
        }
    };
    
    // Helper Methods
    static createFont(style: keyof typeof UITheme.Fonts, overrides?: Partial<ex.FontOptions>): ex.Font {
        const baseStyle = UITheme.Fonts[style];
        return new ex.Font({ ...baseStyle, ...overrides });
    }
    
    static createRectangle(width: number, height: number, style?: {
        fillColor?: ex.Color;
        strokeColor?: ex.Color;
        strokeWidth?: number;
    }): ex.Rectangle {
        return new ex.Rectangle({
            width,
            height,
            color: style?.fillColor || UITheme.Colors.panel,
            strokeColor: style?.strokeColor || UITheme.Colors.border,
            lineWidth: style?.strokeWidth || UITheme.Layout.borderWidth.medium
        });
    }
    
    static createText(text: string, style: keyof typeof UITheme.Fonts = 'body', color?: ex.Color): ex.Text {
        const font = UITheme.createFont(style, color ? { color } as any : undefined);
        return new ex.Text({ text, font });
    }
    
    static getItemRarityColor(item: any): ex.Color {
        if (item.cursed) return UITheme.Colors.cursed;
        if (item.legendary) return UITheme.Colors.legendary;
        if (item.rare) return UITheme.Colors.rare;
        if (item.uncommon) return UITheme.Colors.uncommon;
        return UITheme.Colors.common;
    }
    
    static getHealthColor(percentage: number): ex.Color {
        if (percentage > 0.6) return UITheme.Colors.health;
        if (percentage > 0.3) return UITheme.Colors.healthMid;
        return UITheme.Colors.healthLow;
    }
    
    static getWarmthColor(percentage: number): ex.Color {
        if (percentage > 0.6) return UITheme.Colors.warmth;
        if (percentage > 0.3) return UITheme.Colors.accent;
        return UITheme.Colors.warmthLow;
    }
    
    // Animation Helpers
    static readonly Animations = {
        fadeIn: (element: ex.Actor, duration: number = 300) => {
            element.graphics.opacity = 0;
            element.actions.fade(1, duration);
        },
        
        slideIn: (element: ex.Actor, fromX: number, toX: number, duration: number = 400) => {
            element.pos.x = fromX;
            element.actions.moveTo(toX, element.pos.y, duration);
        },
        
        bounce: (element: ex.Actor, intensity: number = 5, duration: number = 200) => {
            const originalY = element.pos.y;
            element.actions
                .moveTo(element.pos.x, originalY - intensity, duration / 2)
                .moveTo(element.pos.x, originalY, duration / 2);
        },
        
        pulse: (element: ex.Actor, scale: number = 1.1, duration: number = 300) => {
            element.actions
                .scaleTo(ex.vec(scale, scale), ex.vec(duration / 2, duration / 2))
                .scaleTo(ex.vec(1, 1), ex.vec(duration / 2, duration / 2));
        }
    };
    // Z-Index Hierarchy
    static readonly ZIndex = {
        World: 1,
        HUD: 90,
        Hotbar: 90,
        GameJournal: 95,
        Inventory: 100,
        Tooltip: 200
    };
}

// Export commonly used values for convenience
export const { Colors, Fonts, Layout, Styles } = UITheme;