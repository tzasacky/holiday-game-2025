import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';
import { EventBus } from '../core/EventBus';
import { GameEventNames } from '../core/GameEvents';
import { ActorID } from '../constants/ActorIDs';
import { Logger } from '../core/Logger';
import { ActorSpawnSystem } from '../components/ActorSpawnSystem';

export class ActorFactory {
    private static _instance: ActorFactory;

    public static get instance(): ActorFactory {
        if (!this._instance) {
            this._instance = new ActorFactory();
        }
        return this._instance;
    }

    private constructor() {
        // No event listeners needed for synchronous factory
    }

    public createActor(type: string, pos: ex.Vector): GameActor | null {
        Logger.info(`[ActorFactory] Requesting spawn for ${type} at (${pos.x}, ${pos.y})`);
        
        try {
            // Direct synchronous call to ActorSpawnSystem
            const actor = ActorSpawnSystem.instance.spawnActor(type, pos);
            return actor;
        } catch (error) {
            Logger.error(`[ActorFactory] Failed to create actor ${type}:`, error);
            return null;
        }
    }

    public createHero(pos: ex.Vector): GameActor | null {
        return this.createActor(ActorID.HERO, pos);
    }
}
