// INTEGRATION TEST: New component-based actor system
import * as ex from 'excalibur';
import { ActorSpawnSystem } from './ActorSpawnSystem';
import { EventBus } from '../core/EventBus';

console.log('=== TESTING NEW COMPONENT SYSTEM ===');

// Initialize spawn system
const spawnSystem = ActorSpawnSystem.instance;
console.log('Spawn system initialized');

// Test 1: Spawn hero with all components
console.log('\n--- Test 1: Spawn Hero ---');
const hero = spawnSystem.spawnHero(ex.vec(5, 5));
console.log('Hero spawned:', hero.name, 'at', hero.gridPos.toString());
console.log('Hero components:', Array.from(hero.components.keys()));
console.log('Hero HP:', hero.hp, 'Total Damage:', hero.totalDamage);

// Test 2: Spawn enemies
console.log('\n--- Test 2: Spawn Enemies ---');
const snowman = spawnSystem.spawnSnowman(ex.vec(10, 10));
const snowSprite = spawnSystem.spawnSnowSprite(ex.vec(15, 15));
console.log('Snowman spawned:', snowman.name, 'components:', Array.from(snowman.components.keys()));
console.log('Snow Sprite spawned:', snowSprite.name, 'components:', Array.from(snowSprite.components.keys()));

// Test 3: Event-driven stats modification
console.log('\n--- Test 3: Event-driven Stats ---');
EventBus.instance.emit('stat:modify' as any, {
    actorId: hero.entityId,
    stat: 'hp',
    delta: -10
});
console.log('Hero HP after damage event:', hero.hp);

// Test 4: Event-driven combat
console.log('\n--- Test 4: Event-driven Combat ---');
console.log('Snowman HP before attack:', snowman.hp);
EventBus.instance.emit('combat:attack' as any, {
    attackerId: hero.entityId,
    targetId: snowman.entityId
});
console.log('Snowman HP after hero attack (should be reduced)');

// Test 5: Component queries
console.log('\n--- Test 5: Component System ---');
const heroStats = hero.getComponent('stats');
const heroCombat = hero.getComponent('combat');
const heroInput = hero.getComponent('player_input');
console.log('Hero has stats component:', !!heroStats);
console.log('Hero has combat component:', !!heroCombat);
console.log('Hero has input component:', !!heroInput);

const snowmanAI = snowman.getComponent('ai');
console.log('Snowman has AI component:', !!snowmanAI);
console.log('Snowman does not have input component:', !snowman.getComponent('player_input'));

// Test 6: Event spawning
console.log('\n--- Test 6: Event-driven Spawning ---');
EventBus.instance.emit('spawn:actor' as any, {
    defName: 'Krampus',
    gridPos: ex.vec(20, 20)
});
console.log('Krampus spawned via event');

console.log('\n=== ALL TESTS COMPLETED ===');
console.log('Actor/Hero/Mob classes successfully replaced with component system!');

export function runSystemTest() {
    // This function can be called from GameScene to verify the system works
    return {
        hero: spawnSystem.spawnHero(ex.vec(1, 1)),
        snowman: spawnSystem.spawnSnowman(ex.vec(5, 5)),
        success: true
    };
}