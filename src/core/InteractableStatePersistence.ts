import { Logger } from './Logger';
import { InteractableState } from '../components/InteractableComponent';

export interface InteractableStateData {
    id: string;
    levelId: string;
    position: { x: number; y: number };
    state: InteractableState;
    useCount: number;
    lastUseTurn: number;
    health?: number;
}

/**
 * Manages persistence of interactable states across level transitions
 * Stores state in memory for the current game session
 */
export class InteractableStatePersistence {
    private static _instance: InteractableStatePersistence;
    private stateStorage: Map<string, InteractableStateData> = new Map();

    public static get instance(): InteractableStatePersistence {
        if (!this._instance) {
            this._instance = new InteractableStatePersistence();
        }
        return this._instance;
    }

    /**
     * Generate a unique key for an interactable based on level and position
     */
    private getKey(levelId: string, position: { x: number; y: number }, interactableId: string): string {
        return `${levelId}_${position.x}_${position.y}_${interactableId}`;
    }

    /**
     * Save the current state of an interactable
     */
    public saveState(
        levelId: string,
        position: { x: number; y: number },
        interactableId: string,
        state: InteractableState,
        useCount: number,
        lastUseTurn: number,
        health?: number
    ): void {
        const key = this.getKey(levelId, position, interactableId);
        const stateData: InteractableStateData = {
            id: interactableId,
            levelId,
            position,
            state,
            useCount,
            lastUseTurn,
            health
        };

        this.stateStorage.set(key, stateData);
        Logger.debug(`[InteractableStatePersistence] Saved state for ${interactableId} at ${position.x},${position.y}: ${state}`);
    }

    /**
     * Restore the saved state of an interactable, or return null if no saved state exists
     */
    public loadState(
        levelId: string,
        position: { x: number; y: number },
        interactableId: string
    ): InteractableStateData | null {
        const key = this.getKey(levelId, position, interactableId);
        const stateData = this.stateStorage.get(key);

        if (stateData) {
            Logger.debug(`[InteractableStatePersistence] Loaded state for ${interactableId} at ${position.x},${position.y}: ${stateData.state}`);
        }

        return stateData || null;
    }

    /**
     * Check if an interactable has saved state
     */
    public hasState(levelId: string, position: { x: number; y: number }, interactableId: string): boolean {
        const key = this.getKey(levelId, position, interactableId);
        return this.stateStorage.has(key);
    }

    /**
     * Clear all saved states (for new game)
     */
    public clearAllStates(): void {
        this.stateStorage.clear();
        Logger.info('[InteractableStatePersistence] Cleared all saved states');
    }

    /**
     * Clear states for a specific level (for level regeneration)
     */
    public clearLevelStates(levelId: string): void {
        const keysToDelete = Array.from(this.stateStorage.keys()).filter(key => key.startsWith(`${levelId}_`));
        keysToDelete.forEach(key => this.stateStorage.delete(key));
        Logger.info(`[InteractableStatePersistence] Cleared ${keysToDelete.length} states for level ${levelId}`);
    }

    /**
     * Get all saved states for debugging
     */
    public getAllStates(): InteractableStateData[] {
        return Array.from(this.stateStorage.values());
    }

    /**
     * Export states to JSON for save files (future enhancement)
     */
    public exportStates(): string {
        const statesArray = Array.from(this.stateStorage.entries()).map(([key, value]) => ({ key, value }));
        return JSON.stringify(statesArray);
    }

    /**
     * Import states from JSON for save files (future enhancement)
     */
    public importStates(jsonData: string): void {
        try {
            const statesArray = JSON.parse(jsonData) as { key: string; value: InteractableStateData }[];
            this.stateStorage.clear();
            statesArray.forEach(({ key, value }) => {
                this.stateStorage.set(key, value);
            });
            Logger.info(`[InteractableStatePersistence] Imported ${statesArray.length} saved states`);
        } catch (error) {
            Logger.error('[InteractableStatePersistence] Failed to import states:', error);
        }
    }
}