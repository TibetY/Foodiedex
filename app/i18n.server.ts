import { createInstance, type TFunction } from 'i18next';
import { i18nConfig, fallbackLng } from '~/i18n';

/**
 * Server-side translator for loaders and actions. The app is English-only, so
 * this needs no request context and no locale negotiation — one instance is
 * initialised lazily and reused.
 */
let ready: Promise<TFunction> | null = null;

export function getFixedT(): Promise<TFunction> {
  if (!ready) {
    const instance = createInstance();
    ready = instance
      .init({ ...i18nConfig, lng: fallbackLng })
      .then(() => instance.getFixedT(fallbackLng));
  }
  return ready;
}
