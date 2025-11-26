import { Level } from '../Level';
import * as ex from 'excalibur';

export enum TileReservation {
    Free = 0,
    Structure = 1, // Walls, Floors (Basic Layout)
    Feature = 2,   // Rivers, Chasms (Can overwrite Structure if allowed)
    Locked = 3     // Special Rooms (Immutable)
}

export class GenerationContext {
    public level: Level;
    public mask: TileReservation[][];
    public random: ex.Random;

    constructor(level: Level, seed: number = Date.now()) {
        this.level = level;
        this.random = new ex.Random(seed);
        
        // Initialize mask
        this.mask = new Array(level.width).fill(0).map(() => new Array(level.height).fill(TileReservation.Free));
    }

    public reserve(x: number, y: number, type: TileReservation) {
        if (this.isValid(x, y)) {
            this.mask[x][y] = type;
        }
    }

    public isAvailable(x: number, y: number, requestedType: TileReservation): boolean {
        if (!this.isValid(x, y)) return false;
        
        const current = this.mask[x][y];
        
        // Locked tiles are never available
        if (current === TileReservation.Locked) return false;

        // If requesting Lock, must be Free or Structure (can't lock over existing features easily?)
        // Actually, Special Rooms (Locked) usually come first or second.
        
        // Hierarchy: Free < Structure < Feature < Locked
        // Can generally overwrite lower or equal priority?
        // Let's define specific rules:
        
        if (requestedType === TileReservation.Locked) {
            // Can lock anything (since we know it's not already locked)
            return true;
        }
        
        if (requestedType === TileReservation.Feature) {
            // Features can overwrite Free or Structure (since we know it's not Locked)
            return true;
        }
        
        if (requestedType === TileReservation.Structure) {
            // Structure usually fills Free.
            return current === TileReservation.Free;
        }

        return true;
    }

    public isValid(x: number, y: number): boolean {
        return x >= 0 && x < this.level.width && y >= 0 && y < this.level.height;
    }
}
