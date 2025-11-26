import { Consumable } from '../../../items/Consumable';
import { Actor } from '../../../actors/Actor';
import { ItemID } from '../ItemIDs';
import { DamageType } from '../../../mechanics/DamageType';

export class ScrollOfEnchantment extends Consumable {
    constructor() {
        super(ItemID.ScrollOfEnchantment, 'Scroll of Elven Craftsmanship', 'A scroll written by Santa\'s master elves. Imbues gear with magical Christmas properties.');
        
        this.stackable = true;
        this.maxStack = 3;
        this.rare = true;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} reads the Scroll of Enchantment!`);
        
        // Enchant equipped weapon or armor with random bonus
        if (actor.weapon && Math.random() < 0.6) {
            this.enchantWeapon(actor.weapon);
        } else if (actor.armor) {
            this.enchantArmor(actor.armor);
        } else {
            console.log('No equipment to enchant!');
            return false;
        }
        
        this.count--;
        return this.count <= 0;
    }

    private enchantWeapon(weapon: any): void {
        const enchantments = [
            { name: 'Sharpness', property: 'minDamage', value: 2 },
            { name: 'Power', property: 'maxDamage', value: 3 },
            { name: 'Frost', property: 'freezeChance', value: 0.15 },
            { name: 'Fire', property: 'burnChance', value: 0.15 }
        ];
        
        const enchant = enchantments[Math.floor(Math.random() * enchantments.length)];
        weapon[enchant.property] = (weapon[enchant.property] || 0) + enchant.value;
        weapon.name = `${weapon.name} of ${enchant.name}`;
        console.log(`Weapon enchanted with ${enchant.name}!`);
    }

    private enchantArmor(armor: any): void {
        const enchantments = [
            { name: 'Protection', property: 'defense', value: 2 },
            { name: 'Warmth', property: 'coldResist', value: 5 },
            { name: 'Durability', property: 'durability', value: 20 }
        ];
        
        const enchant = enchantments[Math.floor(Math.random() * enchantments.length)];
        armor[enchant.property] = (armor[enchant.property] || 0) + enchant.value;
        armor.name = `${armor.name} of ${enchant.name}`;
        console.log(`Armor enchanted with ${enchant.name}!`);
    }
}

export class ScrollOfMapping extends Consumable {
    constructor() {
        super(ItemID.ScrollOfMapping, 'Santa\'s Route Map', 'A magical map showing Santa\'s delivery routes. Reveals the entire current floor layout.');
        
        this.stackable = true;
        this.maxStack = 5;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} unfolds Santa's Route Map! Ho ho ho! The layout is revealed!`);
        
        // Reveal entire floor
        if (actor.currentLevel) {
            actor.currentLevel.revealAll();
        }
        
        this.count--;
        return this.count <= 0;
    }
}

export class ScrollOfChristmasSpirit extends Consumable {
    constructor() {
        super(ItemID.ScrollOfChristmasSpirit, 'Christmas Carol Sheet', 'A magical sheet music that fills the air with festive melodies, boosting your Christmas spirit!');
        
        this.stackable = true;
        this.maxStack = 3;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} begins singing Christmas carols! 🎵 Jingle bells, jingle bells... 🎵`);
        
        // Temporary boost to all stats for 50 turns
        const duration = 50;
        actor.addTemporaryEffect('Christmas Spirit', {
            strength: 3,
            dexterity: 3,
            intelligence: 3,
            charisma: 5,
            warmth: 10
        }, duration);
        
        this.count--;
        return this.count <= 0;
    }
}

export class ScrollOfReindeerCall extends Consumable {
    constructor() {
        super(ItemID.ScrollOfReindeerCall, 'Reindeer Whistle Call', 'A magical whistle that summons one of Santa\'s reindeer to aid you in battle.');
        
        this.stackable = true;
        this.maxStack = 2;
        this.rare = true;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} blows the magical reindeer whistle! *WHISTLE* *JINGLE*`);
        
        // Summon reindeer ally
        if (actor.currentLevel) {
            const reindeer = actor.currentLevel.spawnAlly('reindeer', actor.x, actor.y);
            if (reindeer) {
                console.log('A majestic reindeer appears to help!');
            }
        }
        
        this.count--;
        return this.count <= 0;
    }
}

export class ScrollOfSnowStorm extends Consumable {
    constructor() {
        super(ItemID.ScrollOfSnowStorm, 'Jack Frost\'s Decree', 'A frozen scroll that unleashes Jack Frost\'s power, creating a devastating blizzard.');
        
        this.stackable = true;
        this.maxStack = 3;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} reads Jack Frost's icy decree! ❄️ Winter's wrath is unleashed! ❄️`);
        
        // Damage and slow all enemies
        if (actor.currentLevel) {
            actor.currentLevel.getAllEnemies().forEach((enemy: Actor) => {
                enemy.takeDamage(Math.floor(Math.random() * 6) + 3, DamageType.Ice, actor);
                enemy.addTemporaryEffect('Slowed by Snow', { speed: -2 }, 20);
            });
        }
        
        this.count--;
        return this.count <= 0;
    }
}

export class ScrollOfMistletoePortal extends Consumable {
    constructor() {
        super(ItemID.ScrollOfMistletoePortal, 'Mistletoe Magic Circle', 'A scroll depicting a magical mistletoe circle. Creates a portal between wreaths.');
        
        this.stackable = true;
        this.maxStack = 4;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} traces a mistletoe magic circle in the air! ✨🌿✨`);
        
        // Teleport to random wreath
        if (actor.currentLevel) {
            const wreaths = actor.currentLevel.getAllWreaths();
            if (wreaths.length > 0) {
                const randomWreath = wreaths[Math.floor(Math.random() * wreaths.length)];
                actor.teleportTo(randomWreath.x, randomWreath.y);
                console.log('You are transported through the mistletoe!');
            } else {
                console.log('No wreaths found on this floor!');
                return false;
            }
        }
        
        this.count--;
        return this.count <= 0;
    }
}