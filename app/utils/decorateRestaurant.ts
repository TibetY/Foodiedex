import type { Restaurant } from '~/types/restaurant';
import { cityFromAddress } from '~/utils/foodStats';

/** Display-decorated restaurant used by the dashboard and the public share view. */
export type DecoratedRestaurant = Restaurant & {
  initial: string;
  costStr: string;
  rated: boolean;
  /** The one quiet line under a place's name: "French · New York · $$",
   *  each part left out when unknown. */
  meta: string;
  /** Always a label (falls back to the place type, then "Restaurant") — for
   *  search and the cuisine column. `meta` leaves the fallback out. */
  cuisine: string;
  /** Best-effort city of the first located branch (heuristic; may be null). */
  city: string | null;
  isBeen: boolean;
  isWant: boolean;
};

/**
 * The mark that stands in for a place with no photo: its leading number
 * ("88 Lanterns" → "88", "1909 Oyster" → "1909") or its first letter, with a
 * leading "The" ignored.
 */
export function monogram(name: string): string {
  const base = name.trim().replace(/^The\s+/i, '');
  const digits = base.match(/^\d{1,4}/);
  if (digits) return digits[0];
  return (Array.from(base)[0] ?? '?').toUpperCase();
}

/**
 * Derive the presentational fields (initial, cuisine, city, status). Bubble
 * display is handled by <Bubbles> from the raw `rating`, so no glyph string is
 * precomputed here (that rounding is what dropped fractional scores).
 *
 * `groupRatings` are the members' individual verdicts on this spot, when the
 * caller has them: their average becomes the displayed `rating`, so the cards,
 * rows, table, sorting and rating filter all agree with the detail dialog.
 * Spots nobody has rated individually keep the restaurant's own column.
 */
export function decorate(r: Restaurant, groupRatings?: { rating: number }[]): DecoratedRestaurant {
  const cuisine = r.cuisineType || r.placeTypes?.[0] || 'Restaurant';
  const status = r.status ?? 'want';
  const rating =
    groupRatings && groupRatings.length > 0
      ? groupRatings.reduce((sum, x) => sum + x.rating, 0) / groupRatings.length
      : r.rating;
  // "Restaurant" says nothing on a restaurant list, so it never reaches the meta line.
  const kind = r.cuisineType || r.placeTypes?.find((p) => p !== 'Restaurant') || '';
  const city = cityFromAddress((r.locations ?? []).find((l) => l.address?.trim())?.address);
  return {
    ...r,
    rating,
    initial: monogram(r.name),
    costStr: r.priceRange || '',
    rated: (rating ?? 0) > 0,
    cuisine,
    meta: [kind, city, r.priceRange].filter(Boolean).join(' · '),
    city,
    isBeen: status === 'been',
    isWant: status === 'want',
  };
}
