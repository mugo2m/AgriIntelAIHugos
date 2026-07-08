// lib/i18n/server.ts
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next/initReactI18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { cookies } from 'next/headers';

export const initI18nextServer = async (lng: string) => {
  // DEBUG: Log the incoming language
  console.log(`🔍 Server initI18nextServer called with lng: "${lng}" (type: ${typeof lng}, length: ${lng?.length})`);

  // Validate lng - allow 2-letter OR 5-letter codes (e.g., 'en', 'en-US', 'en-GB')
  let validLng = lng;
  const isValidLength = lng && typeof lng === 'string' && (lng.length === 2 || lng.length === 5);

  if (!isValidLength) {
    console.error(`❌ Server invalid language code detected: "${lng}", falling back to 'en-US'`);
    validLng = 'en-US';
  }

  // Check for the mysterious 'V'
  if (validLng === 'V') {
    console.error(`🔥 Server found the mysterious 'V' language! This should not happen.`);
    validLng = 'en-US';
  }

  const i18nInstance = createInstance();
  await i18nInstance
    .use(initReactI18next)
    .use(resourcesToBackend((language: string, namespace: string) => {
      // DEBUG: Log each language being loaded on server
      console.log(`📚 Server loading locale: "${language}/${namespace}.json"`);

      // Handle 5-letter codes - they become folder names
      let folderPath = language;

      // First try: exact match for the language folder (supports en-US, en-GB)
      return import(`@/public/locales/${folderPath}/${namespace}.json`)
        .catch(() => {
          // Second try: fallback to common.json in the same language folder
          return import(`@/public/locales/${folderPath}/common.json`)
            .catch(() => {
              // Final fallback: US English common.json
              console.log(`⚠️ Server falling back to en-US/common.json for ${language}/${namespace}`);
              return import(`@/public/locales/en-US/common.json`);
            });
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
    });
  return i18nInstance;
};

export async function getTranslations(namespace: string = 'common') {
  const cookieStore = await cookies();

  // DEBUG: Log all cookies
  console.log('🍪 All cookies:', cookieStore.getAll());

  const preferredLangCookie = cookieStore.get('preferred-language');
  console.log('🍪 preferred-language cookie:', preferredLangCookie);

  let language = preferredLangCookie?.value || 'en-US';
  console.log(`🔤 getTranslations - using language: "${language}", namespace: "${namespace}"`);

  // Allow both 2-letter and 5-letter codes
  if (language.length !== 2 && language.length !== 5) {
    console.error(`❌ getTranslations - invalid language length: "${language}" (length: ${language.length})`);
    language = 'en-US';
  }

  const i18n = await initI18nextServer(language);
  return (key: string, params?: Record<string, any>) => i18n.t(key, params);
}