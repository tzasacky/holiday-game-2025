import { Actor } from '../actors/Actor';
import { Hero } from '../actors/Hero';
import { EnhancedEquipment } from './EquipmentSystem';
import { Item } from '../items/Item';

export class IdentificationSystem {
    private static readonly BASE_IDENTIFICATION_TIME = 150; // ticks (roughly 1 floor of exploration)
    private static readonly WISDOM_BONUS_THRESHOLD = 10;
    
    // Items that provide identification abilities
     private static readonly IDENTIFICATION_SOURCES = [
        'ScrollOfIdentify',
        'MagnifyingGlass',
        'CrystalBall',
        'ElvenEyes',
        'SantasSight'
    ];

    private static identificationQueue: Map<string, {
        item: EnhancedEquipment;
        turnsRemaining: number;
        actor: Hero;
    }> = new Map();

    static startIdentification(actor: Hero, item: EnhancedEquipment): boolean {
        if (item.identified) {
            console.log(`${item.getDisplayName()} is already identified.`);
            return false;
        }

        const itemKey = `${actor.id}_${item.id}_${Date.now()}`;
        let identificationTime = this.BASE_IDENTIFICATION_TIME;
        
        // Faster identification for high wisdom/intelligence
        const wisdomBonus = Math.max(0, (actor.intelligence || 0) - this.WISDOM_BONUS_THRESHOLD);
        identificationTime = Math.max(25, identificationTime - Math.floor(wisdomBonus * 5));
        
        // Check for identification aids
        const hasIdentificationAid = this.hasIdentificationAid(actor);
        if (hasIdentificationAid) {
            identificationTime = Math.max(50, Math.floor(identificationTime * 0.6));
            console.log('🔍 Your identification tools help focus your study!');
        }

        this.identificationQueue.set(itemKey, {
            item,
            turnsRemaining: identificationTime,
            actor
        });

        console.log(`🤔 You begin carefully examining ${item.getDisplayName()}...`);
        console.log(`📚 This will take approximately ${Math.floor(identificationTime / 10)} moves to complete.`);
        console.log('💡 Continue exploring while studying - identification happens passively.');
        
        // If the item is cursed and the actor equips it, trigger immediate identification
        if (item.cursed && this.isItemEquipped(actor, item)) {
            console.log('⚡ The cursed item forces you to understand its true nature!');
            this.completeIdentification(itemKey);
            return true;
        }

        return true;
    }

    static instantIdentify(actor: Hero, item: EnhancedEquipment): boolean {
        if (item.identified) {
            console.log(`${item.getDisplayName()} is already identified.`);
            return false;
        }

        item.identify();
        console.log(`${item.getDisplayName()} has been instantly identified!`);
        
        // If cursed and equipped, it becomes unremovable
        if (item.cursed && this.isItemEquipped(actor, item)) {
            item.unremovableWhenCursed = true;
            console.log('The cursed item binds to you!');
        }

        return true;
    }

    static processTick(): void {
        const completedIdentifications: string[] = [];

        for (const [key, identification] of this.identificationQueue.entries()) {
            identification.turnsRemaining--;

            if (identification.turnsRemaining <= 0) {
                this.completeIdentification(key);
                completedIdentifications.push(key);
            } else {
                // Provide progress updates at meaningful intervals
                const remaining = identification.turnsRemaining;
                const total = this.BASE_IDENTIFICATION_TIME;
                
                if (remaining === Math.floor(total * 0.75)) {
                    console.log(`🔍 Still examining ${identification.item.getDisplayName()}... (75% remaining)`);
                } else if (remaining === Math.floor(total * 0.5)) {
                    console.log(`🤓 Making progress on ${identification.item.getDisplayName()}... (halfway done)`);
                } else if (remaining === Math.floor(total * 0.25)) {
                    console.log(`📖 Almost understand ${identification.item.getDisplayName()}... (25% remaining)`);
                } else if (remaining === 10) {
                    console.log(`✨ Final insights into ${identification.item.getDisplayName()}... (moments left)`);
                }
            }
        }

        // Clean up completed identifications
        completedIdentifications.forEach(key => {
            this.identificationQueue.delete(key);
        });
    }

    private static completeIdentification(key: string): void {
        const identification = this.identificationQueue.get(key);
        if (!identification) return;

        const { item, actor } = identification;
        
        console.log(`You finish studying ${item.getDisplayName()}...`);
        item.identify();

        // Special effects for identifying cursed items while equipped
        if (item.cursed && this.isItemEquipped(actor, item)) {
            item.unremovableWhenCursed = true;
            console.log('The cursed energy binds the item to your very soul!');
            
            // Apply immediate curse effects
            this.applyCurseEffects(actor, item);
        }

        // Experience gain for successful identification
        this.grantIdentificationExperience(actor, item);
    }

    private static applyCurseEffects(actor: Hero, item: EnhancedEquipment): void {
        item.curses.forEach(curse => {
            switch (curse.type) {
                case 'bloodthirsty':
                    console.log('You feel an urge to attack anything that moves!');
                    actor.addTemporaryEffect('Bloodlust', { 
                        attackAllies: true
                    }, -1); // Permanent until cleansed
                    break;
                
                case 'freezing':
                    console.log('An intense cold begins draining your warmth!');
                    actor.addTemporaryEffect('Cursed Cold', {
                        warmthDrain: curse.severity * 3
                    }, -1);
                    break;
                
                case 'naughty_list':
                    console.log('You feel Santa\'s disapproving gaze upon you...');
                    actor.addTemporaryEffect('Naughty Listed', {
                        krampusTarget: true
                    }, -1);
                    break;
                
                case 'melting':
                    console.log('The item begins to deteriorate rapidly!');
                    // This would be handled by the item degradation system
                    break;
                
                case 'coal_touch':
                    console.log('Everything you touch turns to coal!');
                    actor.addTemporaryEffect('Midas Curse', {
                        foodToCoal: curse.severity * 5
                    }, -1);
                    break;
            }
        });
    }

    private static grantIdentificationExperience(actor: Hero, item: EnhancedEquipment): void {
        const baseExp = item.tier * 10;
        let experienceGained = baseExp;
        
        // Bonus experience for identifying cursed items
        if (item.cursed) {
            experienceGained += item.curses.length * 15;
        }
        
        // Bonus experience for rare enchantments
        if (item.enchantments.length > 0) {
            experienceGained += item.enchantments.length * 5;
        }

        console.log(`You gain ${experienceGained} identification experience!`);
        actor.gainExperience(experienceGained);
    }

    private static hasIdentificationAid(actor: Hero): boolean {
        // Check if actor has any identification-enhancing items
        if (!actor.inventory) return false;
        
        return actor.inventory.items.some(item => 
            item !== null && this.IDENTIFICATION_SOURCES.includes(item.id.toString())
        ) || false;
    }

    private static isItemEquipped(actor: Hero, item: EnhancedEquipment): boolean {
        return actor.weapon === item || actor.armor === item || 
               (actor.accessories && actor.accessories.includes(item));
    }

    static cancelIdentification(actor: Hero, item: EnhancedEquipment): boolean {
        for (const [key, identification] of this.identificationQueue.entries()) {
            if (identification.actor === actor && identification.item === item) {
                this.identificationQueue.delete(key);
                console.log(`Stopped identifying ${item.getDisplayName()}.`);
                return true;
            }
        }
        return false;
    }

    static getIdentificationProgress(actor: Hero, item: EnhancedEquipment): number {
        for (const identification of this.identificationQueue.values()) {
            if (identification.actor === actor && identification.item === item) {
                const totalTime = this.BASE_IDENTIFICATION_TIME;
                const remaining = identification.turnsRemaining;
                return ((totalTime - remaining) / totalTime) * 100;
            }
        }
        return 0;
    }

    static isCurrentlyIdentifying(actor: Hero): boolean {
        for (const identification of this.identificationQueue.values()) {
            if (identification.actor === actor) {
                return true;
            }
        }
        return false;
    }

    static getItemBeingIdentified(actor: Hero): EnhancedEquipment | null {
        for (const identification of this.identificationQueue.values()) {
            if (identification.actor === actor) {
                return identification.item;
            }
        }
        return null;
    }

    // Utility methods for special identification scenarios
    static identifyOnEquip(actor: Hero, item: EnhancedEquipment): void {
        if (!item.identified && item.cursed) {
            console.log('As you equip the item, its true nature is revealed!');
            this.instantIdentify(actor, item);
        }
    }

    static identifyOnDeath(actor: Hero): void {
        // When an actor dies, they learn the properties of all their equipment
        [actor.weapon, actor.armor, ...(actor.accessories || [])]
            .filter((item): item is EnhancedEquipment => 
                item instanceof EnhancedEquipment && !item.identified)
            .forEach(item => {
                console.log(`In your final moments, you understand ${item.getDisplayName()}...`);
                item.identify();
            });
    }

    static getMysteriousDescription(item: EnhancedEquipment): string {
        const descriptions = [
            'This item pulses with an unknown energy...',
            'Strange symbols glow faintly on its surface...',
            'You sense powerful magic within, but cannot determine its nature...',
            'The item feels unusually warm to the touch...',
            'A faint holiday melody seems to emanate from within...',
            'Snowflakes appear and disappear around the item...',
            'The item occasionally sparkles with Christmas lights...',
            'You smell cinnamon and pine when holding this item...'
        ];
        
        const mysteriousHints = descriptions[Math.floor(Math.random() * descriptions.length)];
        
        // Give subtle hints about curses
        if (item.cursed && !item.curses.every(c => c.hidden)) {
            const curseHints = [
                'Something feels wrong about this item...',
                'Dark energy seems to swirl around it...',
                'You feel uneasy when touching it...',
                'The item seems to whisper threats...',
                'Coal dust appears to fall from it occasionally...'
            ];
            return mysteriousHints + '\n' + curseHints[Math.floor(Math.random() * curseHints.length)];
        }
        
        return mysteriousHints;
    }
}