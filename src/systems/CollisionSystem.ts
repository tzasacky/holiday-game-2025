import { EventBus } from '../core/EventBus';
import { GameEventNames, CollisionCheckEvent, CollisionResultEvent, TerrainInteractEvent } from '../core/GameEvents';
import { Logger } from '../core/Logger';
import { TerrainType, TerrainDefinitions } from '../data/terrain';
import { DamageType } from '../data/mechanics';
import { EffectID } from '../constants/EffectIDs';
import { DamageSource } from '../constants/DamageSources';
import { DataManager } from '../core/DataManager';
import { Level } from '../dungeon/Level';
import * as ex from 'excalibur';

export class CollisionSystem {
  private static _instance: CollisionSystem;


  public static get instance(): CollisionSystem {
    if (!CollisionSystem._instance) {
      CollisionSystem._instance = new CollisionSystem();
    }
    return CollisionSystem._instance;
  }

  private constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for collision checks
    EventBus.instance.on(GameEventNames.CollisionCheck, this.handleCollisionCheck.bind(this));

    // Listen for terrain interactions  
    EventBus.instance.on(GameEventNames.TerrainInteract, this.handleTerrainInteraction.bind(this));
  }

  private handleCollisionCheck(event: CollisionCheckEvent): void {
    const { position, actorId, movementType, level } = event;
    
    // Check bounds
    if (position.x < 0 || position.x >= level.width || position.y < 0 || position.y >= level.height) {
      this.emitCollisionResult(new CollisionResultEvent(
        actorId,
        position,
        false,
        'terrain'
      ));
      return;
    }

    // Check terrain collision
    const terrainResult = this.checkTerrainCollision(position, level, movementType);
    if (!terrainResult.canPass) {
      this.emitCollisionResult(new CollisionResultEvent(
        actorId,
        position,
        false,
        'terrain',
        terrainResult.interaction,
        terrainResult.consequences
      ));
      return;
    }

    // Check actor collision
    const actorCollision = this.checkActorCollision(position, level, actorId);
    if (actorCollision) {
      this.emitCollisionResult(new CollisionResultEvent(
        actorId,
        position,
        false,
        'actor',
        {
          type: 'actor_block',
          data: { blockingActorId: actorCollision }
        }
      ));
      return;
    }

    // Check interactable collision
    const interactableCollision = this.checkInteractableCollision(position, level);
    if (interactableCollision) {
      this.emitCollisionResult(new CollisionResultEvent(
        actorId,
        position,
        !interactableCollision.solid,
        'interactable',
        {
          type: 'interactable',
          data: interactableCollision
        }
      ));
      return;
    }

    // Movement is allowed - but check for environmental effects
    const environmentalEffects = this.checkEnvironmentalEffects(position, level);
    
    this.emitCollisionResult(new CollisionResultEvent(
      actorId,
      position,
      true,
      undefined,
      undefined,
      environmentalEffects
    ));
  }

  private checkTerrainCollision(position: ex.Vector, level: Level, movementType: string): {
    canPass: boolean;
    interaction?: any;
    consequences?: any[];
  } {
    const terrainType = level.terrainData[position.x]?.[position.y];
    
    if (!terrainType) {
      return { canPass: false };
    }

    // Use data definitions instead of hardcoded logic
    const terrainDef = TerrainDefinitions[terrainType];
    if (!terrainDef) {
      Logger.warn(`[CollisionSystem] Unknown terrain type: ${terrainType}`);
      return { canPass: false };
    }

    // Basic collision check from data
    if (terrainDef.isSolid) {
      return { canPass: false };
    }

    // Special terrain effects - this should be data-driven from biome definitions
    const consequences = this.getTerrainConsequences(terrainType, level, movementType);
    
    return {
      canPass: true,
      consequences
    };
  }

  private getTerrainConsequences(terrainType: TerrainType, level: Level, movementType: string): any[] {
    const consequences: any[] = [];
    
    // Get terrain effects from biome environmental hazards
    if (level.biome?.gameplay?.environmentalHazards) {
      level.biome.gameplay.environmentalHazards.forEach(hazard => {
        if (Math.random() < hazard.probability) {
          consequences.push({
            type: 'damage',
            data: {
              damageType: hazard.damageType,
              amount: hazard.damagePerTurn || 1,
              source: hazard.type
            }
          });
          
          if (hazard.effect) {
            consequences.push({
              type: 'effect',
              data: {
                effectId: hazard.effect,
                duration: 10 // Default duration
              }
            });
          }
        }
      });
    }

    // Terrain-specific consequences from data
    switch (terrainType) {
      case TerrainType.Chasm:
        consequences.push(
          {
            type: 'damage',
            data: {
              damageType: DamageType.Physical,
              amount: 15,
              source: DamageSource.ChasmFall
            }
          },
          {
            type: 'transition',
            data: {
              type: 'next_level',
              message: 'You fall through the chasm to the level below!'
            }
          }
        );
        break;
        
      case TerrainType.Water:
        consequences.push({
          type: 'effect',
          data: {
            effectId: EffectID.Wet,
            duration: 100
          }
        });
        break;
        
      case TerrainType.Ice:
        consequences.push({
          type: 'effect',
          data: {
            effectId: EffectID.SlipperyMovement,
            duration: 1
          }
        });
        break;
        
      case TerrainType.DeepSnow:
        consequences.push({
          type: 'effect',
          data: {
            effectId: EffectID.SlowMovement,
            duration: 1
          }
        });
        break;
    }

    return consequences;
  }

  private checkActorCollision(position: ex.Vector, level: Level, movingActorId: string): string | null {
    // Check if another actor occupies this position
    const entitiesAt = level.getEntitiesAt(position.x, position.y);
    
    for (const entity of entitiesAt) {
      // Use 'name' or 'id' property instead of entityId which doesn't exist on ex.Actor
      const entityId = (entity as any).entityId || entity.name || entity.id;
      if (entityId && entityId !== movingActorId && entityId.toString().startsWith('actor_')) {
        return entityId;
      }
    }
    
    return null;
  }

  private checkInteractableCollision(position: ex.Vector, level: Level): any | null {
    // Check for interactables at this position
    // This would check the level's interactable registry
    // For now, return null - interactables will be handled by InteractableFactory
    return null;
  }

  private checkEnvironmentalEffects(position: ex.Vector, level: Level): any[] {
    const effects: any[] = [];
    
    // Check biome environmental hazards
    // This would query the current biome definition and roll for hazards
    // For now, return empty array
    
    return effects;
  }

  private handleTerrainInteraction(event: TerrainInteractEvent): void {
    const { actorId, position, terrainType, level } = event;
    
    // Use data definitions for terrain interactions
    const terrainDef = TerrainDefinitions[terrainType as TerrainType];
    
    if (terrainDef?.isWarmthSource) {
      EventBus.instance.emit(GameEventNames.EffectApply, {
        targetId: actorId,
        effectId: EffectID.Warmth,
        duration: 50,
        source: DamageSource.TerrainFireplace
      });
    }
    
    // Special terrain interactions
    if (terrainType === TerrainType.StairsDown) {
      EventBus.instance.emit(GameEventNames.LevelTransitionRequest, {
        actorId,
        direction: 'down' as const,
        source: DamageSource.Stairs
      });
    }
  }

  private emitCollisionResult(result: CollisionResultEvent): void {
    EventBus.instance.emit(GameEventNames.CollisionResult, result);
    
    // Apply consequences immediately
    if (result.consequences) {
      result.consequences.forEach(consequence => {
        switch (consequence.type) {
          case 'damage':
            EventBus.instance.emit(GameEventNames.Damage, {
              target: null, // Will be resolved by damage system
              damage: consequence.data.amount,
              type: consequence.data.damageType,
              source: null
            });
            break;
            
          case 'effect':
            EventBus.instance.emit(GameEventNames.EffectApply, {
              targetId: result.actorId,
              effectId: consequence.data.effectId,
              duration: consequence.data.duration,
              source: consequence.data.source
            });
            break;
            
          case 'transition':
            EventBus.instance.emit(GameEventNames.LevelTransitionRequest, {
              actorId: result.actorId,
              direction: consequence.data.type === 'next_level' ? 'down' as const : 'up' as const,
              source: consequence.data.source || 'collision'
            });
            break;
            
          case 'sound':
            EventBus.instance.emit(GameEventNames.SoundPlay, {
              soundId: consequence.data.soundId,
              volume: consequence.data.volume,
              position: consequence.data.position
            });
            break;
        }
      });
    }
  }

  /**
   * High-level collision check API for movement systems
   */
  public static checkMovement(actorId: string, position: ex.Vector, level: Level, movementType: 'walk' | 'run' | 'teleport' | 'fall' = 'walk'): Promise<boolean> {
    return new Promise((resolve) => {
      // Listen for the result
      const handleResult = (result: CollisionResultEvent) => {
        if (result.actorId === actorId && result.position.equals(position)) {
          EventBus.instance.off(GameEventNames.CollisionResult, handleResult);
          resolve(result.canMove);
        }
      };
      
      EventBus.instance.on(GameEventNames.CollisionResult, handleResult);
      
      // Emit the check request
      EventBus.instance.emit(GameEventNames.CollisionCheck, new CollisionCheckEvent(
        actorId,
        position,
        movementType,
        level
      ));
      
      // Timeout safety
      setTimeout(() => {
        EventBus.instance.off(GameEventNames.CollisionResult, handleResult);
        resolve(false);
      }, 100);
    });
  }
}