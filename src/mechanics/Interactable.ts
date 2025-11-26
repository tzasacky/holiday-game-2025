import { Actor } from '../actors/Actor';

export interface Interactable {
    interact(actor: Actor): boolean;
    getInteractionPrompt?(): string;
}
