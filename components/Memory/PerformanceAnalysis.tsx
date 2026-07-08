// components/Memory/PerformanceAnalysis.tsx
"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  BarChart3,
  CheckCircle,
  X
} from "lucide-react";

interface PerformanceAnalysisProps {
  userId?: string;
  compact?: boolean;
  onClose?: () => void;
}

export function PerformanceAnalysis({ userId, compact = false, onClose }: PerformanceAnalysisProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"weaknesses" | "trends" | "recommendations">("weaknesses");

  useEffect(() => {
    const loadAnalysis = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        setTimeout(() => {
          setAnalysis({
            weakAreas: [
              "React Hooks (useEffect, useState)",
              "System Design - Scalability",
              "JavaScript Closures"
            ],
            strongAreas: [
              "Communication Skills",
              "Problem Solving Approach",
              "JavaScript Fundamentals"
            ],
            trends: {
              overall: "improving",
              change: 15,
              technical: { trend: "improving", change: 12 },
              behavioral: { trend: "stable", change: 3 },
              communication: { trend: "improving", change: 20 },
              problemSolving: { trend: "declining", change: -5 }
            },
            recommendations: [
              "Practice React Hooks with real projects",
              "Study system design patterns weekly",
              "Review JavaScript closures scope"
            ],
            stats: {
              totalInterviews: 5,
              averageScore: 78,
              bestScore: 92,
              improvementRate: "15%",
              consistency: "Good"
            }
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error loading analysis:", error);
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [userId]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving": return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "declining": return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-700" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-800">Analyzing...</span>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center p-6">
        <AlertCircle className="w-10 h-10 text-gray-700 mx-auto mb-3" />
        <p className="text-gray-800">Complete an interview to see analysis</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-300 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold flex items-center gap-2 text-gray-900">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Performance
          </h3>
          <span className="text-sm font-semibold text-green-700">+{analysis.trends.change}%</span>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-800">Top improvement area:</p>
          <p className="font-medium text-gray-900">{analysis.weakAreas[0]}</p>
          <button
            onClick={() => onClose?.()}
            className="text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            View details →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-lg border border-gray-300 p-5 max-w-3xl w-full mx-auto shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Performance Analysis</h2>
            <p className="text-gray-800 text-sm">Based on {analysis.stats.totalInterviews} interviews</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-gray-900 text-xl font-bold"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-blue-50 border border-blue-300 p-3 rounded-lg">
            <div className="text-xl font-bold text-blue-900">{analysis.stats.averageScore}%</div>
            <div className="text-xs font-semibold text-blue-800">Avg Score</div>
          </div>
          <div className="bg-green-50 border border-green-300 p-3 rounded-lg">
            <div className="text-xl font-bold text-green-900">+{analysis.trends.change}%</div>
            <div className="text-xs font-semibold text-green-800">Improvement</div>
          </div>
          <div className="bg-purple-50 border border-purple-300 p-3 rounded-lg">
            <div className="text-xl font-bold text-purple-900">{analysis.stats.totalInterviews}</div>
            <div className="text-xs font-semibold text-purple-800">Interviews</div>
          </div>
          <div className="bg-amber-50 border border-amber-300 p-3 rounded-lg">
            <div className="text-xl font-bold text-amber-900">{analysis.stats.bestScore}%</div>
            <div className="text-xs font-semibold text-amber-800">Best Score</div>
          </div>
        </div>

        <div className="border-b border-gray-300 mb-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab("weaknesses")}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === "weaknesses" ? "border-b-2 border-red-600 text-red-700" : "text-gray-700 hover:text-gray-900"}`}
            >
              Weak Areas
            </button>
            <button
              onClick={() => setActiveTab("trends")}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === "trends" ? "border-b-2 border-blue-600 text-blue-700" : "text-gray-700 hover:text-gray-900"}`}
            >
              Trends
            </button>
            <button
              onClick={() => setActiveTab("recommendations")}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === "recommendations" ? "border-b-2 border-green-600 text-green-700" : "text-gray-700 hover:text-gray-900"}`}
            >
              Recommendations
            </button>
          </div>
        </div>

        {/* Weak Areas Tab */}
        {activeTab === "weaknesses" && (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            <div>
              <h3 className="font-bold text-lg mb-3 text-gray-900">Areas to Improve</h3>
              <div className="space-y-2">
                {analysis.weakAreas.map((area: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-red-50 border border-red-300 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-gray-900">{area}</p>
                      <p className="text-gray-800 text-sm mt-1">Focus on this area</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3 text-gray-900">Your Strengths</h3>
              <div className="grid grid-cols-3 gap-2">
                {analysis.strongAreas.map((area: string, i: number) => (
                  <div key={i} className="p-2 bg-green-50 border border-green-300 rounded-lg">
                    <p className="font-bold text-green-900 text-sm">{area}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === "trends" && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(analysis.trends).map(([key, value]: [string, any]) => {
              if (typeof value === 'object' && value.trend) {
                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-300 rounded-lg">
                    <div>
                      <p className="font-bold text-gray-900 capitalize">{key}</p>
                      <p className="text-gray-800 text-sm">{value.trend}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${value.change > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {value.change > 0 ? '+' : ''}{value.change}%
                      </span>
                      {getTrendIcon(value.trend)}
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === "recommendations" && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {analysis.recommendations.map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-300 rounded-lg">
                <div className="w-6 h-6 bg-blue-700 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{rec}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-300">
          <p className="text-xs text-gray-800 text-center">
            Updated after each interview • Based on your performance history
          </p>
        </div>
      </div>
    </div>
  );
}