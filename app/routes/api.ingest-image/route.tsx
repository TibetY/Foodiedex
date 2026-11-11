import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { createSupabaseServerClient } from '~/supabase.server';
import { RESTAURANT_IMAGE_BUCKET, getServerSupabaseEnv } from '~/supabaseConfig';
import { gateImageFromUrl, type GateReason } from '~/services/imageGate.server';
import { findPlaceImage } from '~/services/imageSource.server';

export interface IngestImageResponse {
  /** Public URL of OUR stored copy, or null when the image was not kept. */
  url: string | null;
  reason?: GateReason | 'none' | 'unauthorized' | 'bad-request' | 'storage';
}

/**
 * Save-time image gate. The browser calls this with an image URL before it
 * writes a restaurant row; the reply is either the URL of a resized copy in our
 * own bucket or null. Nothing external is ever hotlinked.
 *
 *   origin "scraped" — found on the web: every quality rule applies.
 *   origin "user"    — a link the user pasted themselves: kept unless it
 *                      cannot be read as an image.
 */
export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers } = createSupabaseServerClient(request);
  const reply = (body: IngestImageResponse, status = 200) => json(body, { status, headers });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return reply({ url: null, reason: 'unauthorized' }, 401);

  let body: { url?: unknown; origin?: unknown; name?: unknown; address?: unknown };
  try {
    body = await request.json();
  } catch {
    return reply({ url: null, reason: 'bad-request' }, 400);
  }
  const url = typeof body.url === 'string' ? body.url.trim() : '';
  if (!url) return reply({ url: null, reason: 'bad-request' }, 400);
  const origin = body.origin === 'user' ? 'user' : 'scraped';

  // Already one of ours (an earlier ingest or an upload) — nothing to do.
  const bucketPrefix = `${getServerSupabaseEnv().SUPABASE_URL}/storage/v1/object/public/${RESTAURANT_IMAGE_BUCKET}/`;
  if (url.startsWith(bucketPrefix)) return reply({ url });

  const result =
    origin === 'user'
      ? await gateImageFromUrl(url, { strict: false })
      : await findPlaceImage({
          name: typeof body.name === 'string' ? body.name : undefined,
          address: typeof body.address === 'string' ? body.address : undefined,
          websiteImage: url,
        });
  if (!result.ok) return reply({ url: null, reason: result.reason });

  // `{uid}/…` is what the bucket's write policy keys on; the prefix records
  // where the picture came from, and the content hash makes re-saves idempotent.
  const path = `${user.id}/${origin === 'user' ? 'up' : 'web'}-${result.hash}.webp`;
  const { error } = await supabase.storage
    .from(RESTAURANT_IMAGE_BUCKET)
    .upload(path, result.data, { contentType: result.contentType, cacheControl: '31536000', upsert: false });
  // A duplicate is the same bytes already stored under the same name: success.
  if (error && !/exists|duplicate/i.test(error.message)) {
    console.error('ingest-image: storage upload failed', error.message);
    return reply({ url: null, reason: 'storage' });
  }
  const { data } = supabase.storage.from(RESTAURANT_IMAGE_BUCKET).getPublicUrl(path);
  return reply({ url: data.publicUrl });
}
