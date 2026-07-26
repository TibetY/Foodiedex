/**
 * Cuisine glyphs — the one place emoji is allowed to speak in the UI. Each
 * cuisine gets a single food glyph; unknown cuisines fall back to the plate.
 * Tints come from the deliberately tiny tile-tint family (3 values, assigned by
 * a stable hash) so a wall of cuisine tiles reads calm rather than carnival.
 */
import type { ListTokens } from '~/listTheme';

type Tokens = ListTokens;

const CUISINE_EMOJI: Record<string, string> = {
  Italian: '🍝',
  Chinese: '🥟',
  Japanese: '🍣',
  Mexican: '🌮',
  Indian: '🍛',
  Thai: '🍲',
  French: '🥐',
  American: '🍔',
  Mediterranean: '🫒',
  Korean: '🍜',
  Vietnamese: '🍜',
  Greek: '🥙',
  Spanish: '🥘',
  Turkish: '🧆',
  Lebanese: '🥙',
  Ethiopian: '🫓',
  Caribbean: '🍤',
  Brazilian: '🥩',
  Peruvian: '🐟',
  German: '🥨',
  Portuguese: '🐙',
  Filipino: '🍢',
  Indonesian: '🍢',
  Malaysian: '🍜',
  Moroccan: '🍲',
  Persian: '🍚',
  Seafood: '🦞',
  Steakhouse: '🥩',
  BBQ: '🍖',
  Pizza: '🍕',
  Burgers: '🍔',
  Sushi: '🍣',
  Ramen: '🍜',
  Fusion: '🍱',
  Other: '🍽️',
  Restaurant: '🍽️',
};

/** Venue glyphs — restaurant / bar / café / bakery. */
const PLACE_TYPE_EMOJI: Record<string, string> = {
  Restaurant: '🍽️',
  Bar: '🍸',
  Cafe: '☕',
  Bakery: '🥐',
};

/**
 * Keyword fallbacks for free-text cuisines — picking 'Other' lets the user type
 * anything ("natural wine bar", "neapolitan pizza"), and decorate() also falls
 * back to a place type, so a plain dictionary lookup misses a lot. Longest
 * keywords first so "wine bar" beats "bar".
 */
const KEYWORD_EMOJI: [needle: string, emoji: string][] = [
  ['steak', '🥩'],
  ['sushi', '🍣'],
  ['ramen', '🍜'],
  ['noodle', '🍜'],
  ['pizza', '🍕'],
  ['pasta', '🍝'],
  ['burger', '🍔'],
  ['bakery', '🥐'],
  ['pastry', '🥐'],
  ['dessert', '🍰'],
  ['cake', '🍰'],
  ['coffee', '☕'],
  ['cafe', '☕'],
  ['café', '☕'],
  ['tea', '🍵'],
  ['wine', '🍷'],
  ['cocktail', '🍸'],
  // Before the bare 'bar', which "barbecue" would otherwise match.
  ['barbecue', '🍖'],
  ['bbq', '🍖'],
  ['bar', '🍸'],
  ['pub', '🍺'],
  ['beer', '🍺'],
  ['brunch', '🥞'],
  ['breakfast', '🥞'],
  ['seafood', '🦞'],
  ['fish', '🐟'],
  ['oyster', '🦪'],
  ['taco', '🌮'],
  ['grill', '🍖'],
  ['veg', '🥗'],
  ['salad', '🥗'],
  ['soup', '🍲'],
  ['sandwich', '🥪'],
  ['deli', '🥪'],
  ['ice cream', '🍨'],
  ['gelato', '🍨'],
];

/**
 * The glyph for a cuisine. Tries the cuisine dictionary, then place types
 * (decorate() falls back to those when no cuisine is set), then keywords for
 * free-text entries — landing on the plate only when nothing matches.
 */
export function cuisineEmoji(cuisine: string): string {
  const exact = CUISINE_EMOJI[cuisine] ?? PLACE_TYPE_EMOJI[cuisine];
  if (exact) return exact;

  const q = cuisine.toLowerCase();
  for (const [needle, emoji] of KEYWORD_EMOJI) {
    if (q.includes(needle)) return emoji;
  }
  return '🍽️';
}

/** Dietary glyphs. Deliberately food imagery, never religious symbols. */
const DIET_EMOJI: Record<string, string> = {
  Vegetarian: '🥗',
  Vegan: '🌱',
  Halal: '🥙',
  Kosher: '🥯',
  'Gluten-Free': '🌾',
};

/** Service-style glyphs for the menu types. */
const MENU_TYPE_EMOJI: Record<string, string> = {
  'Fine Dining': '🕯️',
  'Tasting Menu': '🍮',
  'À la carte': '📜',
  Buffet: '🍲',
  'Prix Fixe': '🎟️',
  Casual: '🥪',
};

export function placeTypeEmoji(placeType: string): string {
  return PLACE_TYPE_EMOJI[placeType] ?? '📍';
}

export function dietEmoji(diet: string): string {
  return DIET_EMOJI[diet] ?? '🥗';
}

export function menuTypeEmoji(menuType: string): string {
  return MENU_TYPE_EMOJI[menuType] ?? '📜';
}

/** Stable tile tint for a cuisine, cycling the 3-tint family by name hash. */
export function cuisineTint(cuisine: string, tokens: Tokens): string {
  let h = 0;
  for (let i = 0; i < cuisine.length; i++) h = (h * 31 + cuisine.charCodeAt(i)) | 0;
  const tints = [tokens.tileTint, tokens.tileTint2, tokens.tileTint3];
  return tints[Math.abs(h) % tints.length];
}
