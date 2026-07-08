// components/Memory/EmotionalSupport.tsx
"use client";

import { useState, useEffect } from "react";
import { Brain, Heart, Zap, Target, RefreshCw } from "lucide-react";

interface EmotionalSupportProps {
  userId: string;
  currentEmotion?: string;
  emotionIntensity?: number;
}

export function EmotionalSupport({ userId, currentEmotion, emotionIntensity = 5 }: EmotionalSupportProps) {
  const [supportMessages, setSupportMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [wellnessScore, setWellnessScore] = useState<number | null>(null);

  useEffect(() => {
    loadEmotionalSupport();
  }, [userId, currentEmotion]);

  const loadEmotionalSupport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/memory/emotional-support/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentEmotion, emotionIntensity })
      });

      const data = await response.json();
      setSupportMessages(data.support || []);
      setWellnessScore(data.wellnessScore || null);
    } catch (error) {
      console.error("Error loading emotional support:", error);
      setSupportMessages([
        "Take a deep breath",
        "Remember: progress over perfection",
        "You're building valuable skills"
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getEmotionColor = (emotion?: string) => {
    switch(emotion) {
      case 'anxious': return 'bg-red-100 text-red-800';
      case 'frustrated': return 'bg-orange-100 text-orange-800';
      case 'confident': return 'bg-green-100 text-green-800';
      case 'excited': return 'bg-blue-100 text-blue-800';
      case 'calm': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmotionIcon = (emotion?: string) => {
    switch(emotion) {
      case 'anxious': return <Brain className="w-5 h-5 text-red-600" />;
      case 'frustrated': return <Zap className="w-5 h-5 text-orange-600" />;
      case 'confident': return <Target className="w-5 h-5 text-green-600" />;
      case 'excited': return <Heart className="w-5 h-5 text-blue-600" />;
      default: return <Brain className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Emotional Support</h3>
            <div className="flex items-center gap-2">
              {currentEmotion && (
                <span className={`text-sm px-2 py-1 rounded-full ${getEmotionColor(currentEmotion)} flex items-center gap-1`}>
                  {getEmotionIcon(currentEmotion)}
                  {currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)}
                </span>
              )}
              {wellnessScore && (
                <span className="text-sm font-medium text-gray-700">
                  Wellness: {wellnessScore}/100
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={loadEmotionalSupport}
          disabled={isLoading}
          className="text-purple-600 hover:text-purple-800 p-2 rounded-lg hover:bg-purple-50"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Analyzing emotional patterns...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {supportMessages.map((message, index) => (
            <div
              key={index}
              className="bg-white border border-purple-100 rounded-lg p-4 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm mt-0.5">
                  {index + 1}
                </div>
                <p className="text-gray-800">{message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {emotionIntensity > 7 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <Zap className="w-5 h-5" />
            <span className="font-medium">High emotional intensity detected</span>
          </div>
          <p className="text-red-700 text-sm mt-1">
            Consider taking a short break or trying a calming exercise.
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-purple-200">
        <p className="text-sm text-gray-600 text-center">
          Based on your emotional patterns and interview performance
        </p>
      </div>
    </div>
  );
}