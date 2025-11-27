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
import { ItemSpawnHandler } from '../systems/ItemSpawnHandler';
import { ItemPickupHandler } from '../systems/ItemPickupHandler';
import { MovementProcessor } from '../systems/MovementProcessor';
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
        
        // 1. Initialize DataManager
        Logger.info('[UnifiedSystemInit] Initializing DataManager...');
        const dataManager = DataManager.instance;
        Logger.info(`[UnifiedSystemInit] DataManager registered systems: ${Array.from(dataManager.getRegisteredSystems()).join(', ')}`);
        
        // 2. Initialize ActorSpawnSystem
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
        
        // 6. Initialize ItemSpawnHandler (handles ItemSpawnRequest events)
        Logger.info('[UnifiedSystemInit] Initializing ItemSpawnHandler...');
        ItemSpawnHandler.initialize();
        Logger.info('[UnifiedSystemInit] ItemSpawnHandler ready');
        
        // 6a. Initialize ItemPickupHandler (automatic pickup when moving onto items)
        Logger.info('[UnifiedSystemInit] Initializing ItemPickupHandler...');
        ItemPickupHandler.initialize();
        Logger.info('[UnifiedSystemInit] ItemPickupHandler ready');
        
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
        
        // 10. AbilityExecutor - DEFERRED (abilities are vaporware, sprites too costly)
        // console.log('[UnifiedSystemInit] Initializing AbilityExecutor...');
        // const abilityExecutor = AbilityExecutor.instance;
        // console.log('[UnifiedSystemInit] AbilityExecutor ready');
        
        // 11. Log available component types (Stream B)
        Logger.info(`[UnifiedSystemInit] Available component types: ${Array.from(ComponentRegistry.getRegisteredTypes()).join(', ')}`);
        
        // 12. Set up integration between Stream A and Stream B
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
        // Connect DataManager queries to component system
        EventBus.instance.on(GameEventNames.ComponentDataRequest, (event: ComponentDataRequestEvent) => {
            const result = DataManager.instance.query(event.system, event.key);
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