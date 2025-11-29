import { UIComponent } from './components/UIComponent';
import { EventBus } from '../core/EventBus';
import { GameEventNames, HealthChangeEvent, WarmthChangeEvent } from '../core/GameEvents';
import { GameActor } from '../components/GameActor';
import { Logger } from '../core/Logger';
import { StatsComponent } from '../components/StatsComponent';

export class HUD extends UIComponent {
    private hpBar: HTMLElement | null = null;
    private hpText: HTMLElement | null = null;
    private warmthBar: HTMLElement | null = null;
    private warmthText: HTMLElement | null = null;

    constructor(private hero: GameActor) {
        super('#hud');
        this.initialize();
    }

    private initialize(): void {
        this.hpBar = document.getElementById('hp-bar');
        this.hpText = document.getElementById('hp-text');
        this.warmthBar = document.getElementById('warmth-bar');
        this.warmthText = document.getElementById('warmth-text');

        // Initial update
        if (this.hero) {
            // We need to access stats from StatsComponent if possible, or via helper methods on GameActor if they exist.
            // GameActor doesn't have direct hp/maxHp properties anymore, they are in StatsComponent.
            // However, for now, let's assume the stats are accessible or we wait for an event.
            // Actually, we should query the stats component.
            // Actually, we should query the stats component.
            const stats = this.hero.getGameComponent<StatsComponent>('stats');
            if (stats) {
                 this.updateHealth(stats.getStat('hp'), stats.getStat('maxHp'));
                 this.updateWarmth(stats.getStat('warmth'), stats.getStat('maxWarmth'));
            }
        }

        this.setupListeners();
    }

    private setupListeners(): void {
        const bus = EventBus.instance;
        
        bus.on(GameEventNames.HealthChange, (event: HealthChangeEvent) => {
            if (event.actor === this.hero) {
                Logger.debug(`[HUD] Received HealthChange for hero: ${event.current}/${event.max}`);
                this.updateHealth(event.current, event.max);
            }
        });

        bus.on(GameEventNames.WarmthChange, (event: WarmthChangeEvent) => {
            if (event.actor === this.hero) {
                this.updateWarmth(event.current, event.max);
            }
        });
    }

    public updateHealth(current: number, max: number): void {
        if (this.hpBar) {
            const percent = Math.max(0, Math.min(100, (current / max) * 100));
            this.hpBar.style.width = `${percent}%`;
        }
        if (this.hpText) {
            this.hpText.textContent = `${Math.ceil(current)}/${max}`;
        }
    }

    public updateWarmth(current: number, max: number): void {
        if (this.warmthBar) {
            const percent = Math.max(0, Math.min(100, (current / max) * 100));
            this.warmthBar.style.width = `${percent}%`;
        }
        if (this.warmthText) {
            this.warmthText.textContent = `${Math.floor(current)}/${max}`;
        }
    }

    public update(): void {
        if (this.hero) {
            const stats = this.hero.getGameComponent<StatsComponent>('stats');
            if (stats) {
                this.updateHealth(stats.getStat('hp'), stats.getStat('maxHp'));
                this.updateWarmth(stats.getStat('warmth'), stats.getStat('maxWarmth'));
                this.updateStats(stats);
            }
        }
    }

    private updateStats(stats: StatsComponent): void {
        const hud = document.getElementById('hud');
        if (!hud) return;

        let statsContainer = document.getElementById('hero-stats-container');
        if (!statsContainer) {
            // Create container if it doesn't exist, appending to main HUD
            statsContainer = document.createElement('div');
            statsContainer.id = 'hero-stats-container';
            statsContainer.style.marginTop = '8px';
            statsContainer.style.paddingTop = '8px';
            statsContainer.style.borderTop = '1px solid var(--color-border)';
            statsContainer.style.fontSize = '12px';
            statsContainer.style.display = 'grid';
            statsContainer.style.gridTemplateColumns = '1fr 1fr';
            statsContainer.style.gap = '4px';
            hud.appendChild(statsContainer);
        }

        const str = stats.getStat('strength');
        const def = stats.getStat('defense');
        const acc = stats.getStat('accuracy');
        const crit = stats.getStat('critRate');

        // Format percentages (assuming 0-1 range, e.g. 0.95 -> 95%)
        // If values are already 0-100, this will show 9500%, so we check range
        const accText = acc <= 1 ? Math.round(acc * 100) : Math.round(acc);
        const critText = crit <= 1 ? Math.round(crit * 100) : Math.round(crit);

        statsContainer.innerHTML = `
            <div style="color: var(--color-text-secondary)">STR: <span style="color: var(--color-text)">${str}</span></div>
            <div style="color: var(--color-text-secondary)">DEF: <span style="color: var(--color-text)">${def}</span></div>
            <div style="color: var(--color-text-secondary)">ACC: <span style="color: var(--color-text)">${accText}%</span></div>
            <div style="color: var(--color-text-secondary)">CRT: <span style="color: var(--color-text)">${critText}%</span></div>
        `;
    }
}
