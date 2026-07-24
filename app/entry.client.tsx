/* eslint-disable import/no-named-as-default-member -- i18next's default export legitimately exposes `.use()` */
/**
 * Client entry. Initializes i18next (reading the language from the <html lang>
 * the server rendered) before hydrating, so the client tree matches the server.
 */

import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { CacheProvider } from "@emotion/react";
import i18next from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import createEmotionCache from "~/createEmotionCache";
import { i18nConfig } from "~/i18n";

// One cache for the life of the page. It lives here rather than in root.tsx so
// it is created only in the browser — the server render gets its own
// request-scoped cache from entry.server, which is what the critical-CSS
// extraction reads.
const emotionCache = createEmotionCache();

async function hydrate() {
  await i18next
    .use(initReactI18next)
    .use(LanguageDetector)
    .init({
      ...i18nConfig,
      detection: {
        // The server already chose the language and set <html lang>; trust it.
        order: ["htmlTag"],
        caches: [],
      },
    });

  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <CacheProvider value={emotionCache}>
          <I18nextProvider i18n={i18next}>
            <RemixBrowser />
          </I18nextProvider>
        </CacheProvider>
      </StrictMode>
    );
  });
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(hydrate);
} else {
  window.setTimeout(hydrate, 1);
}
