/**
 * Supabase configuration is read from environment variables (set these in
 * Netlify → Site settings → Environment variables, and in a local `.env` for
 * development):
 *
 *   SUPABASE_URL        e.g. https://xxxx.supabase.co
 *   SUPABASE_ANON_KEY   the project's anon / public key
 *   TURNSTILE_SITE_KEY  optional: overrides the built-in Cloudflare Turnstile
 *                       site key for the auth forms' bot check, or `off` to
 *                       disable it; see app/utils/captcha.ts
 *
 * The anon key is public (row-level security protects the data), so it is safe
 * to ship to the browser. The server reads `process.env` directly; the browser
 * reads the values from `window.ENV`, which the root route injects from the
 * server-side env (see app/root.tsx).
 */
export const RESTAURANT_IMAGE_BUCKET = 'restaurant-images';

export interface PublicEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  /** Public Turnstile site key; absent means the bot check is off. */
  TURNSTILE_SITE_KEY?: string;
}

declare global {
  interface Window {
    ENV?: PublicEnv;
  }
}

/**
 * Detect a SECRET Supabase key mistakenly placed in SUPABASE_ANON_KEY. This key
 * is injected into the browser via window.ENV, so a secret key here would both
 * be rejected by the client ("Forbidden use of secret API key in browser") AND
 * leak a privileged credential to every visitor. Covers the new key format
 * (sb_secret_...) and legacy service_role JWTs.
 */
function isSecretKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true;
  // Legacy keys are JWTs: header.payload.signature — check the payload's role.
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf8')
      );
      if (payload?.role === 'service_role') return true;
    } catch {
      // Not a decodable JWT; fall through.
    }
  }
  return false;
}

/** Read the public env on the server (loaders/actions). */
export function getServerSupabaseEnv(): PublicEnv {
  // Trim to guard against trailing newlines/spaces from copy-paste into the
  // host's env UI, which would otherwise corrupt the JWT ("Invalid API key").
  const SUPABASE_URL = (process.env.SUPABASE_URL ?? '').trim();
  const SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY ?? '').trim();
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing SUPABASE_URL / SUPABASE_ANON_KEY environment variables.'
    );
  }
  if (isSecretKey(SUPABASE_ANON_KEY)) {
    throw new Error(
      'SUPABASE_ANON_KEY looks like a SECRET key (sb_secret_… or service_role). ' +
        'This value is shipped to the browser — use the publishable/anon key ' +
        'instead, and rotate the leaked secret key.'
    );
  }
  const TURNSTILE_SITE_KEY = turnstileSiteKey();
  return { SUPABASE_URL, SUPABASE_ANON_KEY, ...(TURNSTILE_SITE_KEY ? { TURNSTILE_SITE_KEY } : {}) };
}

/**
 * The Foodiedex Turnstile widget's site key. It is public by design (it ships
 * in every page); the matching secret key lives only in the Supabase dashboard
 * (Authentication → Attack Protection), which verifies the tokens.
 */
export const DEFAULT_TURNSTILE_SITE_KEY = '0x4AAAAAAGANeN4Mng0Auilr';

/**
 * The site key in use: TURNSTILE_SITE_KEY overrides the default, and the value
 * `off` turns the bot check off (e.g. on a host not listed on the widget).
 */
export function turnstileSiteKey(): string | undefined {
  const fromEnv = (process.env.TURNSTILE_SITE_KEY ?? '').trim();
  const word = fromEnv.toLowerCase();
  if (word === 'off' || word === 'false') return undefined;
  // Real site keys start with "0x", Cloudflare's test keys with "1x"–"3x";
  // anything else ("on", "true", a typo) means "use the built-in key" rather
  // than sending an invalid key to Cloudflare.
  return /^[0-3]x\w+$/.test(fromEnv) ? fromEnv : DEFAULT_TURNSTILE_SITE_KEY;
}

/** Whether the auth forms must carry a Turnstile token (server only). */
export function captchaRequired(): boolean {
  return !!turnstileSiteKey();
}

/** Read the public env in the browser (injected via window.ENV). */
export function getBrowserSupabaseEnv(): PublicEnv {
  const env = typeof window !== 'undefined' ? window.ENV : undefined;
  if (!env?.SUPABASE_URL || !env?.SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase env not available on window.ENV. Is root.tsx injecting it?'
    );
  }
  return env;
}
