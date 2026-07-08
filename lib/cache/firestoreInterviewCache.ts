import { getDB } from "@/firebase/admin";

// Simple interface
interface CachedQuestion {
  text: string;
  category: string;
  difficulty: string;
  idealAnswer?: string;
  keywords?: string[];
}

interface CachedInterview {
  id: string;
  role: string;
  level: string;
  type: string;
  amount: number;
  techstack: string;
  questions: CachedQuestion[];
  metadata?: {
    usageCount: number;
    averageRating: number;
    totalSessions: number;
    lastUsed: string;
  };
}

// Helper function to generate consistent cache key
function generateCacheKey(role: string, level: string, type: string, amount: number, techstack: string): string {
  const normalizedRole = role.trim().toLowerCase().replace(/[^\w]/g, '_');
  const normalizedLevel = level.trim().toLowerCase().replace(/[^\w]/g, '_');
  const normalizedType = type.trim().toLowerCase().replace(/[^\w]/g, '_');

  // Normalize techstack - convert array to string, sort for consistency
  let normalizedTechstack = '';
  if (Array.isArray(techstack)) {
    normalizedTechstack = techstack
      .map(t => t.trim().toLowerCase().replace(/[^\w]/g, '_'))
      .sort()
      .join('_');
  } else if (typeof techstack === 'string' && techstack.trim()) {
    normalizedTechstack = techstack
      .toLowerCase()
      .split(/[,;\s]+/)
      .map(t => t.trim().replace(/[^\w]/g, '_'))
      .sort()
      .join('_');
  } else {
    normalizedTechstack = 'general';
  }

  return `${normalizedRole}_${normalizedLevel}_${normalizedType}_${amount}_${normalizedTechstack}`;
}

export const getCachedInterview = async (
  role: string,
  level: string,
  type: string,
  amount: number,
  techstack: string
): Promise<CachedInterview | null> => {
  try {
    const db = getDB();
    if (!db) {
      console.log("❌ Firestore not available for cache lookup");
      return null;
    }

    // Create cache key with all parameters
    const cacheKey = generateCacheKey(role, level, type, amount, techstack);

    // Try exact match
    const docRef = db.collection("interview_cache").doc(cacheKey);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();

      // Check cache age (24 hours TTL)
      const lastUsed = data?.metadata?.lastUsed || data?.createdAt || new Date().toISOString();
      const cacheAge = Date.now() - new Date(lastUsed).getTime();
      const cacheAgeHours = cacheAge / (1000 * 60 * 60);

      if (cacheAgeHours < 24) {
        console.log(`✅ Firestore cache HIT: ${cacheKey} (${cacheAgeHours.toFixed(1)} hours old)`);

        return {
          id: doc.id,
          role: data?.role || role,
          level: data?.level || level,
          type: data?.type || type,
          amount: data?.amount || amount,
          techstack: data?.techstack || techstack,
          questions: data?.questions || [],
          metadata: data?.metadata || {
            usageCount: 0,
            averageRating: 0,
            totalSessions: 0,
            lastUsed: new Date().toISOString()
          }
        };
      } else {
        console.log(`⚠️ Firestore cache expired for ${cacheKey} (${cacheAgeHours.toFixed(1)} hours)`);
        await docRef.delete();
        return null;
      }
    }

    console.log(`❌ No cached interview found in Firestore for ${role} (${techstack})`);
    return null;

  } catch (error: any) {
    console.warn("⚠️ Firestore cache lookup failed:", error.message);
    return null;
  }
};

export const cacheInterview = async (
  role: string,
  level: string,
  type: string,
  amount: number,
  techstack: string,
  questions: CachedQuestion[],
  userId: string
): Promise<string> => {
  try {
    const db = getDB();
    if (!db) {
      console.log("❌ Firestore not available for caching");
      return `mock_${Date.now()}`;
    }

    // Create cache key with all parameters
    const cacheKey = generateCacheKey(role, level, type, amount, techstack);

    // Normalize techstack for storage
    let normalizedTechstack = techstack;
    if (Array.isArray(techstack)) {
      normalizedTechstack = techstack.join(', ');
    }

    const interviewData = {
      role: role.trim().toLowerCase(),
      level: level.trim().toLowerCase(),
      type: type.trim().toLowerCase(),
      amount: amount,
      techstack: normalizedTechstack,
      questions: questions,
      questionCount: questions.length,
      userId: userId,
      createdAt: new Date().toISOString(),
      metadata: {
        usageCount: 0,
        averageRating: 0,
        totalSessions: 0,
        lastUsed: new Date().toISOString()
      }
    };

    const docRef = db.collection("interview_cache").doc(cacheKey);
    await docRef.set(interviewData);

    console.log(`✅ Cached interview in Firestore: ${cacheKey} (${questions.length} questions, tech: ${techstack})`);
    return cacheKey;

  } catch (error: any) {
    console.error("❌ Error caching interview in Firestore:", error.message);
    return `error_${Date.now()}`;
  }
};

export const recordInterviewUsage = async (
  interviewId: string,
  userId: string,
  sessionId?: string
): Promise<void> => {
  try {
    const db = getDB();
    if (!db) {
      console.log("❌ Firestore not available for recording usage");
      return;
    }

    const docRef = db.collection("interview_cache").doc(interviewId);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      const currentUsage = data?.metadata?.usageCount || 0;

      const updateData: any = {
        "metadata.usageCount": currentUsage + 1,
        "metadata.lastUsed": new Date().toISOString(),
        "metadata.totalSessions": (data?.metadata?.totalSessions || 0) + 1
      };

      // Optional: Store individual usage records in a subcollection
      if (sessionId) {
        const usageRef = docRef.collection("usage_log").doc(sessionId);
        await usageRef.set({
          userId,
          timestamp: new Date().toISOString(),
          sessionId,
          interviewId
        });
      }

      await docRef.update(updateData);

      console.log(`📊 Recorded usage for ${interviewId}: ${currentUsage + 1} uses`);
    }
  } catch (error: any) {
    console.warn("⚠️ Error recording interview usage:", error.message);
  }
};

// Optional: Get cache statistics
export const getCacheStats = async (): Promise<any> => {
  try {
    const db = getDB();
    if (!db) {
      return { totalCached: 0, totalUses: 0, averageAgeHours: 0 };
    }

    const snapshot = await db.collection("interview_cache").get();
    let totalUses = 0;
    let totalAgeHours = 0;
    let now = Date.now();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      totalUses += data?.metadata?.usageCount || 0;

      const lastUsed = data?.metadata?.lastUsed || data?.createdAt;
      if (lastUsed) {
        const ageHours = (now - new Date(lastUsed).getTime()) / (1000 * 60 * 60);
        totalAgeHours += ageHours;
      }
    });

    return {
      totalCached: snapshot.size,
      totalUses,
      averageAgeHours: snapshot.size > 0 ? totalAgeHours / snapshot.size : 0,
      mostUsed: snapshot.docs
        .map(doc => ({
          id: doc.id,
          role: doc.data().role,
          uses: doc.data().metadata?.usageCount || 0
        }))
        .sort((a, b) => b.uses - a.uses)
        .slice(0, 5)
    };
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return { error: "Failed to get cache stats" };
  }
};