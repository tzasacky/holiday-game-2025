import { Level } from '../Level';
import { Room } from '../Room';
import { GenerationContext } from '../generators/GenerationContext';

export interface RoomDecorator {
    decorate(context: GenerationContext, room: Room, isSpecial: boolean): void;
}
