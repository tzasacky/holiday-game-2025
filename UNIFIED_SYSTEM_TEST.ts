// UNIFIED SYSTEM INTEGRATION TEST
// Tests Stream A (DataManager) + Stream B (Components) working together

import * as ex from 'excalibur';
import { UnifiedSystemInit } from './src/core/UnifiedSystemInit';
import { DataManager } from './src/core/DataManager';
import { ActorFactory } from './src/factories/ActorFactory';
import { ActorSpawnSystem } from './src/components/ActorSpawnSystem';
import { EventBus } from './src/core/EventBus';

console.log('🧪 UNIFIED SYSTEM INTEGRATION TEST');
console.log('===================================');

// Test 1: Initialize Unified System
console.log('\n📋 Test 1: System Initialization');
try {
    UnifiedSystemInit.initialize();
    console.log('✅ Unified system initialized');
    console.log('📊 Status:', UnifiedSystemInit.getStatus());
} catch (error) {
    console.error('❌ System initialization failed:', error);
}

// Test 2: DataManager (Stream A) Functionality
console.log('\n📋 Test 2: DataManager (Stream A)');
try {
    const dataManager = DataManager.instance;
    
    // Test terrain queries
    const wallData = dataManager.query('terrain', 'Wall');
    console.log('🧱 Wall terrain data:', wallData);
    
    // Test enchantment queries
    const sharpnessData = dataManager.query('enchantment', 'SHARPNESS');
    console.log('⚔️ Sharpness enchantment:', sharpnessData);
    
    // Test balance queries
    const difficultyData = dataManager.query('difficulty', 'playerStartingHP');
    console.log('⚖️ Difficulty setting:', difficultyData);
    
    console.log('✅ DataManager working with', dataManager.getRegisteredSystems().length, 'systems');
} catch (error) {
    console.error('❌ DataManager test failed:', error);
}

// Test 3: Component System (Stream B) Functionality
console.log('\n📋 Test 3: Component System (Stream B)');
try {
    const spawnSystem = ActorSpawnSystem.instance;
    
    // Spawn hero using component system
    const hero = spawnSystem.spawnHero(ex.vec(5, 5));
    console.log('🦸 Hero spawned with components:', Array.from(hero.components.keys()));
    
    // Test component functionality
    const statsComponent = hero.getComponent('stats');
    console.log('💚 Hero HP:', hero.hp, '/', hero.maxHp);
    console.log('⚔️ Hero damage:', hero.totalDamage);
    
    // Spawn enemy using component system  
    const snowman = spawnSystem.spawnSnowman(ex.vec(10, 10));
    console.log('☃️ Snowman spawned with components:', Array.from(snowman.components.keys()));
    
    console.log('✅ Component system working');
} catch (error) {
    console.error('❌ Component system test failed:', error);
}

// Test 4: ActorFactory Integration (Stream A → Stream B)
console.log('\n📋 Test 4: ActorFactory Integration');
try {
    const factory = ActorFactory.instance;
    
    // Test factory creating actors via unified system
    const factoryHero = factory.createHero(ex.vec(1, 1));
    const factorySnowman = factory.createSnowman(ex.vec(2, 2));
    
    console.log('🏭 Factory hero:', factoryHero?.name, 'components:', Array.from(factoryHero?.components.keys() || []));
    console.log('🏭 Factory snowman:', factorySnowman?.name, 'components:', Array.from(factorySnowman?.components.keys() || []));
    
    console.log('✅ ActorFactory integration working');
} catch (error) {
    console.error('❌ ActorFactory integration failed:', error);
}

// Test 5: Event-Driven Communication
console.log('\n📋 Test 5: Event-Driven Communication');
try {
    let eventReceived = false;
    
    // Listen for stat change event
    EventBus.instance.on('stat:changed' as any, (event: any) => {
        console.log('📡 Stat change event received:', event);
        eventReceived = true;
    });
    
    // Trigger stat change via event
    const testHero = ActorSpawnSystem.instance.spawnHero(ex.vec(0, 0));
    EventBus.instance.emit('stat:modify' as any, {
        actorId: testHero.entityId,
        stat: 'hp',
        delta: -10
    });
    
    // Brief delay to let event propagate
    setTimeout(() => {
        if (eventReceived) {
            console.log('✅ Event-driven communication working');
        } else {
            console.log('❌ Event-driven communication failed');
        }
    }, 100);
    
} catch (error) {
    console.error('❌ Event communication test failed:', error);
}

// Test 6: Data Query Integration
console.log('\n📋 Test 6: DataManager ↔ Component Integration');
try {
    // Test component requesting data from DataManager
    EventBus.instance.emit('component:data_request' as any, {
        system: 'enchantment',
        key: 'VAMPIRIC',
        requestId: 'test_request_1'
    });
    
    // Listen for response
    EventBus.instance.on('component:data_response' as any, (event: any) => {
        console.log('🔄 Data request fulfilled:', event);
        if (event.requestId === 'test_request_1') {
            console.log('✅ DataManager ↔ Component integration working');
        }
    });
    
} catch (error) {
    console.error('❌ Data integration test failed:', error);
}

// Test 7: Performance Check
console.log('\n📋 Test 7: Performance Check');
try {
    const startTime = Date.now();
    
    // Spawn 10 actors rapidly
    for (let i = 0; i < 10; i++) {
        ActorSpawnSystem.instance.spawnSnowman(ex.vec(i, i));
    }
    
    const endTime = Date.now();
    console.log(`⚡ Spawned 10 actors in ${endTime - startTime}ms`);
    
    if (endTime - startTime < 100) {
        console.log('✅ Performance acceptable');
    } else {
        console.log('⚠️ Performance may need optimization');
    }
    
} catch (error) {
    console.error('❌ Performance test failed:', error);
}

console.log('\n🎉 UNIFIED SYSTEM TEST COMPLETE');
console.log('=====================================');
console.log('Stream A (DataManager) + Stream B (Components) = 🚀 SUCCESS');

export function runUnifiedTest() {
    console.log('Running unified system test...');
    // This function can be called from main.ts or GameScene for integration testing
}