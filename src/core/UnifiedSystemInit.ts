// Unified System Initialization

import { DataManager } from './DataManager';
import { EventBus } from './EventBus';
import { ActorSpawnSystem } from '../components/ActorSpawnSystem';
import { ComponentRegistry } from '../components/ComponentFactory';
import { EffectExecutor } from '../systems/EffectExecutor';
// import { AbilityExecutor } from '../systems/AbilityExecutor'; // DEFERRED: Abilities are vaporware

export class UnifiedSystemInit {
    private static _initialized = false;
    
    public static initialize(): void {
        if (this._initialized) {
            console.warn('[UnifiedSystemInit] System already initialized');
            return;
        }
        
        console.log('[UnifiedSystemInit] Initializing unified architecture...');
        
        // 1. Initialize DataManager (Stream A)
        console.log('[UnifiedSystemInit] Initializing DataManager...');
        const dataManager = DataManager.instance;
        console.log('[UnifiedSystemInit] DataManager registered systems:', dataManager.getRegisteredSystems());
        
        // 2. Initialize ActorSpawnSystem (Stream B)
        console.log('[UnifiedSystemInit] Initializing ActorSpawnSystem...');
        const spawnSystem = ActorSpawnSystem.instance;
        console.log('[UnifiedSystemInit] ActorSpawnSystem ready');
        
        // 3. Initialize EffectExecutor (Phase 1 Complete!)
        console.log('[UnifiedSystemInit] Initializing EffectExecutor...');
        const effectExecutor = EffectExecutor.instance;
        console.log('[UnifiedSystemInit] EffectExecutor ready');
        
        // 4. AbilityExecutor - DEFERRED (abilities are vaporware, sprites too costly)
        // console.log('[UnifiedSystemInit] Initializing AbilityExecutor...');
        // const abilityExecutor = AbilityExecutor.instance;
        // console.log('[UnifiedSystemInit] AbilityExecutor ready');
        
        // 5. Log available component types (Stream B)
        console.log('[UnifiedSystemInit] Available component types:', ComponentRegistry.getRegisteredTypes());
        
        // 6. Set up integration between Stream A and Stream B
        this.setupStreamIntegration();
        
        this._initialized = true;
        console.log('[UnifiedSystemInit] ✅ Unified architecture initialized successfully!');
        
        // Emit system ready event
        EventBus.instance.emit('system:ready' as any, {
            timestamp: Date.now(),
            registeredSystems: dataManager.getRegisteredSystems(),
            componentTypes: ComponentRegistry.getRegisteredTypes()
        });
    }
    
    private static setupStreamIntegration(): void {
        console.log('[UnifiedSystemInit] Setting up Stream A <-> Stream B integration...');
        
        // Connect DataManager queries to component system
        EventBus.instance.on('component:data_request' as any, (event: any) => {
            const result = DataManager.instance.query(event.system, event.key);
            EventBus.instance.emit('component:data_response' as any, {
                system: event.system,
                key: event.key,
                result: result,
                requestId: event.requestId
            });
        });
        
        // Log when actors are spawned using unified system
        EventBus.instance.on('actor:spawned' as any, (event: any) => {
            console.log('[UnifiedSystemInit] Actor spawned via unified system:', {
                defName: event.defName,
                position: event.gridPos,
                components: Array.from(event.actor.components.keys())
            });
        });
        
        console.log('[UnifiedSystemInit] Stream integration complete');
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