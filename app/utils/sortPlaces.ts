/**
 * How a list of places can be ordered — one definition for the dashboard and
 * the public share page. The ids are stored in URLs and saved views, so never
 * rename one.
 */
export const SORT_MODES = [
  'name',
  'recent',
  'rating',
  'rating_asc',
  'price',
  'price_desc',
  'visits',
  'favorite',
] as const;

export type SortMode = (typeof SORT_MODES)[number];

/** What a list opens in, and what a URL with no `sort` param means. */
export const DEFAULT_SORT: SortMode = 'name';

export function parseSortMode(raw: string | null | undefined): SortMode {
  return SORT_MODES.includes(raw as SortMode) ? (raw as SortMode) : DEFAULT_SORT;
}

interface Sortable {
  name: string;
  rating?: number;
  priceRange?: string;
  visitCount?: number;
  favorite?: boolean;
  createdAt?: string;
}

/**
 * Alphanumeric name order: names that start with a letter come first, A to Z,
 * then names that start with a digit (or anything else). Case and accents are
 * ignored, and digits compare as numbers, so "2 Amys" sorts before "10 Greek".
 */
export function compareNames(a: string, b: string): number {
  const startsWithLetter = (s: string) => /^\p{L}/u.test(s.trim());
  const group = Number(!startsWithLetter(a)) - Number(!startsWithLetter(b));
  if (group !== 0) return group;
  return a.trim().localeCompare(b.trim(), undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Order by a number, with places that have no value (unrated, no price) always
 * last, whichever direction is asked for — they aren't "worst", just unknown.
 */
function byNumber<T extends Sortable>(value: (p: T) => number, direction: 'asc' | 'desc') {
  return (a: T, b: T) => {
    const va = value(a);
    const vb = value(b);
    if (!va || !vb) return Number(!va) - Number(!vb) || compareNames(a.name, b.name);
    return (direction === 'asc' ? va - vb : vb - va) || compareNames(a.name, b.name);
  };
}

const COMPARATORS: Record<SortMode, (a: Sortable, b: Sortable) => number> = {
  name: (a, b) => compareNames(a.name, b.name),
  recent: (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
  rating: byNumber((p) => p.rating ?? 0, 'desc'),
  rating_asc: byNumber((p) => p.rating ?? 0, 'asc'),
  price: byNumber((p) => p.priceRange?.length ?? 0, 'asc'),
  price_desc: byNumber((p) => p.priceRange?.length ?? 0, 'desc'),
  visits: (a, b) => (b.visitCount ?? 0) - (a.visitCount ?? 0) || compareNames(a.name, b.name),
  favorite: (a, b) => Number(b.favorite ?? false) - Number(a.favorite ?? false) || compareNames(a.name, b.name),
};

/** A sorted copy of `places`. `reversed` flips the whole order (Z–A, oldest first…). */
export function sortPlaces<T extends Sortable>(places: T[], mode: SortMode, reversed = false): T[] {
  const sorted = [...places].sort(COMPARATORS[mode]);
  return reversed ? sorted.reverse() : sorted;
}
