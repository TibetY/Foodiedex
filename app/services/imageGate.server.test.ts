import { afterEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import {
  fetchImageSafely,
  gateImage,
  gateImageFromUrl,
  isFlatArtwork,
  looksLikeLogoUrl,
  STORED_MAX_EDGE,
} from './imageGate.server';

/**
 * A photo stand-in: coarse random colour blocks scaled up, so the picture has
 * varied colour and texture at every scale the way a real scene does. Seeded,
 * so the tests are deterministic.
 */
function photo(width: number, height: number, format: 'jpeg' | 'png' = 'jpeg'): Promise<Buffer> {
  const w = 60;
  const h = 40;
  const raw = Buffer.alloc(w * h * 3);
  let seed = 42;
  for (let i = 0; i < raw.length; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    raw[i] = seed >>> 24;
  }
  const img = sharp(raw, { raw: { width: w, height: h, channels: 3 } }).resize(width, height, { fit: 'fill', kernel: 'cubic' });
  return (format === 'jpeg' ? img.jpeg() : img.png()).toBuffer();
}

function svg(markup: string, width: number, height: number): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${markup}</svg>`
  );
}

describe('gateImage (strict)', () => {
  it('keeps a photograph and stores it as a resized webp', async () => {
    const result = await gateImage(await photo(2400, 1600));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.contentType).toBe('image/webp');
    expect(Math.max(result.width, result.height)).toBe(STORED_MAX_EDGE);
    const meta = await sharp(result.data).metadata();
    expect(meta.format).toBe('webp');
  });

  it('never enlarges a photo that is already small enough', async () => {
    const result = await gateImage(await photo(900, 600));
    expect(result.ok && result.width).toBe(900);
  });

  it('rejects a small image', async () => {
    expect(await gateImage(await photo(300, 200))).toEqual({ ok: false, reason: 'too-small' });
  });

  it('rejects a banner and a tall strip', async () => {
    expect(await gateImage(await photo(1600, 400))).toEqual({ ok: false, reason: 'aspect' });
    expect(await gateImage(await photo(600, 1400))).toEqual({ ok: false, reason: 'aspect' });
  });

  it('rejects an image with real transparency', async () => {
    const emblem = await sharp(
      svg('<circle cx="512" cy="512" r="360" fill="none" stroke="#b3261e" stroke-width="40"/>', 1024, 1024)
    )
      .png()
      .toBuffer();
    expect(await gateImage(emblem)).toEqual({ ok: false, reason: 'transparent' });
  });

  it('keeps a png whose alpha channel is fully opaque', async () => {
    const opaque = await sharp(await photo(1200, 800, 'png')).ensureAlpha().png().toBuffer();
    expect((await gateImage(opaque)).ok).toBe(true);
  });

  it('rejects a wordmark on a flat background', async () => {
    const wordmark = await sharp(
      svg('<rect width="1200" height="630" fill="#111"/><text x="600" y="350" font-size="120" text-anchor="middle" fill="#fff">Le Bernardin</text>', 1200, 630)
    )
      .jpeg()
      .toBuffer();
    expect(await gateImage(wordmark)).toEqual({ ok: false, reason: 'logo' });
  });

  it('keeps a black-and-white photograph', async () => {
    const mono = await sharp(await photo(1500, 1000)).greyscale().jpeg().toBuffer();
    expect((await gateImage(mono)).ok).toBe(true);
  });

  it('rejects a logo on a gradient background', async () => {
    const graded = await sharp(
      svg(
        '<defs><linearGradient id="g"><stop offset="0" stop-color="#123"/><stop offset="1" stop-color="#456"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><circle cx="600" cy="315" r="180" fill="#fff"/>',
        1200,
        630
      )
    )
      .jpeg()
      .toBuffer();
    expect(await gateImage(graded)).toEqual({ ok: false, reason: 'logo' });
  });

  it('rejects by file name before looking at pixels', async () => {
    const result = await gateImage(await photo(1200, 800), { sourceUrl: 'https://x.example/assets/site-logo.jpg' });
    expect(result).toEqual({ ok: false, reason: 'logo' });
  });

  it('rejects bytes that are not an image, and svg', async () => {
    expect(await gateImage(Buffer.from('<html>not found</html>'))).toEqual({ ok: false, reason: 'undecodable' });
    expect(await gateImage(svg('<rect width="900" height="600" fill="red"/>', 900, 600))).toEqual({
      ok: false,
      reason: 'undecodable',
    });
  });
});

describe('gateImage (lenient — the user chose this image)', () => {
  it('keeps what strict would refuse, flattened onto white and resized', async () => {
    const emblem = await sharp(svg('<circle cx="150" cy="150" r="120" fill="#b3261e"/>', 300, 300)).png().toBuffer();
    const result = await gateImage(emblem, { strict: false });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const stats = await sharp(result.data).stats();
    expect(stats.isOpaque).toBe(true);
  });

  it('still refuses something unreadable', async () => {
    expect(await gateImage(Buffer.from('nope'), { strict: false })).toEqual({ ok: false, reason: 'undecodable' });
  });
});

describe('looksLikeLogoUrl', () => {
  it('matches logo-ish names as whole words only', () => {
    expect(looksLikeLogoUrl('https://x.example/img/Logo_White.png')).toBe(true);
    expect(looksLikeLogoUrl('https://x.example/favicon.ico')).toBe(true);
    expect(looksLikeLogoUrl('https://x.example/uploads/placeholder-1.jpg')).toBe(true);
    expect(looksLikeLogoUrl('https://x.example/photos/dining-room.jpg')).toBe(false);
    // "icon" inside another word is not a signal
    expect(looksLikeLogoUrl('https://x.example/photos/silicon-valley.jpg')).toBe(false);
    expect(looksLikeLogoUrl('https://x.example/photos/catalogo.jpg')).toBe(false);
  });
});

describe('isFlatArtwork', () => {
  it('flags a single colour and passes noise', () => {
    expect(isFlatArtwork(new Uint8Array(64 * 64 * 3).fill(200))).toBe(true);
    const noisy = new Uint8Array(64 * 64 * 3);
    let seed = 7;
    for (let i = 0; i < noisy.length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      noisy[i] = seed >>> 24;
    }
    expect(isFlatArtwork(noisy)).toBe(false);
  });
});

describe('fetchImageSafely', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('refuses a private address without fetching', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchImageSafely('http://127.0.0.1/a.jpg')).toEqual({ ok: false, reason: 'unsafe-url' });
    expect(await fetchImageSafely('http://169.254.169.254/latest/meta-data')).toEqual({ ok: false, reason: 'unsafe-url' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('re-checks the guard on a redirect hop', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 302, headers: { location: 'http://10.0.0.5/secret.jpg' } }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchImageSafely('https://cdn.example/a.jpg')).toEqual({ ok: false, reason: 'unsafe-url' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('follows a safe redirect and returns the bytes', async () => {
    const bytes = await photo(900, 600);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 301, headers: { location: '/real.jpg' } }))
      .mockResolvedValueOnce(new Response(bytes, { status: 200, headers: { 'content-type': 'image/jpeg' } }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchImageSafely('https://cdn.example/a.jpg');
    expect(result.ok && result.data.length).toBe(bytes.length);
    expect(fetchMock.mock.calls[1][0]).toBe('https://cdn.example/real.jpg');
  });

  it('treats a dead link, an html page and an oversized file as no image', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('gone', { status: 404 })));
    expect(await fetchImageSafely('https://cdn.example/a.jpg')).toEqual({ ok: false, reason: 'unreachable' });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html/>', { status: 200, headers: { 'content-type': 'text/html' } })));
    expect(await fetchImageSafely('https://cdn.example/a.jpg')).toEqual({ ok: false, reason: 'not-image' });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('x', { status: 200, headers: { 'content-type': 'image/jpeg', 'content-length': String(50 * 1024 * 1024) } }))
    );
    expect(await fetchImageSafely('https://cdn.example/a.jpg')).toEqual({ ok: false, reason: 'too-big' });
  });
});

describe('gateImageFromUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects a logo-named url without downloading it', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await gateImageFromUrl('https://x.example/logo.png')).toEqual({ ok: false, reason: 'logo' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
