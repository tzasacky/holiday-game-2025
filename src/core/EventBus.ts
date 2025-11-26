import * as ex from 'excalibur';
import { GameEventMap } from './GameEvents';

export class EventBus extends ex.EventEmitter<GameEventMap> {
    private static _instance: EventBus;

    private constructor() {
        super();
    }

    public static get instance(): EventBus {
        if (!this._instance) {
            this._instance = new EventBus();
        }
        return this._instance;
    }
}
