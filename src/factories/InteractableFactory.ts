import { DataManager } from '../core/DataManager';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { InteractableDefinition } from '../data/interactables';
import { GameEntity } from '../core/GameEntity';
import { Level } from '../dungeon/Level';
import * as ex from 'excalibur';
import { GameEventNames, FactoryCreateEvent, InteractableCreatedEvent, InteractableInteractEvent } from '../core/GameEvents';
import { GameActor } from '../components/GameActor';

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

    // For now, create a placeholder interactable entity
    // This bridges the gap until we have component-based interactables
    const interactable = new PlaceholderInteractable(position, definition, config);
    
    level.scene.add(interactable);
    
    Logger.debug(`[InteractableFactory] Created ${definitionId} at ${position.x}, ${position.y}`);

    EventBus.instance.emit(GameEventNames.InteractableCreated, new InteractableCreatedEvent({
      entity: interactable,
      definition: definition,
      position: position
    }));
  }
}

/**
 * Temporary placeholder until we implement component-based interactables
 */
class PlaceholderInteractable extends GameEntity {
  private definition: InteractableDefinition;
  private config: any;

  constructor(gridPos: ex.Vector, definition: InteractableDefinition, config: any = {}) {
    super(gridPos, { width: 32, height: 32, collisionType: ex.CollisionType.Fixed });
    this.definition = definition;
    this.config = config;
    this.name = definition.name;
  }

  onInitialize(engine: ex.Engine): void {
    super.onInitialize(engine);
    
    // Basic visual representation
    const color = this.getColorForType(this.definition.type);
    this.graphics.use(new ex.Rectangle({
      width: 32,
      height: 32,
      color: color
    }));
  }

  private getColorForType(type: string): ex.Color {
    switch (type) {
      case 'chest':
      case 'present_chest': return ex.Color.Brown;
      case 'door': return ex.Color.fromHex('#8B4513');
      case 'fireplace': return ex.Color.Red;
      case 'anvil': return ex.Color.Gray;
      case 'bookshelf': return ex.Color.fromHex('#654321');
      case 'christmas_tree': return ex.Color.Green;
      default: return ex.Color.Purple;
    }
  }

  public interact(actor: GameActor): boolean {
    EventBus.instance.emit(GameEventNames.InteractableInteract, new InteractableInteractEvent(
      actor,
      {
        interactableId: this.definition.id,
        definition: this.definition,
        config: this.config,
        position: this.gridPos
      }
    ));
    
    return true;
  }
}