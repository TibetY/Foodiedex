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

<<<<<<< HEAD
const MODE_STORAGE_KEY = 'thelist.theme';
const ACCENT_STORAGE_KEY = 'thelist.accent';
const LAYOUT_STORAGE_KEY = 'thelist.dashboardLayout';
=======
/**
 * The "bubbly" UI voice: Zen Maru Gothic — a rounded gothic drawn for Japanese
 * type, so the softness comes from the same tradition as the rest of the theme
 * rather than being borrowed from a Western geometric. Used for labels,
 * buttons, chips and pills; dense body/meta text stays DM Sans and display
 * stays Instrument Serif.
 */
export const roundedFont = "'Zen Maru Gothic','DM Sans',system-ui,sans-serif";

const THEME_STORAGE_KEY = 'thelist.theme';
/** Same preference, mirrored into a cookie so the SERVER can read it. */
export const THEME_COOKIE_KEY = 'thelist_theme';
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9

export function getStoredMode(): ListMode {
  if (typeof window === 'undefined') return 'light';
  const v = window.localStorage.getItem(MODE_STORAGE_KEY);
  return v === 'dark' || v === 'light' ? v : 'light';
}

<<<<<<< HEAD
export function storeMode(mode: ListMode): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(MODE_STORAGE_KEY, mode);
=======
/**
 * Persist the theme preference. Written to BOTH localStorage (the long-standing
 * store) and a cookie, because localStorage is invisible to the server: without
 * the cookie every SSR render guesses "light", and a Supper user watches the
 * page paint in Daylight and then flip after mount.
 */
export function storeMode(mode: ListMode): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  // Not httpOnly on purpose — the client owns this preference and writes it
  // directly; the server only needs to read it to render the right first paint.
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${THEME_COOKIE_KEY}=${mode}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
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
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
}

export function getStoredAccent(): AccentName {
  if (typeof window === 'undefined') return 'matcha';
  const v = window.localStorage.getItem(ACCENT_STORAGE_KEY);
  return v === 'matcha' || v === 'sakura' || v === 'peach' ? v : 'matcha';
}

export function storeAccent(accent: AccentName): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(ACCENT_STORAGE_KEY, accent);
}

export type DashboardLayout = 'grid' | 'rows' | 'table';

export function getStoredDashboardLayout(): DashboardLayout {
  if (typeof window === 'undefined') return 'grid';
  const v = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
  return v === 'grid' || v === 'rows' || v === 'table' ? v : 'grid';
}

export function storeDashboardLayout(layout: DashboardLayout): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
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
  /** The pale empty-star wash in <Stars> — decorative (aria-hidden) only.
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

<<<<<<< HEAD
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
    mapPark: mode === 'light' ? `${a.tint}` : `${a.tint}`,
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
=======
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
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9

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

<<<<<<< HEAD
const ALL_MODES: ListMode[] = ['light', 'dark'];
const ALL_ACCENTS: AccentName[] = ['matcha', 'sakura', 'peach'];

/**
 * Generate the brand's CSS custom properties for every (mode, accent) pair,
 * scoped to [data-theme][data-accent]. Injected once in root.tsx; the
 * KanpaiThemeProvider stamps those attributes on <html> so the whole app —
 * including plain-CSS bits outside MUI's reach — repaints together. Default
 * (`:root`) is light/matcha, the brand's daylight look.
=======
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
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
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
<<<<<<< HEAD
      fontFamily: ['Archivo', 'system-ui', '-apple-system', 'sans-serif'].join(','),
      h1: { fontWeight: 600, letterSpacing: '-.022em' },
      h2: { fontWeight: 600, letterSpacing: '-.022em' },
      h3: { fontWeight: 600, letterSpacing: '-.022em' },
      h4: { fontWeight: 600, letterSpacing: '-.022em' },
      button: { textTransform: 'none', fontWeight: 600 },
=======
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
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
    },
    shape: { borderRadius: 16 },
    spacing: 4,
    components: {
      MuiButton: {
        styleOverrides: {
          root: ({ ownerState }) => ({
            borderRadius: 999,
<<<<<<< HEAD
            padding: '9px 18px',
=======
            padding: '9px 20px',
            // The "squish": buttons compress a touch when pressed.
            transition: 'transform .12s ease, background-color .15s ease, border-color .15s ease',
            '&:active': { transform: 'scale(.97)' },
            // ≥44px tap target for primary actions; small buttons stay compact.
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
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
<<<<<<< HEAD
          paper: { borderRadius: 16, border: `1px solid ${t.border}`, boxShadow: t.shadow2 },
=======
          paper: {
            borderRadius: 18,
            border: `1px solid ${t.border}`,
            boxShadow: t.shadow2,
          },
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
<<<<<<< HEAD
              borderRadius: 14,
=======
              borderRadius: 16,
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
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
<<<<<<< HEAD
        styleOverrides: { root: { borderRadius: 999, fontWeight: 500 } },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 14 } },
=======
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
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
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
 * once in root.tsx; any route reads it back with useKanpaiTheme().
 */
export function KanpaiThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ListMode>('light');
  const [accent, setAccentState] = useState<AccentName>('matcha');

  useEffect(() => {
    setModeState(getStoredMode());
    setAccentState(getStoredAccent());
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
