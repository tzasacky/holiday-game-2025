import * as ex from 'excalibur';
import { InteractableComponent } from '../components/InteractableComponent';
import { InteractableDefinition } from '../data/interactables';
import { GameEntity } from '../core/GameEntity';

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
export class InteractableEntity extends GameEntity {
    public interactableComponent: InteractableComponent;
    public definition: InteractableDefinition;

    constructor(gridPos: ex.Vector, definition: InteractableDefinition, config: any = {}) {
        const width = definition.size ? definition.size.width * 32 : 32;
        const height = definition.size ? definition.size.height * 32 : 32;
        
        super(gridPos, { 
            width: width, 
            height: height, 
            collisionType: ex.CollisionType.Fixed,
            z: 5 // Ensure it renders above floor/walls 
        });
        
        this.definition = definition;
        this.name = definition.name;
        
        // Position on grid handled by GameEntity super()
        
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

    public get state() {
        return this.interactableComponent.currentState;
    }

    public get blocksMovement(): boolean {
        return this.interactableComponent.shouldBlockMovement();
    }

    public setLevelId(levelId: string): void {
        this.interactableComponent.setLevelId(levelId);
    }

    public setState(state: any): void {
        this.interactableComponent.forceState(state);
    }

    onInitialize(engine: ex.Engine): void {
        super.onInitialize(engine);
        
        // Initialize the component
        this.interactableComponent.onAttach();
        
        // Update graphics with any loaded state
        this.setupGraphics();
    }

    public get interactableDefinition(): InteractableDefinition {
        return this.definition;
    }

    public takeDamage(amount: number, source?: any): boolean {
        return this.interactableComponent.takeDamage(amount, source);
    }

    onKill(): void {
        super.kill();
        this.interactableComponent.onDetach();
    }
}