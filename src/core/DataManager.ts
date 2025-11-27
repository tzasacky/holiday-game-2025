import { EventBus } from './EventBus';
import { GameEventNames, RegistryQueryEvent, RegistryReloadEvent } from './GameEvents';

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
    // Import all unified data systems
    try {
      // Terrain system
      const { TerrainDefinitions } = require('../data/terrain');
      this.registerRegistry('terrain', TerrainDefinitions);
      
      // Enchantment system
      const { EnchantmentData, CurseData } = require('../data/enchantments');
      this.registerRegistry('enchantment', EnchantmentData);
      this.registerRegistry('curse', CurseData);
      
      // Balance system
      const { Difficulty, EnemyScaling, StatRequirementsByFloor, ResourceScaling, VictoryConditions } = require('../data/balance');
      this.registerRegistry('difficulty', Difficulty);
      this.registerRegistry('enemy_scaling', EnemyScaling);
      this.registerRegistry('stat_requirements', StatRequirementsByFloor);
      this.registerRegistry('resource_scaling', ResourceScaling);
      this.registerRegistry('victory', VictoryConditions);
      
      // Actor definitions - UNIFIED
      const { ActorDefinitions } = require('../data/actors');
      this.registerRegistry('actor', ActorDefinitions);
      
      // Item definitions - UNIFIED
      const { ItemDefinitions, ItemCategories } = require('../data/items');
      this.registerRegistry('item', ItemDefinitions);
      this.registerRegistry('item_categories', ItemCategories);
      
      // Interactable definitions - UNIFIED
      const { InteractableDefinitions, InteractableCategories } = require('../data/interactables');
      this.registerRegistry('interactable', InteractableDefinitions);
      this.registerRegistry('interactable_categories', InteractableCategories);
      
      // Loot definitions - UNIFIED
      const { LootTables, RarityWeights, FloorScaling, LootHelpers } = require('../data/loot');
      this.registerRegistry('loot_tables', LootTables);
      this.registerRegistry('rarity_weights', RarityWeights);
      this.registerRegistry('floor_scaling', FloorScaling);
      this.registerRegistry('loot_helpers', LootHelpers);
      
      // Abilities definitions - UNIFIED
      const { AbilityDefinitions, AbilityProgression, AbilityCategories } = require('../data/abilities');
      this.registerRegistry('abilities', AbilityDefinitions);
      this.registerRegistry('ability_progression', AbilityProgression);
      this.registerRegistry('ability_categories', AbilityCategories);
      
      // Effects definitions - UNIFIED
      const { EffectDefinitions, EffectCategories, EffectInteractions } = require('../data/effects');
      this.registerRegistry('effects', EffectDefinitions);
      this.registerRegistry('effect_categories', EffectCategories);
      this.registerRegistry('effect_interactions', EffectInteractions);
      
      // Game mechanics - UNIFIED
      const { DamageTypes, EnvironmentalHazards, CombatMechanics, ProgressionRules, StatusMechanics, MechanicsHelpers } = require('../data/mechanics');
      this.registerRegistry('damage_types', DamageTypes);
      this.registerRegistry('environmental_hazards', EnvironmentalHazards);
      this.registerRegistry('combat_mechanics', CombatMechanics);
      this.registerRegistry('progression_rules', ProgressionRules);
      this.registerRegistry('status_mechanics', StatusMechanics);
      this.registerRegistry('mechanics_helpers', MechanicsHelpers);
      
      // Spawn tables - UNIFIED (Phase 3)
      const { SpawnTableDefinitions } = require('../data/spawnTables');
      this.registerRegistry('spawnTable', SpawnTableDefinitions);
      
      // Room templates - UNIFIED (Phase 3)
      const { RoomTemplateDefinitions } = require('../data/roomTemplates');
      this.registerRegistry('roomTemplate', RoomTemplateDefinitions);
      
      // Prefab definitions - UNIFIED (Phase 3.6)
      const { PrefabDefinitions } = require('../data/prefabDefinitions');
      this.registerRegistry('prefab', PrefabDefinitions);
      
      // Biome definitions - UNIFIED (Phase 3.8)  
      const { BiomeDefinitions } = require('../data/biomes');
      this.registerRegistry('biome', BiomeDefinitions);
      
      console.log('[DataManager] Registered unified data systems:', Array.from(this.registries.keys()));
    } catch (error) {
      console.warn('[DataManager] Error registering unified systems:', error);
    }
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
