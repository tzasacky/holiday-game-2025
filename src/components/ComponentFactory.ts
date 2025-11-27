import { ActorComponent } from './ActorComponent';
import { StatsComponent } from './StatsComponent';
import { CombatComponent } from './CombatComponent';
import { InventoryComponent } from './InventoryComponent';
import { EquipmentComponent } from './EquipmentComponent';
import { AIComponent } from './AIComponent';
import { PlayerInputComponent } from './PlayerInputComponent';
import { ComponentType } from '../constants/RegistryKeys';

// Component Registry
class ComponentRegistryClass {
    private registry: Map<string, (actor: any, config?: any) => any> = new Map();

    register(type: string, factory: (actor: any, config?: any) => any): void {
        this.registry.set(type, factory);
    }

    create(type: string, actor: any, config?: any): any {
        const factory = this.registry.get(type);
        if (!factory) {
            throw new Error(`No factory registered for component type: ${type}`);
        }
        return factory(actor, config);
    }

    has(type: string): boolean {
        return this.registry.has(type);
    }

    getRegisteredTypes(): string[] {
        return Array.from(this.registry.keys());
    }
}

export const ComponentRegistry = new ComponentRegistryClass();

// Register built-in components
ComponentRegistry.register(ComponentType.STATS, (actor, config) => new StatsComponent(actor, config));
ComponentRegistry.register(ComponentType.COMBAT, (actor) => new CombatComponent(actor));
ComponentRegistry.register(ComponentType.INVENTORY, (actor) => new InventoryComponent(actor));
ComponentRegistry.register(ComponentType.EQUIPMENT, (actor) => new EquipmentComponent(actor));
ComponentRegistry.register(ComponentType.AI, (actor, config) => new AIComponent(actor, config));
ComponentRegistry.register(ComponentType.PLAYER_INPUT, (actor) => new PlayerInputComponent(actor));