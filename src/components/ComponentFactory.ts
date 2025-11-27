import { ActorComponent } from './ActorComponent';
import { StatsComponent } from './StatsComponent';
import { CombatComponent } from './CombatComponent';
import { PlayerInputComponent } from './PlayerInputComponent';
import { AIComponent } from './AIComponent';
import { InventoryComponent } from './InventoryComponent';
import { MovementComponent } from './MovementComponent';
import { EquipmentComponent } from './EquipmentComponent';

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
ComponentRegistry.register('stats', (actor, config) => new StatsComponent(actor, config));
ComponentRegistry.register('combat', (actor, config) => new CombatComponent(actor));
ComponentRegistry.register('player_input', (actor, config) => new PlayerInputComponent(actor));
ComponentRegistry.register('ai', (actor, config) => new AIComponent(actor, config));
ComponentRegistry.register('inventory', (actor, config) => new InventoryComponent(actor, config));
ComponentRegistry.register('movement', (actor, config) => new MovementComponent(actor));
ComponentRegistry.register('equipment', (actor, config) => new EquipmentComponent(actor));