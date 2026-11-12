import { describe, it, expect } from 'vitest';
import { DEFAULT_SORT, SORT_MODES, compareNames, parseSortMode, sortPlaces } from './sortPlaces';

const names = (places: { name: string }[]) => places.map((p) => p.name);

describe('compareNames', () => {
  it('puts letters A to Z first, then names that start with a digit', () => {
    const sorted = ['7 Numbers', 'Zuni', 'alo', '2 Amys', 'Bar Isabel', '10 Greek'].sort(compareNames);
    expect(sorted).toEqual(['alo', 'Bar Isabel', 'Zuni', '2 Amys', '7 Numbers', '10 Greek']);
  });

  it('ignores case and accents', () => {
    expect(['Édulis', 'eataly', 'Dandylion'].sort(compareNames)).toEqual(['Dandylion', 'eataly', 'Édulis']);
  });
});

describe('parseSortMode', () => {
  it('defaults to name order', () => {
    expect(DEFAULT_SORT).toBe('name');
    expect(parseSortMode(null)).toBe('name');
    expect(parseSortMode('nonsense')).toBe('name');
  });

  it('accepts every listed mode, including ones saved before the default changed', () => {
    for (const mode of SORT_MODES) expect(parseSortMode(mode)).toBe(mode);
    expect(parseSortMode('recent')).toBe('recent');
  });
});

describe('sortPlaces', () => {
  const places = [
    { name: 'Cheap', rating: 3, priceRange: '$', visitCount: 9, createdAt: '2026-01-03' },
    { name: 'Pricey', rating: 5, priceRange: '$$$$', visitCount: 1, createdAt: '2026-01-01' },
    { name: 'Unknown', createdAt: '2026-01-04' },
    { name: 'Middle', rating: 4, priceRange: '$$', favorite: true, createdAt: '2026-01-02' },
  ];

  it('sorts by rating best to worst and worst to best, unrated last both ways', () => {
    expect(names(sortPlaces(places, 'rating'))).toEqual(['Pricey', 'Middle', 'Cheap', 'Unknown']);
    expect(names(sortPlaces(places, 'rating_asc'))).toEqual(['Cheap', 'Middle', 'Pricey', 'Unknown']);
  });

  it('sorts by price low to high and high to low, unpriced last both ways', () => {
    expect(names(sortPlaces(places, 'price'))).toEqual(['Cheap', 'Middle', 'Pricey', 'Unknown']);
    expect(names(sortPlaces(places, 'price_desc'))).toEqual(['Pricey', 'Middle', 'Cheap', 'Unknown']);
  });

  it('breaks ties by name', () => {
    const tied = [{ name: 'Beta', rating: 4 }, { name: 'Alpha', rating: 4 }];
    expect(names(sortPlaces(tied, 'rating'))).toEqual(['Alpha', 'Beta']);
  });

  it('keeps the other orders working', () => {
    expect(names(sortPlaces(places, 'name'))).toEqual(['Cheap', 'Middle', 'Pricey', 'Unknown']);
    expect(names(sortPlaces(places, 'recent'))).toEqual(['Unknown', 'Cheap', 'Middle', 'Pricey']);
    expect(names(sortPlaces(places, 'visits'))[0]).toBe('Cheap');
    expect(names(sortPlaces(places, 'favorite'))[0]).toBe('Middle');
  });

  it('reverses the whole order on request and leaves the input alone', () => {
    const before = names(places);
    expect(names(sortPlaces(places, 'name', true))).toEqual(['Unknown', 'Pricey', 'Middle', 'Cheap']);
    expect(names(places)).toEqual(before);
  });
});
