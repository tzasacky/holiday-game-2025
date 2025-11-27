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
import { RegistryKey } from '../constants/RegistryKeys';
import { Logger } from './Logger';

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
        this.registerRegistry(RegistryKey.TERRAIN, TerrainDefinitions);
        
        // Enchantment system
        this.registerRegistry(RegistryKey.ENCHANTMENT, EnchantmentData);
        this.registerRegistry(RegistryKey.CURSE, CurseData);
        
        // Balance system
        this.registerRegistry(RegistryKey.DIFFICULTY, Difficulty);
        this.registerRegistry(RegistryKey.ENEMY_SCALING, EnemyScaling);
        this.registerRegistry(RegistryKey.STAT_REQUIREMENTS, StatRequirementsByFloor);
        this.registerRegistry(RegistryKey.RESOURCE_SCALING, ResourceScaling);
        this.registerRegistry(RegistryKey.VICTORY, VictoryConditions);
        
        // Actor definitions
        this.registerRegistry(RegistryKey.ACTOR, ActorDefinitions);
        
        // Item definitions
        this.registerRegistry(RegistryKey.ITEM, ItemDefinitions);
        this.registerRegistry(RegistryKey.ITEM_CATEGORIES, ItemCategories);
        
        // Interactable definitions
        this.registerRegistry(RegistryKey.INTERACTABLE, InteractableDefinitions);
        this.registerRegistry(RegistryKey.INTERACTABLE_CATEGORIES, InteractableCategories);
        
        // Loot definitions
        this.registerRegistry(RegistryKey.LOOT_TABLES, LootTables);
        this.registerRegistry(RegistryKey.LOOT_TABLES, LootTables);
        this.registerRegistry(RegistryKey.RARITY_WEIGHTS, RarityWeights);
        this.registerRegistry(RegistryKey.FLOOR_SCALING, FloorScaling);
        
        // Abilities definitions - UNIFIED (TODO: abilities.ts is currently commented out)
        // const { AbilityDefinitions, AbilityProgression, AbilityCategories } = require('../data/abilities');
        // this.registerRegistry(RegistryKey.ABILITIES, AbilityDefinitions);
        // this.registerRegistry(RegistryKey.ABILITY_PROGRESSION, AbilityProgression);
        // this.registerRegistry(RegistryKey.ABILITY_CATEGORIES, AbilityCategories);
        
        // Effects definitions
        this.registerRegistry(RegistryKey.EFFECTS, EffectDefinitions);
        this.registerRegistry(RegistryKey.EFFECT_CATEGORIES, EffectCategories);
        this.registerRegistry(RegistryKey.EFFECT_INTERACTIONS, EffectInteractions);
        
        // Game mechanics
        this.registerRegistry(RegistryKey.DAMAGE_TYPES, DamageTypes);
        this.registerRegistry(RegistryKey.DAMAGE_TYPES, DamageTypes);
        this.registerRegistry(RegistryKey.ENVIRONMENTAL_HAZARDS, EnvironmentalHazards);
        this.registerRegistry(RegistryKey.COMBAT_MECHANICS, CombatMechanics);
        this.registerRegistry(RegistryKey.PROGRESSION_RULES, ProgressionRules);
        this.registerRegistry(RegistryKey.STATUS_MECHANICS, StatusMechanics);
        this.registerRegistry(RegistryKey.MECHANICS_HELPERS, MechanicsHelpers);
        
        // Spawn tables
        this.registerRegistry(RegistryKey.SPAWN_TABLE, AllSpawnTables);
        
        // Room templates
        this.registerRegistry(RegistryKey.ROOM_TEMPLATE, RoomTemplateDefinitions);
        
        // Prefabs
        this.registerRegistry(RegistryKey.PREFAB, PrefabDefinitions);
        
        // Biomes
        this.registerRegistry(RegistryKey.BIOME, BiomeDefinitions);
        
        Logger.info(`[DataManager] Registered unified data systems: ${this.getRegisteredSystems()}`);
        
    } catch (error) {
        Logger.warn(`[DataManager] Error registering unified systems: ${error}`);
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

