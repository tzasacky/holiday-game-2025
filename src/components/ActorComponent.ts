import { Component } from '../core/Component';
import type { GameActor } from './GameActor';

/**
 * Base class for actor-specific components
 * Extends Component with actor-specific utilities
 */
export abstract class ActorComponent extends Component {
    protected get actor(): GameActor {
        return this.owner as GameActor;
    }
    
    /**
     * Helper to check if an event is for this actor
     */
    protected isForThisActor(event: any): boolean {
        return event.actorId === this.actor.entityId || 
               event.actor?.entityId === this.actor.entityId ||
               event.target?.entityId === this.actor.entityId;
    }
}