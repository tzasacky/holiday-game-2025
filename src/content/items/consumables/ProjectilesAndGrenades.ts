import { Consumable } from '../../../items/Consumable';
import { Actor } from '../../../actors/Actor';
import { ItemID } from '../ItemIDs';

export class Snowball extends Consumable {
    constructor() {
        super(ItemID.Snowball, 'Snowball', 'A simple snowball. Cheap and effective ranged weapon.');
        
        this.stackable = true;
        this.maxStack = 20;
        this.projectile = true;
        this.range = 6;
        this.damage = { min: 1, max: 3 };
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} throws a snowball!`);
        // Throwing logic handled by game engine
        
        this.count--;
        return this.count <= 0;
    }
}

export class PackedSnowball extends Consumable {
    constructor() {
        super(ItemID.PackedSnowball, 'Packed Snowball', 'A tightly packed snowball. Harder hitting than a regular snowball.');
        
        this.stackable = true;
        this.maxStack = 15;
        this.projectile = true;
        this.range = 6;
        this.damage = { min: 2, max: 5 };
        this.stunChance = 0.1;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} hurls a packed snowball!`);
        
        this.count--;
        return this.count <= 0;
    }
}

export class Iceball extends Consumable {
    constructor() {
        super(ItemID.Iceball, 'Iceball', 'A solid ball of ice. Deals good damage and has a chance to freeze.');
        
        this.stackable = true;
        this.maxStack = 10;
        this.projectile = true;
        this.range = 7;
        this.damage = { min: 3, max: 7 };
        this.freezeChance = 0.25;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} throws a deadly iceball!`);
        
        this.count--;
        return this.count <= 0;
    }
}

export class YellowSnowball extends Consumable {
    constructor() {
        super(ItemID.YellowSnowball, 'Yellow Snowball', 'A suspicious yellow snowball. Don\'t ask what the yellow stuff is...');
        
        this.stackable = true;
        this.maxStack = 8;
        this.projectile = true;
        this.range = 5;
        this.damage = { min: 1, max: 2 };
        this.poisonChance = 0.8; // Very high poison chance
        this.disgustingEffect = true;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} throws a disgusting yellow snowball!`);
        
        this.count--;
        return this.count <= 0;
    }
}

export class CoalSnowball extends Consumable {
    constructor() {
        super(ItemID.CoalSnowball, 'Coal Snowball', 'A snowball with chunks of coal inside. For the naughty enemies.');
        
        this.stackable = true;
        this.maxStack = 12;
        this.projectile = true;
        this.range = 6;
        this.damage = { min: 4, max: 8 };
        this.extraDamageToNaughty = 5; // Bonus damage to evil enemies
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} throws a coal-filled snowball!`);
        
        this.count--;
        return this.count <= 0;
    }
}

export class CrackedOrnamentGrenade extends Consumable {
    constructor() {
        super(ItemID.CrackedOrnamentGrenade, 'Cracked Ornament Grenade', 'A fragile glass ornament filled with explosive powder. Might not even work.');
        
        this.stackable = true;
        this.maxStack = 8;
        this.grenade = true;
        this.range = 4;
        this.aoeRadius = 1;
        this.damage = { min: 2, max: 6 };
        this.failureChance = 0.3; // 30% chance to be a dud
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        if (Math.random() < this.failureChance) {
            console.log(`${actor.name} throws a cracked ornament grenade... but it's a dud!`);
        } else {
            console.log(`${actor.name} throws a cracked ornament grenade! *CRACK* *POP*`);
        }
        
        this.count--;
        return this.count <= 0;
    }
}

export class GlassOrnamentGrenade extends Consumable {
    constructor() {
        super(ItemID.GlassOrnamentGrenade, 'Glass Ornament Grenade', 'A beautiful glass ornament rigged to explode. Shards everywhere!');
        
        this.stackable = true;
        this.maxStack = 6;
        this.grenade = true;
        this.range = 5;
        this.aoeRadius = 2;
        this.damage = { min: 4, max: 10 };
        this.shrapnelEffect = true; // Causes bleeding
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} throws a glass ornament grenade! *CRASH* *BOOM*`);
        
        this.count--;
        return this.count <= 0;
    }
}

export class SilverOrnamentGrenade extends Consumable {
    constructor() {
        super(ItemID.SilverOrnamentGrenade, 'Silver Ornament Grenade', 'An elegant silver ornament with magical explosive properties.');
        
        this.stackable = true;
        this.maxStack = 4;
        this.grenade = true;
        this.range = 6;
        this.aoeRadius = 2;
        this.damage = { min: 6, max: 14 };
        this.holyDamage = true; // Extra damage to undead/demons
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} throws a silver ornament grenade! *FLASH* *BANG*`);
        
        this.count--;
        return this.count <= 0;
    }
}

export class GoldOrnamentGrenade extends Consumable {
    constructor() {
        super(ItemID.GoldOrnamentGrenade, 'Gold Ornament Grenade', 'A luxurious golden ornament filled with premium explosive magic.');
        
        this.stackable = true;
        this.maxStack = 3;
        this.grenade = true;
        this.range = 7;
        this.aoeRadius = 3;
        this.damage = { min: 8, max: 18 };
        this.stunAllInRadius = true;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} throws a gold ornament grenade! *MAGNIFICENT EXPLOSION*`);
        
        this.count--;
        return this.count <= 0;
    }
}

export class PlatinumOrnamentGrenade extends Consumable {
    constructor() {
        super(ItemID.PlatinumOrnamentGrenade, 'Platinum Ornament Grenade', 'The ultimate ornament grenade. Devastates everything in a huge radius.');
        
        this.stackable = true;
        this.maxStack = 2;
        this.grenade = true;
        this.range = 8;
        this.aoeRadius = 4;
        this.damage = { min: 12, max: 25 };
        this.knockbackAll = true;
        this.stunAllInRadius = true;
        this.rare = true;
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} throws the legendary PLATINUM ornament grenade!`);
        console.log('*THE MOST SPECTACULAR CHRISTMAS EXPLOSION EVER*');
        
        this.count--;
        return this.count <= 0;
    }
}