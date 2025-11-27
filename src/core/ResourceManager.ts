import * as ex from 'excalibur';
import { Resources } from '../config/resources';
import { Logger } from './Logger';

export class ResourceManager {
    private static _instance: ResourceManager;
    private loadingState: 'loading' | 'loaded' | 'error' = 'loading';
    private loadedResources: Set<string> = new Set();
    private loadPromise: Promise<boolean> | null = null;

    public static get instance(): ResourceManager {
        if (!this._instance) {
            this._instance = new ResourceManager();
        }
        return this._instance;
    }

    private constructor() {}

    public async waitForResource(resource: ex.ImageSource): Promise<boolean> {
        if (resource.isLoaded()) {
            return true;
        }

        Logger.debug(`[ResourceManager] Waiting for resource: ${resource.path}`);
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                Logger.error(`[ResourceManager] Timeout waiting for resource: ${resource.path}`);
                reject(new Error(`Timeout loading resource: ${resource.path}`));
            }, 10000); // 10 second timeout

            const checkLoaded = () => {
                if (resource.isLoaded()) {
                    clearTimeout(timeout);
                    Logger.debug(`[ResourceManager] Resource loaded: ${resource.path}`);
                    resolve(true);
                } else {
                    setTimeout(checkLoaded, 50);
                }
            };
            checkLoaded();
        });
    }

    public async ensureAllLoaded(): Promise<boolean> {
        // Return existing promise if already in progress
        if (this.loadPromise) {
            return this.loadPromise;
        }

        if (this.loadingState === 'loaded') {
            return true;
        }

        Logger.info('[ResourceManager] Ensuring all resources are loaded...');

        this.loadPromise = this.performResourceLoading();
        return this.loadPromise;
    }

    private async performResourceLoading(): Promise<boolean> {
        try {
            const resources = Object.values(Resources);
            Logger.info(`[ResourceManager] Waiting for ${resources.length} resources to load`);
            
            const promises = resources.map(async (resource) => {
                try {
                    await this.waitForResource(resource);
                    this.loadedResources.add(resource.path);
                    return true;
                } catch (error) {
                    Logger.error(`[ResourceManager] Failed to load resource: ${resource.path}`, error);
                    return false;
                }
            });

            const results = await Promise.all(promises);
            const failedCount = results.filter(r => !r).length;

            if (failedCount > 0) {
                Logger.warn(`[ResourceManager] ${failedCount} resources failed to load`);
                this.loadingState = 'error';
                return false;
            }

            this.loadingState = 'loaded';
            Logger.info(`[ResourceManager] All ${resources.length} resources loaded successfully`);
            return true;

        } catch (error) {
            Logger.error('[ResourceManager] Critical error during resource loading', error);
            this.loadingState = 'error';
            return false;
        }
    }

    public isReady(): boolean {
        return this.loadingState === 'loaded';
    }

    public hasErrors(): boolean {
        return this.loadingState === 'error';
    }

    public getLoadingState(): 'loading' | 'loaded' | 'error' {
        return this.loadingState;
    }

    public isResourceLoaded(resource: ex.ImageSource): boolean {
        return this.loadedResources.has(resource.path) && resource.isLoaded();
    }

    public getLoadedResourceCount(): number {
        return this.loadedResources.size;
    }

    public getTotalResourceCount(): number {
        return Object.keys(Resources).length;
    }

    public getLoadingProgress(): number {
        const total = this.getTotalResourceCount();
        const loaded = this.getLoadedResourceCount();
        return total > 0 ? loaded / total : 0;
    }

    // Reset for testing purposes
    public reset(): void {
        this.loadingState = 'loading';
        this.loadedResources.clear();
        this.loadPromise = null;
    }
}