import * as ex from 'excalibur';
import { GameActor } from '../components/GameActor';
import { Level } from '../dungeon/Level';
import { TerrainType } from '../data/terrain';
import { Logger } from '../core/Logger';
import { EventBus } from '../core/EventBus';
import { GameEventNames } from '../core/GameEvents';
import { InputManager, GameActionType } from '../core/InputManager';

export class MinimapUI {
    private container: HTMLElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private toggleBtn: HTMLElement | null = null;
    
    private isMinimized: boolean = false;
    private scale: number = 4; // Pixels per tile
    
    private hero: GameActor | null = null;
    private level: Level | null = null;
    
    // Cache for optimization
    private lastHeroPos: ex.Vector | null = null;
    private lastDiscoveredCount: number = 0;

    constructor() {
        this.initialize();
    }

    private initialize() {
        // Create container if not exists
        let container = document.getElementById('minimap-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'minimap-container';
            document.getElementById('ui-layer')?.appendChild(container);
        }
        this.container = container;

        // Create canvas
        let canvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'minimap-canvas';
            container.appendChild(canvas);
        }
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Create toggle button
        let toggle = document.getElementById('minimap-toggle');
        if (!toggle) {
            toggle = document.createElement('button');
            toggle.id = 'minimap-toggle';
            toggle.innerHTML = '−'; // Minus sign
            toggle.title = 'Minimize Map';
            container.appendChild(toggle);
        }
        this.toggleBtn = toggle;

        // Event Listeners
        this.toggleBtn.addEventListener('click', () => this.toggleMinimize());
        
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // Prevent clicks on minimap from propagating to game
        this.container.addEventListener('mousedown', (e) => e.stopPropagation());
        this.container.addEventListener('mouseup', (e) => e.stopPropagation());
        this.container.addEventListener('click', (e) => e.stopPropagation());
        
        Logger.info('[MinimapUI] Initialized');
    }

    public update(hero: GameActor, level: Level) {
        this.hero = hero;
        this.level = level;

        if (!this.canvas || !this.ctx || !this.level) return;

        // Resize canvas if needed
        const expectedWidth = this.level.width * this.scale;
        const expectedHeight = this.level.height * this.scale;
        
        if (this.canvas.width !== expectedWidth || this.canvas.height !== expectedHeight) {
            this.canvas.width = expectedWidth;
            this.canvas.height = expectedHeight;
            this.drawFullMap(); // Force full redraw on resize
            return;
        }

        // Check if we need to redraw
        // Redraw if hero moved or new tiles discovered
        const currentDiscoveredCount = this.level.discoveredTiles.size;
        const heroPosChanged = !this.lastHeroPos || !this.hero.gridPos.equals(this.lastHeroPos);
        
        if (currentDiscoveredCount !== this.lastDiscoveredCount || heroPosChanged) {
            this.drawFullMap();
            this.lastDiscoveredCount = currentDiscoveredCount;
            this.lastHeroPos = this.hero.gridPos.clone();
        }
    }

    private drawFullMap() {
        if (!this.ctx || !this.level || !this.hero) return;

        // Clear
        this.ctx.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
        
        // Fill background (undiscovered)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent black
        this.ctx.fillRect(0, 0, this.canvas!.width, this.canvas!.height);

        // Draw discovered tiles
        for (const tileKey of this.level.discoveredTiles) {
            const [xStr, yStr] = tileKey.split(',');
            const x = parseInt(xStr);
            const y = parseInt(yStr);
            
            const terrain = this.level.getTile(x, y);
            
            // Colors based on user preference
            if (terrain === TerrainType.Floor || terrain === TerrainType.Ice || terrain === TerrainType.Water || terrain === TerrainType.DeepSnow) {
                this.ctx.fillStyle = '#ffffff'; // White for floor
            } else {
                this.ctx.fillStyle = '#808080'; // Grey for walls/other
            }
            
            this.ctx.fillRect(x * this.scale, y * this.scale, this.scale, this.scale);
        }

        // Draw Hero
        this.ctx.fillStyle = '#ef4444'; // Red for hero
        this.ctx.fillRect(
            this.hero.gridPos.x * this.scale, 
            this.hero.gridPos.y * this.scale, 
            this.scale, 
            this.scale
        );
        
        // Draw Floor Number
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Floor ${this.level.floorNumber}`, 4, 14);
        
        // Draw Entrance/Exit markers
        if (this.level.entrancePoint) {
            const ep = this.level.entrancePoint;
            if (this.level.discoveredTiles.has(`${ep.x},${ep.y}`)) {
                this.ctx.fillStyle = '#22c55e'; // Green for entrance (stairs up)
                this.ctx.fillRect(ep.x * this.scale, ep.y * this.scale, this.scale, this.scale);
            }
        }
        if (this.level.exitPoint) {
            const xp = this.level.exitPoint;
            if (this.level.discoveredTiles.has(`${xp.x},${xp.y}`)) {
                this.ctx.fillStyle = '#eab308'; // Yellow for exit (stairs down)
                this.ctx.fillRect(xp.x * this.scale, xp.y * this.scale, this.scale, this.scale);
            }
        }
    }

    private toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        
        if (this.container && this.toggleBtn && this.canvas) {
            if (this.isMinimized) {
                this.container.classList.add('minimized');
                this.toggleBtn.innerHTML = '+';
                this.toggleBtn.title = 'Maximize Map';
                this.canvas.style.display = 'none';
            } else {
                this.container.classList.remove('minimized');
                this.toggleBtn.innerHTML = '−';
                this.toggleBtn.title = 'Minimize Map';
                this.canvas.style.display = 'block';
                this.drawFullMap(); // Redraw when maximizing
            }
        }
    }

    private handleClick(event: MouseEvent) {
        if (!this.canvas || !this.level || !this.hero) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const gridX = Math.floor(x / this.scale);
        const gridY = Math.floor(y / this.scale);

        Logger.info(`[MinimapUI] Clicked at grid ${gridX},${gridY}`);

        // Check if tile is discovered
        const key = `${gridX},${gridY}`;
        if (!this.level.discoveredTiles.has(key)) {
            Logger.info('[MinimapUI] Cannot move to undiscovered area');
            return;
        }

        // Check if walkable (basic check, pathfinding will do the rest)
        if (!this.level.isWalkable(gridX, gridY)) {
             // Allow clicking on interactables even if they block movement (like doors)
             const interactable = this.level.getInteractableAt(gridX, gridY);
             if (!interactable) {
                 Logger.info('[MinimapUI] Target is not walkable');
                 return;
             }
        }

        // Trigger movement via InputManager or direct event
        // We'll simulate a click event for the InputManager to handle, 
        // OR we can emit a PlayerInput event directly.
        
        // Let's emit a PlayerInput event with a special action or just simulate a click
        // But InputManager expects screen coordinates usually. 
        // Better to use the EventBus to send a specific "MoveTo" request or reuse PlayerInput.
        
        // Since PlayerInputComponent handles "click target" logic via InputManager,
        // we can set the click target in InputManager directly if we expose it,
        // OR we can emit a custom event that PlayerInputComponent listens to.
        
        // Let's try to use the InputManager's existing logic if possible, 
        // but InputManager listens to canvas clicks.
        
        // We will emit a custom event that PlayerInputComponent can listen to,
        // OR we can just queue the action directly if we had access.
        
        // Simplest integration: Emit a PlayerInput event with a custom payload?
        // No, PlayerInput expects GameActionType.
        
        // Set click target in InputManager
        InputManager.instance.setClickTarget(new ex.Vector(gridX, gridY));
        
        // Wake up TurnManager to process the click
        // We need to import TurnManager first
        import('../core/TurnManager').then(({ TurnManager }) => {
            TurnManager.instance.processTurns();
        });
    }
}
