import { describe, it, expect } from 'vitest';
import { cuisineEmoji, cuisineTint, placeTypeEmoji, dietEmoji, menuTypeEmoji } from './cuisineEmoji';
import { getListTokens } from '~/listTheme';

describe('cuisineEmoji', () => {
  it('maps known cuisines', () => {
    expect(cuisineEmoji('Japanese')).toBe('🍣');
    expect(cuisineEmoji('Italian')).toBe('🍝');
    expect(cuisineEmoji('Ramen')).toBe('🍜');
  });

  // decorate() falls back to placeTypes[0] when a place has no cuisine, so
  // place-type values reach this function too.
  it('falls back to place types', () => {
    expect(cuisineEmoji('Bakery')).toBe('🥐');
    expect(cuisineEmoji('Bar')).toBe('🍸');
    expect(cuisineEmoji('Cafe')).toBe('☕');
  });

  it('matches free-text cuisines by keyword, case-insensitively', () => {
    expect(cuisineEmoji('natural wine bar')).toBe('🍷');
    expect(cuisineEmoji('Neapolitan Pizza')).toBe('🍕');
    expect(cuisineEmoji('Specialty Coffee')).toBe('☕');
  });

  it('prefers the more specific keyword over a substring match', () => {
    // "barbecue" contains "bar" — the smoke wins over the cocktail.
    expect(cuisineEmoji('Barbecue')).toBe('🍖');
    // "steakhouse" contains "tea".
    expect(cuisineEmoji('Steakhouse')).toBe('🥩');
  });

  it('lands on the plate when nothing matches', () => {
    expect(cuisineEmoji('Californian')).toBe('🍽️');
    expect(cuisineEmoji('')).toBe('🍽️');
  });
});

describe('cuisineTint', () => {
  it('is stable for a given cuisine and stays inside the tint family', () => {
    const t = getListTokens('light', 'matcha');
    const family = [t.tileTint, t.tileTint2, t.tileTint3];
    expect(cuisineTint('Japanese', t)).toBe(cuisineTint('Japanese', t));
    for (const c of ['Japanese', 'Italian', 'Mexican', 'Ramen', 'Other', '']) {
      expect(family).toContain(cuisineTint(c, t));
    }
  });
});

describe('the other glyph maps', () => {
  it('resolve known values and fall back safely', () => {
    expect(placeTypeEmoji('Cafe')).toBe('☕');
    expect(placeTypeEmoji('Nightclub')).toBe('📍');
    expect(dietEmoji('Vegan')).toBe('🌱');
    expect(dietEmoji('Paleo')).toBe('🥗');
    expect(menuTypeEmoji('Buffet')).toBe('🍲');
    expect(menuTypeEmoji('Omakase')).toBe('📜');
  });
});
