import createCache from "@emotion/cache";

/**
 * Emotion cache factory, shared by the server render and the browser.
 *
 * NOTE: no `prepend`. It is tempting (it makes MUI's styles lose ties to app
 * CSS), but it breaks hydration here, because we hydrate the whole `document`:
 * a prepending cache inserts its <style> container as the FIRST child of
 * <head>, while entry.server appends the extracted styles at the END. React
 * then walks <head> expecting the <meta> that <Meta/> rendered, finds the style
 * container instead, fails hydration, and re-renders the entire document from
 * scratch — which is what made the page flash styled, then unstyled.
 *
 * Appending on both sides keeps the server and client markup in the same order.
 * MUI's styles now land after tailwind.css in the cascade, which is what we
 * want anyway: component styles should win over Tailwind's preflight.
 */
export default function createEmotionCache() {
  return createCache({ key: "css" });
}
