import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_TURNSTILE_SITE_KEY, captchaRequired, turnstileSiteKey } from './supabaseConfig';

const original = process.env.TURNSTILE_SITE_KEY;
afterEach(() => {
  if (original === undefined) delete process.env.TURNSTILE_SITE_KEY;
  else process.env.TURNSTILE_SITE_KEY = original;
});

describe('turnstileSiteKey', () => {
  it('uses the built-in key when the env var is unset or blank', () => {
    delete process.env.TURNSTILE_SITE_KEY;
    expect(turnstileSiteKey()).toBe(DEFAULT_TURNSTILE_SITE_KEY);
    process.env.TURNSTILE_SITE_KEY = '  ';
    expect(turnstileSiteKey()).toBe(DEFAULT_TURNSTILE_SITE_KEY);
    expect(captchaRequired()).toBe(true);
  });

  it('lets the env var override the key', () => {
    process.env.TURNSTILE_SITE_KEY = ' 0xOTHER \n';
    expect(turnstileSiteKey()).toBe('0xOTHER');
    // Cloudflare's test key that always shows the checkbox.
    process.env.TURNSTILE_SITE_KEY = '3x00000000000000000000FF';
    expect(turnstileSiteKey()).toBe('3x00000000000000000000FF');
  });

  it('treats "on" or any non-key value as the built-in key', () => {
    process.env.TURNSTILE_SITE_KEY = 'on';
    expect(turnstileSiteKey()).toBe(DEFAULT_TURNSTILE_SITE_KEY);
    process.env.TURNSTILE_SITE_KEY = 'true';
    expect(turnstileSiteKey()).toBe(DEFAULT_TURNSTILE_SITE_KEY);
  });

  it('turns the check off with "off"', () => {
    process.env.TURNSTILE_SITE_KEY = 'OFF';
    expect(turnstileSiteKey()).toBeUndefined();
    expect(captchaRequired()).toBe(false);
  });
});
