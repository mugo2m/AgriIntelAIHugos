// lib/hooks/useEmotionDetection.ts
"use client";

import { useState, useCallback, useEffect } from "react";

type Emotion = 'calm' | 'confident' | 'anxious' | 'frustrated' | 'excited' | 'confused' | 'proud' | 'overwhelmed';

interface EmotionDetectionResult {
  emotion: Emotion;
  confidence: number;
  triggers: string[];
  suggestedResponse: string;
}

export function useEmotionDetection() {
  const [currentEmotion, setCurrentEmotion] = useState<Emotion | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionDetectionResult[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const detectEmotionFromText = useCallback((text: string): EmotionDetectionResult => {
    const lowerText = text.toLowerCase();
    let emotion: Emotion = 'calm';
    let confidence = 0.5;
    const triggers: string[] = [];
    let suggestedResponse = "Keep going!";

    // Simple keyword-based emotion detection
    if (text.includes('?') && text.length < 50) {
      emotion = 'confused';
      confidence = 0.7;
      triggers.push('short questioning response');
      suggestedResponse = "Would you like me to clarify the question?";
    } else if (lowerText.includes('sorry') || lowerText.includes('not sure')) {
      emotion = 'anxious';
      confidence = 0.6;
      triggers.push('apologetic language', 'uncertainty');
      suggestedResponse = "It's okay to be unsure. Let's work through this together.";
    } else if (lowerText.includes('excited') || lowerText.includes('love') || lowerText.includes('great')) {
      emotion = 'excited';
      confidence = 0.8;
      triggers.push('positive language');
      suggestedResponse = "Great enthusiasm!";
    } else if (lowerText.includes('frustrat') || lowerText.includes('hard') || lowerText.includes('difficult')) {
      emotion = 'frustrated';
      confidence = 0.7;
      triggers.push('negative language about difficulty');
      suggestedResponse = "This is challenging material. Let's break it down.";
    } else if (lowerText.includes('understand') || lowerText.includes('clear') || lowerText.includes('know')) {
      emotion = 'confident';
      confidence = 0.75;
      triggers.push('certainty language');
      suggestedResponse = "Good understanding!";
    }

    return { emotion, confidence, triggers, suggestedResponse };
  }, []);

  const detectEmotionFromVoice = useCallback((audioData: any): EmotionDetectionResult => {
    // This would integrate with a voice emotion detection API
    // For now, returning a mock result
    return {
      emotion: 'calm',
      confidence: 0.5,
      triggers: ['normal speech pattern'],
      suggestedResponse: "Good pace and clarity."
    };
  }, []);

  const detectEmotionFromBehavior = useCallback((behavior: {
    responseTime: number;
    answerLength: number;
    edits: number;
    pauses: number;
  }): EmotionDetectionResult => {
    let emotion: Emotion = 'calm';
    let confidence = 0.5;
    const triggers: string[] = [];
    let suggestedResponse = "Good response!";

    if (behavior.responseTime > 60000) { // > 1 minute
      emotion = 'anxious';
      confidence = 0.6;
      triggers.push('long response time');
      suggestedResponse = "Take your time, no rush.";
    } else if (behavior.edits > 5) {
      emotion = 'frustrated';
      confidence = 0.65;
      triggers.push('many edits');
      suggestedResponse = "Don't worry about perfection in draft answers.";
    } else if (behavior.pauses > 10) {
      emotion = 'confused';
      confidence = 0.7;
      triggers.push('frequent pauses');
      suggestedResponse = "Would you like me to rephrase the question?";
    } else if (behavior.responseTime < 10000 && behavior.answerLength > 200) {
      emotion = 'confident';
      confidence = 0.8;
      triggers.push('quick, detailed response');
      suggestedResponse = "Excellent quick thinking!";
    }

    return { emotion, confidence, triggers, suggestedResponse };
  }, []);

  const recordEmotion = useCallback(async (
    userId: string,
    emotionResult: EmotionDetectionResult,
    context: any
  ) => {
    try {
      // Send to emotional memory service
      const response = await fetch('/api/memory/emotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          emotion: emotionResult.emotion,
          intensity: Math.round(emotionResult.confidence * 10),
          triggers: emotionResult.triggers,
          context
        })
      });

      if (response.ok) {
        setCurrentEmotion(emotionResult.emotion);
        setEmotionHistory(prev => [...prev.slice(-9), emotionResult]);
      }
    } catch (error) {
      console.error("Error recording emotion:", error);
    }
  }, []);

  const getEmotionalSupport = useCallback(async (userId: string): Promise<string[]> => {
    try {
      const response = await fetch(`/api/memory/emotional-support/${userId}`);
      const data = await response.json();
      return data.support || [];
    } catch (error) {
      console.error("Error getting emotional support:", error);
      return ["Take a deep breath", "You're doing great!"];
    }
  }, []);

  return {
    currentEmotion,
    emotionHistory,
    isMonitoring,
    setIsMonitoring,
    detectEmotionFromText,
    detectEmotionFromVoice,
    detectEmotionFromBehavior,
    recordEmotion,
    getEmotionalSupport
  };
}