/**
 * Rejects anything that isn't a plausible public http(s) URL. Basic SSRF guard
 * for every server-side fetch of a user-supplied address (website scrape, image
 * ingest). It checks the literal hostname only — it does not resolve DNS — so
 * callers that follow redirects must re-check each hop.
 */
export function isSafeExternalUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '0.0.0.0' || hostname === '::1' || hostname === '::') {
    return false;
  }
  // Literal private/loopback/link-local IPv4 ranges.
  if (
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    /^0\./.test(hostname)
  ) {
    return false;
  }
  // Literal IPv6: unique-local (fc00::/7), link-local (fe80::/10), and
  // IPv4-mapped addresses, which would smuggle a private v4 past the checks above.
  if (hostname.includes(':') && (/^f[cd]/.test(hostname) || /^fe[89ab]/.test(hostname) || hostname.startsWith('::ffff:'))) {
    return false;
  }
  return true;
}
