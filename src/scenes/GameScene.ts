import * as ex from 'excalibur';
import { Level } from '../dungeon/Level';
import { TurnManager } from '../core/TurnManager';
import { UIManager } from '../ui/UIManager';
import { Hero } from '../actors/Hero';
import { HUD } from '../ui/HUD';
import { Hotbar } from '../ui/Hotbar';
import { InventoryScreen } from '../ui/InventoryScreen';

export class GameScene extends ex.Scene {
    public level: Level | null = null;
    
    // UI Components
    private hud: HUD | null = null;
    private hotbar: Hotbar | null = null;
    private inventoryScreen: InventoryScreen | null = null;
    private hero: Hero | null = null;

    public onInitialize(engine: ex.Engine) {
        // Initialize UI Manager
        UIManager.instance.initialize(engine);
    }
    
    public initializeUI(hero: Hero, engine: ex.Engine) {
        console.log("[GameScene] Initializing UI components...");
        this.hero = hero;
        
        // Initialize HUD
        console.log("[GameScene] Creating HUD...");
        this.hud = new HUD(hero);
        this.add(this.hud);
        console.log("[GameScene] HUD added to scene");
        
        // Initialize Hotbar
        console.log("[GameScene] Creating Hotbar...");
        this.hotbar = new Hotbar(hero, () => {
            this.toggleInventory();
        });
        this.add(this.hotbar);
        console.log("[GameScene] Hotbar added to scene");
        
        // Initialize Inventory Screen (hidden by default)
        console.log("[GameScene] Creating InventoryScreen...");
        this.inventoryScreen = new InventoryScreen(hero);
        this.add(this.inventoryScreen);
        console.log("[GameScene] InventoryScreen added to scene");
        
        console.log("[GameScene] UI initialization complete");
        // Note: Inventory toggle is handled by individual UI components to avoid conflicts
    }
    
    private toggleInventory() {
        if (this.inventoryScreen) {
            this.inventoryScreen.toggle();
            
            // Log inventory action
            if (this.inventoryScreen.isVisible()) {
                UIManager.instance.logInteraction('Opened inventory');
            } else {
                UIManager.instance.logInteraction('Closed inventory');
            }
        }
    }

    public onActivate(context: ex.SceneActivationContext<unknown>): void {
        console.log("[GameScene] Scene activated");
        
        // Add all level actors to the now-active scene
        if (this.level) {
            console.log("[GameScene] Adding all level actors to active scene");
            console.log("[GameScene] Level dimensions:", this.level.width, "x", this.level.height);
            console.log("[GameScene] World size:", this.level.width * 32, "x", this.level.height * 32);
            
            // Add all actors to scene now that it's active
            this.level.actors.forEach(actor => {
                console.log("[GameScene] Adding actor to scene:", actor.name, "at grid pos:", actor.gridPos, "world pos:", actor.pos);
                
                // Check if actor is within world bounds
                const worldBounds = {
                    width: this.level!.width * 32,
                    height: this.level!.height * 32
                };
                const inBounds = actor.pos.x >= 0 && actor.pos.x <= worldBounds.width && 
                                actor.pos.y >= 0 && actor.pos.y <= worldBounds.height;
                console.log("[GameScene] Actor in world bounds:", inBounds, "world bounds:", worldBounds);
                
                console.log("[GameScene] Actor isInitialized:", actor.isInitialized);
                this.add(actor);
                
                // Set Z-level for actors to be well above tilemaps
                actor.z = 1;
                console.log("[GameScene] Set actor", actor.name, "z-level to:", actor.z);
                
                // Force initialization if needed
                if (!actor.isInitialized) {
                    console.log("[GameScene] Force initializing actor:", actor.name);
                    actor._initialize(this.engine);
                }
                
                console.log("[GameScene] Scene now has", this.actors.length, "actors, actor isInitialized:", actor.isInitialized);
            });
            
            // Add all mobs to scene
            this.level.mobs.forEach((mob: any) => {
                console.log("[GameScene] Adding mob to scene:", mob.name);
                mob.z = 1; // Well above tilemaps
                this.add(mob);
            });
            
            const hero = this.level.actors.find(a => a.isPlayer) as Hero;
            if (hero) {
                console.log("[GameScene] Found hero, registering with TurnManager");
                TurnManager.instance.registerActor(hero);
                
                // Initialize UI if not already done - this happens after scene is active
                if (!this.hud && !this.hotbar && !this.inventoryScreen) {
                    console.log("[GameScene] UI not initialized, initializing now...");
                    this.initializeUI(hero, context.engine);
                } else {
                    console.log("[GameScene] UI already initialized");
                }
                
                // Update UIManager with Hero
                UIManager.instance.update(hero);
            }
            
            // Set up camera to follow hero
            if (hero) {
                console.log("[GameScene] Setting up camera to follow Hero at:", hero.pos);
                this.camera.strategy.lockToActor(hero);
                this.camera.zoom = 1.5;
                console.log("[GameScene] Camera zoom set to:", this.camera.zoom);
            }
            
            // Start Turns
            console.log("[GameScene] Starting turn processing");
            TurnManager.instance.processTurns();
        }
    }

    public onPostUpdate(engine: ex.Engine, delta: number) {
        if (this.level) {
            const hero = this.level.actors.find(a => a.isPlayer) as Hero;
            if (hero) {
                // Camera is handled by the strategy set in main.ts
                
                // Update UI components
                UIManager.instance.update(hero);
                this.hotbar?.update();
                this.inventoryScreen?.update();
            }
        }
    }
    
    // Utility methods for external access
    public getHero(): Hero | null {
        return this.hero;
    }
    
    public isInventoryOpen(): boolean {
        return this.inventoryScreen?.isVisible() || false;
    }
    
    public logCombat(message: string) {
        UIManager.instance.logCombat(message);
    }
    
    public logItem(message: string) {
        UIManager.instance.logItem(message);
    }
    
    public logEffect(message: string) {
        UIManager.instance.logEffect(message);
    }
    
    public logInteraction(message: string) {
        UIManager.instance.logInteraction(message);
    }
}