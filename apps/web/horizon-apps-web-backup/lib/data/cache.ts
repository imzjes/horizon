// Simple in-memory cache with 60-minute TTL

import { CacheEntry, CacheKey } from './types';

class DataCache {
  private cache = new Map<CacheKey, CacheEntry<any>>();
  private readonly TTL_MS = 10 * 60 * 1000; // 10 minutes for faster updates

  set<T>(key: CacheKey, data: T): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.TTL_MS
    });
  }

  get<T>(key: CacheKey): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: CacheKey): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

export const dataCache = new DataCache();
