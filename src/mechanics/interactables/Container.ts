import * as ex from 'excalibur';
import { Actor } from '../../actors/Actor';
import { Hero } from '../../actors/Hero';
import { Interactable } from '../Interactable';
import { Item } from '../../items/Item';
import { GameEntity } from '../../core/GameEntity';

export class Container extends GameEntity implements Interactable {
    public items: Item[] = [];
    public isOpen: boolean = false;
    public locked: boolean = false;
    public keyId: string | null = null;

    constructor(pos: ex.Vector, public name: string, sprite: ex.Graphic) {
        super(pos);
        this.graphics.use(sprite);
    }

    interact(actor: Actor): boolean {
        if (this.locked) {
            // Check for key
            // TODO: Implement Key check
            console.log(`${this.name} is locked.`);
            return false;
        }

        if (!this.isOpen) {
            this.open(actor);
            return true;
        } else {
            // Already open, maybe show contents again?
            console.log(`${this.name} is empty.`);
            return false;
        }
    }

    private open(actor: Actor) {
        this.isOpen = true;
        console.log(`${actor.name} opened ${this.name}.`);
        
        // Give items to actor
        if (this.items.length > 0) {
            if (actor instanceof Hero) {
                this.items.forEach(item => {
                    console.log(`Found ${item.name}!`);
                    actor.inventory.addItem(item);
                });
            } else {
                console.log(`${actor.name} cannot pick up items.`);
            }
            this.items = [];
            // Change sprite to open state if available
        } else {
            console.log("It's empty.");
        }
    }
}
