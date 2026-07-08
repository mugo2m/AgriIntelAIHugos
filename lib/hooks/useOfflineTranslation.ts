// lib/hooks/useOfflineTranslation.ts
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { OfflineTranslationService } from '@/lib/services/offlineTranslation';
import { useOffline } from './useOffline';

export const useOfflineTranslation = () => {
  const { t, i18n, ready } = useTranslation();
  const { isOnline } = useOffline();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isOnline) return;

    const preloadCommonKeys = [
      'welcome',
      'soil_test',
      'fertilizer',
      'pests',
      'watering',
      'harvest',
      'profit',
      'costs',
      'revenue',
      'farm_size',
      'acres',
      'cattle',
      'ask_questions',
      'personalized_recommendations',
      'business_tip_short',
      'yearly_testing_reminder',
      'soil_test_grouped',
      'calcitic_lime_grouped',
      'fertilizer_header_grouped',
      'planting_fertilizers_grouped',
      'topdressing_fertilizers_grouped',
      'plant_population_grouped',
      'gross_margin_grouped',
      'gap_grouped',
      'disease_management_grouped',
      'pest_management_grouped',
      'conservation_grouped',
      'business_grouped'
    ];

    OfflineTranslationService.preloadLanguage(i18n.language, preloadCommonKeys)
      .catch(error => {
        console.warn('Failed to preload translations:', error);
      });
  }, [i18n.language, isOnline]);

  useEffect(() => {
    if (ready) {
      setIsReady(true);
    }
  }, [ready]);

  const offlineT = (key: string, params?: any): string => {
    try {
      if (!isReady || !t) {
        console.warn(`Translation not ready for: ${key}`);
        return key;
      }

      const translation = t(key, params);

      // Handle if translation returns a Promise
      if (translation && typeof translation.then === 'function') {
        console.warn(`Translation for "${key}" returned a Promise - using key fallback`);
        return key;
      }

      return typeof translation === 'string' ? translation : String(translation || key);
    } catch (error) {
      console.warn('Translation error, falling back to key:', key, error);
      return key;
    }
  };

  return {
    t: offlineT,
    ready: isReady,
    i18n,
    isOnline
  };
};