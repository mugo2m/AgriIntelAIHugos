// lib/services/offlineTranslation.ts
interface CachedTranslation {
  value: string;
  timestamp: number;
  language: string;
  key: string;
}

interface OfflineQueueItem {
  id: string;
  action: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export class OfflineTranslationService {
  private static CACHE_PREFIX = 'translation_';
  private static QUEUE_KEY = 'offline_queue';
  private static CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
  private static MAX_RETRY = 3;

  // ===== TRANSLATION CACHING =====
  // FIXED: Removed async - returns string directly, not Promise
  static getTranslation(
    key: string,
    language: string,
    fetchTranslation: () => string
  ): string {
    const cacheKey = `${this.CACHE_PREFIX}${language}_${key}`;

    // Try cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // If online, fetch and cache
    if (navigator.onLine) {
      const value = fetchTranslation();
      this.saveToCache(cacheKey, value, language, key);
      return value;
    }

    // Offline fallback
    console.warn(`⚠️ Offline - using key as fallback for ${key}`);
    return key;
  }

  private static getFromCache(cacheKey: string): string | null {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const data: CachedTranslation = JSON.parse(cached);
      const isValid = Date.now() - data.timestamp < this.CACHE_DURATION;

      if (isValid) {
        console.log(`✅ Using cached translation for ${data.key} in ${data.language}`);
        return data.value;
      }

      // Expired - remove it
      localStorage.removeItem(cacheKey);
      return null;
    } catch (e) {
      console.warn('Cache read failed:', e);
      return null;
    }
  }

  private static saveToCache(cacheKey: string, value: string, language: string, key: string): void {
    try {
      const cacheData: CachedTranslation = {
        value,
        timestamp: Date.now(),
        language,
        key
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 Cached translation for ${key} in ${language}`);
    } catch (e) {
      console.warn('Cache write failed:', e);
    }
  }

  // ===== PRELOAD LANGUAGES =====

  static async preloadLanguage(language: string, keys: string[]): Promise<void> {
    if (!navigator.onLine) return;

    try {
      const response = await fetch(`/locales/${language}/common.json`);
      const translations = await response.json();

      // Cache all translations
      Object.entries(translations).forEach(([key, value]) => {
        const cacheKey = `${this.CACHE_PREFIX}${language}_${key}`;
        this.saveToCache(cacheKey, value as string, language, key);
      });

      console.log(`📦 Preloaded ${keys.length} translations for ${language}`);
    } catch (e) {
      console.error(`Failed to preload ${language}:`, e);
    }
  }

  // ===== OFFLINE QUEUE =====

  static addToQueue(action: string, data: any): void {
    try {
      const queue = this.getQueue();
      const newItem: OfflineQueueItem = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action,
        data,
        timestamp: Date.now(),
        retryCount: 0
      };

      queue.push(newItem);
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
      console.log(`📝 Added to offline queue: ${action}`);
    } catch (e) {
      console.error('Failed to add to queue:', e);
    }
  }

  static getQueue(): OfflineQueueItem[] {
    try {
      const queue = localStorage.getItem(this.QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch {
      return [];
    }
  }

  static async processQueue(): Promise<void> {
    if (!navigator.onLine) return;

    const queue = this.getQueue();
    if (queue.length === 0) return;

    console.log(`🔄 Processing ${queue.length} offline actions...`);

    const remainingQueue: OfflineQueueItem[] = [];

    for (const item of queue) {
      try {
        await this.processQueueItem(item);
        console.log(`✅ Processed offline action: ${item.action}`);
      } catch (e) {
        item.retryCount++;

        if (item.retryCount < this.MAX_RETRY) {
          remainingQueue.push(item);
          console.log(`⏳ Will retry ${item.action} (${item.retryCount}/${this.MAX_RETRY})`);
        } else {
          console.error(`❌ Failed to process ${item.action} after ${this.MAX_RETRY} attempts`);
        }
      }
    }

    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(remainingQueue));
  }

  private static async processQueueItem(item: OfflineQueueItem): Promise<void> {
    switch (item.action) {
      case 'save_answer':
        await fetch('/api/offline/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        break;
      case 'track_event':
        // Send to analytics
        break;
      default:
        console.warn(`Unknown action: ${item.action}`);
    }
  }

  // ===== UTILITIES =====

  static getCacheStats(): Record<string, number> {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.CACHE_PREFIX));
      const languages = new Set<string>();

      keys.forEach(key => {
        const lang = key.split('_')[1];
        if (lang) languages.add(lang);
      });

      return {
        totalKeys: keys.length,
        languages: languages.size,
        ...Object.fromEntries([...languages].map(l => [l, keys.filter(k => k.includes(`_${l}_`)).length]))
      };
    } catch {
      return { totalKeys: 0, languages: 0 };
    }
  }

  static clearExpiredCache(): void {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.CACHE_PREFIX));
      let cleared = 0;

      keys.forEach(key => {
        try {
          const cached = localStorage.getItem(key);
          if (!cached) return;

          const data: CachedTranslation = JSON.parse(cached);
          if (Date.now() - data.timestamp > this.CACHE_DURATION) {
            localStorage.removeItem(key);
            cleared++;
          }
        } catch {
          // Invalid cache entry - remove it
          localStorage.removeItem(key);
          cleared++;
        }
      });

      if (cleared > 0) {
        console.log(`🧹 Cleared ${cleared} expired cache entries`);
      }
    } catch (e) {
      console.error('Failed to clear cache:', e);
    }
  }
}