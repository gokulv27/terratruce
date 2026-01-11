/**
 * =====================================================
 * GEMINI API LIMITS & QUOTAS (as of Dec 2024)
 * =====================================================
 * 
 * Gemini 2.0 Flash (Free Tier):
 * - 15 RPM (Requests Per Minute)
 * - 1 million TPM (Tokens Per Minute)
 * - 1,500 RPD (Requests Per Day)
 * 
 * Gemini 2.0 Flash (Paid Tier):
 * - 1,000 RPM
 * - 4 million TPM
 * - No daily limit
 * 
 * Vision API:
 * - Same limits as text
 * - Max image size: 20MB
 * - Supported: PNG, JPEG, WEBP, HEIC, HEIF
 * 
 * Error Codes:
 * - 429: Rate limit exceeded (retry with different key)
 * - 403: Quota exceeded or invalid key
 * - 503: Service temporarily unavailable
 * =====================================================
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../config/database.js';

interface KeyConfig {
  key: string;
  rpm?: number;      // Requests per minute (custom limit)
  tpm?: number;      // Tokens per minute (custom limit)
  rpd?: number;      // Requests per day (custom limit)
}

interface KeyUsageStats {
  requestCount: number;
  tokenCount: number;
  dailyRequests: number;
  lastReset: Date;
  lastDailyReset: Date;
}

interface GeminiConfig {
  primaryKey: KeyConfig;
  backupKeys: KeyConfig[];
  currentIndex: number;
  isDev: boolean;
}

class GeminiManager {
  private config: GeminiConfig;
  private clients: Map<string, GoogleGenerativeAI> = new Map();
  private usage: Map<string, KeyUsageStats> = new Map();

  constructor() {
    const isDev = process.env.NODE_ENV !== 'production';

    // Parse primary key with optional limits
    const primaryKeyStr = process.env.GEMINI_PRIMARY_KEY;
    if (!primaryKeyStr) {
      throw new Error('GEMINI_PRIMARY_KEY is required in .env');
    }

    const primaryKey = this.parseKeyConfig(primaryKeyStr, 'primary');

    // Parse backup keys with optional limits
    const backupKeysStr = process.env.GEMINI_BACKUP_KEYS || '';
    const backupKeys = backupKeysStr
      .split(',')
      .filter(k => k.trim())
      .map((k, idx) => this.parseKeyConfig(k.trim(), `backup-${idx}`));

    this.config = {
      primaryKey,
      backupKeys,
      currentIndex: 0,
      isDev
    };

    // Initialize clients and usage tracking
    this.initializeClient('primary', primaryKey.key);
    backupKeys.forEach((keyConfig, idx) => {
      this.initializeClient(`backup-${idx}`, keyConfig.key);
    });

    console.log(`[GeminiManager] Initialized with 1 primary + ${backupKeys.length} backup keys`);
    if (isDev) {
      console.log('[GeminiManager] 🔧 DEV MODE: Token monitoring enabled');
    }
  }

  /**
   * Parse key config from env string
   * Format: "key" or "key|rpm:15|tpm:1000000|rpd:1500"
   */
  private parseKeyConfig(configStr: string, id: string): KeyConfig {
    const parts = configStr.split('|');
    const key = parts[0];

    const config: KeyConfig = { key };

    // Parse optional limits
    parts.slice(1).forEach(part => {
      const [limitType, value] = part.split(':');
      const numValue = parseInt(value, 10);

      if (limitType === 'rpm') config.rpm = numValue;
      else if (limitType === 'tpm') config.tpm = numValue;
      else if (limitType === 'rpd') config.rpd = numValue;
    });

    return config;
  }

  private initializeClient(id: string, key: string) {
    this.clients.set(id, new GoogleGenerativeAI(key));

    // Default initial state
    this.usage.set(id, {
      requestCount: 0,
      tokenCount: 0,
      dailyRequests: 0,
      lastReset: new Date(),
      lastDailyReset: new Date()
    });

    // Load persistent state from Supabase
    this.loadUsage(id);
  }

  /**
   * Load usage stats from Supabase
   */
  private async loadUsage(keyId: string) {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('private.api_usage') // Note: accessing private schema often requires RLS/Function or direct table access if configured
        .select('*') // If this fails due to no table, we just catch it
        .eq('key_id', keyId)
        .single();

      // If table might be in public schema or mapped differently, try fallback if error
      // But for now assuming the SQL setup was run

      if (data) {
        this.usage.set(keyId, {
          requestCount: data.request_count || 0,
          tokenCount: data.token_count || 0,
          dailyRequests: data.daily_requests || 0,
          lastReset: new Date(data.last_reset),
          lastDailyReset: new Date(data.last_daily_reset)
        });
        if (this.config.isDev) {
          console.log(`[GeminiManager] 📥 Loaded stats for ${keyId}: ${data.daily_requests} daily reqs`);
        }
      }
    } catch (err) {
      // Silent fail - just use memory defaults
      // console.warn(`[GeminiManager] Could not load stats for ${keyId} (using memory)`);
    }
  }

  /**
   * Persist usage stats to Supabase
   */
  private async persistUsage(keyId: string) {
    if (!supabase) return;

    const stats = this.usage.get(keyId);
    if (!stats) return;

    try {
      // Use the helper RPC function if available, or direct insert
      const { error } = await supabase.rpc('update_api_usage', { // We use RPC if we made the function, traversing schema issues
        p_key_id: keyId,
        p_request_count: stats.requestCount,
        p_daily_requests: stats.dailyRequests,
        p_token_count: stats.tokenCount,
        p_last_reset: stats.lastReset.toISOString(),
        p_last_daily_reset: stats.lastDailyReset.toISOString()
      });

      if (error) {
        // Fallback to direct upsert if RPC missing
        await supabase.from('private.api_usage').upsert({
          key_id: keyId,
          request_count: stats.requestCount,
          daily_requests: stats.dailyRequests,
          token_count: stats.tokenCount,
          last_reset: stats.lastReset.toISOString(),
          last_daily_reset: stats.lastDailyReset.toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      // console.warn('[GeminiManager] Failed to persist usage:', err);
    }
  }

  /**
   * Check if key has exceeded custom limits
   */
  private checkLimits(keyId: string, keyConfig: KeyConfig): boolean {
    const stats = this.usage.get(keyId);
    if (!stats) return true;

    const now = new Date();

    // Reset minute counter if needed
    if (now.getTime() - stats.lastReset.getTime() > 60000) {
      stats.requestCount = 0;
      stats.tokenCount = 0;
      stats.lastReset = now;
      this.persistUsage(keyId); // Sync reset
    }

    // Reset daily counter if needed
    if (now.getTime() - stats.lastDailyReset.getTime() > 86400000) {
      stats.dailyRequests = 0;
      stats.lastDailyReset = now;
      this.persistUsage(keyId); // Sync reset
    }

    // Check custom limits
    if (keyConfig.rpm && stats.requestCount >= keyConfig.rpm) {
      if (this.config.isDev) {
        console.warn(`[GeminiManager] ⚠️ Key ${keyId} RPM limit reached: ${stats.requestCount}/${keyConfig.rpm}`);
      }
      return false;
    }

    if (keyConfig.rpd && stats.dailyRequests >= keyConfig.rpd) {
      if (this.config.isDev) {
        console.warn(`[GeminiManager] ⚠️ Key ${keyId} daily limit reached: ${stats.dailyRequests}/${keyConfig.rpd}`);
      }
      return false;
    }

    return true;
  }

  /**
   * Track usage for a key
   */
  private trackUsage(keyId: string, estimatedTokens: number = 100) {
    const stats = this.usage.get(keyId);
    if (!stats) return;

    stats.requestCount++;
    stats.dailyRequests++;
    stats.tokenCount += estimatedTokens;

    // Persist to DB
    this.persistUsage(keyId);

    if (this.config.isDev) {
      console.log(`[GeminiManager] 📊 ${keyId}: ${stats.requestCount} req/min, ${stats.dailyRequests} req/day, ~${stats.tokenCount} tokens/min`);
    }
  }

  /**
   * Get all configured keys with their IDs and configs
   */
  private getAllKeys(): Array<{ id: string; config: KeyConfig }> {
    const keys: Array<{ id: string; config: KeyConfig }> = [
      { id: 'primary', config: this.config.primaryKey }
    ];

    this.config.backupKeys.forEach((config, idx) => {
      keys.push({ id: `backup-${idx}`, config });
    });

    return keys;
  }

  /**
   * Get the key with the lowest daily usage that hasn't exceeded limits
   */
  private getLeastUsedKey(
    candidates: Array<{ id: string; config: KeyConfig }>,
    excludeIds: Set<string>
  ): { client: GoogleGenerativeAI; id: string; config: KeyConfig } | null {

    // Filter candidates: must not be excluded AND must have quota remaining
    const eligible = candidates.filter(({ id, config }) => {
      if (excludeIds.has(id)) return false;
      return this.checkLimits(id, config);
    });

    if (eligible.length === 0) return null;

    // Sort by daily usage (ascending)
    // If ties, stable sort or random doesn't strictly matter, but sorting is deterministic
    eligible.sort((a, b) => {
      const usageA = this.usage.get(a.id)?.dailyRequests || 0;
      const usageB = this.usage.get(b.id)?.dailyRequests || 0;
      return usageA - usageB;
    });

    const best = eligible[0];
    return {
      client: this.clients.get(best.id)!,
      id: best.id,
      config: best.config
    };
  }

  /**
   * Generate text with load balancing (Least Used Strategy)
   * Uses the key with lowest daily usage from the entire pool (Primary + Backups)
   */
  async generateText(prompt: string): Promise<string> {
    const allKeys = this.getAllKeys();
    const excludeIds = new Set<string>();
    let lastError: Error | null = null;

    // Try up to N times (where N is total keys)
    while (excludeIds.size < allKeys.length) {
      const selection = this.getLeastUsedKey(allKeys, excludeIds);

      if (!selection) {
        // No more eligible keys
        break;
      }

      const { client, id } = selection;

      try {
        const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Track usage
        this.trackUsage(id, prompt.length + text.length);

        if (this.config.isDev) {
          console.log(`[GeminiManager] ✅ Success with key ${id} (Least Used)`);
        }

        return text;

      } catch (error: any) {
        const isRateLimit = error?.status === 429 || error?.message?.includes('429');
        const isQuotaError = error?.status === 403 || error?.message?.includes('quota');

        if (isRateLimit || isQuotaError) {
          if (this.config.isDev) {
            console.warn(`[GeminiManager] ⚠️ Key ${id} failed (${error.status}), excluding...`);
          }
          excludeIds.add(id);
          lastError = error;
          continue; // Try next best key
        }

        // For other errors, throw immediately
        throw error;
      }
    }

    throw new Error(`All Gemini API keys exhausted. Last error: ${lastError?.message}`);
  }

  /**
   * Analyze image with vision model
   * Prioritizes Backups (Least Used), then falls back to Primary
   */
  async analyzeImage(imageData: string, prompt: string, mimeType: string = 'image/jpeg'): Promise<string> {
    const allKeys = this.getAllKeys();

    // Separate backups and primary
    const backups = allKeys.filter(k => k.id.startsWith('backup'));
    const primary = allKeys.filter(k => k.id === 'primary');

    // Strategy: Try all backups (sorted by least used) FIRST
    // Then try Primary if backups fail

    const strategies = [backups, primary];
    const excludeIds = new Set<string>();
    let lastError: Error | null = null;

    for (const pool of strategies) {
      if (pool.length === 0) continue;

      // Try keys in this pool until exhausted
      while (true) {
        // Check if all keys in this pool are excluded
        const poolRemaining = pool.filter(k => !excludeIds.has(k.id));
        if (poolRemaining.length === 0) break;

        const selection = this.getLeastUsedKey(pool, excludeIds);
        if (!selection) break; // Should be covered by poolRemaining check, but safe guard

        const { client, id } = selection;

        try {
          const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
          const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType } }
          ]);

          const text = result.response.text();

          this.trackUsage(id, 1000); // Estimate 1000 tokens for vision

          if (this.config.isDev) {
            console.log(`[GeminiManager] ✅ Vision success with ${id}`);
          }

          return text;

        } catch (error: any) {
          const isRateLimit = error?.status === 429;
          const isQuotaError = error?.status === 403;

          if (isRateLimit || isQuotaError) {
            if (this.config.isDev) {
              console.warn(`[GeminiManager] ⚠️ Vision key ${id} failed, excluding...`);
            }
            excludeIds.add(id);
            lastError = error;
            continue;
          }

          throw error;
        }
      }
    }

    throw new Error(`All vision API keys exhausted. Last error: ${lastError?.message}`);
  }

  /**
   * Get current usage stats (DEV MODE ONLY)
   */
  getUsageStats() {
    if (!this.config.isDev) {
      return { message: 'Usage stats only available in development mode' };
    }

    const stats: any = {
      environment: 'development',
      primary: {
        key: this.config.primaryKey.key.slice(0, 10) + '...',
        limits: {
          rpm: this.config.primaryKey.rpm || 'default (15)',
          tpm: this.config.primaryKey.tpm || 'default (1M)',
          rpd: this.config.primaryKey.rpd || 'default (1500)'
        },
        usage: this.usage.get('primary')
      },
      backups: this.config.backupKeys.map((keyConfig, idx) => ({
        id: `backup-${idx}`,
        key: keyConfig.key.slice(0, 10) + '...',
        limits: {
          rpm: keyConfig.rpm || 'default (15)',
          tpm: keyConfig.tpm || 'default (1M)',
          rpd: keyConfig.rpd || 'default (1500)'
        },
        usage: this.usage.get(`backup-${idx}`)
      })),
      currentBackupIndex: this.config.currentIndex
    };

    return stats;
  }
}

// Singleton instance
export const geminiManager = new GeminiManager();
