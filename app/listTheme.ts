import { createElement, createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, type Theme } from '@mui/material/styles';

/**
 * Single source of truth for the Kanpai brand: a warm-paper "Daylight" (light)
 * mode and a charcoal "Supper" (dark) mode, each recolorable by one of three
 * accents. These tokens drive every MUI component in the app AND (via
 * brandCssVars, injected once in root.tsx) the plain-CSS layer, so the two
 * can never drift apart.
 */
export type ListMode = 'light' | 'dark';
export type AccentName = 'matcha' | 'sakura' | 'peach';

const MODE_STORAGE_KEY = 'thelist.theme';
const ACCENT_STORAGE_KEY = 'thelist.accent';
/** Same preferences, mirrored into cookies so the SERVER can read them. */
export const THEME_COOKIE_KEY = 'thelist_theme';
export const ACCENT_COOKIE_KEY = 'thelist_accent';

/** The saved mode, or null when the visitor has never chosen one. Callers that
 *  want a value regardless should fall back to 'light'. */
export function readStoredMode(): ListMode | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(MODE_STORAGE_KEY);
  return v === 'dark' || v === 'light' ? v : null;
}

export function getStoredMode(): ListMode {
  return readStoredMode() ?? 'light';
}

/**
 * Persist a preference to BOTH localStorage (the long-standing store) and a
 * cookie, because localStorage is invisible to the server: without the cookie
 * every SSR render guesses light/matcha, and a sakura-dark user watches the
 * page paint in daylight and then flip after hydration.
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
 * Read the mode a request carries, for use in loaders. Falls back to light,
 * which matches getStoredMode()'s default for a brand-new visitor.
 */
export function modeFromCookieHeader(cookieHeader: string | null): ListMode {
  const m = cookieHeader?.match(
    new RegExp(`(?:^|;\\s*)${THEME_COOKIE_KEY}=(light|dark)(?:;|$)`)
  );
  return (m?.[1] as ListMode) ?? 'light';
}

/** The saved accent, or null when the visitor has never chosen one. */
export function readStoredAccent(): AccentName | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(ACCENT_STORAGE_KEY);
  return v === 'matcha' || v === 'sakura' || v === 'peach' ? v : null;
}

export function getStoredAccent(): AccentName {
  return readStoredAccent() ?? 'matcha';
}

export function storeAccent(accent: AccentName): void {
  persist(ACCENT_STORAGE_KEY, ACCENT_COOKIE_KEY, accent);
}

/** Accent counterpart of modeFromCookieHeader, same fallback contract. */
export function accentFromCookieHeader(cookieHeader: string | null): AccentName {
  const m = cookieHeader?.match(
    new RegExp(`(?:^|;\\s*)${ACCENT_COOKIE_KEY}=(matcha|sakura|peach)(?:;|$)`)
  );
  return (m?.[1] as AccentName) ?? 'matcha';
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Per-accent color pair (light/dark), lifted from the Kanpai design's own
 *  THEMES table: acc (bright) + deep (readable-on-paper) + tint/soft (fills). */
interface AccentColors {
  acc: string;
  deep: string;
  tint: string;
  soft: string;
}

export const ACCENTS: Record<AccentName, { label: string; note: string; light: AccentColors; dark: AccentColors }> = {
  matcha: {
    label: 'Matcha',
    note: 'soft matcha green',
    light: { acc: '#8FA477', deep: '#5B6E48', tint: '#EEF2E8', soft: '#DCE6D0' },
    dark: { acc: '#A8C08A', deep: '#BCD1A0', tint: '#2A2F24', soft: '#3B452F' },
  },
  sakura: {
    label: 'Sakura',
    note: 'cherry blossom pink',
    light: { acc: '#D68484', deep: '#9B4F4F', tint: '#FBF0F0', soft: '#F3D3D3' },
    dark: { acc: '#E5A3A3', deep: '#EEB9B9', tint: '#332626', soft: '#46312F' },
  },
  peach: {
    label: 'Peach',
    note: 'pale peach',
    light: { acc: '#D9A273', deep: '#8A5A32', tint: '#FCF2E8', soft: '#F4DCC4' },
    dark: { acc: '#E0B189', deep: '#EDC49F', tint: '#332921', soft: '#47372B' },
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
    canvas: string;
    rule: string;
    hair: string;
    chip: string;
    track: string;
    rowHover: string;
    lift: string;
    liftLg: string;
    shadow1: string;
  }
> = {
  light: {
    onAcc: '#FDFBF7',
    ink: '#2B2B2B',
    ink60: 'rgba(43,43,43,.6)',
    ink45: 'rgba(43,43,43,.45)',
    ink25: 'rgba(43,43,43,.25)',
    paper: '#FDFBF7',
    card: '#FFFFFF',
    canvas: '#F0EDE6',
    rule: 'rgba(43,43,43,.14)',
    hair: 'rgba(43,43,43,.08)',
    chip: '#F4F1EA',
    track: '#F2EFE9',
    rowHover: '#FAF7F1',
    lift: '0 1px 2px rgba(43,43,43,.04),0 10px 26px rgba(43,43,43,.055)',
    liftLg: '0 2px 4px rgba(43,43,43,.05),0 22px 50px rgba(43,43,43,.09)',
    shadow1: '0 1px 2px rgba(43,43,43,.04)',
  },
  dark: {
    onAcc: '#1B1A18',
    ink: '#F0EDE6',
    ink60: 'rgba(240,237,230,.62)',
    ink45: 'rgba(240,237,230,.45)',
    ink25: 'rgba(240,237,230,.22)',
    paper: '#201F1D',
    card: '#292724',
    canvas: '#171614',
    rule: 'rgba(240,237,230,.16)',
    hair: 'rgba(240,237,230,.09)',
    chip: '#302E2A',
    track: '#302E2A',
    rowHover: '#262421',
    lift: '0 1px 2px rgba(0,0,0,.3),0 10px 26px rgba(0,0,0,.34)',
    liftLg: '0 2px 4px rgba(0,0,0,.35),0 22px 50px rgba(0,0,0,.5)',
    shadow1: '0 1px 2px rgba(0,0,0,.3)',
  },
};

/** Fixed decorative pair (independent of the chosen accent) used for the
 *  "want to go" pill and the logo's third dot — mirrors the design's own
 *  static --sakura/--peach root vars, which never change with the picker. */
const DECORATIVE = {
  sakura: {
    light: { bg: '#F3C9C9', fg: '#9B4F4F' },
    dark: { bg: '#46312F', fg: '#EEB9B9' },
  },
  peach: {
    light: { bg: '#F6DCC8', fg: '#8A5A32' },
    dark: { bg: '#47372B', fg: '#EDC49F' },
  },
};

export interface ListTokens {
  pageBg: string;
  panelBg: string;
  cardBg: string;
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
  monoGrad: string;
  monoInitial: string;
  thumbStripeA: string;
  thumbStripeB: string;
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
  const sakura = DECORATIVE.sakura[mode];
  const peach = DECORATIVE.peach[mode];

  return {
    pageBg: b.canvas,
    panelBg: b.paper,
    cardBg: b.card,
    footerBg: b.paper,
    ink: b.ink,
    muted: b.ink60,
    faint: b.ink45,
    chip: b.chip,
    border: b.hair,
    borderSoft: b.hair,
    borderStrong: b.rule,
    divider: b.rule,
    pillBorder: b.hair,
    hair: b.hair,
    track: b.track,
    field: b.card,
    fieldBorder: b.hair,
    searchBg: b.track,
    accent: a.deep,
    accentHover: a.acc,
    accentText: b.onAcc,
    secondary: a.acc,
    success: mode === 'light' ? '#4C7A4F' : '#8FBF86',
    error: mode === 'light' ? '#B3453A' : '#E0857A',
    cost: b.ink60,
    rating: a.deep,
    notRated: b.ink25,
    monoGrad: `linear-gradient(135deg,${a.tint},${a.soft})`,
    monoInitial: hexToRgba(a.deep, 0.3),
    thumbStripeA: a.tint,
    thumbStripeB: a.soft,
    cardShadow: b.lift,
    bubbleShadow: b.lift,
    // accent tint · sakura · peach — the three tile tints, in the current mode.
    tileTint: a.tint,
    tileTint2: sakura.bg,
    tileTint3: peach.bg,
    beenBg: a.tint,
    beenFg: a.deep,
    wantBg: sakura.bg,
    wantFg: sakura.fg,
    avatar2: peach.bg,
    avatar3: a.soft,
    segBg: b.track,
    segFg: b.ink,
    segIdle: b.ink60,
    pBg: a.deep,
    pFg: b.onAcc,
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

/** Swatches + copy for the Account page's accent picker cards. */
export function accentSwatch(name: AccentName, mode: ListMode) {
  const meta = ACCENTS[name];
  const p = meta[mode];
  return { name, label: meta.label, note: meta.note, c1: p.deep, c2: p.acc, c3: p.soft };
}

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

const ALL_MODES: ListMode[] = ['light', 'dark'];
const ALL_ACCENTS: AccentName[] = ['matcha', 'sakura', 'peach'];

/**
 * Generate the brand's CSS custom properties for every (mode, accent) pair,
 * scoped to [data-theme][data-accent]. Injected once in root.tsx; the
 * KanpaiThemeProvider stamps those attributes on <html> so the whole app —
 * including plain-CSS bits outside MUI's reach — repaints together. Default
 * (`:root`) is light/matcha, the brand's daylight look.
 */
export function brandCssVars(): string {
  const block = (mode: ListMode, accent: AccentName) => {
    const t = getListTokens(mode, accent);
    return CSS_VAR_MAP.map(([cssVar, token]) => `${cssVar}:${t[token]}`).join(';');
  };
  const statics = '--radius:20px;--radius-pill:999px;--space:4px';
  const rules: string[] = [`:root{${block('light', 'matcha')};${statics}}`];
  for (const mode of ALL_MODES) {
    for (const accent of ALL_ACCENTS) {
      rules.push(`[data-theme="${mode}"][data-accent="${accent}"]{${block(mode, accent)}}`);
    }
  }
  return rules.join('');
}

/** Build the MUI theme for one (mode, accent) pair — Archivo type, pill
 *  buttons, large-radius surfaces, per the Kanpai design system. */
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
      fontFamily: ['Archivo', 'system-ui', '-apple-system', 'sans-serif'].join(','),
      h1: { fontWeight: 600, letterSpacing: '-.022em' },
      h2: { fontWeight: 600, letterSpacing: '-.022em' },
      h3: { fontWeight: 600, letterSpacing: '-.022em' },
      h4: { fontWeight: 600, letterSpacing: '-.022em' },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 16 },
    spacing: 4,
    components: {
      MuiButton: {
        styleOverrides: {
          root: ({ ownerState }) => ({
            borderRadius: 999,
            padding: '9px 18px',
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
            borderColor: t.borderStrong,
            color: t.ink,
            '&:hover': { borderColor: t.accent, backgroundColor: 'transparent' },
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
          paper: { borderRadius: 16, border: `1px solid ${t.border}`, boxShadow: t.shadow2 },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 14,
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
        styleOverrides: { root: { borderRadius: 999, fontWeight: 500 } },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 14 } },
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
  initialMode = 'light',
  initialAccent = 'matcha',
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
  // that absence as "light/matcha" would clobber a real cookie preference on
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
