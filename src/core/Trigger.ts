import * as ex from 'excalibur';
import { GameEntity } from '../core/GameEntity';
import { GameActor } from '../components/GameActor';

export abstract class Trigger extends GameEntity {
    constructor(pos: ex.Vector, name: string) {
        super(pos);
        this.name = name;
    }

    abstract onEnter(actor: GameActor): void;
    abstract onStay(actor: GameActor): void;
    abstract onExit(actor: GameActor): void;
}
