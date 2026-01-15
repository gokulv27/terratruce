import { supabase } from '../config/database.js';

interface MapsKeyConfig {
    key: string;
    usageCount: number;
    lastUsed: Date;
}

class MapsManager {
    private keys: MapsKeyConfig[] = [];
    private isDev: boolean;

    constructor() {
        this.isDev = process.env.NODE_ENV !== 'production';

        // Primary Key
        const primaryKey = process.env.GOOGLE_MAPS_API_KEY;
        if (primaryKey) {
            this.keys.push({ key: primaryKey, usageCount: 0, lastUsed: new Date() });
        }

        // Backup Keys
        const backupKeysStr = process.env.GOOGLE_MAPS_BACKUP_KEYS || '';
        if (backupKeysStr) {
            backupKeysStr.split(',').forEach(k => {
                if (k.trim()) {
                    this.keys.push({ key: k.trim(), usageCount: 0, lastUsed: new Date() });
                }
            });
        }

        console.log(`[MapsManager] Initialized with ${this.keys.length} keys`);
    }

    /**
     * Get a key using Least Recently Used (LRU) or Least Used strategy
     * For simplicity and fairness, we'll pick the one with lowest usage count today
     * (Mock implementation of usage tracking for now, can be expanded to DB like Gemini)
     */
    public getNextKey(): string {
        if (this.keys.length === 0) {
            throw new Error('No Google Maps API keys configured');
        }

        // Sort by lowest usage
        this.keys.sort((a, b) => a.usageCount - b.usageCount);

        // Pick the best one
        const selected = this.keys[0];
        selected.usageCount++;
        selected.lastUsed = new Date();

        if (this.isDev) {
            console.log(`[MapsManager] Using key ending in ...${selected.key.slice(-4)} (Usage: ${selected.usageCount})`);
        }

        return selected.key;
    }
}

export const mapsManager = new MapsManager();
