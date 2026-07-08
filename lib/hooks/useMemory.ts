// lib/hooks/useMemory.ts - UPDATED WITH DIRECT API CALLS
"use client";

import { useState, useEffect, useCallback } from "react";
import { memoryClient } from "@/lib/api/memoryClient";

export function useMemory(userId?: string) {
  const [resumeData, setResumeData] = useState<any>({ canResume: false });
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);
  const [weakAreas, setWeakAreas] = useState<string[]>([]);
  const [performanceTrends, setPerformanceTrends] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  // Check for resume data
  const checkResumeInterview = useCallback(async () => {
    if (!userId) {
      setResumeData({ canResume: false });
      return { canResume: false };
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/memory/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'getResumeData' })
      });

      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }

      const result = await response.json();
      const data = result.success ? result.data : { canResume: false };

      setResumeData(data);
      return data;
    } catch (error) {
      console.error("Error checking resume data:", error);
      setResumeData({ canResume: false });
      return { canResume: false };
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load performance data - UPDATED WITH DIRECT API CALLS
  const loadPerformanceData = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);

      console.log('📊 [useMemory] Loading performance data for user:', userId);

      // ⭐ DIRECT API CALL 1: Get Performance History
      const historyResponse = await fetch('/api/memory/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'getPerformanceHistory' })
      });

      if (!historyResponse.ok) {
        throw new Error(`History API failed: ${historyResponse.status}`);
      }

      const historyResult = await historyResponse.json();

      // ⭐ DEBUG: Show full API response
      console.log('📊 [useMemory DEBUG] History API Response:', {
        success: historyResult.success,
        hasData: !!historyResult.data,
        dataStructure: historyResult.data,
        historyType: typeof historyResult.data?.history,
        historyIsArray: Array.isArray(historyResult.data?.history),
        historyLength: historyResult.data?.history?.length || 0
      });

      // Extract history from API response structure
      const history = historyResult.success && historyResult.data
        ? (Array.isArray(historyResult.data.history) ? historyResult.data.history : [])
        : [];

      // ⭐ DIRECT API CALL 2: Get Progress
      const progressResponse = await fetch('/api/memory/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'getProgress' })
      });

      if (!progressResponse.ok) {
        throw new Error(`Progress API failed: ${progressResponse.status}`);
      }

      const progressResult = await progressResponse.json();

      console.log('📊 [useMemory DEBUG] Progress API Response:', {
        success: progressResult.success,
        hasData: !!progressResult.data,
        progressData: progressResult.data
      });

      const progress = progressResult.success ? progressResult.data : null;

      // Update state
      setPerformanceHistory(history);

      // Calculate weak areas from history - SAFELY
      const weakAreasSet = new Set<string>();

      history.forEach(item => {
        // ⭐ ADDED SAFETY CHECKS:
        if (item &&
            typeof item === 'object' &&
            item.scores?.overall < 70 &&
            item.metadata?.category) {
          weakAreasSet.add(item.metadata.category);
        }
      });

      setWeakAreas(Array.from(weakAreasSet));

      // Calculate trends - WITH CORRECT DATA ACCESS
      if (progress && typeof progress === 'object') {
        // ⭐ FIXED: Access averageScore directly, not progress.metrics.averageScore
        const averageScore = progress.averageScore || progress.metrics?.averageScore || 0;

        const trends = {
          trend: averageScore > 70 ? 'improving' : 'stable',
          improvement: Math.round(averageScore - 50),
          weakAreas: Array.from(weakAreasSet).slice(0, 3),
          insights: []
        };

        console.log('📊 [useMemory] Calculated trends:', {
          averageScore,
          trend: trends.trend,
          weakAreas: trends.weakAreas
        });

        setPerformanceTrends(trends);
      } else {
        console.log('📊 [useMemory] No progress data available, using defaults');

        setPerformanceTrends({
          trend: 'stable',
          improvement: 0,
          weakAreas: Array.from(weakAreasSet).slice(0, 3),
          insights: []
        });
      }

      console.log('📊 [useMemory] Loaded data:', {
        historyCount: history.length,
        weakAreasCount: weakAreasSet.size,
        hasProgress: !!progress
      });

      return { history, progress };

    } catch (error: any) {
      console.error("Error loading performance data:", error.message);

      // Set safe defaults on error
      setPerformanceHistory([]);
      setWeakAreas([]);
      setPerformanceTrends({
        trend: 'stable',
        improvement: 0,
        weakAreas: [],
        insights: []
      });

      return { history: [], progress: null };
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Save interview progress (lightweight, just for resume)
  const saveInterviewProgress = useCallback(async (
    interviewId: string,
    currentQuestion: number,
    partialAnswer: string,
    answerHistory: any[]
  ) => {
    if (!userId) return false;

    try {
      // Store in localStorage for now (you can move this to API if needed)
      localStorage.setItem(`interview_progress_${userId}`, JSON.stringify({
        interviewId,
        currentQuestion,
        partialAnswer,
        answerHistory,
        timestamp: Date.now()
      }));
      return true;
    } catch (error) {
      console.error("Error saving interview progress:", error);
      return false;
    }
  }, [userId]);

  // Mark interview as completed
  const markInterviewCompleted = useCallback(async (interviewId: string) => {
    if (!userId) return false;

    try {
      // Clear progress from localStorage
      localStorage.removeItem(`interview_progress_${userId}`);
      return true;
    } catch (error) {
      console.error("Error marking interview completed:", error);
      return false;
    }
  }, [userId]);

  // Save user performance
  const saveUserPerformance = useCallback(async (performanceData: any) => {
    if (!userId) return false;

    try {
      const response = await fetch('/api/memory/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'savePerformance',
          ...performanceData
        })
      });

      const result = await response.json();
      const saved = result.success === true;

      if (saved) {
        // Reload performance data
        await loadPerformanceData();
      }

      return saved;
    } catch (error) {
      console.error("Error saving user performance:", error);
      return false;
    }
  }, [userId, loadPerformanceData]);

  // Record emotional state
  const recordEmotionalState = useCallback(async (state: any) => {
    if (!userId) return '';

    try {
      const response = await fetch('/api/memory/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'recordEmotion',
          ...state
        })
      });

      const result = await response.json();
      return result.success && result.data ? result.data.emotionId || '' : '';
    } catch (error) {
      console.error("Error recording emotional state:", error);
      return '';
    }
  }, [userId]);

  // Get emotional support (mock for now)
  const getEmotionalSupport = useCallback(async (context: any) => {
    return [
      "Take a deep breath",
      "Remember this is practice",
      "You're doing great!"
    ];
  }, []);

  // Initialize
  useEffect(() => {
    if (userId) {
      checkResumeInterview();
      loadPerformanceData();
    }
  }, [userId, checkResumeInterview, loadPerformanceData]);

  return {
    // State
    resumeData,
    performanceHistory,
    weakAreas,
    performanceTrends,
    isLoading,

    // Methods
    checkResumeInterview,
    saveInterviewProgress,
    markInterviewCompleted,
    saveUserPerformance,
    loadPerformanceData,
    recordEmotionalState,
    getEmotionalSupport
  };
}