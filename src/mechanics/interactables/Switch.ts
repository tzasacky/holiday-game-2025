import * as ex from 'excalibur';
import { Actor } from '../../actors/Actor';
import { Interactable } from '../Interactable';
import { GameEntity } from '../../core/GameEntity';

export class Switch extends GameEntity implements Interactable {
    public isOn: boolean = false;
    public onToggle: (isOn: boolean) => void;

    constructor(pos: ex.Vector, public name: string, private offSprite: ex.Graphic, private onSprite: ex.Graphic) {
        super(pos);
        this.graphics.use(offSprite);
        this.onToggle = () => {};
    }

    interact(actor: Actor): boolean {
        this.toggle();
        return true;
    }

    public toggle() {
        this.isOn = !this.isOn;
        console.log(`${this.name} turned ${this.isOn ? 'ON' : 'OFF'}.`);
        
        if (this.isOn) {
            this.graphics.use(this.onSprite);
        } else {
            this.graphics.use(this.offSprite);
        }
        
        this.onToggle(this.isOn);
    }
}
