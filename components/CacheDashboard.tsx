// components/CacheDashboard.tsx
"use client";

import { useState, useEffect } from 'react';

interface CacheStats {
  hits: number;
  misses: number;
  total: number;
  hitRate: string;
  estimatedSavings: string;
  monthlyProjection: string;
  cleanedEntries?: number;
  date: string;
}

export function CacheDashboard() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/cache/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const cleanupCache = async () => {
    if (!confirm('Clean up expired cache entries?')) return;

    try {
      const response = await fetch('/api/cache/stats?cleanup=true');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
        alert(`Cleaned ${data.stats.cleanedEntries} expired entries`);
      }
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 border rounded-xl bg-gray-50 animate-pulse">
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

  return (
    <div className="p-6 border border-gray-300 rounded-xl bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">💰 Cache Performance</h3>
          <p className="text-sm text-gray-600">Using Firebase Firestore</p>
        </div>
        <button
          onClick={cleanupCache}
          className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg"
        >
          🧹 Cleanup
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-500">Cache Hits</div>
          <div className="text-2xl font-bold text-green-600">{stats?.hits || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-500">Cache Misses</div>
          <div className="text-2xl font-bold text-amber-600">{stats?.misses || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-500">Hit Rate</div>
          <div className="text-2xl font-bold text-blue-600">{stats?.hitRate || "0%"}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-500">$ Saved</div>
          <div className="text-2xl font-bold text-purple-600">{stats?.estimatedSavings || "$0.00"}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border mb-6">
        <h4 className="font-medium text-gray-700 mb-2">Monthly Projection</h4>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Estimated monthly savings:</span>
          <span className="text-xl font-bold text-green-600">
            {stats?.monthlyProjection || "$0.00"}
          </span>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Based on $0.01 per AI call saved
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}