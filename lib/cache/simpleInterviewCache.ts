// Simple in-memory cache module as fallback
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

  // Normalize techstack
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

// Use global variable to persist across serverless function invocations
declare global {
  var __memoryCache: Map<string, CachedInterview>;
}

if (!global.__memoryCache) {
  global.__memoryCache = new Map<string, CachedInterview>();
}

const memoryCache = global.__memoryCache;

export const getCachedInterview = async (
  role: string,
  level: string,
  type: string,
  amount: number,
  techstack: string
): Promise<CachedInterview | null> => {
  const key = generateCacheKey(role, level, type, amount, techstack);

  if (memoryCache.has(key)) {
    const interview = memoryCache.get(key)!;

    // Check cache age (24 hours TTL)
    const lastUsed = interview.metadata?.lastUsed ? new Date(interview.metadata.lastUsed) : new Date();
    const cacheAge = Date.now() - lastUsed.getTime();
    const cacheAgeHours = cacheAge / (1000 * 60 * 60);

    if (cacheAgeHours < 24) {
      console.log(`✅ Memory cache HIT for ${key} (${cacheAgeHours.toFixed(1)} hours old, ${interview.metadata?.usageCount || 0} uses)`);
      return interview;
    } else {
      console.log(`⚠️ Memory cache expired for ${key} (${cacheAgeHours.toFixed(1)} hours)`);
      memoryCache.delete(key);
      return null;
    }
  }

  console.log(`❌ Memory cache MISS for ${key}`);
  return null;
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
  const key = generateCacheKey(role, level, type, amount, techstack);
  const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Normalize techstack for storage
  let normalizedTechstack = techstack;
  if (Array.isArray(techstack)) {
    normalizedTechstack = techstack.join(', ');
  }

  const cachedInterview: CachedInterview = {
    id,
    role: role.toLowerCase(),
    level: level.toLowerCase(),
    type: type.toLowerCase(),
    amount,
    techstack: normalizedTechstack,
    questions,
    metadata: {
      usageCount: 0,
      averageRating: 0,
      totalSessions: 0,
      lastUsed: new Date().toISOString()
    }
  };

  // Actually store in cache
  memoryCache.set(key, cachedInterview);

  console.log(`💾 Cached interview in memory: ${key} (${questions.length} questions, tech: ${techstack})`);
  return id;
};

export const recordInterviewUsage = async (
  interviewId: string,
  userId: string,
  sessionId?: string
): Promise<void> => {
  // Update usage count in memory cache
  for (const [key, interview] of memoryCache.entries()) {
    if (interview.id === interviewId) {
      if (interview.metadata) {
        interview.metadata.usageCount += 1;
        interview.metadata.totalSessions += 1;
        interview.metadata.lastUsed = new Date().toISOString();
      }
      console.log(`📊 Memory cache usage for ${interviewId}: ${interview.metadata?.usageCount || 0} uses`);
      break;
    }
  }
};

// Optional: Get cache statistics
export const getCacheStats = async (): Promise<any> => {
  let totalUses = 0;
  let totalAgeHours = 0;
  let now = Date.now();

  memoryCache.forEach((interview) => {
    totalUses += interview.metadata?.usageCount || 0;

    const lastUsed = interview.metadata?.lastUsed;
    if (lastUsed) {
      const ageHours = (now - new Date(lastUsed).getTime()) / (1000 * 60 * 60);
      totalAgeHours += ageHours;
    }
  });

  // Convert to array for sorting
  const cacheArray = Array.from(memoryCache.entries()).map(([key, interview]) => ({
    id: key,
    role: interview.role,
    techstack: interview.techstack,
    uses: interview.metadata?.usageCount || 0,
    ageHours: interview.metadata?.lastUsed
      ? (now - new Date(interview.metadata.lastUsed).getTime()) / (1000 * 60 * 60)
      : 0
  }));

  return {
    totalCached: memoryCache.size,
    totalUses,
    averageAgeHours: memoryCache.size > 0 ? totalAgeHours / memoryCache.size : 0,
    mostUsed: cacheArray
      .sort((a, b) => b.uses - a.uses)
      .slice(0, 5),
    techstackDistribution: cacheArray.reduce((acc: any, item) => {
      const tech = item.techstack || 'general';
      acc[tech] = (acc[tech] || 0) + 1;
      return acc;
    }, {})
  };
};

// Optional: Clear expired entries (can be called periodically)
export const cleanupExpiredCache = async (): Promise<number> => {
  const now = Date.now();
  let clearedCount = 0;

  for (const [key, interview] of memoryCache.entries()) {
    const lastUsed = interview.metadata?.lastUsed;
    if (lastUsed) {
      const ageHours = (now - new Date(lastUsed).getTime()) / (1000 * 60 * 60);
      if (ageHours >= 24) {
        memoryCache.delete(key);
        clearedCount++;
      }
    }
  }

  console.log(`🧹 Cleaned up ${clearedCount} expired cache entries`);
  return clearedCount;
};