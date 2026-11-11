import { describe, expect, it } from 'vitest';
import { isSafeExternalUrl } from './safeUrl.server';

describe('isSafeExternalUrl', () => {
  it('accepts ordinary public http(s) urls', () => {
    expect(isSafeExternalUrl('https://lecoucou.com/')).toBe(true);
    expect(isSafeExternalUrl('http://cdn.example.org/a/b.jpg?w=1200')).toBe(true);
    expect(isSafeExternalUrl('https://8.8.8.8/x')).toBe(true);
  });

  it('rejects non-http schemes and junk', () => {
    expect(isSafeExternalUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeExternalUrl('data:image/png;base64,AAAA')).toBe(false);
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeExternalUrl('not a url')).toBe(false);
  });

  it('rejects loopback, private and link-local hosts', () => {
    for (const url of [
      'http://localhost:3000/',
      'http://app.localhost/',
      'http://127.0.0.1/',
      'http://0.0.0.0/',
      'http://10.1.2.3/',
      'http://172.16.0.1/',
      'http://172.31.255.255/',
      'http://192.168.1.1/',
      'http://169.254.169.254/latest/meta-data',
      'http://[::1]/',
      'http://[fd00::1]/',
      'http://[fe80::1]/',
      'http://[::ffff:127.0.0.1]/',
    ]) {
      expect(isSafeExternalUrl(url), url).toBe(false);
    }
  });

  it('does not over-match public ranges next to private ones', () => {
    expect(isSafeExternalUrl('http://172.15.0.1/')).toBe(true);
    expect(isSafeExternalUrl('http://172.32.0.1/')).toBe(true);
    expect(isSafeExternalUrl('http://11.0.0.1/')).toBe(true);
  });
});
