import { describe, it, expect } from 'vitest';
import { safeHttpUrl } from './safeHref';

describe('safeHttpUrl', () => {
  it('keeps plain web addresses', () => {
    expect(safeHttpUrl('https://resy.com/cities/ny/le-coucou')).toBe('https://resy.com/cities/ny/le-coucou');
    expect(safeHttpUrl(' http://example.com ')).toBe('http://example.com');
  });

  it('drops script, data and other schemes', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeHttpUrl(' JavaScript:alert(1)')).toBeUndefined();
    expect(safeHttpUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined();
    expect(safeHttpUrl('vbscript:x')).toBeUndefined();
  });

  it('drops anything that is not a full URL', () => {
    expect(safeHttpUrl('x)}</style><script>alert(1)</script>')).toBeUndefined();
    expect(safeHttpUrl('/relative/path')).toBeUndefined();
    expect(safeHttpUrl('')).toBeUndefined();
    expect(safeHttpUrl(null)).toBeUndefined();
  });
});
