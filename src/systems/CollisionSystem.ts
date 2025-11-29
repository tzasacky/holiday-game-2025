import { EventBus } from '../core/EventBus';
import { GameEventNames, TerrainInteractEvent, DamageDealtEvent, EffectApplyEvent, LevelTransitionRequestEvent, SoundPlayEvent, MovementEvent } from '../core/GameEvents';
import { Logger } from '../core/Logger';
import { TerrainType, TerrainDefinitions } from '../data/terrain';
import { DamageType } from '../data/mechanics';
import { EffectID } from '../constants/EffectIDs';
import { DamageSource } from '../constants/DamageSources';
import { Level } from '../dungeon/Level';
import * as ex from 'excalibur';
import { GameScene } from '../scenes/GameScene';
import { GameActor } from '../components/GameActor';

/**
 * CollisionSystem - Handles environmental effects when actors move
 * Movement validation is now handled by Level.isWalkable() and MovementSystem
 */
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
    // Listen for movement completion to apply terrain effects
    EventBus.instance.on(GameEventNames.Movement, this.handleMovement.bind(this));

    // Listen for terrain interactions  
    EventBus.instance.on(GameEventNames.TerrainInteract, this.handleTerrainInteraction.bind(this));
  }

  /**
   * Handle movement completion - apply terrain effects
   */
  private handleMovement(event: MovementEvent): void {
    const { actor, to } = event;
    
    // Get level from actor's scene
    // Get level from actor's scene
    const scene = actor.scene as unknown as GameScene;
    const level = scene?.level;
    
    if (!level) {
      Logger.warn('[CollisionSystem] No level found for movement event');
      return;
    }

    // Apply environmental effects for the terrain actor moved onto
    this.applyEnvironmentalEffects(actor, to, level);
  }

  /**
   * Apply environmental effects from terrain
   */
  private applyEnvironmentalEffects(actor: GameActor, position: ex.Vector, level: Level): void {
    const terrainType = level.getTile(position.x, position.y);
    const consequences = this.getTerrainConsequences(terrainType, level);
    
    // Apply each consequence
    consequences.forEach(consequence => {
      switch (consequence.type) {
        case 'damage':
          EventBus.instance.emit(GameEventNames.DamageDealt, new DamageDealtEvent(
            actor,
            consequence.data.amount,
            undefined, // Source actor (undefined for environment)
            consequence.data.damageType
          ));
          break;
          
        case 'effect':
          EventBus.instance.emit(GameEventNames.EffectApply, new EffectApplyEvent(
            actor.entityId,
            consequence.data.effectId,
            consequence.data.duration,
            consequence.data.source
          ));
          break;
          
        case 'transition':
          EventBus.instance.emit(GameEventNames.LevelTransitionRequest, new LevelTransitionRequestEvent(
            actor.entityId,
            consequence.data.type === 'next_level' ? 'down' : 'up',
            consequence.data.source || 'terrain'
          ));
          break;
          
        case 'sound':
          EventBus.instance.emit(GameEventNames.SoundPlay, new SoundPlayEvent(
            consequence.data.soundId,
            consequence.data.volume,
            consequence.data.position
          ));
          break;
      }
    });
  }

  /**
   * Get terrain consequences from biome and terrain type
   */
  private getTerrainConsequences(terrainType: TerrainType, level: Level): any[] {
    const consequences: any[] = [];
    
    // Environmental hazards removed in favor of TerrainFeatures
    // TODO: Implement new hazard system based on TerrainFeatures

    // Terrain-specific consequences
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

  /**
   * Handle direct terrain interactions (e.g., walking onto stairs)
   */
  private handleTerrainInteraction(event: TerrainInteractEvent): void {
    const { actorId, position, terrainType, level } = event;
    
    // Use data definitions for terrain interactions
    const terrainDef = TerrainDefinitions[terrainType as TerrainType];
    
    if (terrainDef?.isWarmthSource) {
      EventBus.instance.emit(GameEventNames.EffectApply, new EffectApplyEvent(
        actorId,
        EffectID.Warmth,
        50,
        DamageSource.TerrainFireplace
      ));
    }
    
    // Special terrain interactions removed - handled by InteractableEntity
    // StairsDown is now an interactable entity
  }
}