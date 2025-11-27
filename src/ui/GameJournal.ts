import { UIComponent } from './components/UIComponent';
import { EventBus } from '../core/EventBus';
import { GameEventNames, LogEvent, AttackEvent, DamageEvent, DieEvent, ItemPickupEvent, ItemUseEvent, LevelUpEvent, HealEvent, ItemEquipEvent, ItemUnequipEvent } from '../core/GameEvents';
import { getFlavorText } from '../data/flavorText';

export enum LogCategory {
    Combat = 'Combat',
    Items = 'Items', 
    Effects = 'Effects',
    Interactions = 'Interactions',
    Movement = 'Movement',
    System = 'System'
}

export class GameJournal extends UIComponent {
    private content: HTMLElement | null = null;
    private toggleBtn: HTMLElement | null = null;
    private isCollapsed: boolean = false;
    private readonly MAX_ENTRIES = 100;

    constructor() {
        super('#game-journal');
        this.initialize();
    }

    private initialize(): void {
        if (!this.element) return;

        this.content = document.getElementById('journal-content');
        this.toggleBtn = document.getElementById('journal-toggle');

        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggleCollapse());
        }

        // Listen for logs
        const bus = EventBus.instance;
        
        bus.on(GameEventNames.Log, (event: LogEvent) => {
            this.addEntry(event.message, event.category as LogCategory, event.color);
        });

        // Listen for game events and auto-log them
        bus.on(GameEventNames.Attack, (event: AttackEvent) => {
            const params = {
                attacker: event.attacker.name,
                target: event.target.name,
                damage: event.damage.toString()
            };
            const message = getFlavorText(GameEventNames.Attack, params);
            
            if (event.attacker.isPlayer) {
                this.addEntry(message, LogCategory.Combat);
            } else if (event.target.isPlayer) {
                this.addEntry(message, LogCategory.Combat, '#ff6b6b');
            }
        });

        bus.on(GameEventNames.Die, (event: DieEvent) => {
            const params = { actor: event.actor.name };
            const message = getFlavorText(GameEventNames.Die, params);
            
            if (event.actor.isPlayer) {
                this.addEntry(message, LogCategory.System, '#ff0000');
            } else {
                this.addEntry(message, LogCategory.Combat, '#ffd93d');
            }
        });

        bus.on(GameEventNames.ItemPickup, (event: ItemPickupEvent) => {
            if (event.actor.isPlayer) {
                const params = { item: event.item.getDisplayName() };
                this.addEntry(getFlavorText(GameEventNames.ItemPickup, params), LogCategory.Items);
            }
        });

        bus.on(GameEventNames.ItemUse, (event: ItemUseEvent) => {
            if (event.actor.isPlayer) {
                const params = { item: event.item.getDisplayName() };
                this.addEntry(getFlavorText(GameEventNames.ItemUse, params), LogCategory.Items);
            }
        });

        bus.on(GameEventNames.LevelUp, (event: LevelUpEvent) => {
            if (event.actor.isPlayer) {
                const params = { level: event.newLevel.toString() };
                this.addEntry(getFlavorText(GameEventNames.LevelUp, params), LogCategory.System, '#74c0fc');
            }
        });

        bus.on(GameEventNames.Heal, (event: HealEvent) => {
            if (event.target.isPlayer || (event.source && event.source.isPlayer)) {
                const params = { 
                    target: event.target.name,
                    amount: event.amount.toString()
                };
                this.addEntry(getFlavorText(GameEventNames.Heal, params), LogCategory.Combat, '#40c057');
            }
        });

        bus.on(GameEventNames.EquipmentEquipped, (event: ItemEquipEvent) => {
            if (event.actor.isPlayer) {
                const params = { item: event.item.getDisplayName() };
                this.addEntry(getFlavorText(GameEventNames.EquipmentEquipped, params), LogCategory.Items);
            }
        });

        bus.on(GameEventNames.EquipmentUnequipped, (event: ItemUnequipEvent) => {
            if (event.actor.isPlayer) {
                const params = { item: event.item.getDisplayName() };
                this.addEntry(getFlavorText(GameEventNames.EquipmentUnequipped, params), LogCategory.Items);
            }
        });
    }

    private toggleCollapse(): void {
        this.isCollapsed = !this.isCollapsed;
        if (this.content) {
            this.content.style.display = this.isCollapsed ? 'none' : 'block';
        }
        if (this.toggleBtn) {
            this.toggleBtn.textContent = this.isCollapsed ? '+' : '−';
        }
    }

    public addEntry(message: string, category: LogCategory, color?: string): void {
        if (!this.content) return;

        const entry = document.createElement('div');
        entry.className = 'journal-entry';
        
        // Timestamp
        const time = new Date();
        const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'timestamp';
        timeSpan.textContent = `[${timeStr}] `;
        timeSpan.style.color = '#888';
        entry.appendChild(timeSpan);

        // Message
        const msgSpan = document.createElement('span');
        msgSpan.textContent = message;
        if (color) {
            msgSpan.style.color = color;
        } else {
            // Default colors based on category
            switch (category) {
                case LogCategory.Combat: msgSpan.style.color = '#ff6b6b'; break;
                case LogCategory.Items: msgSpan.style.color = '#ffd93d'; break;
                case LogCategory.System: msgSpan.style.color = '#4dabf7'; break;
                default: msgSpan.style.color = '#e9ecef';
            }
        }
        entry.appendChild(msgSpan);

        this.content.appendChild(entry);

        // Auto-scroll
        this.content.scrollTop = this.content.scrollHeight;

        // Limit entries
        while (this.content.children.length > this.MAX_ENTRIES) {
            this.content.removeChild(this.content.firstChild!);
        }
    }
}