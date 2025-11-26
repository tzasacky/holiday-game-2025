import * as ex from 'excalibur';
import { Actor } from '../actors/Actor';
import { GameEntity } from '../core/GameEntity';

export abstract class Trigger extends GameEntity {
    constructor(pos: ex.Vector, name: string) {
        super(pos);
        this.name = name;
    }

    abstract onEnter(actor: Actor): void;
    abstract onStay(actor: Actor): void;
    abstract onExit(actor: Actor): void;
}
