// lib/i18n/index.ts
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';

export const initI18next = async (lng: string) => {
  // DEBUG: Log the incoming language
  console.log(`🔍 initI18next called with lng: "${lng}" (type: ${typeof lng}, length: ${lng?.length})`);

  // Validate lng - allow 2-letter OR 5-letter codes
  let validLng = lng;
  const isValidLength = lng && typeof lng === 'string' && (lng.length === 2 || lng.length === 5);

  if (!isValidLength) {
    console.error(`❌ Invalid language code detected: "${lng}", falling back to 'en-US'`);
    validLng = 'en-US';
  }

  // Check for the mysterious 'V' bug
  if (validLng === 'V') {
    console.error(`🔥 Found the mysterious 'V' language! This should not happen.`);
    validLng = 'en-US';
  }

  const i18nInstance = createInstance();
  await i18nInstance
    .use(initReactI18next)
    .use(resourcesToBackend((language: string, namespace: string) => {
      // DEBUG: Log each language being loaded
      console.log(`📚 Loading locale: "${language}/${namespace}.json"`);

      // Support folder names like 'en-US', 'en-GB', etc.
      return import(`@/public/locales/${language}/${namespace}.json`)
        .catch(() => {
          // Fallback to US English
          console.log(`⚠️ Falling back to en-US/common.json for ${language}/${namespace}`);
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