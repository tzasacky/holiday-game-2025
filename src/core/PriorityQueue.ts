export interface HeapItem {
    time: number;
    // We need a tie-breaker for priority
    // Higher priority acts sooner if time is equal
    // So we need to compare priority if time is equal
    actPriority: number; 
}

export class PriorityQueue<T extends HeapItem> {
    private heap: T[] = [];

    public push(item: T) {
        this.heap.push(item);
        this.bubbleUp(this.heap.length - 1);
    }

    public pop(): T | undefined {
        if (this.heap.length === 0) return undefined;
        const top = this.heap[0];
        const bottom = this.heap.pop();
        if (this.heap.length > 0 && bottom) {
            this.heap[0] = bottom;
            this.sinkDown(0);
        }
        return top;
    }

    public peek(): T | undefined {
        return this.heap[0];
    }

    public get length(): number {
        return this.heap.length;
    }

    public remove(item: T) {
        const index = this.heap.indexOf(item);
        if (index === -1) return;
        
        const bottom = this.heap.pop();
        if (index < this.heap.length && bottom) {
            this.heap[index] = bottom;
            this.bubbleUp(index);
            this.sinkDown(index);
        }
    }

    private bubbleUp(index: number) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.compare(this.heap[index], this.heap[parentIndex]) < 0) {
                this.swap(index, parentIndex);
                index = parentIndex;
            } else {
                break;
            }
        }
    }

    private sinkDown(index: number) {
        const length = this.heap.length;
        while (true) {
            const leftChildIndex = 2 * index + 1;
            const rightChildIndex = 2 * index + 2;
            let swapIndex = -1;

            if (leftChildIndex < length) {
                if (this.compare(this.heap[leftChildIndex], this.heap[index]) < 0) {
                    swapIndex = leftChildIndex;
                }
            }

            if (rightChildIndex < length) {
                const current = swapIndex === -1 ? index : swapIndex;
                if (this.compare(this.heap[rightChildIndex], this.heap[current]) < 0) {
                    swapIndex = rightChildIndex;
                }
            }

            if (swapIndex === -1) break;

            this.swap(index, swapIndex);
            index = swapIndex;
        }
    }

    private swap(i: number, j: number) {
        const temp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = temp;
    }

    private compare(a: T, b: T): number {
        if (a.time !== b.time) {
            return a.time - b.time;
        }
        // Higher priority comes first (sooner)
        // So if a.priority > b.priority, a comes before b
        // We want negative if a < b (a comes first)
        // So: b.priority - a.priority
        // If a.p = 10, b.p = 0 -> 0 - 10 = -10 (a comes first)
        return b.actPriority - a.actPriority;
    }
}
