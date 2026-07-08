// components/ServiceWorkerRegistration.tsx
'use client';

import { useEffect } from 'react';
import { OfflineTranslationService } from '@/lib/services/offlineTranslation';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('✅ Service Worker registered:', registration);

          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'PROCESS_QUEUE') {
              OfflineTranslationService.processQueue();
            }
          });

        } catch (err) {
          console.log('❌ Service Worker registration failed:', err);
        }
      });
    }

    // Check online status on mount
    const handleOnline = () => {
      console.log('📶 App is online - processing queue');
      OfflineTranslationService.processQueue();
      OfflineTranslationService.clearExpiredCache();
    };

    window.addEventListener('online', handleOnline);

    // Initial cache cleanup
    OfflineTranslationService.clearExpiredCache();

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return null; // This component doesn't render anything
}