// lib/hooks/useOffline.ts
import { useState, useEffect, useRef } from 'react';
import { OfflineTranslationService } from '@/lib/services/offlineTranslation';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // Set initial state
    setIsOnline(navigator.onLine);

    // Check queue on mount - only if mounted
    if (isMounted.current) {
      const queue = OfflineTranslationService.getQueue();
      setPendingCount(queue.length);
    }

    // Event handlers
    const handleOnline = () => {
      if (isMounted.current) {
        setIsOnline(true);
        setWasOffline(true);

        // Process queue when back online
        OfflineTranslationService.processQueue().then(() => {
          if (isMounted.current) {
            const remaining = OfflineTranslationService.getQueue();
            setPendingCount(remaining.length);
          }
        });
      }
      console.log('📶 Back online - processing queue...');
    };

    const handleOffline = () => {
      if (isMounted.current) {
        setIsOnline(false);
      }
      console.log('📴 Offline mode activated');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clear expired cache periodically
    const interval = setInterval(() => {
      OfflineTranslationService.clearExpiredCache();
    }, 60 * 60 * 1000); // Every hour

    return () => {
      isMounted.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    pendingCount,
    hasPending: pendingCount > 0
  };
};