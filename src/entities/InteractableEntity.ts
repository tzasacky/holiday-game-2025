import * as ex from 'excalibur';
import { InteractableComponent } from '../components/InteractableComponent';
import { InteractableDefinition } from '../data/interactables';

// Type definition for interacting entities
interface InteractingEntity {
    name: string;
    pos?: ex.Vector;
}

/**
 * InteractableEntity - Simple entity for interactable objects
 * Does NOT participate in turn management or combat systems
 * Extends ex.Actor directly, NOT GameEntity (which is for turn-based actors)
 */
export class InteractableEntity extends ex.Actor {
    public interactableComponent: InteractableComponent;
    public definition: InteractableDefinition;

    public gridPos: ex.Vector;

    constructor(gridPos: ex.Vector, definition: InteractableDefinition, config: any = {}) {
        super({ 
            width: 32, 
            height: 32, 
            collisionType: ex.CollisionType.Fixed 
        });
        
        this.gridPos = gridPos;
        this.definition = definition;
        this.name = definition.name;
        
        // Position on grid
        this.pos = this.gridPos.scale(32).add(ex.vec(16, 16));
        
        // Create the interactable component
        this.interactableComponent = new InteractableComponent(this, definition, config);
        
        // Set up graphics
        this.setupGraphics();
    }

    private setupGraphics(): void {
        const graphic = this.interactableComponent.getGraphicsForCurrentState();
        this.graphics.use(graphic);
    }

    public interact(entity: InteractingEntity): boolean {
        const result = this.interactableComponent.interact(entity);
        
        if (result.success) {
            // Update graphics after interaction
            this.setupGraphics();
        }
        
        return result.success;
    }

    public canInteract(entity: InteractingEntity): boolean {
        return this.interactableComponent.canInteract(entity);
    }

    public shouldBlockMovement(): boolean {
        return this.interactableComponent.shouldBlockMovement();
    }

    public get currentState() {
        return this.interactableComponent.currentState;
    }

    public setLevelId(levelId: string): void {
        this.interactableComponent.setLevelId(levelId);
    }

    onInitialize(engine: ex.Engine): void {
        super.onInitialize(engine);
        
        // Initialize the component
        this.interactableComponent.onAttach();
        
        // Update graphics with any loaded state
        this.setupGraphics();
    }

    onKill(): void {
        super.kill();
        this.interactableComponent.onDetach();
    }
}