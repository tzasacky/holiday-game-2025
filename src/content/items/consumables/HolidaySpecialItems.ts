import { Consumable } from '../../../items/Consumable';
import { Actor } from '../../../actors/Actor';
import { Hero } from '../../../actors/Hero';
import { EnhancedEquipment } from '../../../mechanics/EquipmentSystem';
import { ItemID } from '../ItemIDs';

export class ScrollOfSantasBlessing extends Consumable {
    constructor() {
        super(ItemID.ScrollOfSantasBlessing, 'Scroll of Santa\'s Blessing', 'A holy scroll written in Santa\'s own hand. Removes all curses and grants divine protection.');
        
        this.stackable = true;
        this.maxStack = 2;
        this.legendary = true;
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

        console.log(`${actor.name} unfurls Santa's sacred scroll...`);
        console.log('🎅 "Ho ho ho! Let my Christmas magic cleanse these dark forces!" 🎅');
        console.log('Golden light radiates from the North Pole blessing!');

        if (cursedItems.length > 0) {
            cursedItems.forEach(item => {
                const curseCount = item.curses.length;
                item.removeAllCurses();
                console.log(`✨ All ${curseCount} curse(s) cleansed from ${item.getDisplayName()}! ✨`);
            });
        }

        // Santa's blessing provides additional benefits
        actor.addTemporaryEffect('Santa\'s Divine Blessing', {
            description: 'Blessed by Santa Claus himself',
            curseImmunity: true,
            allStats: 3,
            warmth: 20,
            luck: 10,
            coldImmunity: true,
            duration: 500 // Long lasting
        }, 500);

        console.log('🎄 You have received Santa\'s personal blessing! 🎄');
        console.log('You feel the warmth and joy of Christmas protecting you.');
        console.log('The scroll crumbles to golden snowflakes that dance around you.');
        
        this.count--;
        return this.count <= 0;
    }
}

export class ChristmasWishBone extends Consumable {
    constructor() {
        super(ItemID.ChristmasWishBone, 'Christmas Wish Bone', 'A mystical bone from the Christmas Turkey of Legend. Break it to make a wish that can bring you back from death.');
        
        this.stackable = false;
        this.maxStack = 1;
        this.legendary = true;
        this.revivesOnDeath = true;
        this.christmasThemed = true;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        if (actor.hp > 0) {
            console.log('The Christmas Wish Bone only responds to your final moment...');
            return false;
        }

        console.log('As darkness closes in, the Christmas Wish Bone begins to glow...');
        console.log('🦴 You hear the faint sound of Christmas bells... 🔔');
        console.log('The bone snaps in two with a magical *CRACK*!');
        
        this.reviveActor(actor);
        
        this.count--;
        return true;
    }

    public autoRevive(actor: Actor): boolean {
        if (this.count <= 0) return false;
        if (actor.hp > 0) return false;

        console.log('💀 Death approaches, but wait... 💀');
        console.log('The Christmas Wish Bone in your pocket suddenly grows warm!');
        console.log('🎄 "I wish... I wish for another chance at Christmas!" 🎄');
        console.log('The mystical turkey bone grants your desperate wish!');
        
        this.reviveActor(actor);
        this.count--;
        return true;
    }

    private reviveActor(actor: Actor): void {
        // More generous revival than angel feather
        const reviveHealth = Math.floor(actor.maxHp * 0.75);
        actor.hp = reviveHealth;
        
        // Full warmth restoration
        actor.warmth = actor.maxWarmth;
        
        // Christmas miracle protection
        actor.addTemporaryEffect('Christmas Miracle', {
            description: 'Protected by the magic of Christmas wishes',
            defense: 8,
            coldResist: 15,
            damageReduction: 0.5, // 50% damage reduction!
            warmthRegen: 3,
            duration: 100
        }, 100);
        
        // Festive stat boost
        actor.addTemporaryEffect('Wishbone Power', {
            description: 'Empowered by Christmas magic',
            strength: 5,
            dexterity: 5,
            intelligence: 5,
            charisma: 8,
            luck: 12,
            duration: 75
        }, 75);
        
        console.log(`🎅 ${actor.name} has been revived with ${reviveHealth} HP! 🎅`);
        console.log('🦃 The spirit of the Christmas Turkey watches over you! 🦃');
        console.log('You feel incredibly grateful and filled with Christmas joy!');
        console.log('The broken wishbone pieces shimmer and fade into Christmas magic.');
        
        // Heal nearby allies and inspire them
        if (actor.currentLevel) {
            const allies = actor.currentLevel.getAllAllies()
                .filter((ally: Actor) => actor.currentLevel.getDistance(actor.x, actor.y, ally.x, ally.y) <= 6);
            
            allies.forEach((ally: Actor) => {
                ally.heal(15);
                ally.addTemporaryEffect('Inspired by Miracle', {
                    strength: 3,
                    morale: 10,
                    duration: 50
                }, 50);
                console.log(`${ally.name} is inspired by your miraculous return!`);
            });
        }
        
        // Grant massive experience for this rare event
        actor.gainExperience(1000);
        
        // Make enemies hesitate in awe
        if (actor.currentLevel) {
            console.log('🙏 Enemies pause in wonder at the Christmas miracle! 🙏');
            actor.currentLevel.getAllEnemies()
                .filter((enemy: Actor) => actor.currentLevel.getDistance(actor.x, actor.y, enemy.x, enemy.y) <= 8)
                .forEach((enemy: Actor) => {
                    enemy.addTemporaryEffect('Awed by Miracle', {
                        stunned: true,
                        duration: 3
                    }, 3);
                    enemy.addTemporaryEffect('Questioning Evil Ways', {
                        accuracy: -5,
                        damage: -3,
                        duration: 20
                    }, 20);
                });
        }
    }

    getDisplayName(): string {
        return this.name + (this.count > 0 ? ' 🦴✨' : ' (Used)');
    }

    // Item does not have getTooltipText, so we rely on description
    // or we could implement it if we add it to Item later
}