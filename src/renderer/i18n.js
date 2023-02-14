import i18n from "i18next";
import detector from "i18next-browser-languagedetector";
import backend from "i18next-http-backend";
import { initReactI18next } from "react-i18next"
import { BUILD, PUBLIC_URL, ALLOWED_LANGUAGES, LS_LANGUAGE, DEFAULT_LANGUAGE } from "./config";

i18n
  .use(backend)
  .use(detector)
  .use(initReactI18next)
  .init({
    // Requires until i18next-scanner supports JSONv4: https://github.com/i18next/i18next-scanner/issues/228
    // Check and adapt "ordinal" translations when it will be supported and migrated
    compatibilityJSON: 'v3',

    fallbackLng: DEFAULT_LANGUAGE,
    keySeparator: false,
    nsSeparator: false,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: `${PUBLIC_URL}i18n/{{lng}}.json?${BUILD}`,
    },
    react: {
      useSuspense: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LS_LANGUAGE,
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
      caches: ["localStorage"],
      checkWhitelist: true,
      checkForSimilarInWhitelist: false,
    },
    supportedLngs: ALLOWED_LANGUAGES,
  });

export default i18n;


const parseLanguageValue = (value = '') => {
  return ALLOWED_LANGUAGES.includes(value) ? value : DEFAULT_LANGUAGE;
};

const browserLanguage = (navigator?.language || DEFAULT_LANGUAGE).split('-')[0];

export const currentLanguage = () => parseLanguageValue(localStorage.getItem(LS_LANGUAGE) || browserLanguage);

export const setLanguage = async (value) => {
  const newValue = parseLanguageValue(value);
  localStorage.setItem(LS_LANGUAGE, newValue);
  return i18n.changeLanguage(newValue);
};