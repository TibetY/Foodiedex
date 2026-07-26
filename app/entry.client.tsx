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
import { EmotionStyleContext, type EmotionStyleChunk } from "~/emotionStyles";
import { i18nConfig } from "~/i18n";

/**
 * Read the server-rendered critical CSS back out of the document BEFORE
 * hydrating, so root.tsx renders byte-identical <style> tags on the client.
 * Without this the client tree would render nothing there, React would delete
 * the tags, and Emotion's cache — which registers their ids as inserted the
 * moment it is created — would never put the rules back.
 */
function readServerStyles(): EmotionStyleChunk[] {
  return [...document.head.querySelectorAll("style[data-emotion]")].map((el) => {
    const attr = el.getAttribute("data-emotion") ?? "";
    const space = attr.indexOf(" ");
    return {
      key: space === -1 ? attr : attr.slice(0, space),
      ids: space === -1 ? "" : attr.slice(space + 1),
      css: el.textContent ?? "",
    };
  });
}

const serverStyles = readServerStyles();

// One cache for the life of the page, created only in the browser — the server
// render gets its own request-scoped cache from entry.server. Created AFTER
// readServerStyles so the scrape sees the untouched server markup.
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
        <EmotionStyleContext.Provider value={serverStyles}>
          <CacheProvider value={emotionCache}>
            <I18nextProvider i18n={i18next}>
              <RemixBrowser />
            </I18nextProvider>
          </CacheProvider>
        </EmotionStyleContext.Provider>
      </StrictMode>
    );
  });
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(hydrate);
} else {
  window.setTimeout(hydrate, 1);
}
