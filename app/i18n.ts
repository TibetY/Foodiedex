import en from '~/locales/en/common.json';

/**
 * The app ships in English only. i18next is kept as the string catalogue —
 * every user-visible string lives in locales/en/common.json rather than being
 * scattered through JSX — but there is no language detection, no locale
 * cookie, and no switcher.
 */
export const fallbackLng = 'en';
export const defaultNS = 'common';

export const resources = {
  en: { common: en },
} as const;

/** Shared i18next init options used on both server and client. */
export const i18nConfig = {
  supportedLngs: [fallbackLng],
  fallbackLng,
  defaultNS,
  ns: [defaultNS],
  resources,
  interpolation: { escapeValue: false },
};
