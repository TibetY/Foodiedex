import { getSupabaseBrowserClient } from '~/supabase.client';
import { RESTAURANT_IMAGE_BUCKET } from '~/supabaseConfig';
import type { IngestImageResponse } from '~/routes/api.ingest-image/route';

/** Longest edge of a stored photo — matches the server-side gate. */
const STORED_MAX_EDGE = 1200;

/**
 * Downscale a picked photo in the browser before it is uploaded: phone photos
 * are several megabytes and 4000px wide, and every thumbnail would otherwise
 * download the original. Falls back to the untouched file when the browser
 * cannot decode it (e.g. HEIC outside Safari) so the upload still succeeds.
 */
async function downscale(file: File): Promise<{ blob: Blob; ext: string }> {
  const original = { blob: file, ext: file.name.includes('.') ? file.name.split('.').pop() ?? 'jpg' : 'jpg' };
  if (typeof createImageBitmap !== 'function') return original;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, STORED_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return original;
    // White under any transparency, so a PNG never shows the page through it.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    return blob ? { blob, ext: 'jpg' } : original;
  } catch {
    return original;
  }
}

/**
 * Upload an image to Supabase Storage and return its public URL.
 * Files are stored under `{userId}/...` so the storage RLS policies (which key
 * off the first path segment) allow each user to manage only their own images.
 * The `up-` prefix marks a user upload, as opposed to a `web-` copy the server
 * ingested from a website.
 */
export async function uploadRestaurantImage(
  file: File,
  userId: string
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { blob, ext } = await downscale(file);
  const path = `${userId}/up-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(RESTAURANT_IMAGE_BUCKET)
    .upload(path, blob, { cacheControl: '31536000', upsert: false, contentType: blob.type || undefined });

  if (error) throw error;

  const { data } = supabase.storage
    .from(RESTAURANT_IMAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

/** True for a URL that already points into our own image bucket. */
export function isStoredImageUrl(url: string | undefined): boolean {
  return !!url && url.includes(`/storage/v1/object/public/${RESTAURANT_IMAGE_BUCKET}/`);
}

/**
 * Pass an external image URL through the server's quality gate and get back the
 * URL of our stored copy — or null when the image was refused (a logo, too
 * small, a dead link…). Never throws: a failed ingest means "no image", which
 * must not stop the place itself from saving.
 *
 * `origin` is "scraped" for an image found on a website (fully gated) and
 * "user" for a link the user pasted themselves (kept unless unreadable).
 */
export async function ingestRestaurantImage(
  url: string | undefined,
  origin: 'scraped' | 'user',
  place?: { name?: string; address?: string }
): Promise<{ url: string | undefined; rejected: boolean }> {
  const trimmed = url?.trim();
  if (!trimmed) return { url: undefined, rejected: false };
  if (isStoredImageUrl(trimmed)) return { url: trimmed, rejected: false };
  try {
    const res = await fetch('/api/ingest-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: trimmed, origin, ...place }),
    });
    const data = (await res.json()) as IngestImageResponse;
    return { url: data.url ?? undefined, rejected: !data.url };
  } catch {
    return { url: undefined, rejected: true };
  }
}

/**
 * Delete a previously uploaded image given its public URL. Best-effort:
 * failures are logged but not thrown.
 */
export async function deleteRestaurantImage(imageUrl: string): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    const marker = `/${RESTAURANT_IMAGE_BUCKET}/`;
    const idx = imageUrl.indexOf(marker);
    if (idx === -1) return;
    const path = imageUrl.slice(idx + marker.length);
    await supabase.storage.from(RESTAURANT_IMAGE_BUCKET).remove([path]);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
}
