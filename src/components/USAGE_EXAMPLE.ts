// EXAMPLE: How to use the new component-based actor system

import * as ex from 'excalibur';
import { ActorSpawnSystem } from './ActorSpawnSystem';
import { EventBus } from '../core/EventBus';

// Initialize the spawn system
const spawnSystem = ActorSpawnSystem.instance;

// === OLD WAY (400+ lines of classes) ===
// const hero = new Hero(ex.vec(5, 5));
// const snowman = new Snowman(ex.vec(10, 10));

// === NEW WAY (Pure data + events) ===
const hero = spawnSystem.spawnHero(ex.vec(5, 5));
const snowman = spawnSystem.spawnSnowman(ex.vec(10, 10));

// === Even simpler: Event-driven spawning ===
EventBus.instance.emit('spawn:actor' as any, {
    defName: 'Hero',
    gridPos: ex.vec(5, 5)
});

EventBus.instance.emit('spawn:actor' as any, {
    defName: 'Snowman', 
    gridPos: ex.vec(10, 10)
});

// === All actor behavior via events ===

// Make hero attack snowman
EventBus.instance.emit('combat:attack' as any, {
    attackerId: hero.entityId,
    targetId: snowman.entityId
});

// Modify hero stats
EventBus.instance.emit('stat:modify' as any, {
    actorId: hero.entityId,
    stat: 'hp',
    delta: -10
});

// Move snowman
EventBus.instance.emit('movement:request' as any, {
    actorId: snowman.entityId,
    direction: ex.vec(1, 0)
});

// === Actor classes eliminated ===
// Actor.ts: 460 lines -> DELETED
// Hero.ts: 200 lines -> DELETED  
// Mob.ts: 150 lines -> DELETED
// 
// Replaced with:
// GameActor.ts: 20 lines (just component container)
// Components: 8 focused files (~100 lines each)
// Pure data definitions + event handlers
//
// Result: 810 lines -> ~300 lines + pure data config