import * as ex from 'excalibur';
import { GameEntity } from '../core/GameEntity';
import { ItemEntity } from '../factories/ItemFactory';
import { GameActor } from '../components/GameActor';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { GameEventNames, ItemPickupAttemptEvent, ItemPickupResultEvent } from '../core/GameEvents';

/**
 * WorldItemEntity - Represents an item that exists in the world
 * Uses the new ItemEntity from ItemFactory for data
 */
export class WorldItemEntity extends GameEntity {
  // Logger used via static methods"

  constructor(gridPos: ex.Vector, public item: ItemEntity) {
    super(gridPos, { width: 32, height: 32, collisionType: ex.CollisionType.Passive });
    this.name = item.getDisplayName();
    this.item.gridPos = gridPos;
  }

  onInitialize(engine: ex.Engine) {
    super.onInitialize(engine);
    
    // Get sprite from the item
    const sprite = this.item.getSprite();
    if (sprite) {
      this.graphics.use(sprite);
    } else {
      this.logger.warn(`[WorldItemEntity] No sprite found for item ${this.item.id}`);
      // Use a fallback colored rectangle
      this.graphics.use(new ex.Rectangle({
        width: 32,
        height: 32,
        color: ex.Color.Yellow
      }));
    }
  }

  /**
   * Handle interaction with this world item
   */
  public interact(actor: GameActor): boolean {
    this.logger.info(`[WorldItemEntity] ${actor.name} interacting with ${this.item.getDisplayName()}`);
    
    // Emit pickup event for inventory system to handle  
    this.logger.info(`[WorldItemEntity] Emitting ItemPickupAttempt for ${this.item.getDisplayName()}`);
    EventBus.instance.emit(GameEventNames.ItemPickupAttempt, new ItemPickupAttemptEvent(actor, this.item));
    
    let resultReceived = false;
    
    // Listen for pickup result
    const handlePickupResult = (event: ItemPickupResultEvent) => {
      if (event.actor.entityId === actor.entityId && event.item.id === this.item.id) {
        resultReceived = true;
        
        if (event.success) {
          this.logger.info(`[WorldItemEntity] ${actor.name} picked up ${this.item.getDisplayName()}`);
          this.kill(); // Remove from world
        } else {
          this.logger.warn(`[WorldItemEntity] ${actor.name} failed to pick up ${this.item.getDisplayName()}: ${event.reason}`);
        }
        
        // Clean up listener
        EventBus.instance.off(GameEventNames.ItemPickupResult, handlePickupResult);
      }
    };
    
    EventBus.instance.on(GameEventNames.ItemPickupResult, handlePickupResult);
    
    // Fallback: if no InventoryComponent responds within next tick, assume pickup failed
    setTimeout(() => {
      if (!resultReceived) {
        this.logger.warn(`[WorldItemEntity] No inventory system responded for ${this.item.getDisplayName()} pickup by ${actor.name}`);
        EventBus.instance.off(GameEventNames.ItemPickupResult, handlePickupResult);
      }
    }, 0);
    
    return true; // Interaction was processed
  }

  /**
   * Get the item for external access
   */
  public getItem(): ItemEntity {
    return this.item;
  }

  /**
   * Update the display name if item changes
   */
  public updateDisplayName(): void {
    this.name = this.item.getDisplayName();
  }
}