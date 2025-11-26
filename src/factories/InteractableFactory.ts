import { DataManager } from '../core/DataManager';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { InteractableDefinition } from '../data/interactables';
import { Level } from '../dungeon/Level';
import * as ex from 'excalibur';
import { GameEventNames, FactoryCreateEvent, InteractableCreatedEvent } from '../core/GameEvents';
import { InteractableEntity } from '../entities/InteractableEntity';

export class InteractableFactory {
  private static _instance: InteractableFactory;
  // Logger is used via static methods

  public static get instance(): InteractableFactory {
    if (!InteractableFactory._instance) {
      InteractableFactory._instance = new InteractableFactory();
    }
    return InteractableFactory._instance;
  }

  private constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    EventBus.instance.on(GameEventNames.InteractableCreate, (event: FactoryCreateEvent) => {
      this.createInteractable(event);
    });
  }

  private createInteractable(event: FactoryCreateEvent): void {
    // event.type is the definitionId
    // event.instance contains { position, config, level }
    const definitionId = event.type;
    const { position, config, level } = event.instance;
    
    // Query definition if not passed (FactoryCreateEvent doesn't pass definition directly usually)
    const definition = DataManager.instance.query<InteractableDefinition>('interactable', definitionId);

    if (!definition) {
      Logger.error(`[InteractableFactory] Missing definition for ${definitionId}`);
      return;
    }

    if (!level) {
        Logger.error(`[InteractableFactory] Missing level for ${definitionId}`);
        return;
    }

    // Create InteractableEntity (NOT a GameActor - doesn't participate in turns)
    const configWithLevelId = { ...config, levelId: level.levelId };
    const entity = new InteractableEntity(position, definition, configWithLevelId);
    
    // Add to scene as entity, not as actor
    level.addEntity(entity);
    
    Logger.debug(`[InteractableFactory] Created ${definitionId} with component at ${position.x}, ${position.y}`);

    EventBus.instance.emit(GameEventNames.InteractableCreated, new InteractableCreatedEvent(entity));
  }
}

