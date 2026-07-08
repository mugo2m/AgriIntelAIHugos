"use client";

// Local storage fallback for when server memory isn't available
export class LocalStorageFallback {
  private static readonly PREFIX = 'interview_memory_';

  static save(key: string, data: any): void {
    try {
      const storageKey = this.PREFIX + key;
      localStorage.setItem(storageKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('LocalStorage save error:', error);
    }
  }

  static load<T>(key: string): T | null {
    try {
      const storageKey = this.PREFIX + key;
      const item = localStorage.getItem(storageKey);

      if (!item) return null;

      const parsed = JSON.parse(item);

      // Check if data is expired (7 days)
      const EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parsed.timestamp > EXPIRY_TIME) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return parsed.data as T;
    } catch (error) {
      console.error('LocalStorage load error:', error);
      return null;
    }
  }

  static remove(key: string): void {
    try {
      const storageKey = this.PREFIX + key;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('LocalStorage remove error:', error);
    }
  }

  static clearUserData(userId: string): void {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.PREFIX + userId)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('LocalStorage clear error:', error);
    }
  }

  static getAllUserData(userId: string): Record<string, any> {
    const userData: Record<string, any> = {};

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.PREFIX + userId)) {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            const cleanKey = key.replace(this.PREFIX + userId + '_', '');
            userData[cleanKey] = parsed.data;
          }
        }
      }
    } catch (error) {
      console.error('LocalStorage get all error:', error);
    }

    return userData;
  }
}