export abstract class UIComponent {
    protected element: HTMLElement | null = null;
    protected visible: boolean = true;

    constructor(protected selector: string) {
        this.element = document.querySelector(selector);
        if (!this.element) {
            console.warn(`[UIComponent] Element not found: ${selector}`);
        }
    }

    public show(): void {
        if (this.element) {
            this.element.classList.add('visible');
            this.element.style.display = ''; // Reset display if inline style was set
            this.visible = true;
        }
    }

    public hide(): void {
        if (this.element) {
            this.element.classList.remove('visible');
            this.element.style.display = 'none';
            this.visible = false;
        }
    }

    public toggle(): void {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    public isVisible(): boolean {
        return this.visible;
    }
}
