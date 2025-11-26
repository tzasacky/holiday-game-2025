import { Artifact } from '../../../items/Artifact';
import { Resources } from '../../../config/resources';
import { Actor } from '../../../actors/Actor';
import { Hero } from '../../../actors/Hero';
import { Level } from '../../../dungeon/Level';
import { StatBoostEffect } from '../../../mechanics/Effect';
import { ItemID } from '../ItemIDs';

export class NewYearsClock extends Artifact {
    public passiveEffects = [
        new StatBoostEffect('Temporal Awareness', 'perception', 8),
        new StatBoostEffect('Countdown Precision', 'accuracy', 6)
    ];
    
    private timeCharges: number = 3;
    private maxCharges: number = 3;
    private rechargeTimer: number = 0;

    constructor() {
        super(ItemID.NewYearsClock, 'New Year\'s Clock', 'A mystical clock that chimes at midnight. Can manipulate time itself during crucial moments.');
    }

    use(actor: Actor): boolean {
        if (this.timeCharges <= 0) {
            console.log('The clock face is dim... wait for midnight to recharge. ⏰');
            return false;
        }

        this.activateRandomTimeEffect(actor);
        return true;
    }

    private activateRandomTimeEffect(actor: Actor): void {
        const effects = ['rewind', 'timestop', 'haste'];
        const randomEffect = effects[Math.floor(Math.random() * effects.length)];
        
        switch (randomEffect) {
            case 'rewind':
                this.activateRewind(actor);
                break;
            case 'timestop':
                this.activateTimeStop(actor);
                break;
            case 'haste':
                this.activateHaste(actor);
                break;
        }
        
        this.timeCharges--;
        console.log(`⚡ Time charges remaining: ${this.timeCharges}`);
    }

    private activateRewind(actor: Actor): void {
        console.log('🔄 Time flows backwards! Your wounds close! 🔄');
        console.log('*TICK TOCK TICK TOCK* The clock chimes once...');
        
        // Simpler "Rewind": Just heal and cleanse
        actor.heal(20);
        actor.warmth = Math.min(actor.maxWarmth, actor.warmth + 30);
        
        if (actor instanceof Hero) {
            actor.removeAllNegativeEffects();
        }
    }

    private activateTimeStop(actor: Actor): void {
        console.log('⏸️ Time itself freezes! Enemies are stunned! ⏸️');
        console.log('*DONG DONG DONG* The clock chimes midnight...');
        
        // Freeze enemies (Stun)
        if (actor.currentLevel instanceof Level) {
            actor.currentLevel.getAllEntities()
                .filter(entity => entity !== actor && entity.isEnemy)
                .forEach(entity => {
                    // Assuming we have a Stun effect or similar
                    // For now, just reduce speed to 0
                    entity.addTemporaryEffect('Time Stopped', {
                        speed: -100, // Effectively stopped
                        accuracy: -100
                    }, 10);
                });
        }
        
        console.log('Enemies are frozen in time!');
    }

    private activateHaste(actor: Actor): void {
        console.log('⚡ Time accelerates around you! You move like lightning! ⚡');
        console.log('*tick-tick-tick-tick* The clock spins rapidly...');
        
        actor.addTemporaryEffect('Temporal Acceleration', {
            description: 'Moving at double speed through time',
            speed: 10,
            dexterity: 10
        }, 30);
        
        // Visual effect
        actor.addVisualEffect('time_haste', 30);
    }

    onTurnEnd(actor: Actor): void {
        this.rechargeTimer++;
        
        // Recharge at "midnight" (every 100 ticks)
        if (this.rechargeTimer >= 100 && this.timeCharges < this.maxCharges) {
            this.timeCharges = this.maxCharges;
            this.rechargeTimer = 0;
            console.log('🕛 DONG! DONG! DONG! The New Year\'s Clock strikes midnight! 🕛');
            console.log('⚡ All time charges restored! ⚡');
        }
    }

    getDisplayName(): string {
        return `${this.name} (${this.timeCharges}/${this.maxCharges})`;
    }
}

export class ChampagneFlute extends Artifact {
    public passiveEffects = [
        new StatBoostEffect('Celebration Spirit', 'charisma', 10),
        new StatBoostEffect('Liquid Courage', 'strength', 5) // morale -> strength
    ];
    
    private champagneCharges: number = 5;

    constructor() {
        super(ItemID.ChampagneFlute, 'Champagne Flute', 'An elegant crystal flute that never empties. Each sip grants courage and celebration magic.');
    }

    use(actor: Actor): boolean {
        if (this.champagneCharges <= 0) {
            console.log('🍾 The flute is empty... it will refill at the next celebration! 🍾');
            return false;
        }

        console.log(`${actor.name} raises the Champagne Flute in celebration! 🥂`);
        console.log('🍾 "Cheers to new beginnings!" *CLINK* 🍾');
        
        this.drinkChampagne(actor);
        this.champagneCharges--;
        
        return true;
    }

    private drinkChampagne(actor: Actor): void {
        // Immediate effects
        actor.heal(Math.floor(Math.random() * 15) + 10);
        actor.warmth = Math.min(actor.maxWarmth, actor.warmth + 20);
        
        // Celebration effects
        actor.addTemporaryEffect('Champagne Celebration', {
            description: 'Feeling bubbly and confident!',
            charisma: 8,
            luck: 12,
            strength: 5
        }, 75);
        
        console.log('🥂 The champagne fills you with joy and confidence! 🥂');
    }

    onNewYear(): void {
        this.champagneCharges = 5;
        console.log('🎉 HAPPY NEW YEAR! The Champagne Flute overflows with celebration! 🎉');
    }

    getDisplayName(): string {
        return `${this.name} (${this.champagneCharges} sips)`;
    }
}

export class CountdownCalendar extends Artifact {
    public passiveEffects = [
        new StatBoostEffect('Future Sight', 'intelligence', 7),
        new StatBoostEffect('Temporal Planning', 'perception', 6) // wisdom -> perception
    ];
    
    private daysRemaining: number = 365;
    private canAlterFate: boolean = true;

    constructor() {
        super(ItemID.CountdownCalendar, 'Countdown Calendar', 'A mystical calendar that counts down to significant events. Can alter destiny itself.');
    }

    use(actor: Actor): boolean {
        if (!this.canAlterFate) {
            console.log('📅 The calendar pages are still settling from the last fate alteration... 📅');
            return false;
        }

        console.log(`${actor.name} tears a page from the Countdown Calendar...`);
        console.log('📅 Time and fate bend to your will! 📅');
        
        this.alterFate(actor);
        this.canAlterFate = false;
        
        // Recharge after 200 ticks
        setTimeout(() => {
            this.canAlterFate = true;
            console.log('📅 The calendar shimmers - fate can be altered once more! 📅');
        }, 200);
        
        return true;
    }

    private alterFate(actor: Actor): void {
        const fateAlterations = [
            () => {
                console.log('⏪ You tear off yesterday\'s page - a past mistake is undone! ⏪');
                this.undoRecentMistake(actor);
            },
            () => {
                console.log('📋 You flip to tomorrow - you see your immediate future! 📋');
                this.revealNearFuture(actor);
            },
            () => {
                console.log('🎯 You circle an important date - fate aligns in your favor! 🎯');
                this.alignFate(actor);
            }
        ];
        
        const randomAlteration = fateAlterations[Math.floor(Math.random() * fateAlterations.length)];
        randomAlteration();
        
        this.daysRemaining--;
        console.log(`Days remaining on calendar: ${this.daysRemaining}`);
    }

    private undoRecentMistake(actor: Actor): void {
        // Undo negative effects and restore some resources
        if (actor instanceof Hero) {
            actor.removeAllNegativeEffects();
            actor.heal(20);
            actor.warmth = Math.min(actor.maxWarmth, actor.warmth + 30);
        }
    }

    private revealNearFuture(actor: Actor): void {
        actor.addTemporaryEffect('Future Sight', {
            description: 'You can see the immediate future',
            accuracy: 15,
            perception: 10
        }, 100);
        
        console.log('🔮 You feel prepared for what is to come. 🔮');
    }

    private alignFate(actor: Actor): void {
        actor.addTemporaryEffect('Fate\'s Favor', {
            description: 'Destiny smiles upon you',
            luck: 20,
            strength: 5
        }, 150);
        
        console.log('🌟 The stars align in your favor! 🌟');
    }

    getDisplayName(): string {
        return `${this.name} (${this.daysRemaining} days)`;
    }
}