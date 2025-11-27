import { UIComponent } from './components/UIComponent';
import { EventBus } from '../core/EventBus';
import { GameEventNames, HealthChangeEvent, WarmthChangeEvent } from '../core/GameEvents';

export class HUD extends UIComponent {
    private hpBar: HTMLElement | null = null;
    private hpText: HTMLElement | null = null;
    private warmthBar: HTMLElement | null = null;
    private warmthText: HTMLElement | null = null;

    constructor(private hero: any) { // Using any to avoid circular dependency if possible, or import Hero
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
            this.updateHealth(this.hero.hp, this.hero.maxHp);
            this.updateWarmth(this.hero.warmth, this.hero.maxWarmth);
        }

        this.setupListeners();
    }

    private setupListeners(): void {
        const bus = EventBus.instance;
        
        bus.on(GameEventNames.HealthChange, (event: HealthChangeEvent) => {
            this.updateHealth(event.current, event.max);
        });

        bus.on(GameEventNames.WarmthChange, (event: WarmthChangeEvent) => {
            this.updateWarmth(event.current, event.max);
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
}
