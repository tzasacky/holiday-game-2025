import * as ex from 'excalibur';
import { Level } from '../Level';
import { Room } from '../Room';
import { Biome } from '../Biome';
import { TerrainType } from '../Terrain';
import { DataManager } from '../../core/DataManager';
import { InteractableDefinition } from '../../data/interactables';
import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';

/**
 * Data-driven InteractableGenerator
 * Uses InteractableDefinitions instead of hardcoded classes
 */
export class InteractableGenerator {
    private static logger = Logger.getInstance();
    
    static generate(level: Level, rooms: Room[], biome: Biome) {
        this.logger.info('[InteractableGenerator] Generating interactables using data-driven approach');
        
        this.placeDoors(level, rooms);
        this.placeLootContainers(level, rooms);
        this.placeDecorations(level, rooms);
        this.placeUtilities(level, rooms);
        
        this.logger.info('[InteractableGenerator] Interactable generation complete');
    }

    private static placeDoors(level: Level, rooms: Room[]) {
        // Doors are structural and still use the Door class for now
        // This could be migrated to a DoorComponent system later
        
        rooms.forEach(room => {
            // Place doors at room entrances/exits
            const entrances = this.findRoomEntrances(level, room);
            
            entrances.forEach(pos => {
                this.createInteractable('door', pos, level, {
                    isLocked: Math.random() < 0.1, // 10% chance locked
                    keyRequired: Math.random() < 0.1 ? 'silver_key' : null
                });
            });
        });
    }

    private static placeLootContainers(level: Level, rooms: Room[]) {
        const rng = new ex.Random();
        
        rooms.forEach(room => {
            const roomArea = room.width * room.height;
            
            // Chests based on room size
            const chestChance = Math.min(0.3, roomArea / 100); // Larger rooms = more chests
            if (rng.bool(chestChance)) {
                const pos = this.getRandomFloorPosition(level, room, rng);
                if (pos) {
                    const chestType = this.selectChestType(rng);
                    this.createInteractable(chestType, pos, level, {
                        isLocked: rng.bool(0.3),
                        isMimic: rng.bool(0.05),
                        lootTable: this.getLootTableForRoom(room)
                    });
                }
            }

            // Stockings (wall mounted)
            if (rng.bool(0.15)) {
                const pos = this.getRandomWallAdjacentPosition(level, room, rng);
                if (pos) {
                    this.createInteractable('stocking', pos, level, {
                        lootTable: 'small_treasures'
                    });
                }
            }
        });
    }

    private static placeDecorations(level: Level, rooms: Room[]) {
        const rng = new ex.Random();
        
        rooms.forEach(room => {
            // Christmas Trees
            if (rng.bool(0.08)) {
                const pos = this.getRandomFloorPosition(level, room, rng);
                if (pos) {
                    this.createInteractable('christmas_tree', pos, level);
                }
            }

            // Bookshelves  
            if (rng.bool(0.12)) {
                const pos = this.getRandomWallAdjacentPosition(level, room, rng);
                if (pos) {
                    this.createInteractable('bookshelf', pos, level);
                }
            }

            // Wreaths (holiday decoration)
            if (rng.bool(0.06)) {
                const pos = this.getRandomWallAdjacentPosition(level, room, rng);
                if (pos) {
                    this.createInteractable('wreath', pos, level);
                }
            }
        });
    }

    private static placeUtilities(level: Level, rooms: Room[]) {
        const rng = new ex.Random();
        
        rooms.forEach(room => {
            const roomArea = room.width * room.height;
            
            // Larger rooms get more utility items
            if (roomArea > 50) {
                // Anvils for crafting
                if (rng.bool(0.15)) {
                    const pos = this.getRandomFloorPosition(level, room, rng);
                    if (pos) {
                        this.createInteractable('anvil', pos, level);
                    }
                }

                // Alchemy Stations
                if (rng.bool(0.1)) {
                    const pos = this.getRandomFloorPosition(level, room, rng);
                    if (pos) {
                        this.createInteractable('alchemy_pot', pos, level);
                    }
                }

                // Sleigh Stations (holiday specific)
                if (rng.bool(0.05)) {
                    const pos = this.getRandomFloorPosition(level, room, rng);
                    if (pos) {
                        this.createInteractable('sleigh_station', pos, level);
                    }
                }
            }

            // Fireplaces for warmth (smaller rooms can have these)
            if (rng.bool(0.08)) {
                const pos = this.getRandomWallAdjacentPosition(level, room, rng);
                if (pos) {
                    this.createInteractable('fireplace', pos, level, {
                        warmthRadius: 3,
                        warmthValue: 10
                    });
                }
            }
        });
    }

    /**
     * Create an interactable using data definitions and event system
     */
    private static createInteractable(
        interactableId: string, 
        position: ex.Vector, 
        level: Level, 
        config: any = {}
    ): boolean {
        const definition = DataManager.instance.query<InteractableDefinition>('interactable', interactableId);
        
        if (!definition) {
            this.logger.warn(`[InteractableGenerator] Unknown interactable definition: ${interactableId}`);
            return false;
        }

        // Emit event to create interactable
        // This will be handled by an InteractableFactory or similar system
        EventBus.instance.emit('interactable:create' as any, {
            definitionId: interactableId,
            definition: definition,
            position: position,
            config: config,
            level: level
        });

        this.logger.debug(`[InteractableGenerator] Created ${interactableId} at ${position.x}, ${position.y}`);
        return true;
    }

    // Helper methods for room analysis and positioning

    private static findRoomEntrances(level: Level, room: Room): ex.Vector[] {
        const entrances: ex.Vector[] = [];
        
        // Check room perimeter for openings (non-wall tiles)
        for (let x = room.x; x < room.x + room.width; x++) {
            // Top wall
            if (this.isFloorTile(level, x, room.y)) {
                entrances.push(ex.vec(x, room.y));
            }
            // Bottom wall  
            if (this.isFloorTile(level, x, room.y + room.height - 1)) {
                entrances.push(ex.vec(x, room.y + room.height - 1));
            }
        }
        
        for (let y = room.y; y < room.y + room.height; y++) {
            // Left wall
            if (this.isFloorTile(level, room.x, y)) {
                entrances.push(ex.vec(room.x, y));
            }
            // Right wall
            if (this.isFloorTile(level, room.x + room.width - 1, y)) {
                entrances.push(ex.vec(room.x + room.width - 1, y));
            }
        }
        
        return entrances;
    }

    private static getRandomFloorPosition(level: Level, room: Room, rng: ex.Random): ex.Vector | null {
        const attempts = 20;
        
        for (let i = 0; i < attempts; i++) {
            const x = room.x + 1 + rng.integer(0, room.width - 2);
            const y = room.y + 1 + rng.integer(0, room.height - 2);
            
            if (this.isValidInteractablePosition(level, x, y)) {
                return ex.vec(x, y);
            }
        }
        
        return null;
    }

    private static getRandomWallAdjacentPosition(level: Level, room: Room, rng: ex.Random): ex.Vector | null {
        const attempts = 20;
        
        for (let i = 0; i < attempts; i++) {
            const x = room.x + 1 + rng.integer(0, room.width - 2);
            const y = room.y + 1 + rng.integer(0, room.height - 2);
            
            if (this.isValidInteractablePosition(level, x, y) && this.isAdjacentToWall(level, x, y)) {
                return ex.vec(x, y);
            }
        }
        
        return null;
    }

    private static isValidInteractablePosition(level: Level, x: number, y: number): boolean {
        if (x < 0 || x >= level.width || y < 0 || y >= level.height) {
            return false;
        }
        
        return this.isFloorTile(level, x, y);
    }

    private static isFloorTile(level: Level, x: number, y: number): boolean {
        const terrain = level.terrainData[y]?.[x];
        return terrain && terrain.name !== 'Wall';
    }

    private static isAdjacentToWall(level: Level, x: number, y: number): boolean {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        return directions.some(([dx, dy]) => {
            const checkX = x + dx;
            const checkY = y + dy;
            
            if (checkX < 0 || checkX >= level.width || checkY < 0 || checkY >= level.height) {
                return true; // Edge counts as wall
            }
            
            const terrain = level.terrainData[checkY]?.[checkX];
            return terrain && terrain.name === 'Wall';
        });
    }

    // Game logic helpers

    private static selectChestType(rng: ex.Random): string {
        const roll = rng.float();
        
        if (roll < 0.6) return 'present_chest';      // 60% - common
        if (roll < 0.85) return 'treasure_chest';    // 25% - uncommon  
        if (roll < 0.95) return 'golden_chest';      // 10% - rare
        return 'crystal_chest';                      // 5% - epic
    }

    private static getLootTableForRoom(room: Room): string {
        const area = room.width * room.height;
        
        if (area > 100) return 'large_room_loot';
        if (area > 50) return 'medium_room_loot';
        return 'small_room_loot';
    }
}