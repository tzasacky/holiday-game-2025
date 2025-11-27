import { ActorComponent } from './ActorComponent';
import * as ex from 'excalibur';

export class MovementComponent extends ActorComponent {
    private moving: boolean = false;
    
    protected setupEventListeners(): void {
        // Listen for movement requests
        this.listen('movement:request', (event) => {
            if (this.isForThisActor(event)) {
                this.handleMovement(event.direction);
            }
        });
        
        // Listen for teleport requests
        this.listen('movement:teleport', (event) => {
            if (this.isForThisActor(event)) {
                this.handleTeleport(event.gridPos);
            }
        });
        
        // Listen for movement validation responses
        this.listen('movement:validation_response', (event) => {
            if (this.isForThisActor(event)) {
                if (event.valid) {
                    this.executeMovement(event.newPos);
                }
            }
        });
    }
    
    private handleMovement(direction: ex.Vector): void {
        if (this.moving) return; // Already moving
        
        const currentPos = this.actor.gridPos;
        const newPos = currentPos.add(direction);
        
        // Request movement validation from level system
        this.emit('level:validate_movement', {
            actorId: this.actor.entityId,
            fromPos: currentPos,
            toPos: newPos,
            responseEvent: 'movement:validation_response'
        });
    }
    
    private executeMovement(newPos: ex.Vector): void {
        const oldPos = this.actor.gridPos.clone();
        
        // Update position
        this.actor.gridPos = newPos;
        this.actor.syncToGrid();
        
        // Emit movement completed event
        this.emit('actor:moved', {
            actorId: this.actor.entityId,
            fromPos: oldPos,
            toPos: newPos,
            actor: this.actor
        });
        
        // Check for terrain effects
        this.emit('terrain:entered', {
            actorId: this.actor.entityId,
            pos: newPos,
            actor: this.actor
        });
    }
    
    private handleTeleport(gridPos: ex.Vector): void {
        const oldPos = this.actor.gridPos.clone();
        
        this.actor.gridPos = gridPos;
        this.actor.syncToGrid();
        
        this.emit('actor:teleported', {
            actorId: this.actor.entityId,
            fromPos: oldPos,
            toPos: gridPos,
            actor: this.actor
        });
    }
}