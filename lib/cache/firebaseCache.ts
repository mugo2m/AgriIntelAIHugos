import { getDB } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface CacheEntry {
  key: string;
  value: any;
  expiresAt: string;
  hits: number;
  lastAccessed: string;
  metadata?: Record<string, any>;
}

export class FirebaseCache {
  private collectionName = 'interview_cache';
  private statsCollection = 'cache_stats';
  private db: any;

  constructor() {
    this.db = getDB();
  }

  generateKey(type: string, ...parts: string[]): string {
    return `interview:${type}:${parts.join(':')}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const snapshot = await this.db
        .collection(this.collectionName)
        .doc(key)
        .get();

      if (!snapshot.exists) {
        return null;
      }

      const data = snapshot.data() as CacheEntry;
      const expiresAt = new Date(data.expiresAt);
      if (expiresAt < new Date()) {
        await this.delete(key);
        return null;
      }

      await this.db
        .collection(this.collectionName)
        .doc(key)
        .update({
          hits: (data.hits || 0) + 1,
          lastAccessed: new Date().toISOString(),
        });

      await this.recordHit(key);
      return data.value as T;
    } catch (error) {
      console.error('Firebase cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      const cacheEntry: CacheEntry = {
        key,
        value,
        expiresAt: expiresAt.toISOString(),
        hits: 0,
        lastAccessed: new Date().toISOString(),
        metadata: {
          ttlSeconds,
          createdAt: new Date().toISOString(),
        },
      };

      await this.db
        .collection(this.collectionName)
        .doc(key)
        .set(cacheEntry);

      await this.recordMiss();
    } catch (error) {
      console.error('Firebase cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.db.collection(this.collectionName).doc(key).delete();
    } catch (error) {
      console.error('Firebase cache delete error:', error);
    }
  }

  async cleanupExpired(): Promise<number> {
    try {
      const now = new Date().toISOString();
      const expired = await this.db
        .collection(this.collectionName)
        .where('expiresAt', '<', now)
        .get();

      const batch = this.db.batch();
      expired.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return expired.size;
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }
  }

  async getStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const statsRef = this.db
        .collection(this.statsCollection)
        .doc(today);

      const statsDoc = await statsRef.get();
      
      if (statsDoc.exists) {
        return statsDoc.data();
      }

      return {
        hits: 0,
        misses: 0,
        estimatedSavings: 0,
        totalEntries: await this.getTotalEntries(),
        date: today,
      };
    } catch (error) {
      console.error('Get stats error:', error);
      return { hits: 0, misses: 0, estimatedSavings: 0 };
    }
  }

  private async recordHit(key: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const statsRef = this.db
        .collection(this.statsCollection)
        .doc(today);

      await statsRef.set(
        {
          hits: FieldValue.increment(1),
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Record hit error:', error);
    }
  }

  private async recordMiss(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const statsRef = this.db
        .collection(this.statsCollection)
        .doc(today);

      await statsRef.set(
        {
          misses: FieldValue.increment(1),
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Record miss error:', error);
    }
  }

  private async getTotalEntries(): Promise<number> {
    try {
      const snapshot = await this.db
        .collection(this.collectionName)
        .count()
        .get();

      return snapshot.data().count;
    } catch (error) {
      console.error('Get total entries error:', error);
      return 0;
    }
  }
}

export const firebaseCache = new FirebaseCache();


