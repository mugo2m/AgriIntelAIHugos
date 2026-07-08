// components/OfflineBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { OfflineTranslationService } from '@/lib/services/offlineTranslation';

export const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setPendingCount(OfflineTranslationService.getQueue().length);

    const handleOnline = () => {
      setIsOnline(true);
      handleSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    await OfflineTranslationService.processQueue();
    setPendingCount(OfflineTranslationService.getQueue().length);
    setIsSyncing(false);
  };

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 rounded-xl shadow-xl border-2 ${
      isOnline ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'
    } p-4`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${
          isOnline ? 'bg-green-100' : 'bg-yellow-100'
        }`}>
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-yellow-600" />
          )}
        </div>

        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">
            {isOnline ? 'Back Online' : 'You\'re Offline'}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            {isOnline
              ? pendingCount > 0
                ? `Syncing ${pendingCount} pending ${pendingCount === 1 ? 'action' : 'actions'}...`
                : 'Connected to internet'
              : 'Using cached translations. Some features may be limited.'}
          </p>

          {isOnline && pendingCount > 0 && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="mt-2 flex items-center gap-2 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};