import * as ex from 'excalibur';
import { Actor } from './Actor';
import { Resources } from '../config/resources';
import { ActorRegistry } from '../config/ActorRegistry';
import { GameScene } from '../scenes/GameScene';
import { Level } from '../dungeon/Level';
import { TurnManager } from '../core/TurnManager';
import { InputManager, GameActionType } from '../core/InputManager';
import { Logger } from '../core/Logger';
import { TerrainType, TerrainDefinitions } from '../dungeon/Terrain';
import { Inventory } from '../items/Inventory';
import { EnhancedEquipment } from '../mechanics/EquipmentSystem';
import { IdentificationSystem } from '../mechanics/IdentificationSystem';
import { ItemEntity } from '../items/ItemEntity';
import { Pathfinding } from '../core/Pathfinding';
import { InteractionManager } from '../mechanics/InteractionManager';
import { EventBus } from '../core/EventBus';
import { 
    GameEventNames, 
    ItemPickupEvent, 
    ItemDropEvent, 
    ItemEquipEvent, 
    ItemUnequipEvent,
    LogEvent
} from '../core/GameEvents';

export class Hero extends Actor {
    private inputManager!: InputManager;
    private actionQueue: GameActionType[] = [];

    constructor(gridPos: ex.Vector) {
        super(gridPos, 100, {
            collisionType: ex.CollisionType.Active
        });
        this.name = 'Hero';
        this.isPlayer = true;
    }

    onInitialize(engine: ex.Engine): void {
        super.onInitialize(engine);
        Logger.info("[Hero] onInitialize called at position:", this.gridPos, "world pos:", this.pos);
        this.inputManager = InputManager.instance;


        // Use ActorRegistry for consistent rendering
        ActorRegistry.getInstance().configureActor(this);
    }



    // Called by InputManager to queue an action
    public queueAction(action: GameActionType) {
        Logger.debug("[Hero] Action queued:", action);
        this.actionQueue.push(action);
    }

    // Implement abstract method from Actor
    public async act(): Promise<boolean> {
        Logger.debug("[Hero] act() called - checking for input - time:", this.time);
        
        // Continue following existing path first
        if (this.hasPath()) {
            Logger.debug("[Hero] Continuing path, steps remaining:", this.currentPath.length - this.currentPathIndex);
            const nextStep = this.getNextPathStep();
            if (nextStep) {
                const diff = nextStep.sub(this.gridPos);
                const dx = Math.round(diff.x);
                const dy = Math.round(diff.y);
                
                Logger.debug("[Hero] Moving along path:", dx, dy);
                if (this.tryMove(dx, dy)) {
                    this.advancePath();
                    return true; // Keep processing turns to continue path
                } else {
                    Logger.debug("[Hero] Path blocked, clearing path");
                    this.clearPath();
                    return true; // Still consumed the turn
                }
            } else {
                Logger.debug("[Hero] Path complete");
                this.clearPath();
                return false; // Path finished, wait for new input
            }
        }
        
        // Check for new mouse clicks
        const clickTarget = this.inputManager.getClickTarget();
        Logger.debug("[Hero] getClickTarget returned:", clickTarget);
        if (clickTarget) {
            Logger.debug("[Hero] Processing click target:", clickTarget);
            this.findPathTo(clickTarget.x, clickTarget.y);
            if (this.hasPath()) {
                Logger.debug("[Hero] New path created, starting movement");
                // Start the path on this turn
                const nextStep = this.getNextPathStep();
                if (nextStep) {
                    const diff = nextStep.sub(this.gridPos);
                    const dx = Math.round(diff.x);
                    const dy = Math.round(diff.y);
                    
                    Logger.debug("[Hero] Starting path movement:", dx, dy);
                    if (this.tryMove(dx, dy)) {
                        this.advancePath();
                        return true; // Keep processing turns for the path
                    } else {
                        this.clearPath();
                        return true; // Still consumed the turn
                    }
                }
            } else {
                Logger.debug("[Hero] No path found to target");
                return true; // Click consumed the turn even if no path
            }
        }
        
        // Process queued actions
        if (this.actionQueue.length > 0) {
            const action = this.actionQueue.shift()!;
            Logger.debug("[Hero] Processing queued action:", action);
            return this.executeAction(action);
        }
        
        Logger.debug("[Hero] No queued actions, waiting for input");
        return false;
    }
    
    private tryMove(dx: number, dy: number): boolean {
        const targetGridPos = this.gridPos.add(ex.vec(dx, dy));
        
        if (!this.scene || !(this.scene as GameScene).level) {
            return false;
        }
        
        const level = (this.scene as GameScene).level!;
        
        // Check bounds
        if (targetGridPos.x < 0 || targetGridPos.x >= level.width || 
            targetGridPos.y < 0 || targetGridPos.y >= level.height) {
            return false;
        }
        
        // Check for interaction first
        if (this.handleInteraction(targetGridPos.x, targetGridPos.y)) {
            this.spend(1.0);
            Logger.debug("[Hero] Interaction handled at:", targetGridPos, "time:", this.time);
            return true;
        }
        
        // Check for walls/obstacles  
        const tile = level.objectMap.getTile(targetGridPos.x, targetGridPos.y);
        if (tile && tile.solid) {
            Logger.debug("[Hero] Movement blocked by solid tile at:", targetGridPos);
            return false; // Don't spend time on failed movement
        }
        
        // Get terrain info for movement cost and effects
        const targetTerrain = level.getTile(targetGridPos.x, targetGridPos.y);
        const terrainDef = TerrainDefinitions[targetTerrain];
        
        // Check if terrain is passable (redundant with tile check but more explicit)
        if (terrainDef && terrainDef.isSolid) {
            Logger.debug("[Hero] Movement blocked by solid terrain:", targetTerrain);
            return false;
        }
        
        // Update position instantly for game logic
        this.gridPos = targetGridPos;
        
        // Trigger animation (non-blocking)
        this.animateMovement(targetGridPos);
        
        // Apply terrain effects using existing system
        this.applyTerrainEffects(targetTerrain, terrainDef);
        
        // Spend time based on terrain cost (default to 1.0 if no definition)
        const cost = terrainDef ? terrainDef.cost : 1.0;
        this.spend(cost);
        
        Logger.debug("[Hero] Moved to:", this.gridPos, "terrain:", targetTerrain, "cost:", cost, "time:", this.time);
        return true;
    }

    private animateMovement(targetGridPos: ex.Vector): void {
        // Set moving state to prevent visual glitches
        this.moving = true;
        
        // Update sprite facing and animation based on movement direction  
        const diff = targetGridPos.sub(this.gridPos);
        const direction = Math.abs(diff.x) > Math.abs(diff.y) 
            ? (diff.x > 0 ? 'right' : 'left') 
            : (diff.y > 0 ? 'down' : 'up');
        
        // Use appropriate walk animation from ActorRegistry
        this.graphics.use(`${direction}-walk`);
        
        // Animate movement - purely visual, doesn't affect game state
        const moveSpeed = 300; // 300px/sec for smooth movement
        const targetWorldPos = targetGridPos.scale(32).add(ex.vec(16, 16));
        
        this.actions.moveTo(targetWorldPos, moveSpeed).callMethod(() => {
            this.moving = false;
            // Return to idle animation after movement
            this.graphics.use(`idle-${direction}`);
            // Sync visual position with game state (in case of any drift)
            this.pos = this.gridPos.scale(32).add(ex.vec(16, 16));
        });
    }
    
    private applyTerrainEffects(terrainType: TerrainType, terrainDef: any): void {
        // Apply existing terrain effects
        
        if (!terrainDef) return;
        
        // Ice sliding effect - integrate with existing Effect system
        if (terrainDef.isSlippery && terrainType === TerrainType.Ice) {
            Logger.debug("[Hero] Stepping on ice - slippery!");
            // Could add a slippery status effect here using existing Effect system
        }
        
        // Warmth effects 
        if (terrainDef.isWarmthSource) {
            Logger.debug("[Hero] Near warmth source - gaining warmth");
            // Integrate with existing WarmthSystem
            this.warmth = Math.min(this.maxWarmth, this.warmth + 10);
        }
        
        // Deep snow slowing
        if (terrainType === TerrainType.DeepSnow) {
            Logger.debug("[Hero] Moving through deep snow");
            // Movement cost is already handled above
        }
        
        // Water effects
        if (terrainType === TerrainType.Water) {
            Logger.debug("[Hero] Wading through water");
            // Could add wet status effect
        }
    }
    
    
    private executeAction(action: GameActionType): boolean {
        Logger.debug("[Hero] Executing action:", action, "current time:", this.time);
        
        // Use existing movement logic from onPreUpdate
        let dx = 0;
        let dy = 0;
        
        switch (action) {
            case GameActionType.MoveNorth: dy = -1; break;
            case GameActionType.MoveSouth: dy = 1; break;
            case GameActionType.MoveWest: dx = -1; break;
            case GameActionType.MoveEast: dx = 1; break;
            case GameActionType.Wait: 
                Logger.debug("[Hero] Wait action - spending time");
                this.spend(1.0);
                Logger.debug("[Hero] After wait - time:", this.time);
                return true;
        }

        if (dx !== 0 || dy !== 0) {
            const targetGridPos = this.gridPos.add(ex.vec(dx, dy));
            Logger.debug("[Hero] Attempting move from", this.gridPos, "to", targetGridPos);
            
            // Use existing collision/movement logic
            if (this.scene && (this.scene as GameScene).level) {
                const level = (this.scene as GameScene).level!;
                
                // Check bounds
                if (targetGridPos.x < 0 || targetGridPos.x >= level.width || 
                    targetGridPos.y < 0 || targetGridPos.y >= level.height) {
                    Logger.debug("[Hero] Movement blocked - out of bounds");
                    return false; // Don't spend time on failed movement
                }
                
                // Check for interaction first
                if (this.handleInteraction(targetGridPos.x, targetGridPos.y)) {
                    this.spend(1.0);
                    Logger.debug("[Hero] Interaction handled in executeAction at:", targetGridPos, "time:", this.time);
                    return true;
                }
                
                // Check for walls/obstacles  
                const tile = level.objectMap.getTile(targetGridPos.x, targetGridPos.y);
                if (tile && tile.solid) {
                    Logger.debug("[Hero] Movement blocked by solid tile at", targetGridPos);
                    return false; // Don't spend time on failed movement
                }
                
                // Perform movement
                Logger.debug("[Hero] Movement successful - updating position and time");
                this.gridPos = targetGridPos;
                this.pos = targetGridPos.scale(32).add(ex.vec(16, 16));
                this.spend(1.0);
                
                Logger.debug("[Hero] Moved to:", this.gridPos, "world pos:", this.pos, "time:", this.time);
                return true; // Action successful
            } else {
                Logger.debug("[Hero] No scene or level - cannot move");
            }
        }
        
        Logger.debug("[Hero] Action not handled:", action);
        return false;
    }


    // ============================================================================================
    // RPG Mechanics (Moved from Actor)
    // ============================================================================================

    // Inventory & Equipment
    public inventory: Inventory = new Inventory();
    public accessories: any[] = []; // TODO: Type this properly

    // Player-specific Stats
    public luck: number = 10;
    public charisma: number = 10;

    // Artifact specific properties
    public canSeeIntoFuture: number = 0;
    public temporalSenses: boolean = false;
    public celebrationAura: any = null;
    public recentlyUsedItems: any[] = [];
    public temporalAwareness: boolean = false;
    public canPredictEvents: boolean = false;
    public hasUsedSantasCookie: boolean = false;

    public dropItem(index: number) {
        const item = this.inventory.drop(index);
        if (item) {
            if (this.scene instanceof GameScene && this.scene.level) {
                const entity = new ItemEntity(this.gridPos.clone(), item);
                this.scene.level.addEntity(entity);
                
                EventBus.instance.emit(GameEventNames.ItemDrop, new ItemDropEvent(this, item));
                
                if (this.scene instanceof GameScene) {
                    this.scene.logItem(`Dropped ${item.name}`);
                } else {
                    console.log(`${this.name} dropped ${item.name}`);
                }
            } else {
                console.warn(`${this.name} dropped ${item.name} into the void!`);
            }
        }
    }

    public equip(item: EnhancedEquipment): boolean {
        // Slot logic
        let slot = 'unknown';
        const idStr = item.id.toString();
        if (idStr.includes('Dagger') || idStr.includes('Hammer') || idStr.includes('Wand') || idStr.includes('Sword') || idStr.includes('Lights')) slot = 'weapon';
        if (idStr.includes('Suit') || idStr.includes('Plate') || idStr.includes('Cloak') || idStr.includes('Sweater')) slot = 'armor';

        if (slot === 'weapon') {
            if (this.weapon) this.unequip(this.weapon);
            this.weapon = item;
            EventBus.instance.emit(GameEventNames.ItemEquip, new ItemEquipEvent(this, item, 'weapon'));
        } else if (slot === 'armor') {
            if (this.armor) this.unequip(this.armor);
            this.armor = item;
            EventBus.instance.emit(GameEventNames.ItemEquip, new ItemEquipEvent(this, item, 'armor'));
        } else {
            console.log('Unknown slot for item:', item.name);
            return false;
        }

        if (this.scene instanceof GameScene) {
            this.scene.logItem(`Equipped ${item.getDisplayName()}`);
        } else {
            console.log(`${this.name} equipped ${item.getDisplayName()}`);
        }
        
        // Trigger identification/curse logic (Player specific)
        IdentificationSystem.identifyOnEquip(this, item);
        
        return true;
    }

    public unequip(item: EnhancedEquipment): boolean {
        if (item.unremovableWhenCursed) {
            console.log(`${item.getDisplayName()} is cursed and cannot be removed!`);
            EventBus.instance.emit(GameEventNames.Log, new LogEvent(`${item.getDisplayName()} is cursed!`, 'Combat', 'red'));
            return false;
        }

        if (this.weapon === item) {
            this.weapon = null;
            EventBus.instance.emit(GameEventNames.ItemUnequip, new ItemUnequipEvent(this, item, 'weapon'));
        } else if (this.armor === item) {
            this.armor = null;
            EventBus.instance.emit(GameEventNames.ItemUnequip, new ItemUnequipEvent(this, item, 'armor'));
        } else {
            return false;
        }

        if (this.scene instanceof GameScene) {
            this.scene.logItem(`Unequipped ${item.getDisplayName()}`);
        } else {
            console.log(`${this.name} unequipped ${item.getDisplayName()}`);
        }
        return true;
    }

    public addToInventory(item: any): void {
        this.inventory.addItem(item);
    }
    
    private handleInteraction(targetX: number, targetY: number): boolean {
        if (!this.scene || !(this.scene as GameScene).level) {
            return false;
        }
        
        const level = (this.scene as GameScene).level!;
        const targetPos = ex.vec(targetX, targetY);
        
        // Try existing InteractionManager first
        const interactionManager = new InteractionManager(level);
        if (interactionManager.tryInteract(this, targetPos)) {
            Logger.debug(`[Hero] Interaction handled by InteractionManager at`, targetX, targetY);
            return true;
        }
        
        // Fall back to custom interactions
        const interaction = Pathfinding.getInteractionAt(level, targetX, targetY);
        
        if (!interaction) {
            return false;
        }
        
        Logger.debug(`[Hero] handling custom interaction:`, interaction, "at", targetX, targetY);
        
        switch (interaction) {
            case 'item_pickup':
                return this.pickupItem(targetX, targetY);
            case 'mob_attack':
                return this.attackMob(targetX, targetY);
            default:
                return false;
        }
    }
    
    
    private pickupItem(x: number, y: number): boolean {
        if (!this.scene || !(this.scene as GameScene).level) {
            return false;
        }
        
        const level = (this.scene as GameScene).level!;
        const itemIndex = level.items.findIndex(item => 
            (item as any).gridPos && (item as any).gridPos.x === x && (item as any).gridPos.y === y
        );
        
        if (itemIndex >= 0) {
            const item = level.items[itemIndex];
            level.items.splice(itemIndex, 1);
            
            this.addToInventory(item);
            
            EventBus.instance.emit(GameEventNames.ItemPickup, new ItemPickupEvent(this, item));
            
            if (this.scene instanceof GameScene) {
                this.scene.logItem(`Picked up ${item.name}`);
            }
            
            Logger.debug(`[Hero] Picked up ${item.name} at`, x, y);
            return true;
        }
        
        return false;
    }
    
    private attackMob(x: number, y: number): boolean {
        if (!this.scene || !(this.scene as GameScene).level) {
            return false;
        }
        
        const level = (this.scene as GameScene).level!;
        const target = level.mobs.find(mob => 
            mob.gridPos.x === x && mob.gridPos.y === y && mob.hp > 0
        );
        
        if (target) {
            this.attack(target);
            return true;
        }
        
        return false;
    }

    public removeLastNegativeEffect(): void {
        // Find last negative effect
        // For now, just remove the last effect if any
        if (this.effects.length > 0) {
            this.effects.pop();
        }
    }
}
