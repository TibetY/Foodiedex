import type { Restaurant } from '~/types/restaurant';
import { cityFromAddress } from '~/utils/foodStats';

/** Display-decorated restaurant used by the dashboard and the public share view. */
export type DecoratedRestaurant = Restaurant & {
  initial: string;
  costStr: string;
  rated: boolean;
  meta: string;
  cuisine: string;
  /** Best-effort city of the first located branch (heuristic; may be null). */
  city: string | null;
  isBeen: boolean;
  isWant: boolean;
};

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
  return {
    ...r,
    rating,
    initial: (r.name.replace(/^The /i, '')[0] || '?').toUpperCase(),
    costStr: r.priceRange || '',
    rated: (rating ?? 0) > 0,
    cuisine,
    meta: cuisine,
    city: cityFromAddress((r.locations ?? []).find((l) => l.address?.trim())?.address),
    isBeen: status === 'been',
    isWant: status === 'want',
  };
}
