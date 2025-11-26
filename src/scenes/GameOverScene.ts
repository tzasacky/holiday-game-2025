import * as ex from 'excalibur';
import { GameEventNames } from '../core/GameEvents';
import { EventBus } from '../core/EventBus';

export class GameOverScene extends ex.Scene {
    private ui: HTMLElement | null = null;

    onInitialize(engine: ex.Engine): void {
        // No persistent setup needed
    }

    onActivate(context: ex.SceneActivationContext<unknown>): void {
        // Create UI
        this.ui = document.createElement('div');
        this.ui.style.position = 'absolute';
        this.ui.style.top = '0';
        this.ui.style.left = '0';
        this.ui.style.width = '100%';
        this.ui.style.height = '100%';
        this.ui.style.display = 'flex';
        this.ui.style.flexDirection = 'column';
        this.ui.style.justifyContent = 'center';
        this.ui.style.alignItems = 'center';
        this.ui.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.ui.style.zIndex = '1000';
        this.ui.style.color = 'red';
        this.ui.style.fontFamily = 'serif';

        const title = document.createElement('h1');
        title.textContent = 'YOU DIED';
        title.style.fontSize = '5rem';
        title.style.marginBottom = '2rem';
        title.style.textShadow = '0 0 10px darkred';

        const restartBtn = document.createElement('button');
        restartBtn.textContent = 'Start Over';
        restartBtn.style.fontSize = '2rem';
        restartBtn.style.padding = '1rem 2rem';
        restartBtn.style.cursor = 'pointer';
        restartBtn.style.backgroundColor = '#333';
        restartBtn.style.color = 'white';
        restartBtn.style.border = '2px solid red';
        
        restartBtn.onclick = () => {
            window.location.reload(); // Simple restart for now
        };

        this.ui.appendChild(title);
        this.ui.appendChild(restartBtn);
        document.body.appendChild(this.ui);
    }

    onDeactivate(context: ex.SceneActivationContext<unknown>): void {
        if (this.ui) {
            this.ui.remove();
            this.ui = null;
        }
    }
}
