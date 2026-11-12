import { describe, it, expect } from 'vitest';
import {
  DISTINCTIONS,
  DISTINCTION_GROUPS,
  applyDistinctionChange,
  distinctionIds,
  distinctionLabels,
  fieldsFromDistinctionIds,
} from './distinctions';

describe('distinctions', () => {
  it('has unique ids and only known groups', () => {
    const ids = DISTINCTIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of DISTINCTIONS) expect(DISTINCTION_GROUPS).toContain(d.group);
  });

  it('reads stars, bib and the stored list into one selection', () => {
    expect(distinctionIds({ michelinStars: 2, bibGourmand: false, distinctions: ['canadas-100-best'] })).toEqual([
      'michelin-2',
      'canadas-100-best',
    ]);
    expect(distinctionIds({ bibGourmand: true })).toEqual(['bib-gourmand']);
    expect(distinctionIds({})).toEqual([]);
  });

  it('round-trips a selection through the stored fields', () => {
    const ids = ['michelin-3', 'michelin-green-star', 'worlds-50-best'];
    const fields = fieldsFromDistinctionIds(ids);
    expect(fields).toEqual({
      michelinStars: 3,
      bibGourmand: false,
      distinctions: ['michelin-green-star', 'worlds-50-best'],
    });
    expect(distinctionIds(fields)).toEqual(ids);
  });

  it('stores nothing for an empty selection', () => {
    expect(fieldsFromDistinctionIds([])).toEqual({ michelinStars: 0, bibGourmand: false, distinctions: [] });
  });

  it('keeps only one of the star tiers and Bib Gourmand', () => {
    expect(applyDistinctionChange(['michelin-1'], ['michelin-1', 'michelin-2'])).toEqual(['michelin-2']);
    expect(applyDistinctionChange(['michelin-2', 'la-liste'], ['michelin-2', 'la-liste', 'bib-gourmand'])).toEqual([
      'la-liste',
      'bib-gourmand',
    ]);
    expect(applyDistinctionChange(['bib-gourmand'], ['bib-gourmand', 'michelin-1'])).toEqual(['michelin-1']);
  });

  it('lets other distinctions combine freely, and allows removing one', () => {
    expect(applyDistinctionChange(['michelin-1'], ['michelin-1', 'canadas-100-best'])).toEqual([
      'michelin-1',
      'canadas-100-best',
    ]);
    expect(applyDistinctionChange(['michelin-1', 'la-liste'], ['la-liste'])).toEqual(['la-liste']);
  });

  it('labels what a place holds and skips ids it no longer knows', () => {
    expect(distinctionLabels({ michelinStars: 1, distinctions: ['canadas-100-best', 'retired-list'] })).toEqual([
      '1 Michelin Star',
      "Canada's 100 Best",
    ]);
  });
});
