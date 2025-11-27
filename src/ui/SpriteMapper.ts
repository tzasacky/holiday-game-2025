import { Item } from '../items/Item';

export class SpriteMapper {
    // Map item names/IDs to image URLs or emoji
    // For now, we'll use emojis as placeholders, but this structure supports URLs
    
    public static getIcon(item: Item): string {
        const name = item.name.toLowerCase();
        
        if (name.includes('potion')) return '🧪';
        if (name.includes('sword')) return '⚔️';
        if (name.includes('spear')) return '🔱';
        if (name.includes('dagger')) return '🗡️';
        if (name.includes('armor') || name.includes('plate') || name.includes('mail')) return '🛡️';
        if (name.includes('helmet') || name.includes('hat')) return '⛑️';
        if (name.includes('boots')) return '👢';
        if (name.includes('scroll')) return '📜';
        if (name.includes('key')) return '🔑';
        if (name.includes('gold') || name.includes('coin')) return '💰';
        if (name.includes('food') || name.includes('cocoa')) return '☕';
        
        return '📦'; // Default box
    }
    
    public static getCSSClass(item: Item): string {
        // Return a CSS class based on rarity or type
        // e.g. 'item-rare', 'item-legendary'
        return 'item-common';
    }
}
