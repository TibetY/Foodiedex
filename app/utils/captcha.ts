/**
 * Bot check for every form that makes Supabase send an email (sign-up,
 * sign-in, resend confirmation, password reset), using Cloudflare Turnstile.
 *
 * The browser widget (components/Captcha.tsx) puts a one-time token into the
 * form as `captchaToken`; the route's action passes it to Supabase, which
 * verifies it with the Turnstile secret key set in the Supabase dashboard
 * (Authentication → Attack Protection). The secret never lives in this app.
 *
 * The widget's site key is built in (supabaseConfig.ts); TURNSTILE_SITE_KEY can
 * override it, or be set to `off` to turn the check off. Tokens are harmless
 * until Supabase's CAPTCHA protection is switched on.
 */

/** The form field the widget writes its token into. */
export const CAPTCHA_FIELD = 'captchaToken';

/** The token a form posted, or undefined when there is none. */
export function readCaptchaToken(formData: FormData): string | undefined {
  const value = formData.get(CAPTCHA_FIELD);
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** Whether a Supabase auth error means the bot check failed or expired. */
export function isCaptchaError(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  return error.code === 'captcha_failed' || /captcha/i.test(error.message ?? '');
}
