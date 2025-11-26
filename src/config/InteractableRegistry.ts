import { GameEntity } from '../core/GameEntity';
import { Door } from '../dungeon/interactables/Door';
import { PresentChest } from '../dungeon/interactables/PresentChest';
import { Stocking } from '../dungeon/interactables/Stocking';
import { ChristmasTree } from '../dungeon/interactables/ChristmasTree';
import { SecretDoor } from '../dungeon/interactables/SecretDoor';
import { DestructibleWall } from '../dungeon/interactables/DestructibleWall';
import { Bookshelf } from '../dungeon/interactables/Bookshelf';
import { AlchemyPot } from '../dungeon/interactables/AlchemyPot';
import { Anvil } from '../dungeon/interactables/Anvil';
import { SleighStation } from '../dungeon/interactables/SleighStation';
import { Resources } from './resources';

export enum InteractableID {
    Door = 'door',
    PresentChest = 'present_chest',
    Stocking = 'stocking',
    ChristmasTree = 'christmas_tree',
    SecretDoor = 'secret_door',
    DestructibleWall = 'destructible_wall',
    Bookshelf = 'bookshelf',
    AlchemyPot = 'alchemy_pot',
    Anvil = 'anvil',
    SleighStation = 'sleigh_station'
}

type InteractableConstructor = new (...args: any[]) => GameEntity;

export const InteractableRegistry: Record<InteractableID, InteractableConstructor> = {
    [InteractableID.Door]: Door,
    [InteractableID.PresentChest]: PresentChest,
    [InteractableID.Stocking]: Stocking,
    [InteractableID.ChristmasTree]: ChristmasTree,
    [InteractableID.SecretDoor]: SecretDoor,
    [InteractableID.DestructibleWall]: DestructibleWall,
    [InteractableID.Bookshelf]: Bookshelf,
    [InteractableID.AlchemyPot]: AlchemyPot,
    [InteractableID.Anvil]: Anvil,
    [InteractableID.SleighStation]: SleighStation
};

export function getInteractableClass(id: InteractableID): InteractableConstructor | undefined {
    return InteractableRegistry[id];
}
