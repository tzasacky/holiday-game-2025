import { GameEntity } from '../core/GameEntity';
import * as ex from 'excalibur';
import { Resources } from '../config/resources';

export enum TrapType {
    IceSlip = 'ice_slip',
    FallingIcicle = 'falling_icicle',
    ExplodingOrnament = 'exploding_ornament'
}

export abstract class Trap extends GameEntity {
    public trapType: TrapType;
    public isHidden: boolean = true;
    public damage: number = 0;

    constructor(gridPos: ex.Vector, type: TrapType) {
        super(gridPos, { width: 16, height: 16, collisionType: ex.CollisionType.Passive });
        this.trapType = type;
    }

    abstract trigger(actor: GameEntity): void;

    onInitialize(engine: ex.Engine) {
        super.onInitialize(engine);
        this.on('collisionstart', (evt) => this.handleCollision(evt));
    }

    handleCollision(evt: ex.CollisionStartEvent): void {
        if (evt.other.owner instanceof GameEntity) {
            this.trigger(evt.other.owner);
        }
    }

    reveal() {
        this.isHidden = false;
        this.graphics.opacity = 1;
    }
}

export class IceSlipTrap extends Trap {
    constructor(gridPos: ex.Vector) {
        super(gridPos, TrapType.IceSlip);
        // Visuals
        const sheet = ex.SpriteSheet.fromImageSource({
            image: Resources.SnowyVillageTilesPng,
            grid: { spriteWidth: 32, spriteHeight: 32, rows: 3, columns: 8 }
        });
        this.graphics.use(sheet.getSprite(2, 0)); // Packed Ice
        this.graphics.opacity = 0; // Hidden initially
    }

    trigger(actor: GameEntity): void {
        if (this.isHidden) {
            console.log(`${actor.name} triggered an Ice Slip Trap!`);
            this.reveal();
            // TODO: Apply "Slip" effect or damage
        }
    }
}
