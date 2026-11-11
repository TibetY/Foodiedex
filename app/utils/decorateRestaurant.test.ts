import { describe, expect, it } from 'vitest';
import { decorate } from './decorateRestaurant';

describe('decorate().meta — the one line under a place name', () => {
  it('joins cuisine, city and price', () => {
    const r = decorate({
      name: 'Le Coucou',
      cuisineType: 'French',
      priceRange: '$$$',
      locations: [{ address: '138 Lafayette St, New York, NY 10013' }],
    });
    expect(r.meta).toBe('French · New York · $$$');
  });

  it('leaves out whatever is unknown', () => {
    expect(decorate({ name: 'A', cuisineType: 'Thai' }).meta).toBe('Thai');
    expect(decorate({ name: 'A', priceRange: '$$' }).meta).toBe('$$');
    expect(decorate({ name: 'A' }).meta).toBe('');
  });

  it('never says "Restaurant", but does use a more specific place type', () => {
    expect(decorate({ name: 'A', placeTypes: ['Restaurant'] }).meta).toBe('');
    expect(decorate({ name: 'A', placeTypes: ['Restaurant', 'Bar'], priceRange: '$$' }).meta).toBe('Bar · $$');
  });

  it('keeps a cuisine label for search and the cuisine column', () => {
    expect(decorate({ name: 'A' }).cuisine).toBe('Restaurant');
    expect(decorate({ name: 'A', placeTypes: ['Bar'] }).cuisine).toBe('Bar');
  });
});

describe('decorate() status and rating', () => {
  it('defaults to want, and averages group ratings over the own column', () => {
    const r = decorate({ name: 'A', rating: 2 }, [{ rating: 4 }, { rating: 5 }]);
    expect(r.isWant).toBe(true);
    expect(r.isBeen).toBe(false);
    expect(r.rating).toBe(4.5);
    expect(r.rated).toBe(true);
    expect(decorate({ name: 'A' }).rated).toBe(false);
  });
});
