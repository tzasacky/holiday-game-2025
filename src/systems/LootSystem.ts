import { EnchantmentSystem } from '../systems/EnchantmentSystem';
import { DataManager } from '../core/DataManager';
import { EventBus } from '../core/EventBus';
import { GameEventNames, LootRequestEvent, LootGeneratedEvent } from '../core/GameEvents';
import { ItemRarity, ItemDefinition, ItemType } from '../data/items';
import { LootTable, LootTableEntry, RarityWeights, FloorScaling } from '../data/loot';
import { InteractableID } from '../constants/InteractableIDs';
import { LootTableID } from '../constants/LootTableIDs';
import { ActorID } from '../constants/ActorIDs';
import { ActorDefinition } from '../data/actors';
import { InteractableDefinition } from '../data/interactables';
import { Logger } from '../core/Logger';

export interface GeneratedLoot {
    itemId: string;
    rarity: ItemRarity;
    quantity: number;
    identified: boolean;
    cursed: boolean;
    enchantments: any[];
    curses: any[];
    bonusStats?: Record<string, number>;
    displayName: string;
    tier: number; // Added tier property
}

export class LootSystem {
    private static _instance: LootSystem;
    private dataManager = DataManager.instance;
    private eventBus = EventBus.instance;

    public static get instance(): LootSystem {
        if (!this._instance) {
            this._instance = new LootSystem();
        }
        return this._instance;
    }

    constructor() {
        this.initialize();
    }

    private initialize() {
        // Listen for loot requests
        this.eventBus.on(GameEventNames.LootRequest, (event: LootRequestEvent) => {
            this.handleLootRequest(event);
        });

        // Listen for enemy death to auto-generate loot if configured
        // Note: This requires the DieEvent to have the actor's lootTableId
        // For now, we assume something else triggers the LootRequest
    }

    private handleLootRequest(event: LootRequestEvent) {
        const loot = this.generateLoot(event.tableId, event.floor);
        if (loot.length > 0) {
            this.eventBus.emit(GameEventNames.LootGenerated, new LootGeneratedEvent(
                loot,
                event.position,
                event.sourceId
            ));
        }
    }

    public generateLoot(tableId: string, floor: number = 1, quantity: number = 1): GeneratedLoot[] {
        const lootTable = this.dataManager.query<LootTable>('loot_tables', tableId);
        if (!lootTable) {
            Logger.warn(`[LootSystem] No loot table found for ID: ${tableId}`);
            return [];
        }

        const results: GeneratedLoot[] = [];
        
        for (let i = 0; i < quantity; i++) {
            const entry = this.selectLootEntry(lootTable, floor);
            if (entry) {
                const loot = this.generateLootFromEntry(entry, floor);
                if (loot) {
                    results.push(loot);
                }
            }
        }

        return results;
    }

    public generateLootFromEnemy(enemyType: string, floor: number): GeneratedLoot[] {
        const actorDef = this.dataManager.query<ActorDefinition>('actor', enemyType);
        const tableId = actorDef?.lootTableId || LootTableID.FloorGeneral;
        return this.generateLoot(tableId, floor);
    }

    public generateContainerLoot(containerType: string): GeneratedLoot[] {
        const interactableDef = this.dataManager.query<InteractableDefinition>('interactable', containerType);
        const tableId = interactableDef?.lootTableId || LootTableID.FloorGeneral;
        return this.generateLoot(tableId, 1);
    }

    private selectLootEntry(lootTable: LootTable, floor: number): LootTableEntry | null {
        // Filter entries by floor
        const validEntries = lootTable.entries.filter(entry => {
            if (entry.minFloor && floor < entry.minFloor) return false;
            if (entry.maxFloor && floor > entry.maxFloor) return false;
            return true;
        });

        if (validEntries.length === 0) return null;

        // Calculate weighted selection
        const totalWeight = validEntries.reduce((sum, entry) => {
            const adjustedWeight = this.getAdjustedWeight(entry, floor, lootTable.rarityBias || 0);
            return sum + adjustedWeight;
        }, 0);

        let random = Math.random() * totalWeight;
        
        for (const entry of validEntries) {
            const weight = this.getAdjustedWeight(entry, floor, lootTable.rarityBias || 0);
            random -= weight;
            if (random <= 0) {
                return entry;
            }
        }

        return validEntries[0]; // Fallback
    }

    private getAdjustedWeight(entry: LootTableEntry, floor: number, rarityBias: number): number {
        // Use imported RarityWeights and FloorScaling directly since they are data
        const rarityWeights = RarityWeights[entry.rarity] || 100;
        const scaling = FloorScaling.rarityBonusPerFloor || 0.02;
        
        const baseWeight = entry.weight;
        const rarityMultiplier = rarityWeights / 100;
        const floorBonus = Math.min(floor * scaling, 0.5); // Cap at 50% bonus
        
        return baseWeight * rarityMultiplier * (1 + floorBonus + rarityBias);
    }

    private generateLootFromEntry(entry: LootTableEntry, floor: number): GeneratedLoot | null {
        const itemDef = this.dataManager.query<ItemDefinition>('item', entry.itemId);
        if (!itemDef) {
            Logger.warn(`[LootSystem] No item definition found for: ${entry.itemId}`);
            return null;
        }

        const quantity = this.calculateQuantity(entry);
        const identified = this.shouldBeIdentified(entry.rarity, floor);
        const cursed = this.shouldBeCursed(entry.rarity, floor);
        const enchantments = this.generateEnchantments(itemDef, entry.rarity, floor);
        const curses = cursed ? this.generateCurses(itemDef, entry.rarity) : [];
        const bonusStats = this.generateBonusStats(itemDef, entry.rarity);
        const displayName = this.generateDisplayName(itemDef, identified, enchantments, curses);
        
        // Calculate tier based on rarity and floor
        const tier = Math.min(5, Math.floor(floor / 5) + (Object.values(ItemRarity).indexOf(entry.rarity)));

        return {
            itemId: entry.itemId,
            rarity: entry.rarity,
            quantity,
            identified,
            cursed,
            enchantments,
            curses,
            bonusStats,
            displayName,
            tier
        };
    }

    private calculateQuantity(entry: LootTableEntry): number {
        if (!entry.quantity) return 1;
        
        const min = entry.quantity.min || 1;
        const max = entry.quantity.max || min;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private shouldBeIdentified(rarity: ItemRarity, floor: number): boolean {
        // Higher rarity items are less likely to be identified
        // Later floors have better identification rates
        const baseChance = {
            [ItemRarity.COMMON]: 0.9,
            [ItemRarity.UNCOMMON]: 0.7,
            [ItemRarity.RARE]: 0.4,
            [ItemRarity.EPIC]: 0.2,
            [ItemRarity.LEGENDARY]: 0.1,
            [ItemRarity.UNIQUE]: 0.05
        }[rarity] || 0.5;

        const floorBonus = Math.min(floor * 0.01, 0.3); // Up to 30% bonus
        return Math.random() < (baseChance + floorBonus);
    }

    private shouldBeCursed(rarity: ItemRarity, floor: number): boolean {
        // Lower rarity items more likely to be cursed
        const baseChance = {
            [ItemRarity.COMMON]: 0.1,
            [ItemRarity.UNCOMMON]: 0.05,
            [ItemRarity.RARE]: 0.02,
            [ItemRarity.EPIC]: 0.01,
            [ItemRarity.LEGENDARY]: 0.005,
            [ItemRarity.UNIQUE]: 0
        }[rarity] || 0.05;

        // Difficulty settings affect curse frequency
        const difficulty = this.dataManager.query<any>('difficulty', 'curseFrequency') || 1;
        return Math.random() < (baseChance * difficulty);
    }

    private generateEnchantments(itemDef: ItemDefinition, rarity: ItemRarity, floor: number): any[] {
        if (!itemDef.allowedEnchantments) return [];

        const maxEnchantments = {
            [ItemRarity.COMMON]: 0,
            [ItemRarity.UNCOMMON]: 1,
            [ItemRarity.RARE]: 2,
            [ItemRarity.EPIC]: 3,
            [ItemRarity.LEGENDARY]: 4,
            [ItemRarity.UNIQUE]: 5
        }[rarity] || 0;

        const enchantments: any[] = [];
        const enchantmentChance = 0.3 + (floor * 0.02); // Better chance on higher floors

        for (let i = 0; i < maxEnchantments; i++) {
            if (Math.random() < enchantmentChance) {
                const enchantment = this.selectRandomEnchantment(itemDef.allowedEnchantments);
                if (enchantment && !enchantments.some(e => e.type === enchantment.type)) {
                    enchantments.push(enchantment);
                }
            }
        }

        return enchantments;
    }

    private generateCurses(itemDef: ItemDefinition, rarity: ItemRarity): any[] {
        if (!itemDef.possibleCurses) return [];

        const curseType = itemDef.possibleCurses[
            Math.floor(Math.random() * itemDef.possibleCurses.length)
        ];

        // Use EnchantmentSystem for actual curse generation
        const tier = Object.values(ItemRarity).indexOf(rarity) + 1;
        const curse = EnchantmentSystem.generateCurse?.(tier);
        return curse ? [curse] : [];
    }

    private generateBonusStats(itemDef: ItemDefinition, rarity: ItemRarity): Record<string, number> {
        const bonusStats: Record<string, number> = {};
        
        const bonusCount = {
            [ItemRarity.COMMON]: 0,
            [ItemRarity.UNCOMMON]: 1,
            [ItemRarity.RARE]: 2,
            [ItemRarity.EPIC]: 3,
            [ItemRarity.LEGENDARY]: 4,
            [ItemRarity.UNIQUE]: 5
        }[rarity] || 0;

        if (bonusCount === 0) return bonusStats;

        const baseStats = itemDef.stats;
        if (!baseStats) return bonusStats;

        const possibleStats = Object.keys(baseStats);
        
        for (let i = 0; i < Math.min(bonusCount, possibleStats.length); i++) {
            const stat = possibleStats[Math.floor(Math.random() * possibleStats.length)];
            if (!bonusStats[stat]) {
                const baseStat = baseStats[stat as keyof typeof baseStats] || 1;
                const bonus = Math.ceil(baseStat * 0.1 * (Object.values(ItemRarity).indexOf(rarity) + 1));
                bonusStats[stat] = bonus;
            }
        }

        return bonusStats;
    }

    private selectRandomEnchantment(allowedTypes: any[]): any | null {
        if (allowedTypes.length === 0) return null;

        const enchantmentType = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
        
        // Use EnchantmentSystem for actual enchantment generation
        // Mapping rarity to tier for now
        return EnchantmentSystem.generateEnchantment?.(1, true) || null;
    }

    private generateDisplayName(
        itemDef: ItemDefinition, 
        identified: boolean, 
        enchantments: any[], 
        curses: any[]
    ): string {
        if (!identified) {
            return this.getUnidentifiedName(itemDef);
        }

        let name = itemDef.name;
        
        // Add enchantment prefixes/suffixes
        if (enchantments.length > 0) {
            const enchantment = enchantments[0]; // Use first enchantment for name
            name = `${enchantment.name} ${name}`;
        }

        // Add curse indicators
        if (curses.length > 0) {
            name = `Cursed ${name}`;
        }

        return name;
    }

    private getUnidentifiedName(itemDef: ItemDefinition): string {
        const categoryNames: Record<string, string> = {
            [ItemType.WEAPON]: 'Weapon',
            [ItemType.ARMOR]: 'Armor',
            [ItemType.CONSUMABLE]: 'Potion',
            [ItemType.ARTIFACT]: 'Artifact',
            [ItemType.MISC]: 'Item'
        };

        const rarityAdjectives: Record<string, string> = {
            [ItemRarity.COMMON]: 'Plain',
            [ItemRarity.UNCOMMON]: 'Quality',
            [ItemRarity.RARE]: 'Fine',
            [ItemRarity.EPIC]: 'Ornate',
            [ItemRarity.LEGENDARY]: 'Magnificent',
            [ItemRarity.UNIQUE]: 'Mysterious'
        };

        const categoryName = categoryNames[itemDef.type] || 'Item';
        const rarityAdj = rarityAdjectives[itemDef.rarity] || 'Unknown';

        return `${rarityAdj} ${categoryName}`;
    }

    // Public utility methods
    public static getLootDropChance(enemyType: string, floor: number): number {
        const actorDef = DataManager.instance.query<ActorDefinition>('actor', enemyType);
        const baseChance = actorDef?.dropChance || 0.1;

        const difficulty = DataManager.instance.query<any>('difficulty', 'lootScarcity') || 1;
        const floorBonus = floor * 0.01; // +1% per floor

        return Math.min(0.5, (baseChance / difficulty) * (1 + floorBonus));
    }

    public static getItemValue(itemDef: ItemDefinition, floor: number): number {
        if (!itemDef.sellValue) return 0;
        
        // Scale value based on floor progression
        const floorMultiplier = 1 + (floor * 0.05); // 5% more valuable per floor
        return Math.floor(itemDef.sellValue * floorMultiplier);
    }
}