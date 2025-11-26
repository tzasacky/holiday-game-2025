import * as ex from 'excalibur';
import { Room } from '../Room';

export interface BSPNode {
    x: number;
    y: number;
    width: number;
    height: number;
    left?: BSPNode;
    right?: BSPNode;
    room?: Room;
}

export class BSPGenerator {
    private minRoomSize: number = 6;

    generate(width: number, height: number, depth: number): BSPNode {
        const root: BSPNode = { x: 0, y: 0, width, height };
        this.split(root, depth);
        return root;
    }

    private split(node: BSPNode, iter: number) {
        if (iter === 0) {
            // Create a room within this leaf node
            const padding = 2;
            const maxW = node.width - padding * 2;
            const maxH = node.height - padding * 2;

            if (maxW >= this.minRoomSize && maxH >= this.minRoomSize) {
                const rng = new ex.Random();
                const rW = rng.integer(this.minRoomSize, maxW);
                const rH = rng.integer(this.minRoomSize, maxH);
                const rX = node.x + padding + rng.integer(0, maxW - rW);
                const rY = node.y + padding + rng.integer(0, maxH - rH);
                node.room = new Room(rX, rY, rW, rH);
            }
            return;
        }

        const rng = new ex.Random();
        let splitH = rng.bool();
        if (node.width > node.height && node.width / node.height >= 1.25) splitH = false;
        else if (node.height > node.width && node.height / node.width >= 1.25) splitH = true;

        const max = (splitH ? node.height : node.width) - this.minRoomSize * 2; // Ensure space for two rooms
        if (max <= this.minRoomSize * 2) {
             // Too small to split further, treat as leaf
             this.split(node, 0);
             return;
        }

        const splitAt = rng.integer(this.minRoomSize, max);

        if (splitH) {
            // Split horizontally
            node.left = { x: node.x, y: node.y, width: node.width, height: splitAt };
            node.right = { x: node.x, y: node.y + splitAt, width: node.width, height: node.height - splitAt };
        } else {
            // Split vertically
            node.left = { x: node.x, y: node.y, width: splitAt, height: node.height };
            node.right = { x: node.x + splitAt, y: node.y, width: node.width - splitAt, height: node.height };
        }

        this.split(node.left, iter - 1);
        this.split(node.right, iter - 1);
    }
}
