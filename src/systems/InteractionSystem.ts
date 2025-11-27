import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';
import { DataManager } from '../core/DataManager';
import { InteractableDefinition, InteractableType } from '../data/interactables';
import { LootSystem } from './LootSystem';
import { EventBus } from '../core/EventBus';
import { GameEventNames } from '../core/GameEvents';

export class InteractionSystem {
    private static _instance: InteractionSystem;
    
    public static get instance(): InteractionSystem {
        if (!this._instance) {
            this._instance = new InteractionSystem();
        }
        return this._instance;
    }

    public handleInteraction(actor: GameActor, target: GameActor): boolean {
        // Assume target is an interactable entity
        // We use target.name as the ID for now, or we should have a component storing the ID
        const interactableId = target.name; 
        const def = DataManager.instance.query<InteractableDefinition>('interactable', interactableId);
        
        if (!def) {
            // It might be an actor (NPC)
            // Handle NPC interaction here if needed
            return false;
        }

        console.log(`${actor.name} interacts with ${def.name}`);

        // Check conditions (key required, etc.)
        if (def.requiresKey) {
            // Check if actor has key
            // const hasKey = actor.inventory.hasItem(def.requiresKey);
            // if (!hasKey) { console.log("Locked!"); return false; }
            // For now, assume unlocked or handle later
        }

        switch (def.type) {
            case InteractableType.CONTAINER:
                return this.handleContainer(actor, target, def);
            case InteractableType.DOOR:
                return this.handleDoor(actor, target, def);
            case InteractableType.PORTAL:
                return this.handlePortal(actor, target, def);
            case InteractableType.CRAFTING:
                return this.handleCrafting(actor, target, def);
            default:
                // Generic effects
                return this.applyEffects(actor, target, def);
        }
    }

    private handleContainer(actor: GameActor, target: GameActor, def: InteractableDefinition): boolean {
        // Check if already opened
        // We need state on the target entity.
        // For now, assume if it exists, it's closed (and we destroy/change it after open)
        
        console.log(`Opening ${def.name}...`);
        
        // Generate loot
        const loot = LootSystem.instance.generateContainerLoot(def.id);
        
        if (loot.length > 0) {
            console.log(`Found ${loot.length} items!`);
            EventBus.instance.emit(GameEventNames.LootGenerated, {
                items: loot,
                position: target.gridPos.clone(),
                sourceId: target.entityId
            });
        } else {
            console.log("It's empty.");
        }

        // Change state to open or destroy
        // If it has a "consumeOnUse" property
        if (def.consumeOnUse) {
            target.kill(); // Remove from world
        } else {
            // Change graphics to open state if possible
            // target.setAnimation('open');
        }

        return true;
    }

    private handleDoor(actor: GameActor, target: GameActor, def: InteractableDefinition): boolean {
        console.log(`Opening door...`);
        // Play open animation
        // Remove collision
        // For now, just kill it to "open" it (simplest migration)
        // Or replace with "Open Door" entity
        target.kill();
        return true;
    }

    private handlePortal(actor: GameActor, target: GameActor, def: InteractableDefinition): boolean {
        console.log(`Using portal...`);
        // Trigger level change or teleport
        // EventBus.emit(GameEventNames.LevelChange, ...);
        return true;
    }

    private handleCrafting(actor: GameActor, target: GameActor, def: InteractableDefinition): boolean {
        console.log(`Using ${def.name} for crafting...`);
        // Open crafting UI
        return true;
    }

    private applyEffects(actor: GameActor, target: GameActor, def: InteractableDefinition): boolean {
        if (def.effects) {
            def.effects.forEach(effect => {
                // Apply effect
                console.log(`Applied effect: ${effect.type}`);
            });
            return true;
        }
        return false;
    }
}
