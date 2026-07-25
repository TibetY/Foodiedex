import { createContext } from "react";

/** One server-rendered Emotion style tag: its cache key, ids, and CSS text. */
export interface EmotionStyleChunk {
  /** The cache key, e.g. "css" or "css-global". */
  key: string;
  /** Space-separated class ids the tag covers (the rest of data-emotion). */
  ids: string;
  /** The CSS rules themselves. */
  css: string;
}

/**
 * The critical CSS extracted during SSR, rendered into <head> by root.tsx.
 *
 * Why this exists: previously entry.server appended the extracted <style> tags
 * by string-replacing "</head>", which left them as DOM nodes React did not
 * own. Emotion's browser cache scans those tags on creation and marks every id
 * as already-inserted — so if React ever re-rendered the document (any
 * hydration mismatch does this) it deleted the tags while the cache still
 * believed the rules were present, and nothing re-inserted them. The page went
 * from styled to permanently unstyled.
 *
 * Rendering the same tags through React on the server AND the browser (see
 * entry.client, which reads them back out of the document before hydrating)
 * makes the markup identical and puts them under React's control, so they are
 * never orphaned and never silently dropped.
 */
export const EmotionStyleContext = createContext<EmotionStyleChunk[]>([]);
