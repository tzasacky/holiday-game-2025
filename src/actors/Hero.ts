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

export class Hero extends Actor {
    private inputManager!: InputManager;
    private actionQueue: GameActionType[] = [];

    constructor(gridPos: ex.Vector) {
        super(gridPos, 100, { // 100 HP
            width: 32,
            height: 32,
            color: ex.Color.Red,
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
        Logger.debug("[Hero] act() called - checking for input");
        
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
        
        if (this.scene && (this.scene as GameScene).level) {
            const level = (this.scene as GameScene).level!;
            
            // Check bounds
            if (targetGridPos.x < 0 || targetGridPos.x >= level.width || 
                targetGridPos.y < 0 || targetGridPos.y >= level.height) {
                return false;
            }
            
            // Check for walls/obstacles  
            const tile = level.objectMap.getTile(targetGridPos.x, targetGridPos.y);
            if (tile && tile.solid) {
                return false;
            }
            
            // Perform movement
            this.gridPos = targetGridPos;
            this.pos = targetGridPos.scale(32).add(ex.vec(16, 16));
            this.spend(1.0);
            
            Logger.debug("[Hero] Moved to:", this.gridPos, "time:", this.time);
            return true;
        }
        
        return false;
    }
    
    private executeAction(action: GameActionType): boolean {
        Logger.debug("[Hero] Executing action:", action, "current time:", this.time);
        
        // Use existing movement logic from onPreUpdate
        let dx = 0;
        let dy = 0;
        
        switch (action) {
            case GameActionType.MoveNorth: dy = -1; this.graphics.use('up-walk'); break;
            case GameActionType.MoveSouth: dy = 1; this.graphics.use('down-walk'); break;
            case GameActionType.MoveWest: dx = -1; this.graphics.use('left-walk'); break;
            case GameActionType.MoveEast: dx = 1; this.graphics.use('right-walk'); break;
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

    onPreUpdate(engine: ex.Engine, elapsedMs: number): void {
        super.onPreUpdate(engine, elapsedMs);
        
        // CRITICAL DEBUG - This should always log if onPreUpdate is being called
        console.log("[Hero] onPreUpdate CALLED!");
        
        if (this.moving) {
            Logger.debug("[Hero] onPreUpdate - skipping, currently moving");
            return;
        }
        
        // Debug logging
        Logger.debug("[Hero] onPreUpdate - isPlayerTurnActive:", TurnManager.instance.isPlayerTurnActive);
        Logger.debug("[Hero] onPreUpdate - TurnManager actors count:", TurnManager.instance.getActorCount());
        
        // Only allow input if it's our turn and UI isn't blocking
        if (!TurnManager.instance.isPlayerTurnActive) {
            Logger.debug("[Hero] onPreUpdate - not player turn, skipping input");
            return;
        }
        
        Logger.debug("[Hero] Processing input...");
        
        // Update input manager UI state
        this.inputManager.updateUIState();
        
        // Don't process game input if UI is active
        if (this.inputManager.isUIBlocking()) {
            return;
        }

        // Check for mouse clicks first
        const clickTarget = this.inputManager.getClickTarget();
        if (clickTarget) {
            // clickTarget is already in tile coordinates from InputManager
            this.findPathTo(clickTarget.x, clickTarget.y);
            if (this.currentPath.length > 0) {
                // Path is set by findPathTo
                // Don't return, let the path logic below handle the first step immediately
            }
        }

        let dx = 0;
        let dy = 0;
        let actionTaken = false;

        // Check for keyboard input
        const action = this.inputManager.getAction();
        if (action) {
            this.clearPath(); // Input interrupts path
            switch (action) {
                case GameActionType.MoveNorth: dy = -1; this.graphics.use('up-walk'); break;
                case GameActionType.MoveSouth: dy = 1; this.graphics.use('down-walk'); break;
                case GameActionType.MoveWest: dx = -1; this.graphics.use('left-walk'); break;
                case GameActionType.MoveEast: dx = 1; this.graphics.use('right-walk'); break;
                case GameActionType.Wait: 
                    this.spend(1.0);
                    TurnManager.instance.playerActionComplete(); 
                    return;
            }
        } else if (this.hasPath()) {
            // Continue with current path
            const nextStep = this.getNextPathStep();
            if (nextStep) {
                const diff = nextStep.sub(this.gridPos);
                dx = Math.round(diff.x);
                dy = Math.round(diff.y);
                
                // Update facing
                if (dx > 0) this.graphics.use('right-walk');
                else if (dx < 0) this.graphics.use('left-walk');
                else if (dy > 0) this.graphics.use('down-walk');
                else if (dy < 0) this.graphics.use('up-walk');
            }
        }

        if (dx !== 0 || dy !== 0) {
            const targetGridPos = this.gridPos.add(ex.vec(dx, dy));
            
            // Check for interactions first
            if (this.scene && (this.scene as GameScene).level) {
                const level = (this.scene as GameScene).level!;
                
                if (this.handleInteraction(targetGridPos.x, targetGridPos.y)) {
                    this.clearPath(); // Interaction ends current path
                    this.spend(1.0);
                    TurnManager.instance.playerActionComplete();
                    return;
                }
                
                // Check for walls/obstacles
                const tile = level.objectMap.getTile(targetGridPos.x, targetGridPos.y);
                if (tile && tile.solid) {
                    // Blocked
                    this.clearPath();
                    return; 
                }
                
                // Move
                this.moving = true;
                
                // Determine Movement Cost
                let cost = 1.0;
                const targetTerrainType = level.terrainData[targetGridPos.x][targetGridPos.y] as TerrainType;
                const targetTerrainDef = TerrainDefinitions[targetTerrainType];
                
                if (targetTerrainDef && targetTerrainDef.cost > 1) {
                    cost = targetTerrainDef.cost;
                }

                // Speed: 300px/sec for smooth fast movement
                const moveSpeed = 300; 

                this.actions.moveTo(targetGridPos.scale(32).add(ex.vec(16, 16)), moveSpeed).callMethod(() => {
                    this.gridPos = targetGridPos;
                    
                    // Update path progress
                    if (this.hasPath()) {
                        this.advancePath();
                    }
                    
                    // Slide Logic
                    if (targetTerrainType === TerrainType.Ice) {
                        console.log("Sliding on Ice!");
                        this.attemptSlide(dx, dy, level);
                    } else {
                        this.moving = false;
                        this.spend(cost);
                        TurnManager.instance.playerActionComplete();
                    }
                });
            }
        }
    }

    private attemptSlide(dx: number, dy: number, level: Level) {
        const nextGridPos = this.gridPos.add(ex.vec(dx, dy));
        
        // Check bounds/walls for slide
        if (nextGridPos.x < 0 || nextGridPos.x >= level.width || nextGridPos.y < 0 || nextGridPos.y >= level.height) {
             this.moving = false;
             this.spend(1.0); // Spent time sliding
             TurnManager.instance.playerActionComplete();
             return;
        }

        const tile = level.objectMap.getTile(nextGridPos.x, nextGridPos.y);
        if (tile && tile.solid) {
             // Hit a wall while sliding
             this.moving = false;
             this.spend(1.0);
             TurnManager.instance.playerActionComplete();
             return;
        }
        
        // Continue Slide (Fast)
        this.actions.moveTo(nextGridPos.scale(32).add(ex.vec(16, 16)), 400).callMethod(() => { 
            this.gridPos = nextGridPos;
            const terrain = level.terrainData[nextGridPos.x][nextGridPos.y];
            if (terrain === TerrainType.Ice) {
                this.attemptSlide(dx, dy, level);
            } else {
                this.moving = false;
                this.spend(1.0);
                TurnManager.instance.playerActionComplete();
            }
        });
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
        } else if (slot === 'armor') {
            if (this.armor) this.unequip(this.armor);
            this.armor = item;
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
            return false;
        }

        if (this.weapon === item) {
            this.weapon = null;
        } else if (this.armor === item) {
            this.armor = null;
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
        const interaction = Pathfinding.getInteractionAt(level, targetX, targetY);
        
        if (!interaction) {
            return false;
        }
        
        Logger.debug(`[Hero] handling interaction:`, interaction, "at", targetX, targetY);
        
        switch (interaction) {
            case 'door_open':
                return this.openDoor(targetX, targetY);
            case 'door_locked':
                Logger.debug(`[Hero] tried to open locked door`);
                return true; // Consumed turn trying
            case 'item_pickup':
                return this.pickupItem(targetX, targetY);
            case 'mob_attack':
                return this.attackMob(targetX, targetY);
            default:
                return false;
        }
    }
    
    private openDoor(x: number, y: number): boolean {
        if (!this.scene || !(this.scene as GameScene).level) {
            return false;
        }
        
        const level = (this.scene as GameScene).level!;
        const terrain = level.getTile(x, y);
        
        if (terrain === TerrainType.DoorClosed) {
            Logger.debug(`[Hero] opening door at`, x, y);
            level.terrainData[x][y] = TerrainType.DoorOpen;
            
            const tile = level.objectMap.getTile(x, y);
            if (tile) {
                tile.solid = false;
                tile.clearGraphics();
                tile.addGraphic(level.theme.tiles[TerrainType.DoorOpen]);
            }
            
            return true;
        }
        
        return false;
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
