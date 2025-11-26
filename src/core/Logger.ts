export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export class Logger {
    private static currentLevel: LogLevel = LogLevel.INFO;
    
    public static setLevel(level: LogLevel) {
        this.currentLevel = level;
    }
    
    public static debug(...args: any[]) {
        if (this.currentLevel <= LogLevel.DEBUG) {
            console.log('[DEBUG]', ...args);
        }
    }
    
    public static info(...args: any[]) {
        if (this.currentLevel <= LogLevel.INFO) {
            console.log('[INFO]', ...args);
        }
    }
    
    public static warn(...args: any[]) {
        if (this.currentLevel <= LogLevel.WARN) {
            console.warn('[WARN]', ...args);
        }
    }
    
    public static error(...args: any[]) {
        if (this.currentLevel <= LogLevel.ERROR) {
            console.error('[ERROR]', ...args);
        }
    }
}