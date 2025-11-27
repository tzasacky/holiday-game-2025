import * as ex from 'excalibur';
import { GameEntity } from '../../core/GameEntity';
import { Interactable } from '../../mechanics/Interactable';
import { Actor } from '../../actors/Actor';
import { Hero } from '../../actors/Hero';
import { Resources } from '../../config/resources';
import { ItemID } from '../../constants';

export class Door extends GameEntity implements Interactable {
    public isOpen: boolean = false;
    public isLocked: boolean = false;
    public keyId: string | null = null; // e.g., ItemID.SilverKey, ItemID.GoldKey

    constructor(gridPos: ex.Vector, isLocked: boolean = false, keyId: string | null = null) {
        super(gridPos, { width: 32, height: 32, collisionType: ex.CollisionType.Fixed });
        this.isLocked = isLocked;
        this.keyId = keyId;
    }

    onInitialize(engine: ex.Engine) {
        super.onInitialize(engine);

        const spriteSheet = ex.SpriteSheet.fromImageSource({
            image: Resources.CommonTilesPng,
            grid: {
                rows: 3,
                columns: 8,
                spriteWidth: 32,
                spriteHeight: 32
            }
        });

        const closedSprite = spriteSheet.getSprite(0, 0); // Row 1, Col 0
        const openSprite = spriteSheet.getSprite(1, 0);   // Row 1, Col 1

        this.graphics.add('closed', closedSprite!);
        this.graphics.add('open', openSprite!);

        this.updateVisuals();
    }

    interact(actor: Actor): boolean {
        if (this.isOpen) {
            this.close();
            return true;
        } else {
            if (this.isLocked) {
                if (actor instanceof Hero) {
                    // Check for key
                    if (this.keyId && actor.inventory.hasItem(this.keyId)) {
                        console.log(`Unlocked with ${this.keyId}!`);
                        actor.inventory.removeItemByName(this.keyId, 1);
                        this.isLocked = false;
                        this.open();
                        return true;
                    } else {
                        console.log("Locked! Needs key: " + this.keyId);
                        // TODO: Show UI message
                        return false;
                    }
                }
                return false;
            } else {
                this.open();
                return true;
            }
        }
    }

    open() {
        this.isOpen = true;
        this.body.collisionType = ex.CollisionType.Passive;
        this.updateVisuals();
    }

    close() {
        // Check if blocked
        // For now, just close
        this.isOpen = false;
        this.body.collisionType = ex.CollisionType.Fixed;
        this.updateVisuals();
    }

    private updateVisuals() {
        // Use the sprites we loaded
        if (this.isOpen) {
            this.graphics.use('open');
        } else {
            this.graphics.use('closed');
        }
    }
}
