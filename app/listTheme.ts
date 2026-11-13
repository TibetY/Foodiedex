import { createElement, createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, type Theme } from '@mui/material/styles';

/**
 * Single source of truth for the look, "Nocturne": a near-black dark mode the
 * design is led by, and a warm-paper light mode, each recolorable by an accent
 * (ember by default). These tokens drive every MUI component in the app AND (via
 * brandCssVars, injected once in root.tsx) the plain-CSS layer, so the two
 * can never drift apart.
 */
export type ListMode = 'light' | 'dark';
export type AccentName = 'ember' | 'matcha' | 'sakura' | 'peach';

/** What a visitor who has never chosen gets. */
export const DEFAULT_MODE: ListMode = 'dark';
export const DEFAULT_ACCENT: AccentName = 'ember';
const ACCENT_PATTERN = 'ember|matcha|sakura|peach';

const MODE_STORAGE_KEY = 'thelist.theme';
const ACCENT_STORAGE_KEY = 'thelist.accent';
/** Same preferences, mirrored into cookies so the SERVER can read them. */
export const THEME_COOKIE_KEY = 'thelist_theme';
export const ACCENT_COOKIE_KEY = 'thelist_accent';

/** The saved mode, or null when the visitor has never chosen one. Callers that
 *  want a value regardless should fall back to DEFAULT_MODE. */
export function readStoredMode(): ListMode | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(MODE_STORAGE_KEY);
  return v === 'dark' || v === 'light' ? v : null;
}

export function getStoredMode(): ListMode {
  return readStoredMode() ?? DEFAULT_MODE;
}

/**
 * Persist a preference to BOTH localStorage (the long-standing store) and a
 * cookie, because localStorage is invisible to the server: without the cookie
 * every SSR render guesses the defaults, and a sakura-light user watches the
 * page paint dark and then flip after hydration.
 */
function persist(storageKey: string, cookieKey: string, value: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, value);
  // Not httpOnly on purpose — the client owns this preference and writes it
  // directly; the server only needs to read it to render the right first paint.
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${cookieKey}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

export function storeMode(mode: ListMode): void {
  persist(MODE_STORAGE_KEY, THEME_COOKIE_KEY, mode);
}

/**
 * Read the mode a request carries, for use in loaders. Falls back to
 * DEFAULT_MODE, which matches getStoredMode() for a brand-new visitor.
 */
export function modeFromCookieHeader(cookieHeader: string | null): ListMode {
  const m = cookieHeader?.match(
    new RegExp(`(?:^|;\\s*)${THEME_COOKIE_KEY}=(light|dark)(?:;|$)`)
  );
  return (m?.[1] as ListMode) ?? DEFAULT_MODE;
}

/** The saved accent, or null when the visitor has never chosen one. */
export function readStoredAccent(): AccentName | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(ACCENT_STORAGE_KEY);
  return v === 'ember' || v === 'matcha' || v === 'sakura' || v === 'peach' ? v : null;
}

export function getStoredAccent(): AccentName {
  return readStoredAccent() ?? DEFAULT_ACCENT;
}

export function storeAccent(accent: AccentName): void {
  persist(ACCENT_STORAGE_KEY, ACCENT_COOKIE_KEY, accent);
}

/** Accent counterpart of modeFromCookieHeader, same fallback contract. */
export function accentFromCookieHeader(cookieHeader: string | null): AccentName {
  const m = cookieHeader?.match(
    new RegExp(`(?:^|;\\s*)${ACCENT_COOKIE_KEY}=(${ACCENT_PATTERN})(?:;|$)`)
  );
  return (m?.[1] as AccentName) ?? DEFAULT_ACCENT;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Per-accent colours for one mode: deep (the accent itself, readable as text
 *  on every surface), acc (its hover), tint/soft (fills), and optionally the
 *  text colour that sits on it. */
interface AccentColors {
  acc: string;
  deep: string;
  tint: string;
  soft: string;
  on?: string;
}

export const ACCENTS: Record<AccentName, { label: string; note: string; light: AccentColors; dark: AccentColors }> = {
  ember: {
    label: 'Ember',
    note: 'warm ember glow',
    light: { acc: '#8C3A18', deep: '#A3461F', tint: '#F6E6DD', soft: '#EBCDBD' },
    dark: { acc: '#F7C2A8', deep: '#F2A07B', tint: '#2E211B', soft: '#44291D', on: '#2A140A' },
  },
  matcha: {
    label: 'Matcha',
    note: 'soft matcha green',
    light: { acc: '#8FA477', deep: '#5B6E48', tint: '#EEF2E8', soft: '#DCE6D0' },
    dark: { acc: '#CFE0B8', deep: '#BCD1A0', tint: '#22271D', soft: '#3B452F' },
  },
  sakura: {
    label: 'Sakura',
    note: 'cherry blossom pink',
    light: { acc: '#D68484', deep: '#9B4F4F', tint: '#FBF0F0', soft: '#F3D3D3' },
    dark: { acc: '#F6D2D2', deep: '#EEB9B9', tint: '#2C2020', soft: '#46312F' },
  },
  peach: {
    label: 'Peach',
    note: 'pale peach',
    light: { acc: '#D9A273', deep: '#8A5A32', tint: '#FCF2E8', soft: '#F4DCC4' },
    dark: { acc: '#F5D9BE', deep: '#EDC49F', tint: '#2C231C', soft: '#47372B' },
  },
};

/** Neutral/paper tokens shared by every accent, per mode. */
const MODE_BASE: Record<
  ListMode,
  {
    onAcc: string;
    ink: string;
    ink60: string;
    ink45: string;
    ink25: string;
    paper: string;
    card: string;
    raised: string;
    glass: string;
    canvas: string;
    rule: string;
    hair: string;
    control: string;
    chip: string;
    track: string;
    rowHover: string;
    lift: string;
    liftLg: string;
    shadow1: string;
  }
> = {
  light: {
    onAcc: '#FFFFFF',
    ink: '#1B1714',
    // The ink ramp is held to WCAG AA against every surface text sits on — see
    // contrast.test.ts, which fails the build if any of these slip.
    ink60: '#6B6259',
    ink45: '#6B6259',
    // Carries the empty bubble in the rating picker and other component
    // boundaries: 3:1 (1.4.11).
    ink25: 'rgba(27,23,20,.5)',
    paper: '#F3EFEA',
    card: '#FFFFFF',
    raised: '#EDE7E0',
    glass: 'rgba(255,255,255,.78)',
    canvas: '#F3EFEA',
    rule: 'rgba(27,23,20,.14)',
    hair: 'rgba(27,23,20,.10)',
    // Input outlines are a component boundary, so they need 3:1 — the
    // decorative `hair` is a fraction of that.
    control: 'rgba(27,23,20,.55)',
    chip: '#EDE7E0',
    track: '#FFFFFF',
    rowHover: '#FAF7F3',
    lift: '0 1px 2px rgba(27,23,20,.04),0 10px 26px rgba(27,23,20,.06)',
    liftLg: '0 2px 4px rgba(27,23,20,.05),0 22px 50px rgba(27,23,20,.1)',
    shadow1: '0 1px 2px rgba(27,23,20,.08)',
  },
  dark: {
    onAcc: '#1B1714',
    ink: '#F6F0EA',
    ink60: '#ADA398',
    ink45: '#9C9288',
    ink25: 'rgba(246,240,234,.42)',
    paper: '#0E0C0B',
    card: '#1A1715',
    raised: '#2A2522',
    glass: 'rgba(26,23,21,.72)',
    canvas: '#0E0C0B',
    rule: 'rgba(246,240,234,.16)',
    hair: 'rgba(246,240,234,.12)',
    control: 'rgba(246,240,234,.45)',
    chip: '#2A2522',
    track: '#1A1715',
    rowHover: '#211D1A',
    lift: '0 1px 2px rgba(0,0,0,.3),0 10px 26px rgba(0,0,0,.34)',
    liftLg: '0 2px 4px rgba(0,0,0,.35),0 22px 50px rgba(0,0,0,.5)',
    shadow1: '0 1px 2px rgba(0,0,0,.2)',
  },
};

/** A fixed decorative fill (independent of the chosen accent) for the second
 *  avatar in a stack. */
const DECORATIVE = {
  peach: {
    light: { bg: '#F6DCC8', fg: '#8A5A32' },
    dark: { bg: '#47372B', fg: '#EDC49F' },
  },
};

export interface ListTokens {
  /** The page, and the body of full-screen sheets and dialogs. */
  pageBg: string;
  panelBg: string;
  /** "Surface": cards, rows, and the resting fill of every control. */
  cardBg: string;
  /** One step above the surface: the selected segment, tiles inside a card. */
  raised: string;
  /** Translucent surface for sheets and bars that float over content; pair it
   *  with a backdrop blur. */
  glass: string;
  /** The soft accent glow in the corner of photo-less cards and hero tiles. */
  halo: string;
  /** The accent as drawn over a photograph, which is always dark-scrimmed:
   *  the dark-mode accent, whichever mode the page is in. */
  onPhotoAccent: string;
  footerBg: string;
  ink: string;
  muted: string;
  faint: string;
  /** Chip/pill FILL (the design's --chip). Quiet pill text is `muted`. */
  chip: string;
  border: string;
  borderSoft: string;
  borderStrong: string;
  divider: string;
  pillBorder: string;
  hair: string;
  track: string;
  field: string;
  fieldBorder: string;
  searchBg: string;
  accent: string;
  accentHover: string;
  accentText: string;
  secondary: string;
  success: string;
  error: string;
  cost: string;
  rating: string;
  /** The empty-bubble outline in <Bubbles> — decorative (aria-hidden) only.
   *  Quiet text uses `faint`, which is held to the 4.5:1 AA minimum. */
  notRated: string;
  cardShadow: string;
  // Soft ambient "bubble" shadow for floating tiles/pills (gentler than cardShadow).
  bubbleShadow: string;
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
  glow: string;
  skeleton: string;
  snackBg: string;
  snackFg: string;
  rowHover: string;
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

/** Compose the full flat token set for one (accent, mode) pair. */
export function getListTokens(mode: ListMode, accent: AccentName): ListTokens {
  const b = MODE_BASE[mode];
  const a = ACCENTS[accent][mode];
  const peach = DECORATIVE.peach[mode];

  return {
    pageBg: b.canvas,
    panelBg: b.paper,
    cardBg: b.card,
    raised: b.raised,
    glass: b.glass,
    halo: hexToRgba(a.deep, mode === 'dark' ? 0.16 : 0.1),
    onPhotoAccent: ACCENTS[accent].dark.deep,
    footerBg: b.paper,
    ink: b.ink,
    muted: b.ink60,
    faint: b.ink45,
    chip: b.chip,
    border: b.hair,
    borderSoft: b.hair,
    borderStrong: b.control,
    divider: b.rule,
    pillBorder: b.hair,
    hair: b.hair,
    track: b.track,
    field: b.card,
    fieldBorder: b.control,
    searchBg: b.track,
    accent: a.deep,
    accentHover: a.acc,
    accentText: a.on ?? b.onAcc,
    secondary: a.acc,
    success: mode === 'light' ? '#3F6B43' : '#8FBF86',
    error: mode === 'light' ? '#A83E34' : '#E0857A',
    cost: b.ink60,
    rating: a.deep,
    notRated: b.ink25,
    cardShadow: b.lift,
    bubbleShadow: b.lift,
    beenBg: a.tint,
    beenFg: a.deep,
    // "Want to go" is a quiet neutral pill; the accent is kept for ratings and
    // the one primary action.
    wantBg: b.raised,
    wantFg: b.ink,
    avatar2: peach.bg,
    avatar3: a.soft,
    segBg: b.track,
    segFg: b.ink,
    segIdle: b.ink60,
    // Selected pills are ink, not accent: the accent is kept for the one primary
    // action on a screen and the rating bubbles.
    pBg: b.ink,
    pFg: b.paper,
    pIdle: b.ink60,
    ring: hexToRgba(a.deep, 0.22),
    glow: hexToRgba(a.deep, 0.32),
    skeleton: hexToRgba(b.ink, 0.08),
    snackBg: b.ink,
    snackFg: b.paper,
    rowHover: b.rowHover,
    shadow1: b.shadow1,
    shadow2: b.lift,
    shadow3: b.liftLg,
    mapBg: b.canvas,
    mapGrid: hexToRgba(b.ink, 0.08),
    mapWater: mode === 'light' ? 'rgba(120,150,170,.22)' : 'rgba(90,120,140,.18)',
    mapPark: a.tint,
    pinBorder: b.paper,
    pinLabelBg: b.card,
    pinLabelFg: b.ink,
    pinLabelBorder: b.hair,
  };
}

/**
 * The soft accent glow in the top-right corner of a surface: cards, sheets,
 * dialogs and menus. `base` is the surface colour under it.
 */
export function haloSx(t: ListTokens, base: string = t.cardBg) {
  return {
    backgroundColor: base,
    backgroundImage: `radial-gradient(120% 100% at 100% 0%, ${t.halo} 0%, transparent 62%)`,
  } as const;
}

/** Swatches + copy for the Account page's accent picker cards. */
export function accentSwatch(name: AccentName, mode: ListMode) {
  const meta = ACCENTS[name];
  const p = meta[mode];
  return { name, label: meta.label, note: meta.note, c1: p.deep, c2: p.acc, c3: p.soft };
}

const CSS_VAR_MAP: [cssVar: string, token: keyof ListTokens][] = [
  ['--bg', 'pageBg'],
  ['--surface', 'panelBg'],
  ['--raised', 'raised'],
  ['--card', 'cardBg'],
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
];

const ALL_MODES: ListMode[] = ['light', 'dark'];
const ALL_ACCENTS: AccentName[] = ['ember', 'matcha', 'sakura', 'peach'];

/**
 * Generate the brand's CSS custom properties for every (mode, accent) pair,
 * scoped to [data-theme][data-accent]. Injected once in root.tsx; the
 * KanpaiThemeProvider stamps those attributes on <html> so the whole app —
 * including plain-CSS bits outside MUI's reach — repaints together. Default
 * (`:root`) is the dark, ember look.
 */
export function brandCssVars(): string {
  const block = (mode: ListMode, accent: AccentName) => {
    const t = getListTokens(mode, accent);
    return CSS_VAR_MAP.map(([cssVar, token]) => `${cssVar}:${t[token]}`).join(';');
  };
  const statics = '--radius:22px;--radius-control:16px;--radius-pill:999px;--space:4px';
  const rules: string[] = [`:root{${block(DEFAULT_MODE, DEFAULT_ACCENT)};${statics}}`];
  for (const mode of ALL_MODES) {
    for (const accent of ALL_ACCENTS) {
      rules.push(`[data-theme="${mode}"][data-accent="${accent}"]{${block(mode, accent)}}`);
    }
  }
  return rules.join('');
}

/**
 * The type scale for running text. Titles step up from here (24 for a card or
 * sheet title, 34 for the one page title), and big numerals and monograms are
 * set light (300). Inputs stay at 16px on phones so iOS does not zoom the page
 * on focus.
 */
export const TYPE = {
  /** Labels, counts, captions. */
  caption: 13,
  /** Secondary text: meta lines, controls, table cells. */
  body: 14,
  /** Primary text: names, notes, link rows. */
  bodyLg: 16,
  /** Card and sheet titles. */
  title: 24,
  /** One per screen: the page name. */
  display: 34,
} as const;

/** The one typeface. */
export const FONT = ['Manrope', 'system-ui', '-apple-system', 'sans-serif'].join(',');

/**
 * Corner radii: soft and large. Buttons, chips and toggles are full pills;
 * cards and sheets 28; rows and grouped blocks 22; thumbnails and text fields 16.
 */
export const RADIUS = { thumb: 16, control: 16, surface: 22, card: 28, dialog: 28, pill: 999 } as const;

/** Build the MUI theme for one (mode, accent) pair — Manrope on the TYPE
 *  scale, RADIUS corners, flat surfaces. */
export function makeListTheme(mode: ListMode, accent: AccentName): Theme {
  const t = getListTokens(mode, accent);

  return createTheme({
    palette: {
      mode,
      background: { default: t.pageBg, paper: t.cardBg },
      primary: { main: t.accent, contrastText: t.accentText },
      secondary: { main: t.secondary },
      text: { primary: t.ink, secondary: t.muted, disabled: t.faint },
      divider: t.border,
      error: { main: t.error },
      success: { main: t.success },
    },
    typography: {
      fontFamily: FONT,
      h1: { fontWeight: 600, letterSpacing: '-.04em' },
      h2: { fontWeight: 600, letterSpacing: '-.04em' },
      h3: { fontWeight: 600, letterSpacing: '-.04em' },
      h4: { fontWeight: 600, letterSpacing: '-.04em' },
      h5: { fontWeight: 600, letterSpacing: '-.03em' },
      h6: { fontWeight: 600, letterSpacing: '-.03em' },
      body1: { fontSize: TYPE.bodyLg },
      body2: { fontSize: TYPE.body },
      caption: { fontSize: TYPE.caption },
      subtitle1: { fontSize: TYPE.bodyLg },
      subtitle2: { fontSize: TYPE.body, fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600, fontSize: TYPE.body },
    },
    shape: { borderRadius: RADIUS.surface },
    spacing: 4,
    components: {
      // MUI's ButtonBase resets `outline: 0`, which beats the global
      // *:focus-visible rule in tailwind.css — so every Button, IconButton,
      // Tab and MenuItem had NO visible keyboard focus indicator (WCAG 2.4.7).
      // Restoring it here keeps the ring on the same accent as everything else.
      MuiButtonBase: {
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': {
              outline: `2px solid ${t.accent}`,
              outlineOffset: '2px',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: ({ ownerState }) => ({
            borderRadius: RADIUS.pill,
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
            '&:hover': { boxShadow: 'none', backgroundColor: t.accentHover },
          },
          outlined: {
            // The quiet button is a filled surface pill, not an outline.
            border: 'none',
            backgroundColor: t.cardBg,
            color: t.ink,
            '&:hover': { border: 'none', backgroundColor: t.raised },
          },
          text: {
            color: t.accent,
            '&:hover': { backgroundColor: 'transparent' },
          },
        },
      },
      // Dark-mode MUI lightens raised Paper with a gradient overlay; the
      // surfaces here are set by token instead.
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      // Anything modal blurs the page behind it, so sheets and dialogs read as
      // glass laid over the list. Menus and popovers keep an invisible backdrop.
      MuiBackdrop: {
        styleOverrides: {
          root: ({ ownerState }) =>
            ownerState.invisible
              ? {}
              : {
                  backgroundColor: mode === 'dark' ? 'rgba(0,0,0,.45)' : 'rgba(27,23,20,.28)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            ...haloSx(t, t.panelBg),
            borderRadius: RADIUS.dialog,
            boxShadow: `0 0 0 1px ${t.border}, ${t.shadow3}`,
          },
          // A full-screen dialog fills the phone; rounded corners would show the
          // page behind them at the screen edges.
          paperFullScreen: { borderRadius: 0 },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: RADIUS.surface,
            ...haloSx(t),
            boxShadow: `0 0 0 1px ${t.border}, ${t.shadow2}`,
          },
          list: { padding: 6 },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            minHeight: 44,
            '&.Mui-selected, &.Mui-selected:hover': { backgroundColor: t.raised },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: RADIUS.control,
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
        styleOverrides: { root: { borderRadius: RADIUS.pill, fontWeight: 600 } },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: RADIUS.control } },
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

interface KanpaiThemeState {
  mode: ListMode;
  accent: AccentName;
  tokens: ListTokens;
  muiTheme: Theme;
  setMode: (m: ListMode) => void;
  setAccent: (a: AccentName) => void;
}

const KanpaiThemeContext = createContext<KanpaiThemeState | null>(null);

/**
 * Global theme provider — holds the user's mode+accent preference, persists
 * it, applies the MUI theme, and stamps data-theme/data-accent on <html> so
 * every plain-CSS consumer (via brandCssVars) repaints in lockstep. Mounted
 * once in root.tsx, SEEDED from the request's cookies (root's loader) so the
 * server renders the right look on first paint — no flash. Any route reads it
 * back with useKanpaiTheme().
 */
export function KanpaiThemeProvider({
  children,
  initialMode = DEFAULT_MODE,
  initialAccent = DEFAULT_ACCENT,
}: {
  children: ReactNode;
  initialMode?: ListMode;
  initialAccent?: AccentName;
}) {
  const [mode, setModeState] = useState<ListMode>(initialMode);
  const [accent, setAccentState] = useState<AccentName>(initialAccent);

  // Reconcile once with localStorage, for visitors who saved a preference
  // before the cookies existed. storeMode/storeAccent then write the cookie,
  // so later loads are server-rendered right and this effect becomes a no-op.
  //
  // Only an ACTUAL saved value may override the cookie the server rendered
  // from: read*Stored* returns null when nothing was ever chosen, and treating
  // that absence as the default would clobber a real cookie preference on
  // any browser whose localStorage is empty (a cleared site-data profile, a
  // restored cookie jar) and flip the page back to the default after paint.
  useEffect(() => {
    const storedMode = readStoredMode();
    const storedAccent = readStoredAccent();
    if (storedMode && storedMode !== initialMode) {
      setModeState(storedMode);
      storeMode(storedMode);
    }
    if (storedAccent && storedAccent !== initialAccent) {
      setAccentState(storedAccent);
      storeAccent(storedAccent);
    }
    // Seed values are per-mount request snapshots; run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.setAttribute('data-accent', accent);
  }, [mode, accent]);

  const setMode = (m: ListMode) => {
    setModeState(m);
    storeMode(m);
  };
  const setAccent = (a: AccentName) => {
    setAccentState(a);
    storeAccent(a);
  };

  const tokens = useMemo(() => getListTokens(mode, accent), [mode, accent]);
  const muiTheme = useMemo(() => makeListTheme(mode, accent), [mode, accent]);
  const value = useMemo(
    () => ({ mode, accent, tokens, muiTheme, setMode, setAccent }),
    [mode, accent, tokens, muiTheme]
  );

  return createElement(
    KanpaiThemeContext.Provider,
    { value },
    createElement(MuiThemeProvider, { theme: muiTheme }, children)
  );
}

export function useKanpaiTheme(): KanpaiThemeState {
  const ctx = useContext(KanpaiThemeContext);
  if (!ctx) throw new Error('useKanpaiTheme must be used within a KanpaiThemeProvider');
  return ctx;
}
