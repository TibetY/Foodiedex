/**
 * entry.server.tsx
 *
 * Renders twice on purpose. The first pass populates a request-scoped Emotion
 * cache so the critical CSS can be extracted; the second pass renders that CSS
 * through the React tree (EmotionStyleContext -> root.tsx) instead of splicing
 * <style> tags into the HTML string. Injecting them by string replace left them
 * outside React's tree, and a single hydration mismatch would delete them while
 * Emotion's browser cache still believed the rules were inserted — leaving the
 * page permanently unstyled. Also wraps i18next so SSR renders in the request's
 * locale.
 */

import { renderToString } from "react-dom/server";
import type { AppLoadContext, EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { CacheProvider } from "@emotion/react";
import { createInstance } from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import createEmotionCache from "~/createEmotionCache";
import createEmotionServer from "@emotion/server/create-instance";
import { i18nConfig, fallbackLng } from "~/i18n";
import { EmotionStyleContext, type EmotionStyleChunk } from "~/emotionStyles";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loadContext: AppLoadContext
) {
  // Request-scoped i18next instance. English-only, so there is nothing to
  // detect — the language is fixed.
  const instance = createInstance();
  await instance.use(initReactI18next).init({ ...i18nConfig, lng: fallbackLng });

  // Request-scoped Emotion cache. It must NOT be shared between requests, or
  // the second request would consider every rule already inserted and emit
  // nothing.
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  const tree = (styles: EmotionStyleChunk[]) => (
    <EmotionStyleContext.Provider value={styles}>
      <I18nextProvider i18n={instance}>
        <CacheProvider value={cache}>
          <RemixServer context={remixContext} url={request.url} />
        </CacheProvider>
      </I18nextProvider>
    </EmotionStyleContext.Provider>
  );

  // Pass 1 — populates the cache so there is something to extract.
  const probe = renderToString(tree([]));
  const chunks = extractCriticalToChunks(probe);
  const styles: EmotionStyleChunk[] = chunks.styles.map((s) => ({
    key: s.key,
    ids: s.ids.join(" "),
    css: s.css,
  }));

  // Pass 2 — the markup we actually send, with the CSS rendered by React.
  const html = renderToString(tree(styles));

  responseHeaders.set("Content-Type", "text/html");
  return new Response(`<!DOCTYPE html>${html}`, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
