// lib/i18n/client.ts
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';

export const initI18nextClient = async (lng: string) => {
  // Allow both 2-letter and 5-letter codes
  const validLng = lng && (lng.length === 2 || lng.length === 5) ? lng : 'en-US';

  console.log(`🔍 Client initI18nextClient called with lng: "${lng}" -> validLng: "${validLng}"`);

  const i18nInstance = createInstance();
  await i18nInstance
    .use(initReactI18next)
    .use(resourcesToBackend((language: string, namespace: string) => {
      // Support folder names like 'en-US', 'en-GB', 'fr', 'sw'
      return import(`@/public/locales/${language}/${namespace}.json`)
        .catch(() => {
          // Fallback to US English
          console.log(`⚠️ Client falling back to en-US/common.json for ${language}/${namespace}`);
          return import(`@/public/locales/en-US/common.json`);
        });
    }))
    .init({
      lng: validLng,
      fallbackLng: 'en-US',
      supportedLngs: ['en-US', 'en-GB', 'fr', 'es', 'sw'],
      defaultNS: 'common',
      fallbackNS: 'common',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
  return i18nInstance;
};