import { createHash } from 'node:crypto';
// Relative imports only in this file: scripts/backfill-images.ts runs it
// outside the app build, where the `~/` alias may not exist.
import { isSafeExternalUrl } from '../utils/safeUrl.server';

/**
 * The quality gate for restaurant photos.
 *
 * Most restaurant sites expose a logo, a wordmark or nothing as their
 * og:image, and a stretched logo looks worse than no photo at all. So an image
 * found on the web is fetched here, judged, and only kept — as our own resized
 * copy — when it reads as a photograph. A rejection means "no image".
 */

const FETCH_TIMEOUT_MS = 6000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 4;

/** Smallest photo worth showing: the card is ~300 CSS px wide at 2x. */
export const MIN_LONG_SIDE = 600;
export const MIN_SHORT_SIDE = 400;
/** Width / height. Thumbs render at 3:2, so anything far from it crops badly. */
export const MIN_ASPECT = 3 / 4;
export const MAX_ASPECT = 2.2;
/** Longest edge of the copy we store. */
export const STORED_MAX_EDGE = 1200;

export type GateReason =
  | 'unsafe-url'
  | 'unreachable'
  | 'not-image'
  | 'too-big'
  | 'undecodable'
  | 'too-small'
  | 'aspect'
  | 'transparent'
  | 'logo'
  | 'unavailable';

export type GateResult =
  | { ok: true; data: Buffer; contentType: 'image/webp'; hash: string; width: number; height: number }
  | { ok: false; reason: GateReason };

type SharpModule = typeof import('sharp').default;

/**
 * sharp is a native module. Load it lazily so a platform where its binary is
 * missing degrades to "no image" for this one feature instead of taking the
 * whole server bundle down at import time.
 */
async function loadSharp(): Promise<SharpModule | null> {
  try {
    return (await import('sharp')).default;
  } catch (error) {
    console.error('imageGate: sharp failed to load — images cannot be processed', error);
    return null;
  }
}

/**
 * Download an image from a user-supplied URL. Redirects are followed by hand so
 * the SSRF guard runs on every hop, not just the first.
 */
export async function fetchImageSafely(
  url: string
): Promise<{ ok: true; data: Buffer } | { ok: false; reason: GateReason }> {
  let current = url;
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!isSafeExternalUrl(current)) return { ok: false, reason: 'unsafe-url' };
      const response = await fetch(current, {
        redirect: 'manual',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { 'User-Agent': 'TheFoodiedex-LinkPreview/1.0', Accept: 'image/*' },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) return { ok: false, reason: 'unreachable' };
        current = new URL(location, current).toString();
        continue;
      }
      if (!response.ok || !response.body) return { ok: false, reason: 'unreachable' };

      // Some CDNs serve images as octet-stream, so only clearly-wrong types are
      // refused here; the decoder is the real judge.
      const type = (response.headers.get('content-type') ?? '').toLowerCase();
      if (type.startsWith('text/') || type.includes('json') || type.includes('svg')) {
        return { ok: false, reason: 'not-image' };
      }
      const declared = Number(response.headers.get('content-length'));
      if (declared > MAX_IMAGE_BYTES) return { ok: false, reason: 'too-big' };

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_IMAGE_BYTES) {
          await reader.cancel();
          return { ok: false, reason: 'too-big' };
        }
        chunks.push(value);
      }
      return { ok: true, data: Buffer.concat(chunks) };
    }
    return { ok: false, reason: 'unreachable' };
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
}

/** File or path names that announce a non-photo. */
const LOGO_NAME = /(^|[^a-z])(logo|logos|icon|favicon|sprite|placeholder|wordmark|brandmark|avatar)([^a-z]|$)/i;

export function looksLikeLogoUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const { pathname } = new URL(url);
    return LOGO_NAME.test(decodeURIComponent(pathname));
  } catch {
    return LOGO_NAME.test(url);
  }
}

/** Side of the square sample the flatness test runs on. */
export const FLAT_SAMPLE = 64;

/**
 * True when the picture is mostly flat colour — a logo or wordmark on a plain
 * (or gently graded) background. Takes a FLAT_SAMPLE x FLAT_SAMPLE RGB sample
 * and looks at two things a photograph has and artwork lacks:
 *
 *  - no single colour dominates (each channel cut to 16 levels; a dark dining
 *    room measures ~0.5 here, a logo's background 0.8+), and
 *  - texture nearly everywhere: most neighbouring pixels differ in brightness
 *    (0.55-0.9 of them in photos, colour or black-and-white; 0.1-0.25 in
 *    logos, including ones on a gradient, which the first test alone misses).
 *
 * It does not catch artwork that is dense edge to edge, such as a page of text.
 */
export function isFlatArtwork(rgb: Uint8Array | Buffer, side: number = FLAT_SAMPLE): boolean {
  const pixels = side * side;
  const counts = new Map<number, number>();
  const lum = new Float32Array(pixels);
  let top = 0;
  for (let p = 0, i = 0; p < pixels; p++, i += 3) {
    const key = ((rgb[i] >> 4) << 8) | ((rgb[i + 1] >> 4) << 4) | (rgb[i + 2] >> 4);
    const n = (counts.get(key) ?? 0) + 1;
    counts.set(key, n);
    if (n > top) top = n;
    lum[p] = 0.299 * rgb[i] + 0.587 * rgb[i + 1] + 0.114 * rgb[i + 2];
  }
  if (top / pixels >= 0.6) return true;

  let textured = 0;
  let compared = 0;
  for (let y = 0; y < side - 1; y++) {
    for (let x = 0; x < side - 1; x++) {
      const p = y * side + x;
      const step = Math.max(Math.abs(lum[p] - lum[p + 1]), Math.abs(lum[p] - lum[p + side]));
      if (step > 6) textured++;
      compared++;
    }
  }
  return textured / compared < 0.3;
}

export interface GateOptions {
  /** Where the bytes came from — its file name is one of the logo signals. */
  sourceUrl?: string;
  /**
   * Strict (default) applies every quality rule: this is for images found on
   * the web. Lenient is for an image the user chose themselves (upload or
   * pasted link): it is still decoded, resized and stored, but only refused
   * when it cannot be read as an image at all.
   */
  strict?: boolean;
}

/** Judge an image and, if it passes, produce the resized copy to store. */
export async function gateImage(input: Buffer, opts: GateOptions = {}): Promise<GateResult> {
  const strict = opts.strict ?? true;
  const sharp = await loadSharp();
  if (!sharp) return { ok: false, reason: 'unavailable' };

  try {
    const meta = await sharp(input).metadata();
    if (!meta.width || !meta.height || meta.format === 'svg') {
      return { ok: false, reason: 'undecodable' };
    }
    // EXIF orientations 5-8 are rotated a quarter turn: what the viewer sees is
    // height x width.
    const turned = (meta.orientation ?? 1) >= 5;
    const width = turned ? meta.height : meta.width;
    const height = turned ? meta.width : meta.height;

    if (strict) {
      if (looksLikeLogoUrl(opts.sourceUrl)) return { ok: false, reason: 'logo' };
      if (Math.max(width, height) < MIN_LONG_SIDE || Math.min(width, height) < MIN_SHORT_SIDE) {
        return { ok: false, reason: 'too-small' };
      }
      const aspect = width / height;
      if (aspect < MIN_ASPECT || aspect > MAX_ASPECT) return { ok: false, reason: 'aspect' };
      if (meta.hasAlpha) {
        const { isOpaque } = await sharp(input).stats();
        if (!isOpaque) return { ok: false, reason: 'transparent' };
      }
      const sample = await sharp(input)
        .flatten({ background: '#ffffff' })
        .resize(FLAT_SAMPLE, FLAT_SAMPLE, { fit: 'fill' })
        .removeAlpha()
        .toColourspace('srgb')
        .raw()
        .toBuffer();
      if (isFlatArtwork(sample)) return { ok: false, reason: 'logo' };
    }

    const { data, info } = await sharp(input)
      .rotate() // bake in the EXIF orientation before the metadata is dropped
      .flatten({ background: '#ffffff' })
      .resize({ width: STORED_MAX_EDGE, height: STORED_MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });

    return {
      ok: true,
      data,
      contentType: 'image/webp',
      hash: createHash('sha256').update(data).digest('hex').slice(0, 20),
      width: info.width,
      height: info.height,
    };
  } catch {
    return { ok: false, reason: 'undecodable' };
  }
}

/** Fetch + judge in one step: the whole path for an image found by URL. */
export async function gateImageFromUrl(url: string, opts: Omit<GateOptions, 'sourceUrl'> = {}): Promise<GateResult> {
  // The name check needs no download, so a strict rejection on it is free.
  if ((opts.strict ?? true) && looksLikeLogoUrl(url)) return { ok: false, reason: 'logo' };
  const fetched = await fetchImageSafely(url);
  if (!fetched.ok) return fetched;
  return gateImage(fetched.data, { ...opts, sourceUrl: url });
}
