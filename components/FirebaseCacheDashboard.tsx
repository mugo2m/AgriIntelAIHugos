// components/FirebaseCacheDashboard.tsx - UPDATED IMPORTS
"use client";

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, RefreshCw, Trash2, Database, Zap } from 'lucide-react';

interface CacheStats {
  hits: number;
  misses: number;
  total: number;
  hitRate: string;
  estimatedSavings: string;
  monthlyProjection: string;
  totalCacheEntries: number;
  cleanedEntries?: number;
  date: string;
}

export function FirebaseCacheDashboard() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/cache/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const cleanupCache = async () => {
    setCleaning(true);
    try {
      const response = await fetch('/api/cache/stats?cleanup=true');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
        console.log(`Cleaned ${data.stats.cleanedEntries} expired entries`);
      }
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    } finally {
      setCleaning(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 border rounded-xl bg-gradient-to-br from-gray-50 to-blue-50 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-48"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  const hitRatePercentage = stats?.hitRate ? parseFloat(stats.hitRate) : 0;

  return (
    <div className="p-6 border border-gray-300 rounded-xl bg-gradient-to-br from-gray-50 to-blue-50 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Firebase Cache Performance
            </h3>
            <p className="text-sm text-gray-600">
              Powered by your existing Firebase Admin setup
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={cleanupCache}
            disabled={cleaning}
            className="px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 transition-all"
            title="Remove expired cache entries"
          >
            {cleaning ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Cleaning...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Cleanup
              </>
            )}
          </button>

          <button
            onClick={loadStats}
            disabled={refreshing}
            className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {refreshing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div className="text-sm text-gray-500">Cache Hits</div>
          </div>
          <div className="text-3xl font-bold text-green-600">{stats?.hits || 0}</div>
          <div className="text-xs text-gray-400 mt-1">Total successful cache retrievals</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <div className="text-sm text-gray-500">Cache Misses</div>
          </div>
          <div className="text-3xl font-bold text-amber-600">{stats?.misses || 0}</div>
          <div className="text-xs text-gray-400 mt-1">AI calls required</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <div className="text-sm text-gray-500">Hit Rate</div>
          </div>
          <div className="text-3xl font-bold text-blue-600">{stats?.hitRate || "0%"}</div>
          <div className="text-xs text-gray-400 mt-1">Percentage of cache hits</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-purple-500" />
            <div className="text-sm text-gray-500">$ Saved</div>
          </div>
          <div className="text-3xl font-bold text-purple-600">{stats?.estimatedSavings || "$0.00"}</div>
          <div className="text-xs text-gray-400 mt-1">Total cost savings</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span className="font-medium">Cache Performance</span>
          <span className="font-bold">{stats?.hitRate || "0%"}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="h-4 rounded-full transition-all duration-1000"
            style={{
              width: `${Math.min(100, hitRatePercentage)}%`,
              background: `linear-gradient(90deg,
                ${hitRatePercentage < 50 ? '#f59e0b' : hitRatePercentage < 80 ? '#3b82f6' : '#10b981'} 0%,
                ${hitRatePercentage < 50 ? '#f97316' : hitRatePercentage < 80 ? '#6366f1' : '#059669'} 100%)`
            }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span className={hitRatePercentage < 30 ? "font-bold text-red-600" : ""}>
            {hitRatePercentage < 30 ? "Needs Improvement" : "Low"}
          </span>
          <span className={hitRatePercentage >= 30 && hitRatePercentage < 70 ? "font-bold text-amber-600" : ""}>
            {hitRatePercentage >= 30 && hitRatePercentage < 70 ? "Good" : "Medium"}
          </span>
          <span className={hitRatePercentage >= 70 ? "font-bold text-green-600" : ""}>
            {hitRatePercentage >= 70 ? "Excellent" : "High"}
          </span>
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border">
          <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-500" />
            Monthly Projection
          </h4>
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {stats?.monthlyProjection || "$0.00"}
            </div>
            <p className="text-green-600 text-sm">Potential monthly savings</p>
          </div>
          <div className="text-xs text-gray-500">
            Based on current performance and $0.01 per AI call saved
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border">
          <h4 className="font-medium text-gray-700 mb-3">Cache Details</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Total Cached Items:</span>
              <span className="font-bold text-gray-800">{stats?.totalCacheEntries || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Storage:</span>
              <span className="font-medium text-blue-600">Firebase Firestore</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Cache Date:</span>
              <span className="font-medium">{stats?.date || "Today"}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-3">How It Works</h4>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-blue-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
              <span><strong>Exact matches:</strong> 100% cache hit</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-blue-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
              <span><strong>Similar answers:</strong> 70%+ match gives partial hit</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-blue-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
              <span><strong>Cache duration:</strong> 7 days for feedback</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-blue-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
              <span><strong>Storage:</strong> Uses your existing Firebase setup</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Connected to: Firebase Admin</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}