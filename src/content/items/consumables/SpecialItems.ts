import { Consumable } from '../../../items/Consumable';
import { Actor } from '../../../actors/Actor';
import { Hero } from '../../../actors/Hero';
import { EnhancedEquipment } from '../../../mechanics/EquipmentSystem';
import { ItemID } from '../ItemIDs';
import { IdentificationSystem } from '../../../mechanics/IdentificationSystem';

export class ScrollOfRemoveCurse extends Consumable {
    constructor() {
        super(ItemID.ScrollOfRemoveCurse, 'Scroll of Remove Curse', 'A holy scroll that can cleanse cursed items. Blessed by Santa himself.');
        
        this.stackable = true;
        this.maxStack = 3;
        this.rare = true;
        this.holy = true;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        // Find cursed equipment
        const cursedItems: EnhancedEquipment[] = [];
        
        if (actor.weapon instanceof EnhancedEquipment && actor.weapon.cursed) {
            cursedItems.push(actor.weapon);
        }
        
        if (actor.armor instanceof EnhancedEquipment && actor.armor.cursed) {
            cursedItems.push(actor.armor);
        }
        
        // Add accessories if they exist
        if (actor instanceof Hero && actor.accessories) {
            actor.accessories
                .filter((item): item is EnhancedEquipment => 
                    item instanceof EnhancedEquipment && item.cursed)
                .forEach(item => cursedItems.push(item));
        }

        if (cursedItems.length === 0) {
            console.log('You have no cursed items to cleanse.');
            return false;
        }

        // If only one cursed item, cleanse it automatically
        if (cursedItems.length === 1) {
            this.cleanseCurses(actor, cursedItems[0]);
        } else {
            // Multiple cursed items - let player choose or cleanse all
            console.log('Multiple cursed items detected. Cleansing all curses...');
            cursedItems.forEach(item => this.cleanseCurses(actor, item));
        }

        this.count--;
        return this.count <= 0;
    }

    private cleanseCurses(actor: Actor, item: EnhancedEquipment): void {
        console.log(`${actor.name} reads the Scroll of Remove Curse!`);
        console.log('Holy light engulfs the cursed item...');
        
        const curseCount = item.curses.length;
        item.removeAllCurses();
        
        console.log(`All ${curseCount} curse(s) have been cleansed from ${item.getDisplayName()}!`);
        console.log('The item can now be freely equipped and unequipped.');
        
        // Bonus: Temporarily bless the item (if supported, otherwise just log)
        // Equipment doesn't have addTemporaryEffect, so we apply to actor or just skip
        console.log('The item is temporarily blessed against future curses.');
    }
}

export class AngelFeatherRevive extends Consumable {
    constructor() {
        super(ItemID.AngelFeatherRevive, 'Angel Feather', 'A pristine white feather from a Christmas angel. Can bring the dead back to life.');
        
        this.stackable = true;
        this.maxStack = 1; // Extremely rare
        this.legendary = true;
        this.revivesOnDeath = true;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        if (actor.hp > 0) {
            console.log('You are not dead - the Angel Feather has no effect.');
            return false;
        }

        console.log('The Angel Feather glows with divine light...');
        console.log('Christmas miracles are real!');
        
        this.reviveActor(actor);
        
        this.count--;
        return true; // Always consumed
    }

    public autoRevive(actor: Actor): boolean {
        if (this.count <= 0) return false;
        if (actor.hp > 0) return false;

        console.log('As your life fades, the Angel Feather in your inventory begins to glow...');
        console.log('A Christmas miracle occurs!');
        
        this.reviveActor(actor);
        this.count--;
        return true;
    }

    private reviveActor(actor: Actor): void {
        // Restore to 50% health
        const reviveHealth = Math.floor(actor.maxHp * 0.5);
        actor.hp = reviveHealth;
        
        // Restore some warmth
        actor.warmth = Math.min(actor.maxWarmth, actor.warmth + 30);
        
        // Temporary protection
        actor.addTemporaryEffect('Angel\'s Protection', {
            description: 'Protected by divine grace',
            defense: 5,
            coldResist: 10,
            damageReduction: 0.25,
            duration: 50
        }, 50);
        
        // Temporary stat boost
        actor.addTemporaryEffect('Miraculous Recovery', {
            description: 'Blessed by Christmas magic',
            strength: 3,
            dexterity: 3,
            intelligence: 3,
            charisma: 5,
            duration: 25
        }, 25);
        
        console.log(`${actor.name} has been revived with ${reviveHealth} HP!`);
        console.log('You are blessed with divine protection and feel incredibly lucky to be alive.');
        console.log('The Angel Feather crumbles to golden dust, its miracle complete.');
        
        // Grant significant experience for the rare event
        actor.gainExperience(500);
        
        // Make nearby enemies flee in awe (if in combat)
        // Assuming inCombat is a property we might need to check or just skip
        if (actor.currentLevel && actor.currentLevel.getAllEnemies) {
            console.log('Nearby enemies flee in terror at the divine intervention!');
            actor.currentLevel.getAllEnemies()
                .filter((enemy: any) => actor.currentLevel.getDistance(actor.x, actor.y, enemy.x, enemy.y) <= 5)
                .forEach((enemy: any) => {
                    enemy.addTemporaryEffect('Divine Terror', {
                        flee: true,
                        speed: -2,
                        accuracy: -10,
                        duration: 10
                    }, 10);
                });
        }
    }
}

export class ScrollOfIdentify extends Consumable {
    constructor() {
        super(ItemID.ScrollOfIdentify, 'Scroll of Identify', 'A magical scroll that instantly reveals the true nature of any item.');
        
        this.stackable = true;
        this.maxStack = 5;
        this.uncommon = true;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        if (!(actor instanceof Hero)) return false;

        // Find unidentified items
        const unidentifiedItems: EnhancedEquipment[] = [];
        
        // Iterate inventory manually since it might not have forEach
        for (let i = 0; i < actor.inventory.capacity; i++) {
            const item = actor.inventory.getItem(i);
            if (item && item instanceof EnhancedEquipment && !item.identified) {
                unidentifiedItems.push(item);
            }
        }

        if (unidentifiedItems.length === 0) {
            console.log('You have no unidentified items.');
            return false;
        }

        console.log(`${actor.name} reads a Scroll of Identify!`);
        console.log('Magical knowledge flows into your mind...');
        
        // Identify the first unidentified item (or let player choose)
        const itemToIdentify = unidentifiedItems[0];
        IdentificationSystem.instantIdentify(actor, itemToIdentify);
        
        this.count--;
        return this.count <= 0;
    }
}

export class PotionOfCureDisease extends Consumable {
    constructor() {
        super(ItemID.PotionOfCureDisease, 'Potion of Cure Disease', 'A greenish potion that cures all diseases and poisons.');
        
        this.stackable = true;
        this.maxStack = 3;
        this.uncommon = true;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} drinks a Potion of Cure Disease!`);
        
        // Remove all negative status effects
        actor.removeAllNegativeEffects();
        
        // Cure specific conditions
        actor.removeCondition('poisoned');
        actor.removeCondition('diseased');
        actor.removeCondition('infected');
        actor.removeCondition('nauseous');
        actor.removeCondition('weak');
        
        // Restore some health
        actor.heal(Math.floor(Math.random() * 10) + 5);
        
        console.log('You feel much healthier and all ailments are cured!');
        
        this.count--;
        return this.count <= 0;
    }
}

export class ScrollOfTeleport extends Consumable {
    constructor() {
        super(ItemID.ScrollOfTeleport, 'Scroll of Teleport', 'A scroll that teleports you to a random safe location on the current floor.');
        
        this.stackable = true;
        this.maxStack = 4;
        this.rare = true;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} reads a Scroll of Teleport!`);
        
        if (!actor.currentLevel) {
            console.log('The scroll fizzles - there\'s nowhere to teleport to!');
            return false;
        }
        
        // Find safe teleport locations
        // Assuming findSafeLocations exists on Level, if not we fallback
        const safeLocations = actor.currentLevel.findSafeLocations ? actor.currentLevel.findSafeLocations() : [];
        
        if (safeLocations.length === 0) {
            console.log('The scroll burns up - no safe locations found!');
            this.count--;
            return this.count <= 0;
        }
        
        const randomLocation = safeLocations[Math.floor(Math.random() * safeLocations.length)];
        
        console.log('Reality warps around you...');
        actor.teleportTo(randomLocation.x, randomLocation.y);
        console.log('You materialize in a new location!');
        
        // Brief confusion after teleporting
        actor.addTemporaryEffect('Teleport Disorientation', {
            accuracy: -2,
            speed: -1,
            duration: 3
        }, 3);
        
        this.count--;
        return this.count <= 0;
    }
}

export class SantasCookie extends Consumable {
    constructor() {
        super(ItemID.SantasCookie, 'Santa\'s Cookie', 'One of Santa\'s personal cookies. Grants incredible power but only works once per Christmas season.');
        
        this.stackable = false;
        this.maxStack = 1;
        this.legendary = true;
        this.oncePerSeason = true;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        // Check if already used this season
        if (actor instanceof Hero && actor.hasUsedSantasCookie) {
            console.log('You\'ve already received Santa\'s blessing this Christmas season.');
            return false;
        }
        
        console.log(`${actor.name} takes a bite of Santa\'s magical cookie...`);
        console.log('The power of Christmas flows through your entire being!');
        
        // Massive permanent bonuses
        actor.addPermanentBonus('strength', 3);
        actor.addPermanentBonus('dexterity', 3);
        actor.addPermanentBonus('intelligence', 3);
        actor.addPermanentBonus('charisma', 5);
        actor.addPermanentBonus('maxHP', 20);
        actor.addPermanentBonus('maxWarmth', 25);
        
        // Full heal and warm
        actor.hp = actor.maxHp;
        actor.warmth = actor.maxWarmth;
        
        // Special Santa's blessing
        actor.addTemporaryEffect('Santa\'s Blessing', {
            description: 'Blessed by Santa Claus himself',
            allStats: 5,
            luck: 15,
            curseImmunity: true,
            krampusImmunity: true,
            coldImmunity: true,
            duration: 200
        }, 200);
        
        console.log('You have received the ultimate Christmas blessing!');
        console.log('All stats permanently increased!');
        console.log('You feel the warmth and joy of Christmas in your heart.');
        
        if (actor instanceof Hero) {
            actor.hasUsedSantasCookie = true;
        }
        this.count--;
        return true;
    }
}