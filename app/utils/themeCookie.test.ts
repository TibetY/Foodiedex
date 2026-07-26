import { describe, it, expect } from 'vitest';
import {
  modeFromCookieHeader,
  accentFromCookieHeader,
  THEME_COOKIE_KEY,
  ACCENT_COOKIE_KEY,
} from '~/listTheme';

/**
 * The theme cookie exists so the SERVER can render the user's mode. If this
 * parsing regresses, every SSR paints "light" and dark-mode users watch the
 * page flip after mount — the flash this was written to kill.
 */
describe('modeFromCookieHeader', () => {
  it('reads the mode when the cookie is alone', () => {
    expect(modeFromCookieHeader(`${THEME_COOKIE_KEY}=dark`)).toBe('dark');
    expect(modeFromCookieHeader(`${THEME_COOKIE_KEY}=light`)).toBe('light');
  });

  it('reads it among other cookies, in any position', () => {
    expect(modeFromCookieHeader(`lng=fr; ${THEME_COOKIE_KEY}=dark; sb-token=xyz`)).toBe('dark');
    expect(modeFromCookieHeader(`${THEME_COOKIE_KEY}=dark; lng=en`)).toBe('dark');
    expect(modeFromCookieHeader(`lng=en; ${THEME_COOKIE_KEY}=dark`)).toBe('dark');
  });

  it('defaults to light when absent, empty, or unparseable', () => {
    expect(modeFromCookieHeader(null)).toBe('light');
    expect(modeFromCookieHeader('')).toBe('light');
    expect(modeFromCookieHeader('lng=fr; sb-token=xyz')).toBe('light');
    expect(modeFromCookieHeader(`${THEME_COOKIE_KEY}=neon`)).toBe('light');
  });

  it('does not match a cookie whose name merely ends with the key', () => {
    expect(modeFromCookieHeader(`not_${THEME_COOKIE_KEY}=dark`)).toBe('light');
  });
});

describe('accentFromCookieHeader', () => {
  it('reads each accent, alone or among other cookies', () => {
    expect(accentFromCookieHeader(`${ACCENT_COOKIE_KEY}=matcha`)).toBe('matcha');
    expect(accentFromCookieHeader(`${ACCENT_COOKIE_KEY}=sakura`)).toBe('sakura');
    expect(accentFromCookieHeader(`lng=fr; ${ACCENT_COOKIE_KEY}=peach; sb-token=xyz`)).toBe('peach');
  });

  it('defaults to matcha when absent, empty, or unparseable', () => {
    expect(accentFromCookieHeader(null)).toBe('matcha');
    expect(accentFromCookieHeader('')).toBe('matcha');
    expect(accentFromCookieHeader(`${ACCENT_COOKIE_KEY}=chartreuse`)).toBe('matcha');
    expect(accentFromCookieHeader(`not_${ACCENT_COOKIE_KEY}=sakura`)).toBe('matcha');
  });

  it('reads mode and accent independently from one header', () => {
    const header = `${THEME_COOKIE_KEY}=dark; ${ACCENT_COOKIE_KEY}=sakura`;
    expect(modeFromCookieHeader(header)).toBe('dark');
    expect(accentFromCookieHeader(header)).toBe('sakura');
  });
});
