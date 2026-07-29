/* eslint-disable import/no-named-as-default-member -- i18next's default export legitimately exposes `.use()` */
/**
 * Client entry. Initializes i18next before hydrating so the client tree
 * matches the server. The app is English-only — no detection.
 */

import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { CacheProvider } from "@emotion/react";
import i18next from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
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

/**
 * Recover Emotion when hydration fails.
 *
 * React discards the server tree on a hydration mismatch and re-renders the
 * document from scratch, which takes Emotion's <style> elements with it. The
 * cache does not notice: it still lists every id as inserted, so it never
 * writes those rules again, and its sheet keeps appending to elements that are
 * no longer in the document. The page then renders partly unstyled — and
 * anything mounted after hydration, a dialog above all, comes up with no
 * styling at all, because its rules are written somewhere the browser will
 * never read.
 *
 * Emptying the cache's bookkeeping and flushing its sheet puts Emotion back to
 * a cold start, so the re-render that follows re-inserts everything.
 *
 * Hydration can fail for reasons the page does not control — a browser
 * extension or content blocker touching the DOM before React runs is enough,
 * which is why this appeared in Brave and not Safari on the same phone.
 */
function resetEmotionCache(): void {
  // flush() removes each tag from its container and throws if React already
  // detached them, which would abort the reset half-done — so it is best
  // effort, and the sheet is repointed at the live <head> either way.
  try {
    emotionCache.sheet.flush();
  } catch {
    /* tags were already gone */
  }
  const sheet = emotionCache.sheet as unknown as {
    tags: HTMLStyleElement[];
    ctr: number;
    container: Node;
  };
  sheet.tags = [];
  sheet.ctr = 0;
  sheet.container = document.head;
  emotionCache.inserted = {};
  emotionCache.registered = {};
}

// One cache for the life of the page, created only in the browser — the server
// render gets its own request-scoped cache from entry.server. Created AFTER
// readServerStyles so the scrape sees the untouched server markup.
const emotionCache = createEmotionCache();

async function hydrate() {
  await i18next.use(initReactI18next).init(i18nConfig);

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
      </StrictMode>,
      {
        // Fires when React gives up on the server markup — the moment Emotion's
        // stylesheets stop being part of the document.
        onRecoverableError: resetEmotionCache,
      }
    );
  });
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(hydrate);
} else {
  window.setTimeout(hydrate, 1);
}
