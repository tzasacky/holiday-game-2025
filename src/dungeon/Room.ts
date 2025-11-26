import * as ex from 'excalibur';
import { RoomTemplate } from '../data/roomTemplates';

export type RoomType = 'normal' | 'boss' | 'treasure' | 'puzzle' | 'ambush' | 'safe' | 'shop';

export class Room {
    public x: number;
    public y: number;
    public width: number;
    public height: number;

    // Room metadata for enhanced generation
    public roomType: RoomType = 'normal';
    public template?: RoomTemplate;
    public tags: string[] = [];
    public isSpecial: boolean = false;
    public entrances: ex.Vector[] = []; // Door locations
    public cleared: boolean = false;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    public get center(): ex.Vector {
        return ex.vec(this.x + Math.floor(this.width / 2), this.y + Math.floor(this.height / 2));
    }
    
    public overlaps(other: Room): boolean {
        return (this.x < other.x + other.width && this.x + this.width > other.x &&
                this.y < other.y + other.height && this.y + this.height > other.y);
    }

    public contains(x: number, y: number): boolean {
        return x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height;
    }
    
    /**
     * Get the area of the room in tiles
     */
    public getArea(): number {
        return this.width * this.height;
    }
    
    /**
     * Calculate distance to another room (center to center)
     */
    public distanceTo(other: Room): number {
        const dx = this.center.x - other.center.x;
        const dy = this.center.y - other.center.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
