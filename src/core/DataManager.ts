import { EventBus } from './EventBus';
import { GameEventNames, RegistryQueryEvent, RegistryReloadEvent } from './GameEvents';

// Import all unified data systems
import { TerrainDefinitions } from '../data/terrain';
import { EnchantmentData, CurseData } from '../data/enchantments';
import { Difficulty, EnemyScaling, StatRequirementsByFloor, ResourceScaling, VictoryConditions } from '../data/balance';
import { ActorDefinitions } from '../data/actors';
import { ItemDefinitions, ItemCategories } from '../data/items';
import { InteractableDefinitions, InteractableCategories } from '../data/interactables';
import { LootTables, RarityWeights, FloorScaling } from '../data/loot';
import { EffectDefinitions, EffectCategories, EffectInteractions } from '../data/effects';
import { DamageTypes, EnvironmentalHazards, CombatMechanics, ProgressionRules, StatusMechanics, MechanicsHelpers } from '../data/mechanics';
import { AllSpawnTables } from '../data/spawnTables';
import { RoomTemplateDefinitions } from '../data/roomTemplates';
import { PrefabDefinitions } from '../data/prefabDefinitions';
import { BiomeDefinitions } from '../data/biomes';

export class DataManager {
  private static _instance: DataManager;

  // Centralized access to all Record<> systems
  private registries = new Map<string, any>();

  public static get instance(): DataManager {
    if (!this._instance) {
      this._instance = new DataManager();
    }
    return this._instance;
  }

  constructor() {
    this.setupEventListeners();
    this.registerSystemDefaults();
  }

  public getAllData(system: string): Record<string, any> {
    const registry = this.registries.get(system);
    return registry || {};
  }

  // Unified query interface
  query<T>(system: string, key: string): T | null {
    const registry = this.registries.get(system);
    const result = registry?.[key] ?? null;

    let eventName: any; // Using any to bypass strict keyof check for now as we map string to event
    switch (system) {
        case 'terrain': eventName = GameEventNames.TerrainQuery; break;
        case 'actor': eventName = GameEventNames.ActorConfigQuery; break;
        case 'item': eventName = GameEventNames.ItemSpriteQuery; break;
        case 'enchantment': eventName = GameEventNames.EnchantmentQuery; break;
        case 'loot': eventName = GameEventNames.LootQuery; break;
    }

    if (eventName) {
        EventBus.instance.emit(eventName, new RegistryQueryEvent(system, key, result));
    }

    return result;
  }

  // Hot-reload capability
  updateDefinition(system: string, key: string, definition: any) {
    const registry = this.registries.get(system);
    if (registry) {
      registry[key] = definition;
      EventBus.instance.emit(GameEventNames.RegistryReload, new RegistryReloadEvent(system, key, definition));
    }
  }

  public registerRegistry(system: string, registry: any) {
      this.registries.set(system, registry);
  }

  private setupEventListeners() {
    // Listen for registry queries from components
    EventBus.instance.on('registry:query' as any, (event: any) => {
      const result = this.query(event.system, event.key);
      EventBus.instance.emit('registry:response' as any, {
        system: event.system,
        key: event.key,
        result: result,
        requestId: event.requestId
      });
    });
  }

  private registerSystemDefaults() {
    // Import and register all existing Record<> systems
    this.registerExistingSystems();
  }

  private registerExistingSystems() {
    // Register all unified data systems using ES6 imports
    // Terrain system
    this.registerRegistry('terrain', TerrainDefinitions);
    
    // Enchantment system
    this.registerRegistry('enchantment', EnchantmentData);
    this.registerRegistry('curse', CurseData);
    
    // Balance system
    this.registerRegistry('difficulty', Difficulty);
    this.registerRegistry('enemy_scaling', EnemyScaling);
    this.registerRegistry('stat_requirements', StatRequirementsByFloor);
    this.registerRegistry('resource_scaling', ResourceScaling);
    this.registerRegistry('victory', VictoryConditions);
    
    // Actor definitions - UNIFIED
    this.registerRegistry('actor', ActorDefinitions);
    
    // Item definitions - UNIFIED
    this.registerRegistry('item', ItemDefinitions);
    this.registerRegistry('item_categories', ItemCategories);
    
    // Interactable definitions - UNIFIED
    this.registerRegistry('interactable', InteractableDefinitions);
    this.registerRegistry('interactable_categories', InteractableCategories);
    
    // Loot definitions - UNIFIED
    this.registerRegistry('loot_tables', LootTables);
    this.registerRegistry('rarity_weights', RarityWeights);
    this.registerRegistry('floor_scaling', FloorScaling);
    
    // Abilities definitions - UNIFIED (TODO: abilities.ts is currently commented out)
    // this.registerRegistry('abilities', AbilityDefinitions);
    // this.registerRegistry('ability_progression', AbilityProgression);
    // this.registerRegistry('ability_categories', AbilityCategories);
    
    // Effects definitions - UNIFIED
    this.registerRegistry('effects', EffectDefinitions);
    this.registerRegistry('effect_categories', EffectCategories);
    this.registerRegistry('effect_interactions', EffectInteractions);
    
    // Game mechanics - UNIFIED
    this.registerRegistry('damage_types', DamageTypes);
    this.registerRegistry('environmental_hazards', EnvironmentalHazards);
    this.registerRegistry('combat_mechanics', CombatMechanics);
    this.registerRegistry('progression_rules', ProgressionRules);
    this.registerRegistry('status_mechanics', StatusMechanics);
    this.registerRegistry('mechanics_helpers', MechanicsHelpers);
    
    // Spawn tables - UNIFIED (Phase 3)
    this.registerRegistry('spawn_table', AllSpawnTables);
    
    // Room templates - UNIFIED (Phase 3)
    this.registerRegistry('room_template', RoomTemplateDefinitions);
    
    // Prefab definitions - UNIFIED (Phase 3.6)
    this.registerRegistry('prefab', PrefabDefinitions);
    
    // Biome definitions - UNIFIED (Phase 3.8)  
    this.registerRegistry('biome', BiomeDefinitions);
    
    console.log('[DataManager] Registered unified data systems:', Array.from(this.registries.keys()));
  }

  // Get all registered systems
  public getRegisteredSystems(): string[] {
    return Array.from(this.registries.keys());
  }

  // Check if system exists
  public hasSystem(system: string): boolean {
    return this.registries.has(system);
  }
}

