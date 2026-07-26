import type {
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
  isRouteErrorResponse,
  Link as RemixLink,
} from "@remix-run/react";

<<<<<<< HEAD
import { CacheProvider } from "@emotion/react";
import createEmotionCache from "./createEmotionCache";

import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { ThemeProvider } from '@mui/material/styles';
import { makeListTheme, brandCssVars, KanpaiThemeProvider } from "./listTheme";
=======
import { useContext } from "react";
import { ThemeProvider, CssBaseline, Box, Button, Typography } from "@mui/material";
import theme from "./theme";
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9

import { json } from "@remix-run/node";
import { useTranslation } from "react-i18next";
import { useChangeLanguage } from "remix-i18next/react";
import { createSupabaseServerClient } from "~/supabase.server";
import { getServerSupabaseEnv, type PublicEnv } from "~/supabaseConfig";
import i18nextServer from "~/i18next.server";
import { resources, fallbackLng } from "~/i18n";
import Navbar from "./components/Navbar";
<<<<<<< HEAD
=======
import { brandCssVars } from "~/listTheme";
import { EmotionStyleContext } from "~/emotionStyles";
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
import tailwindHref from "~/tailwind.css?url";

/** Error boundary only — the app shell itself uses KanpaiThemeProvider, but a
 *  thrown loader/render error replaces the whole document before that ever
 *  mounts, so the boundary needs its own static fallback theme. */
const errorTheme = makeListTheme('light', 'matcha');

export const handle = { i18n: "common" };

export const links: LinksFunction = () => [
  // SVG favicon (evergreen browsers) — the same Marker pin used in the
  // dashboard/shared-list headers, so the tab icon matches the in-app brand.
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  // Rasterized fallbacks: legacy browsers without SVG favicon support, and iOS
  // home-screen bookmarks.
  { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "stylesheet", href: tailwindHref },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
<<<<<<< HEAD
    href: "https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&display=swap",
=======
    href: "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Instrument+Serif:ital@0;1&family=Zen+Maru+Gothic:wght@400;500;700&display=swap",
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
  },
];

export const meta: MetaFunction = ({ data }) => {
  const locale = (data as { locale?: string } | undefined)?.locale ?? fallbackLng;
  const m = (resources[locale as keyof typeof resources] ?? resources[fallbackLng]).common.meta;
  return [
    { charset: "utf-8" },
    { title: m.title },
    { name: "description", content: m.description },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
<<<<<<< HEAD
    { name: "theme-color", content: "#F0EDE6" },
=======
    { name: "theme-color", content: "#F4F1E8" },
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
  ];
};

export const loader: LoaderFunction = async ({ request }) => {
  const { supabase } = createSupabaseServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ENV = getServerSupabaseEnv();
  const locale = await i18nextServer.getLocale(request);
  return json({ isLoggedIn: !!user, ENV, locale });
};

export default function App() {
  const { ENV, locale } = useLoaderData<{ ENV: PublicEnv; locale: string }>();
  // Server-extracted critical CSS on the server; the same tags read back out of
  // the document on the client (see entry.client), so the markup is identical
  // and React owns these nodes instead of leaving them orphaned in <head>.
  const emotionStyles = useContext(EmotionStyleContext);
  const { t, i18n } = useTranslation();
  // Keep the i18next client instance in sync with the server-detected locale.
  useChangeLanguage(locale);

  return (
<<<<<<< HEAD
    <html lang={locale} dir={i18n.dir(locale)} data-theme="light" data-accent="matcha">
=======
    <html lang={locale} dir={i18n.dir(locale)} data-theme="light">
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
      <head>
        <Meta />
        <Links />
        {/* Brand design tokens as CSS custom properties (generated from the same
<<<<<<< HEAD
            source as the MUI theme); KanpaiThemeProvider keeps the data-theme/
            data-accent attributes above in sync with the user's stored pick. */}
=======
            source as the MUI theme). Public pages inherit the light set; the
            dashboard/profile override with data-theme on their own root. */}
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
        <style dangerouslySetInnerHTML={{ __html: brandCssVars() }} />
        {emotionStyles.map((chunk) => (
          <style
            key={chunk.key + chunk.ids}
            data-emotion={`${chunk.key} ${chunk.ids}`}
            dangerouslySetInnerHTML={{ __html: chunk.css }}
          />
        ))}
      </head>
      <body>
        <a href="#main-content" className="skip-to-main">
          {t("a11y.skipToMain")}
        </a>
<<<<<<< HEAD
        <CacheProvider value={clientSideEmotionCache}>
          <KanpaiThemeProvider>
            <CssBaseline />
            <Navbar />
            <main id="main-content">
              <Outlet />
            </main>
          </KanpaiThemeProvider>
        </CacheProvider>
=======
        {/* The Emotion cache is provided by entry.client (browser) and
            entry.server (per request) — NOT here. A provider at this level runs
            in both environments and shadowed the server's request-scoped cache,
            leaving extractCriticalToChunks with nothing to inline and shipping
            an unstyled first paint. */}
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Navbar />
          <main id="main-content">
            <Outlet />
          </main>
        </ThemeProvider>
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)};`,
          }}
        />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

/**
 * App-wide error boundary. Replaces the whole document tree when a loader or
 * render throws, so users see a friendly localized page instead of a raw stack
 * trace. Distinguishes 404 from other failures.
 */
export function ErrorBoundary() {
  const error = useRouteError();
  const { t } = useTranslation();

  const isNotFound = isRouteErrorResponse(error) && error.status === 404;
  const title = isNotFound ? t("errors.notFoundTitle") : t("errors.title");
  const body = isNotFound ? t("errors.notFoundBody") : t("errors.genericBody");

  return (
    <html lang="en">
      <head>
        <title>{title}</title>
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider theme={errorTheme}>
          <CssBaseline />
          <Box
            component="main"
            sx={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: 2,
              px: 3,
            }}
          >
            <Box aria-hidden sx={{ fontSize: 52, lineHeight: 1 }}>
              {isNotFound ? '🍽️' : '🍳'}
            </Box>
            <Typography variant="h3" component="h1">
              {title}
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 440 }}>
              {body}
            </Typography>
            <Button component={RemixLink} to="/" variant="contained" sx={{ mt: 1 }}>
              {t("errors.backHome")}
            </Button>
          </Box>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
