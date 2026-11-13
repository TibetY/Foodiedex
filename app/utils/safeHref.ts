/**
 * A user- or scrape-supplied web address, only if it is plain http(s).
 *
 * Anything else — `javascript:`, `data:`, a relative path, a typo — becomes
 * undefined, so it can never reach an `href`, an `src` or a CSS `url()`. The
 * forms already check this on input, but rows can be written straight through
 * the database API, so every place that renders one checks again.
 */
export function safeHttpUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  try {
    const { protocol } = new URL(trimmed);
    return protocol === 'http:' || protocol === 'https:' ? trimmed : undefined;
  } catch {
    return undefined;
  }
}
