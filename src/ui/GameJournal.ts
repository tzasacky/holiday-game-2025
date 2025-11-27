import { UIComponent } from './components/UIComponent';
import { EventBus } from '../core/EventBus';
import { GameEventNames, LogEvent } from '../core/GameEvents';

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
        EventBus.instance.on(GameEventNames.Log, (event: LogEvent) => {
            this.addEntry(event.message, event.category as LogCategory, event.color);
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