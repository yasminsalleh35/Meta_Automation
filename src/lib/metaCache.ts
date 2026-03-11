/**
 * Sistema de cache unificado para ativos Meta
 * - Cache em memória + localStorage
 * - TTL de 5 minutos
 * - Suporte para múltiplas tabs via BroadcastChannel
 */

const CACHE_TTL = 60 * 60 * 1000; // 60 minutos (backend já tem cache de 24h)
const CACHE_PREFIX = 'meta-cache:';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MetaCache {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private channel: BroadcastChannel | null = null;

  constructor() {
    // Setup BroadcastChannel para sincronizar entre tabs
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('meta-cache-sync');
      this.channel.onmessage = (event) => {
        if (event.data.action === 'clear') {
          this.handleClearMessage(event.data.key);
        } else if (event.data.action === 'set') {
          this.handleSetMessage(event.data.key, event.data.entry);
        }
      };
    }
  }

  private handleClearMessage(key?: string) {
    if (key) {
      this.memoryCache.delete(key);
      localStorage.removeItem(CACHE_PREFIX + key);
    } else {
      this.memoryCache.clear();
      // Clear all meta cache items from localStorage
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(k);
        }
      });
    }
  }

  private handleSetMessage(key: string, entry: CacheEntry<any>) {
    this.memoryCache.set(key, entry);
  }

  /**
   * Get cached data if still valid
   */
  get<T>(key: string): T | null {
    // Try memory cache first
    const memoryCached = this.memoryCache.get(key);
    if (memoryCached && this.isValid(memoryCached)) {
      console.log(`[metaCache] Memory hit for "${key}"`);
      return memoryCached.data as T;
    }

    // Try localStorage
    try {
      const stored = localStorage.getItem(CACHE_PREFIX + key);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (this.isValid(entry)) {
          console.log(`[metaCache] LocalStorage hit for "${key}"`);
          // Restore to memory cache
          this.memoryCache.set(key, entry);
          return entry.data;
        } else {
          // Expired - remove
          localStorage.removeItem(CACHE_PREFIX + key);
        }
      }
    } catch (err) {
      console.warn('[metaCache] Error reading from localStorage:', err);
    }

    console.log(`[metaCache] Miss for "${key}"`);
    return null;
  }

  /**
   * Set cache with optional custom TTL
   */
  set<T>(key: string, data: T, ttl: number = CACHE_TTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    // Memory cache
    this.memoryCache.set(key, entry);

    // localStorage
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (err) {
      console.warn('[metaCache] Error writing to localStorage:', err);
    }

    // Broadcast to other tabs
    if (this.channel) {
      this.channel.postMessage({ action: 'set', key, entry });
    }

    console.log(`[metaCache] Set "${key}" with TTL ${ttl}ms`);
  }

  /**
   * Clear specific key or all cache
   */
  clear(key?: string): void {
    if (key) {
      this.memoryCache.delete(key);
      localStorage.removeItem(CACHE_PREFIX + key);
      console.log(`[metaCache] Cleared "${key}"`);
    } else {
      this.memoryCache.clear();
      // Clear all meta cache items
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(k);
        }
      });
      console.log('[metaCache] Cleared all cache');
    }

    // Broadcast to other tabs
    if (this.channel) {
      this.channel.postMessage({ action: 'clear', key });
    }
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry<any>): boolean {
    const age = Date.now() - entry.timestamp;
    return age < entry.ttl;
  }

  /**
   * Get cache age in seconds
   */
  getAge(key: string): number | null {
    const entry = this.memoryCache.get(key);
    if (!entry) {
      try {
        const stored = localStorage.getItem(CACHE_PREFIX + key);
        if (stored) {
          const parsed = JSON.parse(stored);
          return Math.floor((Date.now() - parsed.timestamp) / 1000);
        }
      } catch {}
      return null;
    }
    return Math.floor((Date.now() - entry.timestamp) / 1000);
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// Singleton instance
export const metaCache = new MetaCache();
