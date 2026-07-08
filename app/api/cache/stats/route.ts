// app/api/cache/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { firebaseCache } from "@/lib/cache/firebaseCache";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cleanup = searchParams.get('cleanup') === 'true';

    console.log('📊 Fetching cache statistics...');

    // Cleanup expired entries if requested
    let cleanedCount = 0;
    if (cleanup) {
      console.log('🧹 Cleaning up expired cache entries...');
      cleanedCount = await firebaseCache.cleanupExpired();
      console.log(`✅ Cleaned ${cleanedCount} expired entries`);
    }

    // Get current stats
    const stats = await firebaseCache.getStats();

    // Calculate hit rate
    const hits = stats.hits || 0;
    const misses = stats.misses || 0;
    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total * 100).toFixed(1) : "0.0";

    // Calculate estimated savings ($0.01 per AI call saved)
    const estimatedSavings = hits * 0.01;
    const monthlyProjection = estimatedSavings * 30; // 30-day projection

    const response = {
      success: true,
      stats: {
        hits,
        misses,
        total,
        hitRate: `${hitRate}%`,
        estimatedSavings: `$${estimatedSavings.toFixed(2)}`,
        monthlyProjection: `$${monthlyProjection.toFixed(2)}`,
        cleanedEntries: cleanedCount,
        date: stats.date || new Date().toISOString().split('T')[0]
      },
      cacheInfo: {
        storage: 'Firebase Firestore',
        ttl: {
          feedback: '7 days',
          recent: '24 hours'
        }
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Failed to get cache stats:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}