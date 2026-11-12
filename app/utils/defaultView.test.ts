import { describe, it, expect } from 'vitest';
import { defaultViewFor } from './defaultView';

const places = (withPhoto: number, without: number) => [
  ...Array.from({ length: withPhoto }, () => ({ image: 'https://example.com/a.webp' })),
  ...Array.from({ length: without }, () => ({ image: undefined })),
];

describe('defaultViewFor', () => {
  it('opens an empty list as tiles', () => {
    expect(defaultViewFor([])).toBe('tile');
  });

  it('opens as rows when under half the places have a photo', () => {
    expect(defaultViewFor(places(2, 8))).toBe('list');
    expect(defaultViewFor(places(0, 1))).toBe('list');
  });

  it('opens as tiles when half or more have a photo', () => {
    expect(defaultViewFor(places(5, 5))).toBe('tile');
    expect(defaultViewFor(places(7, 3))).toBe('tile');
  });

  it('does not count an empty image string as a photo', () => {
    expect(defaultViewFor([{ image: '' }, { image: '' }, { image: 'x' }])).toBe('list');
  });
});
