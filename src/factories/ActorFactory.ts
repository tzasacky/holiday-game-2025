import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';
import { DataManager } from '../core/DataManager';
import { ActorSpawnSystem } from '../components/ActorSpawnSystem';
import { EventBus } from '../core/EventBus';
import { GameEventNames, FactoryCreateEvent } from '../core/GameEvents';

export class ActorFactory {
    private static _instance: ActorFactory;

    public static get instance(): ActorFactory {
        if (!this._instance) {
            this._instance = new ActorFactory();
        }
        return this._instance;
    }

    public createActor(type: string, pos: ex.Vector): GameActor | null {
        console.log(`[ActorFactory] Creating actor ${type} via unified component system`);
        
        // Use the unified ActorSpawnSystem instead of old class instantiation
        try {
            const actor = ActorSpawnSystem.instance.spawnActor(type, pos);
            
            // Emit creation event for monitoring
            EventBus.instance.emit(GameEventNames.ActorCreate, new FactoryCreateEvent(type, actor));
            
            console.log(`[ActorFactory] Successfully created ${type} with components:`, Array.from(actor.gameComponents.keys()));
            return actor;
            
        } catch (error) {
            console.error(`[ActorFactory] Failed to create actor ${type}:`, error);
            return null;
        }
    }

    // Convenience methods that delegate to ActorSpawnSystem
    public createHero(pos: ex.Vector): GameActor | null {
        return this.createActor('Hero', pos);
    }

    public createSnowman(pos: ex.Vector): GameActor | null {
        return this.createActor('Snowman', pos);
    }

    public createSnowSprite(pos: ex.Vector): GameActor | null {
        return this.createActor('Snow Sprite', pos);
    }

    public createKrampus(pos: ex.Vector): GameActor | null {
        return this.createActor('Krampus', pos);
    }
}
