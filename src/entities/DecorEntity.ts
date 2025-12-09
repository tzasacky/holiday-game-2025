import * as ex from 'excalibur';
import { DecorDefinition } from '../data/decor';
import { GraphicsManager } from '../data/graphics';
import { GraphicType } from '../constants/GraphicType';

export class DecorEntity extends ex.Actor {
    public definition: DecorDefinition;
    public decorId: string;

    constructor(pos: ex.Vector, definition: DecorDefinition, id: string, width: number = 32, height: number = 32) {
        super({
            pos: pos,
            width: width,
            height: height,
            anchor: ex.vec(0, 0),
            collisionType: ex.CollisionType.Fixed, // Fixed so it doesn't move, but can participate in collision if needed
            z: definition.placement === 'wall' ? 5 : -0.5 // Wall items higher, floor items lower
        });

        this.definition = definition;
        this.decorId = id;
        
        this.setupGraphics();
    }

    private setupGraphics(): void {
        let graphic: ex.Graphic;
        
        if (this.definition.type === GraphicType.NineSlice) {
            // For NineSlice, we really need the size. 
            // For now, we'll assume the actor's size is set correctly by the creator (DecorSystem).
            // But wait, the creator sets the actor size.
            graphic = GraphicsManager.instance.getNineSliceSprite(this.decorId, this.width, this.height);
        } else if (this.definition.type === GraphicType.Animation) {
             // Animation handling would go here, leveraging GraphicsManager
             // For now, fall back to small decor sprite if animation not fully supported in GraphicsManager yet for decor
             // Actually GraphicsManager.getSmallDecorSprite returns a Sprite. 
             // We might need to extend GraphicsManager to return Animations for decor.
             // For now, let's just use the sprite frame.
             graphic = GraphicsManager.instance.getSmallDecorSprite(this.decorId);
        } else {
            graphic = GraphicsManager.instance.getSmallDecorSprite(this.decorId);
        }
        
        this.graphics.use(graphic);
    }

    public get blocksMovement(): boolean {
        return !!this.definition.blocksMovement;
    }

    public get blocksSight(): boolean {
        return !!this.definition.blocksSight;
    }
}
