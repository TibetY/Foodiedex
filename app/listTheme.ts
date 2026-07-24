import { createTheme, type Theme } from '@mui/material/styles';

/**
 * Single source of truth for "The List" brand — the warm editorial system from
 * the Brand & Product System handoff. Two modes of ONE brand: a cream
 * "Daylight" (light) palette and a deep-green "Supper" (dark) palette. These
 * tokens drive the dashboard chrome, every MUI component in the app subtree,
 * AND (via theme.ts, which builds on the dark palette + heroTokens) the
 * marketing and auth pages, so the product reads as one table end to end.
 */
export type ListMode = 'light' | 'dark';

/**
 * The "bubbly" UI voice: Zen Maru Gothic — a rounded gothic drawn for Japanese
 * type, so the softness comes from the same tradition as the rest of the theme
 * rather than being borrowed from a Western geometric. Used for labels,
 * buttons, chips and pills; dense body/meta text stays DM Sans and display
 * stays Instrument Serif.
 */
export const roundedFont = "'Zen Maru Gothic','DM Sans',system-ui,sans-serif";

const THEME_STORAGE_KEY = 'thelist.theme';

/** Read the user's saved theme preference (client only; defaults to light). */
export function getStoredMode(): ListMode {
  if (typeof window === 'undefined') return 'light';
  const v = window.localStorage.getItem(THEME_STORAGE_KEY);
  return v === 'dark' || v === 'light' ? v : 'light';
}

/** Persist the user's theme preference so it survives navigation/reloads. */
export function storeMode(mode: ListMode): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }
}

export interface ListTokens {
  pageBg: string;
  panelBg: string;
  cardBg: string;
  footerBg: string;
  ink: string;
  muted: string;
  faint: string;
  chip: string;
  border: string;
  borderSoft: string;
  borderStrong: string;
  divider: string;
  pillBorder: string;
  field: string;
  fieldBorder: string;
  searchBg: string;
  accent: string;
  accentHover: string;
  accentText: string;
  ember: string;
  secondary: string;
  success: string;
  error: string;
  cost: string;
  rating: string;
  /** The pale empty-star wash in <Stars> — decorative (aria-hidden) only.
   *  Quiet text uses `faint`, which is held to the 4.5:1 AA minimum. */
  notRated: string;
  monoGrad: string;
  monoInitial: string;
  // Diagonal-stripe placeholder for thumbnails without a photo.
  thumbStripeA: string;
  thumbStripeB: string;
  // Warm, deep card shadow (the refined place card).
  cardShadow: string;
  // Soft ambient "bubble" shadow for floating tiles/pills (gentler than cardShadow).
  bubbleShadow: string;
  // The cuisine-tile tints — a deliberately small family (3, assigned by hash)
  // instead of one tint per cuisine, so tile grids read calm, not carnival.
  tileTint: string;
  tileTint2: string;
  tileTint3: string;
  beenBg: string;
  beenFg: string;
  wantBg: string;
  wantFg: string;
  avatar2: string;
  avatar3: string;
  segBg: string;
  segFg: string;
  segIdle: string;
  pBg: string;
  pFg: string;
  pIdle: string;
  ring: string;
  // Stronger accent halo for the "just auto-filled" moment (box-shadow-ready).
  glow: string;
  // Neutral base for loading skeletons (search results, resolving cards).
  skeleton: string;
  snackBg: string;
  snackFg: string;
  shadow1: string;
  shadow2: string;
  shadow3: string;
  mapBg: string;
  mapGrid: string;
  mapWater: string;
  mapPark: string;
  pinBorder: string;
  pinLabelBg: string;
  pinLabelFg: string;
  pinLabelBorder: string;
}

export const listTokens: Record<ListMode, ListTokens> = {
  light: {
    // Washi paper — a warm off-white with the yellow pulled back, so the ground
    // reads as paper rather than cream. Panels/cards step up from it.
    pageBg: '#F4F1E8',
    panelBg: '#FAF8F2',
    cardBg: '#FFFFFF',
    footerBg: '#EEEADF',
    // Sumi ink: near-black, only faintly warm — not the old brown.
    ink: '#1F1E1A',
    muted: '#67625A',
    // 4.83:1 on pageBg / 5.46:1 on cardBg. This token labels real content
    // (counts, distances, placeholders), so it has to clear 4.5:1 everywhere.
    faint: '#6E695F',
    chip: '#67625A',
    border: '#E6E1D4',
    borderSoft: '#EDE9DE',
    borderStrong: '#DAD4C4',
    divider: '#E6E1D4',
    pillBorder: '#DAD4C4',
    field: '#FFFFFF',
    fieldBorder: '#DAD4C4',
    searchBg: '#EFEBE0',
    // Persimmon (kaki), deepened to bengara so small accent text clears AA on
    // the page ground — the old #B5532F measured 4.36:1 there.
    accent: '#A8442A',
    accentHover: '#8E3722',
    accentText: '#FFFFFF',
    ember: 'linear-gradient(135deg,#B85536,#8E3722)',
    // Matcha, the quiet second colour.
    secondary: '#5F6B4C',
    success: '#3D7048',
    error: '#A5382C',
    cost: '#5F6B4C',
    rating: '#A8442A',
    notRated: '#AFA898',
    monoGrad: 'linear-gradient(135deg,#E5DFCF,#D6CDB8)',
    monoInitial: 'rgba(168,68,42,.30)',
    thumbStripeA: '#E7E1D0',
    thumbStripeB: '#DED7C2',
    cardShadow: '0 22px 46px -28px rgba(28,26,20,.4)',
    bubbleShadow: '0 14px 34px -20px rgba(28,26,20,.35)',
    // kaki · sakura · matcha — the three tile tints.
    tileTint: '#F2E0C9',
    tileTint2: '#F3DBDC',
    tileTint3: '#E3E7D2',
    beenBg: '#E4EBD9',
    beenFg: '#455239',
    wantBg: '#F6E0D6',
    wantFg: '#96401F',
    avatar2: '#5F6B4C',
    avatar3: '#DFD8C6',
    segBg: '#1F1E1A',
    segFg: '#FAF8F2',
    segIdle: '#67625A',
    pBg: '#A8442A',
    pFg: '#FFFFFF',
    pIdle: '#67625A',
    ring: 'rgba(168,68,42,.22)',
    glow: 'rgba(168,68,42,.32)',
    skeleton: 'rgba(110,105,95,.14)',
    snackBg: '#1F1E1A',
    snackFg: '#F4F1E8',
    shadow1: '0 1px 3px rgba(31,30,26,.08)',
    shadow2: '0 8px 24px rgba(31,30,26,.12)',
    shadow3: '0 24px 60px rgba(31,30,26,.22)',
    mapBg: '#F4F1E8',
    mapGrid: 'rgba(140,132,112,.18)',
    mapWater: 'rgba(110,140,165,.25)',
    mapPark: 'rgba(150,168,128,.22)',
    pinBorder: '#ffffff',
    pinLabelBg: '#ffffff',
    pinLabelFg: '#1F1E1A',
    pinLabelBorder: '#E6E1D4',
  },
  dark: {
    // Sumi night — near-black with the faintest green-blue cast, so Supper
    // stays the same room as Daylight after dark.
    pageBg: '#121513',
    panelBg: '#191D1A',
    cardBg: '#212622',
    footerBg: '#0F1210',
    ink: '#EDE7DA',
    muted: '#95A08F',
    // 4.99:1 on cardBg — the previous #7E907E measured 4.40:1 there.
    faint: '#8B9686',
    chip: '#95A08F',
    border: 'rgba(237,231,218,.1)',
    borderSoft: 'rgba(237,231,218,.07)',
    borderStrong: 'rgba(237,231,218,.16)',
    divider: 'rgba(237,231,218,.12)',
    pillBorder: 'rgba(237,231,218,.14)',
    field: '#191D1A',
    fieldBorder: 'rgba(237,231,218,.16)',
    searchBg: '#212622',
    // Persimmon lit for night — the same hue as Daylight's accent, warmed.
    accent: '#E09248',
    accentHover: '#EDA45F',
    accentText: '#191D1A',
    ember: 'linear-gradient(135deg,#E5A05C,#C87A36)',
    secondary: '#9FCBA4',
    success: '#9FCBA4',
    error: '#E8857A',
    cost: '#9FCBA4',
    rating: '#E09248',
    notRated: '#6E7A6C',
    monoGrad: 'linear-gradient(135deg,#2A322B,#1A211C)',
    monoInitial: 'rgba(224,146,72,.30)',
    thumbStripeA: '#242B26',
    thumbStripeB: '#1D241F',
    cardShadow: '0 22px 46px -28px rgba(0,0,0,.6)',
    bubbleShadow: '0 14px 34px -20px rgba(0,0,0,.55)',
    tileTint: '#33291D',
    tileTint2: '#332528',
    tileTint3: '#293024',
    beenBg: '#23402E',
    beenFg: '#9FCBA4',
    wantBg: '#3A2A19',
    wantFg: '#E5A05C',
    avatar2: '#4E7458',
    avatar3: '#2E3B31',
    segBg: '#EDE7DA',
    segFg: '#191D1A',
    segIdle: '#8B9686',
    pBg: '#E09248',
    pFg: '#191D1A',
    pIdle: '#8B9686',
    ring: 'rgba(224,146,72,.3)',
    glow: 'rgba(224,146,72,.42)',
    skeleton: 'rgba(237,231,218,.08)',
    snackBg: '#EDE7DA',
    snackFg: '#212622',
    shadow1: '0 1px 3px rgba(0,0,0,.4)',
    shadow2: '0 8px 24px rgba(0,0,0,.45)',
    shadow3: '0 24px 60px rgba(0,0,0,.55)',
    mapBg: '#0F1210',
    mapGrid: 'rgba(150,170,130,.08)',
    mapWater: 'rgba(90,120,140,.18)',
    mapPark: 'rgba(120,150,110,.14)',
    pinBorder: '#191D1A',
    pinLabelBg: '#212622',
    pinLabelFg: '#EDE7DA',
    pinLabelBorder: 'rgba(237,231,218,.14)',
  },
};

/**
 * Washi "hero" treatment for marketing/auth — Daylight cream lit with the
 * faintest terracotta + amber washes, so the first impression is airy paper,
 * not a dark theatre. `glass` is now a plain white floating card (the old
 * translucent glassmorphism disappeared on light ground); the name is kept so
 * every consumer restyles in lockstep.
 */
export const heroTokens = {
  bg:
    'radial-gradient(120% 120% at 12% 8%, rgba(168,68,42,.08), transparent 46%),' +
    ' radial-gradient(110% 110% at 92% 96%, rgba(95,107,76,.10), transparent 52%), #F4F1E8',
  ink: '#1F1E1A',
  muted: '#67625A',
  glass: '#FFFFFF',
  glassBorder: '#E6E1D4',
  ember: 'linear-gradient(135deg,#B85536,#8E3722)',
};

/**
 * The semantic-token names the brand exposes as CSS custom properties, mapped to
 * the fields on ListTokens. This is the single mapping that produces tokens.css
 * (via brandCssVars) so the CSS layer is GENERATED from the same source as the
 * MUI theme — they can never drift apart.
 */
const CSS_VAR_MAP: [cssVar: string, token: keyof ListTokens][] = [
  ['--bg', 'pageBg'],
  ['--surface', 'panelBg'],
  ['--raised', 'cardBg'],
  ['--footer', 'footerBg'],
  ['--ink', 'ink'],
  ['--muted', 'muted'],
  ['--faint', 'faint'],
  ['--border', 'border'],
  ['--border-soft', 'borderSoft'],
  ['--border-strong', 'borderStrong'],
  ['--field', 'field'],
  ['--field-border', 'fieldBorder'],
  ['--search-bg', 'searchBg'],
  ['--accent', 'accent'],
  ['--accent-hover', 'accentHover'],
  ['--accent-text', 'accentText'],
  ['--ember', 'ember'],
  ['--secondary', 'secondary'],
  ['--success', 'success'],
  ['--error', 'error'],
  ['--rating', 'rating'],
  ['--cost', 'cost'],
  ['--not-rated', 'notRated'],
  ['--been-bg', 'beenBg'],
  ['--been-fg', 'beenFg'],
  ['--want-bg', 'wantBg'],
  ['--want-fg', 'wantFg'],
  ['--ring', 'ring'],
  ['--glow', 'glow'],
  ['--skeleton', 'skeleton'],
  ['--snack-bg', 'snackBg'],
  ['--snack-fg', 'snackFg'],
  ['--shadow-1', 'shadow1'],
  ['--shadow-2', 'shadow2'],
  ['--shadow-3', 'shadow3'],
  ['--card-shadow', 'cardShadow'],
  ['--bubble-shadow', 'bubbleShadow'],
  ['--tile-tint', 'tileTint'],
  ['--tile-tint-2', 'tileTint2'],
  ['--tile-tint-3', 'tileTint3'],
  ['--thumb-stripe-a', 'thumbStripeA'],
  ['--thumb-stripe-b', 'thumbStripeB'],
];

/**
 * Generate the brand's CSS custom properties for both modes, scoped to
 * [data-theme]. Inject once (see root.tsx); any element carrying
 * data-theme="light|dark" then exposes --accent, --surface, … to Tailwind /
 * Emotion / plain CSS. Derived from listTokens, so it tracks the MUI theme.
 */
export function brandCssVars(): string {
  const block = (mode: ListMode) =>
    CSS_VAR_MAP.map(([cssVar, token]) => `${cssVar}:${listTokens[mode][token]}`).join(';');
  const statics = '--radius:16px;--radius-card:22px;--radius-pill:999px;--space:4px';
  return (
    `:root,[data-theme="light"]{${block('light')};${statics}}` +
    `[data-theme="dark"]{${block('dark')}}`
  );
}

/**
 * Build an MUI theme for a brand mode. Used for the dashboard subtree (dialogs,
 * buttons, inputs, snackbars) and, via theme.ts, the public pages.
 *
 * Radius grammar (the bubbly system, kept disciplined so it never turns to
 * mush): interactive bubbles — buttons, chips, pills — are fully round;
 * containers — cards, dialogs — sit at 20–24; fields and menus at 16–18.
 */
export function makeListTheme(mode: ListMode): Theme {
  const t = listTokens[mode];

  return createTheme({
    palette: {
      mode,
      background: {
        default: t.pageBg,
        paper: t.cardBg,
      },
      primary: {
        main: t.accent,
        contrastText: t.accentText,
      },
      secondary: {
        main: t.secondary,
      },
      text: {
        primary: t.ink,
        secondary: t.muted,
        disabled: t.faint,
      },
      divider: t.border,
      error: { main: t.error },
      success: { main: t.success },
    },
    typography: {
      fontFamily: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'].join(
        ','
      ),
      // Display type is the serif, quiet (weight 400 only) — never bold the serif.
      h1: { fontFamily: ['Instrument Serif', 'serif'].join(','), fontWeight: 400 },
      h2: { fontFamily: ['Instrument Serif', 'serif'].join(','), fontWeight: 400 },
      h3: { fontFamily: ['Instrument Serif', 'serif'].join(','), fontWeight: 400 },
      h4: { fontFamily: ['Instrument Serif', 'serif'].join(','), fontWeight: 400 },
      // Sub-heads and controls speak in the rounded voice.
      h5: { fontFamily: roundedFont, fontWeight: 700 },
      h6: { fontFamily: roundedFont, fontWeight: 700 },
      button: {
        fontFamily: roundedFont,
        textTransform: 'none',
        fontWeight: 700,
      },
    },
    shape: {
      borderRadius: 16,
    },
    spacing: 4,
    components: {
      MuiButton: {
        styleOverrides: {
          root: ({ ownerState }) => ({
            borderRadius: 999,
            padding: '9px 20px',
            // The "squish": buttons compress a touch when pressed.
            transition: 'transform .12s ease, background-color .15s ease, border-color .15s ease',
            '&:active': { transform: 'scale(.97)' },
            // ≥44px tap target for primary actions; small buttons stay compact.
            ...(ownerState.size !== 'small' ? { minHeight: 44 } : {}),
          }),
          contained: {
            boxShadow: 'none',
            backgroundColor: t.accent,
            color: t.accentText,
            '&:hover': {
              boxShadow: 'none',
              backgroundColor: t.accentHover,
            },
          },
          outlined: {
            borderColor: t.borderStrong,
            color: t.ink,
            '&:hover': {
              borderColor: t.accent,
              backgroundColor: 'transparent',
            },
          },
          text: {
            color: t.accent,
            '&:hover': { backgroundColor: 'transparent' },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: t.panelBg,
            backgroundImage: 'none',
            border: `1px solid ${t.border}`,
            borderRadius: 22,
            boxShadow: t.shadow3,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 18,
            border: `1px solid ${t.border}`,
            boxShadow: t.shadow2,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 16,
              backgroundColor: t.field,
              '& fieldset': { borderColor: t.fieldBorder },
              '&:hover fieldset': { borderColor: t.borderStrong },
              '&.Mui-focused fieldset': { borderColor: t.accent },
            },
            '& .MuiInputLabel-root.Mui-focused': { color: t.accent },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 999, fontFamily: roundedFont, fontWeight: 500 },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 16 },
        },
      },
      MuiRating: {
        styleOverrides: {
          iconFilled: { color: t.rating },
          iconHover: { color: t.rating },
        },
      },
    },
  });
}
