import { GameEventNames } from '../core/GameEvents';

export const FlavorText: Record<string, string[]> = {
    [GameEventNames.Attack]: [
        "{attacker} lunges at {target} dealing {damage} damage!",
        "{attacker} strikes {target} with force, causing {damage} injury!",
        "A swift blow from {attacker} hits {target} for {damage}.",
        "{attacker} attacks {target} successfully for {damage} damage."
    ],
    [GameEventNames.Die]: [
        "{actor} has fallen!",
        "{actor} collapses, defeated.",
        "{actor} breathes their last.",
        "The journey ends for {actor}."
    ],
    [GameEventNames.ItemPickup]: [
        "You pick up {item}.",
        "You found {item}!",
        "{item} is now yours.",
        "You stash {item} in your inventory."
    ],
    [GameEventNames.ItemUse]: [
        "You use {item}.",
        "You activate {item}.",
        "{item} is consumed.",
        "You apply the effects of {item}."
    ],
    [GameEventNames.LevelUp]: [
        "Level Up! You are now level {level}!",
        "You feel stronger! Level {level} reached.",
        "Experience flows through you. Welcome to level {level}."
    ],
    [GameEventNames.Heal]: [
        "{target} recovers {amount} HP.",
        "{target} feels rejuvenated, gaining {amount} HP.",
        "Healing energy restores {amount} HP to {target}."
    ],
    [GameEventNames.EquipmentEquipped]: [
        "You equip {item}.",
        "{item} is now equipped.",
        "You ready {item} for use."
    ],
    [GameEventNames.EquipmentUnequipped]: [
        "You unequip {item}.",
        "{item} is returned to your pack.",
        "You are no longer using {item}."
    ]
};

export function getFlavorText(eventKey: string, params: Record<string, string>): string {
    const templates = FlavorText[eventKey];
    if (!templates || templates.length === 0) {
        return "Something happened.";
    }
    
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template.replace(/{(\w+)}/g, (_, key) => params[key] || '?');
}
