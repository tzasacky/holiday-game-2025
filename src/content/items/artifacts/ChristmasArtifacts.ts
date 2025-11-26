import { Artifact } from '../../../items/Artifact';
import { Actor } from '../../../actors/Actor';
import { StatBoostEffect, ActiveEffect } from '../../../mechanics/Effect';
import { ItemID } from '../ItemIDs';

export class SnowGlobe extends Artifact {
    public passiveEffects = [
        new StatBoostEffect('Winter\'s Eye', 'perception', 5)
    ];
    
    private cooldown: number = 0;

    constructor() {
        super(ItemID.SnowGlobe, 'Snow Globe', 'A magical snow globe containing a miniature blizzard. Shake to unleash winter\'s fury!');
    }

    use(actor: Actor): boolean {
        if (this.cooldown > 0) {
            console.log('The snow globe is still settling... wait a few more turns.');
            return false;
        }

        console.log(`${actor.name} shakes the Snow Globe violently!`);
        console.log('A massive blizzard erupts from the globe!');
        
        // Create blizzard AoE attack (simplified for now)
        console.log('A massive blizzard affects nearby enemies!');
        
        this.cooldown = 15;
        return false; // Don't consume
    }

    onTurnEnd(actor: Actor) {
        if (this.cooldown > 0) {
            this.cooldown--;
        }
    }
}

export class ReindeerBell extends Artifact {
    public passiveEffects = [
        new StatBoostEffect('Reindeer Call', 'charisma', 6)
    ];
    
    private cooldown: number = 0;

    constructor() {
        super(ItemID.ReindeerBell, 'Reindeer Bell', 'Santa\'s own sleigh bell. Ring it to summon a spectral reindeer ally.');
    }

    use(actor: Actor): boolean {
        if (this.cooldown > 0) {
            console.log('The bell\'s magic is recharging...');
            return false;
        }

        console.log(`${actor.name} rings the Reindeer Bell!`);
        console.log('*JINGLE JINGLE* A spectral reindeer appears!');
        
        // Summon reindeer ally (simplified for now)
        console.log('A spectral reindeer will aid you for 25 turns!');
        
        this.cooldown = 30;
        return false;
    }

    onTurnEnd(actor: Actor) {
        if (this.cooldown > 0) {
            this.cooldown--;
        }
    }
}

export class NaughtyList extends Artifact {
    public passiveEffects = [
        new StatBoostEffect('Santa\'s Judgment', 'perception', 8),
        new StatBoostEffect('Moral Authority', 'charisma', 4)
    ];

    constructor() {
        super(ItemID.NaughtyList, 'Naughty List', 'Santa\'s official naughty list. Greatly increases damage against evil creatures.');
    }

    onEquip(actor: Actor) {
        super.onEquip(actor);
        // Double damage against "naughty" enemies
        if (actor.damageModifier) {
            const originalModifier = actor.damageModifier;
            actor.damageModifier = (target: Actor, damage: number) => {
                let modifiedDamage = originalModifier(target, damage);
                if (target.alignment === 'evil' || target.entityTypes.includes('demon') || target.entityTypes.includes('krampus')) {
                    console.log(`${target.name} is on the naughty list! Double damage!`);
                    return modifiedDamage * 2;
                }
                return modifiedDamage;
            };
        } else {
            actor.damageModifier = (target: Actor, damage: number) => {
                if (target.alignment === 'evil' || target.entityTypes.includes('demon') || target.entityTypes.includes('krampus')) {
                    console.log(`${target.name} is on the naughty list! Double damage!`);
                    return damage * 2;
                }
                return damage;
            };
        }
    }
}

export class ChristmasCandle extends Artifact {
    public passiveEffects = [
        new StatBoostEffect('Eternal Flame', 'warmth', 12),
        new ActiveEffect('Light Radius', 'lightRadius', 6)
    ];

    constructor() {
        super(ItemID.ChristmasCandle, 'Christmas Candle', 'A candle that never goes out. Provides warmth and light in the darkest places.');
    }

    onEquip(actor: Actor) {
        super.onEquip(actor);
        // Passive warmth regeneration
        actor.warmthRegen = actor.warmthRegen + 1;
        
        // Undead and dark creatures take damage nearby
        actor.holyAura = {
            radius: 3,
            damagePerTurn: 2,
            affectedTypes: ['undead', 'shadow', 'demon']
        };
    }

    onUnequip(actor: Actor) {
        super.onUnequip(actor);
        actor.warmthRegen = Math.max(0, actor.warmthRegen - 1);
        actor.holyAura = null;
    }
}

export class MagicStocking extends Artifact {
    public passiveEffects = [
        new StatBoostEffect('Santa\'s Favor', 'luck', 10)
    ];
    
    private dailyGift: boolean = true;

    constructor() {
        super(ItemID.MagicStocking, 'Magic Stocking', 'One of Santa\'s enchanted stockings. Occasionally provides gifts and greatly improves luck.');
    }

    onEquip(actor: Actor) {
        super.onEquip(actor);
        // Better loot drops
        actor.lootBonus = actor.lootBonus * 1.5;
        
        // Chance for random gift each floor
        if (this.dailyGift && Math.random() < 0.3) {
            this.giveRandomGift(actor);
            this.dailyGift = false; // Once per floor
        }
    }

    private giveRandomGift(actor: Actor) {
        const gifts = ['HotCocoa', 'Fruitcake', 'Snowball', 'Gold'];
        const randomGift = gifts[Math.floor(Math.random() * gifts.length)];
        console.log(`The Magic Stocking produces a ${randomGift}!`);
        // Add item to inventory
    }

    onNewFloor() {
        this.dailyGift = true; // Reset for new floor
    }
}

export class FrozenHeart extends Artifact {
    public passiveEffects = [
        new StatBoostEffect('Ice Immunity', 'coldResist', 25),
        new StatBoostEffect('Frozen Soul', 'intelligence', 8)
    ];

    constructor() {
        super(ItemID.FrozenHeart, 'Frozen Heart', 'A heart of pure ice that never melts. Grants immunity to cold and enhances ice magic.');
    }

    onEquip(actor: Actor) {
        super.onEquip(actor);
        // All ice/frost attacks are stronger
        actor.iceAttackBonus = 2.0; // Double ice damage
        
        // Immune to freeze effects
        actor.immuneTo = [...actor.immuneTo, 'freeze', 'slow', 'chill'];
        
        // Regenerate in cold environments
        actor.coldRegeneration = 2; // +2 HP per turn in cold
    }
}

export class ChristmasWish extends Artifact {
    public passiveEffects = [
        new StatBoostEffect('Hope', 'luck', 15),
        new StatBoostEffect('Christmas Magic', 'intelligence', 6)
    ];
    
    private wishesGranted: number = 0;
    private maxWishes: number = 3;

    constructor() {
        super(ItemID.ChristmasWish, 'Christmas Wish', 'A crystallized Christmas wish. Can be used to make miracles happen, but only three times.');
    }

    use(actor: Actor): boolean {
        if (this.wishesGranted >= this.maxWishes) {
            console.log('All wishes have been granted...');
            return false;
        }

        console.log(`${actor.name} makes a Christmas wish!`);
        
        // Random beneficial effect
        const wishes = [
            () => { actor.heal(actor.maxHp); console.log('Wish: Full healing!'); },
            () => { actor.addTemporaryEffect('Blessed', { strength: 5, dexterity: 5, intelligence: 5 }, 50); console.log('Wish: Temporary power boost!'); },
            () => { actor.warmth = actor.maxWarmth; console.log('Wish: Complete warmth!'); },
            () => { console.log('Wish: Rare item appears!'); /* Spawn rare item */ },
            () => { actor.teleportToSafeLocation(); console.log('Wish: Teleported to safety!'); }
        ];
        
        const randomWish = wishes[Math.floor(Math.random() * wishes.length)];
        randomWish();
        
        this.wishesGranted++;
        console.log(`Wishes remaining: ${this.maxWishes - this.wishesGranted}`);
        
        return this.wishesGranted >= this.maxWishes; // Consume when all wishes used
    }
}