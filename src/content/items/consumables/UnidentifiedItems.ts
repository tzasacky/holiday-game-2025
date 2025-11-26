import { Consumable } from '../../../items/Consumable';
import { Actor } from '../../../actors/Actor';
import { ItemID } from '../ItemIDs';
import { Hero } from '../../../actors/Hero';
import { Item } from '../../../items/Item';
import { HotCocoa } from './HotCocoa';
import { CoalSnowball, GlassOrnamentGrenade, Snowball } from './ProjectilesAndGrenades';
import { Fruitcake } from './Fruitcake';
import { RingOfFrost } from '../artifacts/ChristmasRings';
import { ReindeerBell, ChristmasCandle } from '../artifacts/ChristmasArtifacts';
import { SharpIcicleDagger } from '../weapons/IcicleDaggers';
import { WoodenToyHammer } from '../weapons/ToyHammers';
import { CandlestickWand } from '../weapons/ChristmasWands';
import { CozySweater } from '../armor/CozySweater';
import { ClassicSantaSuit } from '../armor/SantaSuits';
import { ElfCloak } from '../armor/ChristmasCloaks';
import { ScrollOfMapping, ScrollOfChristmasSpirit, ScrollOfSnowStorm } from './ChristmasScrolls';
import { Gold } from '../misc/Gold';
import { DamageType } from '../../../mechanics/DamageType';

export class UnlabeledPotion extends Consumable {
    private actualEffect: string;
    
    private static readonly POSSIBLE_EFFECTS = [
        'healing_minor',
        'healing_major',
        'poison_weak',
        'poison_strong',
        'strength_boost',
        'speed_boost',
        'warmth_boost',
        'magic_boost',
        'confusion',
        'blindness',
        'invisibility',
        'levitation'
    ];

    constructor() {
        super(ItemID.UnlabeledPotion, 'Unlabeled Potion', 'A mysterious potion with no label. Could be beneficial... or deadly.');
        
        this.stackable = true;
        this.maxStack = 5;
        this.identified = false;
        
        // Randomly determine what this potion actually does
        this.actualEffect = UnlabeledPotion.POSSIBLE_EFFECTS[
            Math.floor(Math.random() * UnlabeledPotion.POSSIBLE_EFFECTS.length)
        ];
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        if (!this.identified) {
            this.identified = true;
            this.revealTrueNature();
        }
        
        console.log(`${actor.name} drinks the mysterious potion...`);
        
        this.applyEffect(actor);
        
        this.count--;
        return this.count <= 0;
    }

    private revealTrueNature(): void {
        switch (this.actualEffect) {
            case 'healing_minor':
                this.name = 'Weak Healing Potion';
                this.description = 'A basic healing potion that restores a small amount of health.';
                break;
            case 'healing_major':
                this.name = 'Strong Healing Potion';
                this.description = 'A powerful healing potion that restores significant health.';
                break;
            case 'poison_weak':
                this.name = 'Weak Poison';
                this.description = 'A mildly toxic potion that causes minor poisoning.';
                break;
            case 'poison_strong':
                this.name = 'Deadly Poison';
                this.description = 'A lethal poison that deals severe damage over time.';
                break;
            case 'strength_boost':
                this.name = 'Potion of Strength';
                this.description = 'Temporarily increases physical power and damage.';
                break;
            case 'speed_boost':
                this.name = 'Potion of Speed';
                this.description = 'Temporarily increases movement and action speed.';
                break;
            case 'warmth_boost':
                this.name = 'Potion of Warmth';
                this.description = 'Fills you with magical warmth, protecting against cold.';
                break;
            case 'confusion':
                this.name = 'Potion of Confusion';
                this.description = 'Scrambles your thoughts and reverses movement controls.';
                break;
            case 'invisibility':
                this.name = 'Potion of Invisibility';
                this.description = 'Makes you invisible to enemies for a short time.';
                break;
        }
        console.log(`The potion is revealed to be: ${this.name}!`);
    }

    private applyEffect(actor: Actor): void {
        switch (this.actualEffect) {
            case 'healing_minor':
                actor.heal(Math.floor(Math.random() * 15) + 10);
                console.log('You feel slightly better.');
                break;
            case 'healing_major':
                actor.heal(Math.floor(Math.random() * 30) + 25);
                console.log('You feel much better!');
                break;
            case 'poison_weak':
                actor.addTemporaryEffect('Weak Poison', { damage: 2 }, 8);
                console.log('You feel slightly nauseous...');
                break;
            case 'poison_strong':
                actor.addTemporaryEffect('Strong Poison', { damage: 5 }, 10);
                console.log('You feel very sick!');
                break;
            case 'strength_boost':
                actor.addTemporaryEffect('Strength Boost', { strength: 5 }, 30);
                console.log('You feel incredibly strong!');
                break;
            case 'speed_boost':
                actor.addTemporaryEffect('Speed Boost', { speed: 4 }, 25);
                console.log('You feel lightning fast!');
                break;
            case 'warmth_boost':
                actor.warmth = Math.min(actor.maxWarmth, actor.warmth + 50);
                actor.addTemporaryEffect('Magical Warmth', { coldResist: 10 }, 40);
                console.log('Warmth flows through your body!');
                break;
            case 'confusion':
                actor.addTemporaryEffect('Confusion', { randomMovement: true }, 15);
                console.log('Everything seems backwards and confusing!');
                break;
            case 'invisibility':
                actor.addTemporaryEffect('Invisibility', { invisible: true }, 20);
                console.log('You fade from sight!');
                break;
        }
    }

    getDisplayName(): string {
        return this.identified ? this.name : 'Unlabeled Potion';
    }
}

export class WrappedGift extends Consumable {
    private actualContent: string;
    
    private static readonly POSSIBLE_CONTENTS = [
        'gold_small',
        'gold_large',
        'healing_potion',
        'weapon_random',
        'armor_random',
        'jack_in_the_box_trap',
        'coal_lump',
        'rare_artifact',
        'ornament_grenade',
        'scroll_random',
        'nothing_but_paper',
        'mimic_spawn'
    ];

    constructor() {
        super(ItemID.WrappedGift, 'Wrapped Gift', 'A beautifully wrapped present. What could be inside?');
        
        this.stackable = true;
        this.maxStack = 3;
        this.identified = false;
        
        // Randomly determine what's inside
        this.actualContent = WrappedGift.POSSIBLE_CONTENTS[
            Math.floor(Math.random() * WrappedGift.POSSIBLE_CONTENTS.length)
        ];
    }

    public use(actor: Actor): boolean {
        if (this.count <= 0) return false;
        
        console.log(`${actor.name} unwraps the present...`);
        
        this.identified = true;
        this.unwrapGift(actor);
        
        this.count--;
        return this.count <= 0;
    }

    private unwrapGift(actor: Actor): void {
        if (!(actor instanceof Hero)) return;

        switch (this.actualContent) {
            case 'gold_small':
                const smallGold = Math.floor(Math.random() * 20) + 10;
                actor.gold += smallGold;
                console.log(`Inside is ${smallGold} gold coins! A modest gift.`);
                break;
                
            case 'gold_large':
                const largeGold = Math.floor(Math.random() * 100) + 50;
                actor.gold += largeGold;
                console.log(`Inside is ${largeGold} gold coins! A generous gift!`);
                break;
                
            case 'healing_potion':
                actor.addToInventory(new HotCocoa());
                console.log('Inside is a steaming mug of hot cocoa!');
                break;
                
            case 'jack_in_the_box_trap':
                actor.takeDamage(Math.floor(Math.random() * 8) + 5, DamageType.Physical);
                actor.addTemporaryEffect('Startled', { accuracy: -3, speed: -2 }, 5);
                console.log('A JACK-IN-THE-BOX springs out and scares you! *BOING*');
                break;
                
            case 'coal_lump':
                const coal = new CoalSnowball();
                coal.count = 3;
                actor.addToInventory(coal);
                console.log('Inside is a lump of coal... were you naughty?');
                break;
                
            case 'ornament_grenade':
                actor.addToInventory(new GlassOrnamentGrenade());
                console.log('Inside is a beautiful glass ornament... that looks explosive!');
                break;
                
            case 'nothing_but_paper':
                console.log('Inside is... nothing but wrapping paper. What a disappointment.');
                break;
                
            case 'mimic_spawn':
                console.log('The gift suddenly grows teeth and attacks! IT\'S A MIMIC!');
                if (actor.currentLevel) {
                    actor.currentLevel.spawnEnemy('gift_mimic', actor.x, actor.y);
                }
                break;
                
            case 'rare_artifact':
                const artifacts = [new RingOfFrost(), new ReindeerBell(), new ChristmasCandle()];
                const randomArtifact = artifacts[Math.floor(Math.random() * artifacts.length)];
                actor.addToInventory(randomArtifact);
                console.log(`Inside is a rare magical artifact: ${randomArtifact.name}!`);
                break;
                
            case 'weapon_random':
                const weapons = [new SharpIcicleDagger(), new WoodenToyHammer(), new CandlestickWand()];
                const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)];
                actor.addToInventory(randomWeapon);
                console.log(`Inside is a ${randomWeapon.name}!`);
                break;
                
            case 'armor_random':
                const armors = [new CozySweater(), new ClassicSantaSuit(), new ElfCloak()];
                const randomArmor = armors[Math.floor(Math.random() * armors.length)];
                actor.addToInventory(randomArmor);
                console.log(`Inside is a ${randomArmor.name}!`);
                break;
                
            case 'scroll_random':
                const scrolls = [new ScrollOfMapping(), new ScrollOfChristmasSpirit(), new ScrollOfSnowStorm()];
                const randomScroll = scrolls[Math.floor(Math.random() * scrolls.length)];
                actor.addToInventory(randomScroll);
                console.log(`Inside is a ${randomScroll.name}!`);
                break;
        }
    }

    getDisplayName(): string {
        return this.identified ? `Unwrapped Gift (${this.actualContent})` : 'Wrapped Gift';
    }
}