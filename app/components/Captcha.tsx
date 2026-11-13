import { useEffect, useRef, useState } from 'react';
import { useRouteLoaderData } from '@remix-run/react';
import Box from '@mui/material/Box';
import { useKanpaiTheme } from '~/listTheme';
import type { PublicEnv } from '~/supabaseConfig';
import { CAPTCHA_FIELD } from '~/utils/captcha';

interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __fdxTurnstileLoaded?: () => void;
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__fdxTurnstileLoaded';
let scriptPromise: Promise<TurnstileApi> | null = null;

/** Load Cloudflare's script once per page, whichever form asks first. */
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      window.__fdxTurnstileLoaded = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile missing')));
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Could not load the Turnstile script'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

/** The public Turnstile site key, or undefined when the check is switched off. */
export function useCaptchaSiteKey(): string | undefined {
  const root = useRouteLoaderData('root') as { ENV?: PublicEnv } | undefined;
  return root?.ENV?.TURNSTILE_SITE_KEY || undefined;
}

interface CaptchaProps {
  /** Change this (e.g. to the action's result) to get a fresh token: each one works once. */
  resetKey?: unknown;
}

/**
 * Cloudflare Turnstile, placed inside a <Form>. Most visitors never see it: it
 * only shows a checkbox when Cloudflare is unsure. Its token is posted as
 * `captchaToken`. Renders nothing when no site key is configured.
 */
export default function Captcha({ resetKey }: CaptchaProps) {
  const siteKey = useCaptchaSiteKey();
  const { mode } = useKanpaiTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;
    const el = containerRef.current;
    const update = (value: string | null) => setToken(value ?? '');
    loadTurnstile()
      .then((api) => {
        if (cancelled) return;
        widgetId.current = api.render(el, {
          sitekey: siteKey,
          theme: mode,
          // Only appears when Cloudflare wants a click. "flexible" needs 300px;
          // narrower phones get the compact box.
          appearance: 'interaction-only',
          size: el.clientWidth >= 300 ? 'flexible' : 'compact',
          callback: (value: string) => update(value),
          'expired-callback': () => update(null),
          'error-callback': () => update(null),
        });
      })
      .catch((e) => console.error(e));
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
    // The widget is drawn once per site key and theme.
  }, [siteKey, mode]);

  // A token is spent once the form is submitted; ask for a new one.
  useEffect(() => {
    if (resetKey === undefined || !widgetId.current || !window.turnstile) return;
    window.turnstile.reset(widgetId.current);
    setToken('');
  }, [resetKey]);

  if (!siteKey) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <div ref={containerRef} />
      <input type="hidden" name={CAPTCHA_FIELD} value={token} />
    </Box>
  );
}
