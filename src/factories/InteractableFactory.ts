import { DataManager } from '../core/DataManager';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { InteractableDefinition } from '../data/interactables';
import { GameEntity } from '../core/GameEntity';
import { Level } from '../dungeon/Level';
import * as ex from 'excalibur';

export class InteractableFactory {
  private static _instance: InteractableFactory;
  private logger = Logger.getInstance();

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
    EventBus.instance.on('interactable:create' as any, (event: any) => {
      this.createInteractable(event);
    });
  }

  private createInteractable(event: any): void {
    const { definitionId, definition, position, config, level } = event;

    if (!definition) {
      this.logger.error(`[InteractableFactory] Missing definition for ${definitionId}`);
      return;
    }

    // For now, create a placeholder interactable entity
    // This bridges the gap until we have component-based interactables
    const interactable = new PlaceholderInteractable(position, definition, config);
    
    level.scene.add(interactable);
    
    this.logger.debug(`[InteractableFactory] Created ${definitionId} at ${position.x}, ${position.y}`);

    EventBus.instance.emit('interactable:created' as any, {
      entity: interactable,
      definition: definition,
      position: position
    });
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

  onInitialize(): void {
    super.onInitialize();
    
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

  public interact(actor: any): boolean {
    EventBus.instance.emit('interactable:interact' as any, {
      interactableId: this.definition.id,
      definition: this.definition,
      config: this.config,
      actorId: actor.entityId,
      position: this.gridPos
    });
    
    return true;
  }
}