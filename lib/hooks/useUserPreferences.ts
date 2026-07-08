"use client";

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface UserPreferences {
  userId: string;
  preferredRoles: string[];
  preferredTechStack: string[];
  defaultLevel: string;
  defaultType: string;
  defaultQuestionCount: number;
  voiceSettings: {
    enabled: boolean;
    rate: number;
    volume: number;
    language: string;
  };
  updatedAt: string;
}

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPreferences(null);
      setIsLoading(false);
      return;
    }

    // Load from localStorage or use defaults
    const stored = localStorage.getItem(`preferences_${user.uid}`);
    if (stored) {
      setPreferences(JSON.parse(stored));
    } else {
      // Default preferences
      const defaultPrefs: UserPreferences = {
        userId: user.uid,
        preferredRoles: ['Frontend Developer', 'Software Engineer'],
        preferredTechStack: ['React', 'TypeScript', 'JavaScript', 'Next.js'],
        defaultLevel: 'Mid-level',
        defaultType: 'Technical',
        defaultQuestionCount: 5,
        voiceSettings: {
          enabled: true,
          rate: 1.0,
          volume: 0.8,
          language: 'en-US'
        },
        updatedAt: new Date().toISOString()
      };
      setPreferences(defaultPrefs);
      localStorage.setItem(`preferences_${user.uid}`, JSON.stringify(defaultPrefs));
    }
    setIsLoading(false);
  }, [user]);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    if (!preferences || !user) return;

    const updated = {
      ...preferences,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    setPreferences(updated);
    localStorage.setItem(`preferences_${user.uid}`, JSON.stringify(updated));
  };

  return {
    preferences,
    updatePreferences,
    isLoading
  };
};