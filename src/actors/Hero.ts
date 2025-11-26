import * as ex from 'excalibur';
import { Actor } from './Actor';
import { Resources } from '../config/resources';
import { ActorRegistry } from '../config/ActorRegistry';
import { GameScene } from '../scenes/GameScene';
import { Level } from '../dungeon/Level';
import { TurnManager } from '../core/TurnManager';
import { InputManager, GameActionType } from '../core/InputManager';
import { Logger } from '../core/Logger';
import { Config } from '../config';
import { TerrainType, TerrainDefinitions } from '../dungeon/Terrain';
import { Inventory } from '../items/Inventory';
import { EnhancedEquipment } from '../mechanics/EquipmentSystem';
import { IdentificationSystem } from '../mechanics/IdentificationSystem';
import { ItemEntity } from '../items/ItemEntity';

export class Hero extends Actor {
    private inputManager!: InputManager;

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

        // Set Z-level to be well above tilemaps
        this.z = 100;
        
        // Graphics setup via Registry
        ActorRegistry.getInstance().configureActor(this);
        
        // Debug graphics state
        Logger.info("[Hero] Graphics configured, has graphics:", this.graphics ? 'yes' : 'no', "z-level:", this.z);
        Logger.info("[Hero] Graphics current:", this.graphics.current?.constructor.name || 'none');
        Logger.info("[Hero] Graphics visible:", this.graphics.visible);
        Logger.info("[Hero] Actor visible:", this.visible);
        Logger.info("[Hero] Actor opacity:", this.graphics.opacity);
        
        // Force visibility - this was the bug!
        this.visible = true;
        this.graphics.visible = true;
        this.graphics.opacity = 1.0;
        
        Logger.info("[Hero] After forcing visibility - Actor visible:", this.visible);
    }

    // Implement abstract method from Actor
    public async act(): Promise<boolean> {
        // Hero actions are driven by Input in onPreUpdate.
        // We return false here to tell TurnManager we are waiting for input.
        // When input is received in onPreUpdate, we'll execute and call playerActionComplete.
        
        // Exception: If we have a path (auto-running), we can act immediately?
        // No, let onPreUpdate handle it to ensure consistent flow.
        return false;
    }

    onPreUpdate(engine: ex.Engine, elapsedMs: number): void {
        if (this.moving) {
            return;
        }
        
        // Debug logging
        Logger.debug("[Hero] onPreUpdate - isPlayerTurnActive:", TurnManager.instance.isPlayerTurnActive);
        
        // Only allow input if it's our turn and UI isn't blocking
        if (!TurnManager.instance.isPlayerTurnActive) {
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
            
            // Check for Mobs
            if (this.scene && (this.scene as GameScene).level) {
                const level = (this.scene as GameScene).level!;
                
                const targetMob = level.mobs.find((m: any) => 
                    m.gridPos.equals(targetGridPos) && m.hp > 0 && m.active
                );
                
                if (targetMob) {
                    this.attack(targetMob);
                    this.spend(1.0);
                    TurnManager.instance.playerActionComplete();
                    return;
                }
                
                // Check for Walls/Doors
                const tile = level.objectMap.getTile(targetGridPos.x, targetGridPos.y);
                if (tile && tile.solid) {
                    // Check Terrain Type
                    const terrain = level.terrainData[targetGridPos.x][targetGridPos.y];
                    if (terrain === TerrainType.DoorClosed) {
                        // Open the door
                        console.log("Opening Door!");
                        level.terrainData[targetGridPos.x][targetGridPos.y] = TerrainType.DoorOpen;
                        tile.solid = false;
                        tile.clearGraphics();
                        tile.addGraphic(level.theme.tiles[TerrainType.DoorOpen]);
                        
                        this.spend(1.0);
                        TurnManager.instance.playerActionComplete();
                        return;
                    }
                    
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

    public removeLastNegativeEffect(): void {
        // Find last negative effect
        // For now, just remove the last effect if any
        if (this.effects.length > 0) {
            this.effects.pop();
        }
    }
}
