import { describe, it, expect } from 'vitest';
import { CAPTCHA_FIELD, isCaptchaError, readCaptchaToken } from './captcha';

describe('readCaptchaToken', () => {
  it('reads the token the widget posted', () => {
    const form = new FormData();
    form.set(CAPTCHA_FIELD, ' tok-123 ');
    expect(readCaptchaToken(form)).toBe('tok-123');
  });

  it('is undefined when the field is missing or empty', () => {
    expect(readCaptchaToken(new FormData())).toBeUndefined();
    const form = new FormData();
    form.set(CAPTCHA_FIELD, '  ');
    expect(readCaptchaToken(form)).toBeUndefined();
  });
});

describe('isCaptchaError', () => {
  it('recognises Supabase captcha failures by code or message', () => {
    expect(isCaptchaError({ code: 'captcha_failed', message: 'x' })).toBe(true);
    expect(isCaptchaError({ message: 'captcha verification process failed' })).toBe(true);
  });

  it('leaves other errors alone', () => {
    expect(isCaptchaError({ message: 'Invalid login credentials' })).toBe(false);
    expect(isCaptchaError(null)).toBe(false);
  });
});
