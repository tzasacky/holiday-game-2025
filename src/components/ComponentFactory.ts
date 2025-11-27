import { ActorComponent } from './ActorComponent';
import { StatsComponent } from './StatsComponent';
import { CombatComponent } from './CombatComponent';
import { PlayerInputComponent } from './PlayerInputComponent';
import { AIComponent } from './AIComponent';
import { InventoryComponent } from './InventoryComponent';
import { MovementComponent } from './MovementComponent';
import { EquipmentComponent } from './EquipmentComponent';
import { ComponentType } from '../constants/RegistryKeys';

export type ComponentFactory = (actor: any, config?: any) => ActorComponent;

export class ComponentRegistry {
    private static factories = new Map<string, ComponentFactory>();
    
    static register(type: string, factory: ComponentFactory): void {
        this.factories.set(type, factory);
    }
    
    static create(type: string, actor: any, config?: any): ActorComponent {
        const factory = this.factories.get(type);
        if (!factory) {
            throw new Error(`Unknown component type: ${type}`);
        }
        return factory(actor, config);
    }
    
    static getRegisteredTypes(): string[] {
        return Array.from(this.factories.keys());
    }
}

// Register all component types
ComponentRegistry.register(ComponentType.STATS, (actor, config) => new StatsComponent(actor, config));
ComponentRegistry.register(ComponentType.COMBAT, (actor, config) => new CombatComponent(actor));
ComponentRegistry.register(ComponentType.PLAYER_INPUT, (actor, config) => new PlayerInputComponent(actor));
ComponentRegistry.register(ComponentType.AI, (actor, config) => new AIComponent(actor, config));
ComponentRegistry.register(ComponentType.INVENTORY, (actor, config) => new InventoryComponent(actor, config));
ComponentRegistry.register(ComponentType.MOVEMENT, (actor, config) => new MovementComponent(actor));
ComponentRegistry.register(ComponentType.EQUIPMENT, (actor, config) => new EquipmentComponent(actor));