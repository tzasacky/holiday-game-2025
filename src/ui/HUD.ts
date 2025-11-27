import { UIComponent } from './components/UIComponent';
import { EventBus } from '../core/EventBus';
import { GameEventNames, HealthChangeEvent, WarmthChangeEvent } from '../core/GameEvents';
import { GameActor } from '../components/GameActor';
import { Logger } from '../core/Logger';

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
            const stats = this.hero.getGameComponent('stats') as any; // Temporary cast until StatsComponent is fully typed/imported
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
            this.updateHealth(this.hero.hp, this.hero.maxHp);
            this.updateWarmth(this.hero.warmth, 100);
        }
    }
}
