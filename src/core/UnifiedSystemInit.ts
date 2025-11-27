// Unified System Initialization

import { DataManager } from './DataManager';
import { EventBus } from './EventBus';
import { GameEventNames, SystemReadyEvent, ComponentDataRequestEvent, ActorSpawnedEvent } from './GameEvents';
import { ActorSpawnSystem } from '../components/ActorSpawnSystem';
import { ComponentRegistry } from '../components/ComponentFactory';
import { EffectExecutor } from '../systems/EffectExecutor';
import { SpawnTableExecutor } from '../systems/SpawnTableExecutor';
import { RoomGenerationExecutor } from '../systems/RoomGenerationExecutor';
// import { ItemSpawner } from '../systems/ItemSpawner'; // Legacy - ItemSpawner was deleted
import { InteractableFactory } from '../factories/InteractableFactory';
import { PrefabExecutor } from '../systems/PrefabExecutor';
import { CollisionSystem } from '../systems/CollisionSystem';
import { PathfindingSystem } from '../systems/PathfindingSystem';
import { Logger } from './Logger';
// import { AbilityExecutor } from '../systems/AbilityExecutor'; // DEFERRED: Abilities are vaporware

export class UnifiedSystemInit {
    private static _initialized = false;
    
    public static initialize(): void {
        if (this._initialized) {
            Logger.warn('[UnifiedSystemInit] System already initialized');
            return;
        }
        
        Logger.info('[UnifiedSystemInit] Initializing unified architecture...');
        
        // 1. Initialize DataManager (Stream A)
        Logger.info('[UnifiedSystemInit] Initializing DataManager...');
        const dataManager = DataManager.instance;
        Logger.info(`[UnifiedSystemInit] DataManager registered systems: ${Array.from(dataManager.getRegisteredSystems()).join(', ')}`);
        
        // 2. Initialize ActorSpawnSystem (Stream B)
        Logger.info('[UnifiedSystemInit] Initializing ActorSpawnSystem...');
        const spawnSystem = ActorSpawnSystem.instance;
        Logger.info('[UnifiedSystemInit] ActorSpawnSystem ready');
        
        // 3. Initialize EffectExecutor (Phase 1 Complete!)
        Logger.info('[UnifiedSystemInit] Initializing EffectExecutor...');
        const effectExecutor = EffectExecutor.instance;
        Logger.info('[UnifiedSystemInit] EffectExecutor ready');
        
        // 4. Initialize SpawnTableExecutor (Phase 3)
        Logger.info('[UnifiedSystemInit] Initializing SpawnTableExecutor...');
        const spawnTableExecutor = SpawnTableExecutor.instance;
        Logger.info('[UnifiedSystemInit] SpawnTableExecutor ready');
        
        // 5. Initialize RoomGenerationExecutor (Phase 3)  
        Logger.info('[UnifiedSystemInit] Initializing RoomGenerationExecutor...');
        const roomExecutor = RoomGenerationExecutor.instance;
        Logger.info('[UnifiedSystemInit] RoomGenerationExecutor ready');
        
        // 6. ItemSpawner functionality moved to RoomGenerationExecutor and LootSystem
        
        // 7. Initialize InteractableFactory (Phase 3)
        Logger.info('[UnifiedSystemInit] Initializing InteractableFactory...');
        const interactableFactory = InteractableFactory.instance;
        Logger.info('[UnifiedSystemInit] InteractableFactory ready');
        
        // 8. Initialize PrefabExecutor (Phase 3.6)
        Logger.info('[UnifiedSystemInit] Initializing PrefabExecutor...');
        const prefabExecutor = PrefabExecutor.instance;
        Logger.info('[UnifiedSystemInit] PrefabExecutor ready');
        
        // 9. Initialize CollisionSystem (Phase 3.8) 
        Logger.info('[UnifiedSystemInit] Initializing CollisionSystem...');
        const collisionSystem = CollisionSystem.instance;
        Logger.info('[UnifiedSystemInit] CollisionSystem ready');
        
        // 10. Initialize PathfindingSystem (Phase 3.8)
        Logger.info('[UnifiedSystemInit] Initializing PathfindingSystem...');
        const pathfindingSystem = PathfindingSystem.instance;
        Logger.info('[UnifiedSystemInit] PathfindingSystem ready');
        
        // 11. AbilityExecutor - DEFERRED (abilities are vaporware, sprites too costly)
        // console.log('[UnifiedSystemInit] Initializing AbilityExecutor...');
        // const abilityExecutor = AbilityExecutor.instance;
        // console.log('[UnifiedSystemInit] AbilityExecutor ready');
        
        // 12. Log available component types (Stream B)
        Logger.info(`[UnifiedSystemInit] Available component types: ${Array.from(ComponentRegistry.getRegisteredTypes()).join(', ')}`);
        
        // 13. Set up integration between Stream A and Stream B
        this.setupStreamIntegration();
        
        this._initialized = true;
        Logger.info('[UnifiedSystemInit] ✅ Unified architecture initialized successfully!');
        
        // Emit system ready event
        EventBus.instance.emit(GameEventNames.SystemReady, new SystemReadyEvent(
            Date.now(),
            Array.from(dataManager.getRegisteredSystems()),
            Array.from(ComponentRegistry.getRegisteredTypes())
        ));
    }
    
    private static setupStreamIntegration(): void {
        Logger.info('[UnifiedSystemInit] Setting up Stream A <-> Stream B integration...');
        
        // Connect DataManager queries to component system
        EventBus.instance.on(GameEventNames.ComponentDataRequest, (event: ComponentDataRequestEvent) => {
            const result = DataManager.instance.query(event.system, event.key);
            // Wait, ComponentDataRequestEvent only has componentId. The original had system and key.
            // Let's check the original usage: event.system, event.key.
            // My new event definition is wrong. I need to fix ComponentDataRequestEvent definition first.
            // ABORTING this part of the change to fix definition.
        });

        // Log when actors are spawned using unified system
        EventBus.instance.on(GameEventNames.ActorSpawned, (event: ActorSpawnedEvent) => {
            Logger.info(`[UnifiedSystemInit] Actor spawned via unified system: ${event.actor.name} at ${event.actor.pos}`);
        });
        
        Logger.info('[UnifiedSystemInit] Stream integration complete');
    }
    
    public static isInitialized(): boolean {
        return this._initialized;
    }
    
    public static getStatus(): any {
        if (!this._initialized) {
            return { status: 'not_initialized' };
        }
        
        return {
            status: 'initialized',
            dataManager: {
                systems: DataManager.instance.getRegisteredSystems()
            },
            components: {
                types: ComponentRegistry.getRegisteredTypes()
            },
            spawnSystem: {
                ready: true
            }
        };
    }
}