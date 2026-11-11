import { gateImageFromUrl, type GateReason, type GateResult } from './imageGate.server';

/**
 * Where a place's photo comes from.
 *
 * Sources are tried in order and the first candidate that passes the quality
 * gate wins. Today the only source is the og:image scraped from the place's own
 * website. A dedicated photo service belongs at the FRONT of IMAGE_PROVIDERS:
 * it then becomes the primary source and the website image the fallback,
 * with no change to callers.
 *
 * A photo the user uploads or pastes never passes through here — it is the
 * override, and always replaces whatever a provider found.
 */
export interface PlaceImageQuery {
  name?: string;
  address?: string;
  /** The og:image / twitter:image scraped from the place's website, if any. */
  websiteImage?: string;
}

export interface ImageProvider {
  id: string;
  /** Candidate image URLs for this place, best first. */
  candidates(query: PlaceImageQuery): Promise<string[]>;
}

const websiteProvider: ImageProvider = {
  id: 'website',
  candidates: async (query) => (query.websiteImage ? [query.websiteImage] : []),
};

export const IMAGE_PROVIDERS: ImageProvider[] = [websiteProvider];

export type PlaceImageResult =
  | (Extract<GateResult, { ok: true }> & { provider: string })
  | { ok: false; reason: GateReason | 'none' };

/** The first provider candidate that passes the (strict) gate. */
export async function findPlaceImage(
  query: PlaceImageQuery,
  providers: ImageProvider[] = IMAGE_PROVIDERS
): Promise<PlaceImageResult> {
  let lastReason: GateReason | 'none' = 'none';
  for (const provider of providers) {
    let urls: string[] = [];
    try {
      urls = await provider.candidates(query);
    } catch {
      continue; // a failing source must not block the ones after it
    }
    for (const url of urls) {
      const result = await gateImageFromUrl(url, { strict: true });
      if (result.ok) return { ...result, provider: provider.id };
      lastReason = result.reason;
    }
  }
  return { ok: false, reason: lastReason };
}
