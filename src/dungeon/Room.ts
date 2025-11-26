import * as ex from 'excalibur';

export class Room {
    public x: number;
    public y: number;
    public width: number;
    public height: number;

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
}
