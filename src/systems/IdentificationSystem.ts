import { GameActor } from '../components/GameActor';
import { ItemEntity } from '../factories/ItemFactory';
import { EquipmentSystem } from './EquipmentSystem';
import { ItemID } from '../constants/ItemIDs';

interface IdentificationProcess {
    item: ItemEntity;
    turnsRemaining: number;
    actor: GameActor;
}

export class IdentificationSystem {
    private static _instance: IdentificationSystem;
    
    public static get instance(): IdentificationSystem {
        if (!this._instance) {
            this._instance = new IdentificationSystem();
        }
        return this._instance;
    }

    private static readonly BASE_IDENTIFICATION_TIME = 150;
    private static readonly WISDOM_BONUS_THRESHOLD = 10;
    
    private static readonly IDENTIFICATION_SOURCES = [
        'ScrollOfIdentify',
        'MagnifyingGlass',
        'CrystalBall',
        'ElvenEyes',
        'SantasSight'
    ];

    private identificationQueue: Map<string, IdentificationProcess> = new Map();

    public startIdentification(actor: GameActor, item: EnhancedEquipment): boolean {
        if (item.identified) {
            console.log(`${item.getDisplayName()} is already identified.`);
            return false;
        }

        const itemKey = `${actor.entityId}_${item.id}_${Date.now()}`;
        let identificationTime = IdentificationSystem.BASE_IDENTIFICATION_TIME;
        
        // Faster identification for high wisdom/intelligence
        const stats = actor.getGameComponent('stats') as any;
        const intelligence = stats?.getStat('intelligence') || 0;
        const wisdomBonus = Math.max(0, intelligence - IdentificationSystem.WISDOM_BONUS_THRESHOLD);
        identificationTime = Math.max(25, identificationTime - Math.floor(wisdomBonus * 5));
        
        // Check for identification aids
        if (this.hasIdentificationAid(actor)) {
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
        
        // If the item is cursed and the actor equips it, trigger immediate identification
        if (item.cursed && this.isItemEquipped(actor, item)) {
            console.log('⚡ The cursed item forces you to understand its true nature!');
            this.completeIdentification(itemKey);
            return true;
        }

        return true;
    }

    public instantIdentify(actor: GameActor, item: EnhancedEquipment): boolean {
        if (item.identified) {
            return false;
        }

        EquipmentSystem.identifyItem(item);
        console.log(`${item.getDisplayName()} has been instantly identified!`);
        
        if (item.cursed && this.isItemEquipped(actor, item)) {
            item.unremovableWhenCursed = true;
            console.log('The cursed item binds to you!');
        }

        return true;
    }

    public processTick(): void {
        const completedIdentifications: string[] = [];

        for (const [key, identification] of this.identificationQueue.entries()) {
            identification.turnsRemaining--;

            if (identification.turnsRemaining <= 0) {
                this.completeIdentification(key);
                completedIdentifications.push(key);
            } else {
                // Progress updates could go here
            }
        }

        completedIdentifications.forEach(key => {
            this.identificationQueue.delete(key);
        });
    }

    private completeIdentification(key: string): void {
        const identification = this.identificationQueue.get(key);
        if (!identification) return;

        const { item, actor } = identification;
        
        console.log(`You finish studying ${item.getDisplayName()}...`);
        EquipmentSystem.identifyItem(item);

        if (item.cursed && this.isItemEquipped(actor, item)) {
            item.unremovableWhenCursed = true;
            console.log('The cursed energy binds the item to your very soul!');
            // Apply curse effects logic here if needed
        }

        // Grant XP
        // actor.gainExperience(...) - need to check how XP is handled
    }

    private hasIdentificationAid(actor: GameActor): boolean {
        const inventory = actor.getGameComponent('inventory') as any;
        if (!inventory || !inventory.items) return false;
        
        return inventory.items.some((item: any) => 
            item !== null && IdentificationSystem.IDENTIFICATION_SOURCES.includes(item.id)
        );
    }

    private isItemEquipped(actor: GameActor, item: EnhancedEquipment): boolean {
        const equipment = actor.getGameComponent('equipment') as any;
        if (!equipment) return false;
        return equipment.getEquipment('weapon') === item || equipment.getEquipment('armor') === item;
    }
}
