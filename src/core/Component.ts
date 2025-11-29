import { EventBus } from './EventBus';
import { GameEventMap } from './GameEvents';

export interface ComponentSaveState {
    saveState(): any;
    loadState(data: any): void;
}

/**
 * Base component class for all game components (Actor & UI)
 * Components are event-driven and communicate via EventBus
 */
export abstract class Component implements ComponentSaveState {
    protected eventHandlers: Array<{ event: string; handler: (data: any) => void }> = [];
    
    constructor(protected owner: any) {
        this.setupEventListeners();
    }
    
    /**
     * Override this to set up component-specific event listeners
     */
    protected abstract setupEventListeners(): void;
    
    /**
     * Helper to register an event listener that auto-cleans up on detach
     */
    protected listen<K extends keyof GameEventMap>(eventName: K, handler: (event: GameEventMap[K]) => void): void {
        const boundHandler = handler.bind(this);
        this.eventHandlers.push({ event: eventName, handler: boundHandler });
        EventBus.instance.on(eventName, boundHandler);
    }
    
    /**
     * Helper to emit events
     */
    protected emit<K extends keyof GameEventMap>(eventName: K, event: GameEventMap[K]): void {
        EventBus.instance.emit(eventName, event);
    }
    
    /**
     * Called when component is attached to owner
     */
    onAttach(): void {
        // Subclasses can override
    }
    
    /**
     * Called when component is detached from owner
     */
    onDetach(): void {
        // Clean up all event listeners
        this.eventHandlers.forEach(({ event, handler }) => {
            EventBus.instance.off(event as keyof GameEventMap, handler);
        });
        this.eventHandlers = [];
    }
    
    /**
     * Optional lifecycle hooks
     */
    onTick?(deltaMs: number): void;
    onTurn?(): void;
    onDestroy?(): void;

    /**
     * Save component state for serialization
     */
    saveState(): any {
        return {};
    }

    /**
     * Load component state from serialized data
     */
    loadState(data: any): void {
        // Default implementation does nothing
    }
}
