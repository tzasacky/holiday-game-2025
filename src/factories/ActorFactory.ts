import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';
import { EventBus } from '../core/EventBus';
import { GameEventNames } from '../core/GameEvents';
import { ActorID } from '../constants/ActorIDs';
import { Logger } from '../core/Logger';

export class ActorFactory {
    private static _instance: ActorFactory;
    private pendingSpawns: Map<string, {
        resolve: (actor: GameActor | null) => void;
        reject: (error: Error) => void;
        timeout: NodeJS.Timeout;
    }> = new Map();

    public static get instance(): ActorFactory {
        if (!this._instance) {
            this._instance = new ActorFactory();
        }
        return this._instance;
    }

    private constructor() {
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Listen for successful actor spawns
        EventBus.instance.on(GameEventNames.ActorSpawned, (event: any) => {
            const spawnId = `${event.defName}_${event.position.x}_${event.position.y}`;
            const pending = this.pendingSpawns.get(spawnId);
            
            if (pending) {
                clearTimeout(pending.timeout);
                pending.resolve(event.actor);
                this.pendingSpawns.delete(spawnId);
            }
        });
    }

    public createActor(type: string, pos: ex.Vector): Promise<GameActor | null> {
        Logger.info(`[ActorFactory] Requesting spawn for ${type} at (${pos.x}, ${pos.y})`);
        
        return new Promise((resolve, reject) => {
            const spawnId = `${type}_${pos.x}_${pos.y}`;
            
            // Set timeout in case spawn fails
            const timeout = setTimeout(() => {
                Logger.error(`[ActorFactory] Spawn timeout for ${type}`);
                this.pendingSpawns.delete(spawnId);
                resolve(null);
            }, 5000);
            
            this.pendingSpawns.set(spawnId, { resolve, reject, timeout });
            
            // Emit spawn request event
            EventBus.instance.emit(GameEventNames.ActorCreate, {
                defName: type,
                gridPos: pos,
                options: {}
            });
        });
    }

    // Convenience methods that delegate to createActor
    public async createHero(pos: ex.Vector): Promise<GameActor | null> {
        return this.createActor(ActorID.HERO, pos);
    }

    public async createSnowman(pos: ex.Vector): Promise<GameActor | null> {
        return this.createActor(ActorID.SNOWMAN, pos);
    }

    public async createSnowSprite(pos: ex.Vector): Promise<GameActor | null> {
        return this.createActor(ActorID.SNOW_SPRITE, pos);
    }

    public async createKrampus(pos: ex.Vector): Promise<GameActor | null> {
        return this.createActor(ActorID.KRAMPUS, pos);
    }
}
