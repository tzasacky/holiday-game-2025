export class ActorStats {
    public hp: number = 10;
    public maxHp: number = 10;
    public strength: number = 1;
    public defense: number = 0;
    public warmth: number = 100;
    public agility: number = 1;
    public dexterity: number = 1;
    public intelligence: number = 1;
    public perception: number = 1;
    public speed: number = 1;
    
    // Progression
    public level: number = 1;
    public xp: number = 0;
    public xpToNextLevel: number = 100;

    constructor(config?: Partial<ActorStats>) {
        if (config) {
            Object.assign(this, config);
        }
    }
}
