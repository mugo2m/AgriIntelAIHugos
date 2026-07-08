"use client";

import { useOfflineTranslation } from '@/lib/hooks/useOfflineTranslation';
import { Sprout, WifiOff } from "lucide-react";
import { LANGUAGE_OPTIONS } from '@/lib/config/language';
import { useMobile } from '@/lib/hooks/useMobile';

interface LanguageBarProps {
  className?: string;
  userId?: string;
  userCountry?: string;
}

export default function LanguageBar({ className = '', userId, userCountry }: LanguageBarProps) {
  const { i18n, ready, isOnline, t } = useOfflineTranslation();
  const { isMobile } = useMobile();

  const safeT = (key: string, params?: any): string => {
    try {
      const result = t(key, params);
      if (result && typeof result.then === 'function') {
        console.warn(`Translation for "${key}" returned a Promise`);
        return key;
      }
      return typeof result === 'string' ? result : String(result || '');
    } catch (e) {
      console.error('Translation error for key:', key, e);
      return key;
    }
  };

  if (!ready) {
    return (
      <div className={`w-full bg-gradient-to-r from-green-700 to-green-800 text-white py-3 px-4 ${className}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sprout className="w-6 h-6 text-green-200 animate-pulse" />
            <span className="text-xl font-bold text-white drop-shadow-sm">{safeT('app_name')}</span>
          </div>
          <div className="flex gap-1">
            <div className="w-8 h-8 bg-green-600 rounded-full animate-pulse"></div>
            <div className="w-8 h-8 bg-green-600 rounded-full animate-pulse delay-100"></div>
            <div className="w-8 h-8 bg-green-600 rounded-full animate-pulse delay-200"></div>
          </div>
        </div>
      </div>
    );
  }

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('preferred-language', langCode);
    document.cookie = `preferred-language=${langCode}; path=/; max-age=31536000; SameSite=Lax`;
    if (isMobile && 'vibrate' in navigator) navigator.vibrate(20);
    console.log(`🌐 Language changed to: ${langCode}, cookie set`);
  };

  const getButtonStyle = (langCode: string) => {
    const isActive = i18n.language.startsWith(langCode);
    if (isActive) {
      return "bg-green-600 text-white border-2 border-white shadow-lg scale-105 active:scale-100";
    }
    return "bg-white text-green-800 hover:bg-green-100 border-2 border-green-600 active:bg-green-200 active:scale-95";
  };

  return (
    <div className={`w-full bg-gradient-to-r from-green-700 to-green-800 text-white py-3 px-3 md:px-6 shadow-lg language-bar ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-start">
          <Sprout className="w-6 h-6 text-green-200 flex-shrink-0" />
          <span className="text-xl font-bold text-white drop-shadow-sm">{safeT('app_name')}</span>
          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full ml-2 hidden sm:inline-block">
            {safeT('beta')}
          </span>

          {!isOnline && (
            <div className="flex items-center gap-1 ml-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs">
              <WifiOff className="w-3 h-3" />
              <span className="hidden sm:inline">{safeT('offline')}</span>
            </div>
          )}
        </div>

        {/* Language Buttons */}
        <div className="flex flex-wrap justify-center gap-2 w-full md:w-auto">
          {LANGUAGE_OPTIONS.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`
                ${getButtonStyle(lang.code)}
                px-3 sm:px-4 py-3 md:py-2.5
                rounded-xl font-bold text-sm
                transition-all duration-200
                flex items-center justify-center gap-1 sm:gap-2
                flex-1 md:flex-none
                min-w-[80px] sm:min-w-[100px] md:min-w-[120px]
                active:scale-95 touch-manipulation min-h-[48px]
              `}
              aria-label={`Switch to ${lang.name}`}
            >
              <span className="text-lg md:text-xl">{lang.flag}</span>
              <span className="truncate">{lang.label}</span>
            </button>
          ))}
        </div>

        <div className="text-xs text-green-200 md:hidden w-full text-center">
          {safeT('tap_to_change_language')}
        </div>
      </div>
    </div>
  );
}