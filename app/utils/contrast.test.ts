import { describe, it, expect } from 'vitest';
import { getListTokens, type AccentName, type ListMode, type ListTokens } from '~/listTheme';

/**
 * Contrast floor for the brand palette.
 *
 * Every colour pair the UI actually puts together is checked here rather than
 * spot-checked in review, because these tokens are used on hundreds of
 * elements — one failing token is hundreds of failing elements in an automated
 * audit. WCAG 2.1 AA: 4.5:1 for body text, 3:1 for large text (>=24px, or
 * >=18.66px bold) and for the boundary of interactive components.
 */

type Rgb = [number, number, number];

function parse(color: string): { rgb: Rgb; alpha: number } {
  const hex = color.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], alpha: 1 };
  }
  const rgba = color.trim().match(/^rgba?\(([^)]+)\)$/i);
  if (rgba) {
    const parts = rgba[1].split(',').map((p) => parseFloat(p.trim()));
    return { rgb: [parts[0], parts[1], parts[2]], alpha: parts[3] ?? 1 };
  }
  throw new Error(`Unsupported colour: ${color}`);
}

/** Composite a possibly-translucent foreground over an opaque background. */
function flatten(fg: string, bg: string): Rgb {
  const f = parse(fg);
  const b = parse(bg);
  if (b.alpha !== 1) throw new Error(`Background must be opaque: ${bg}`);
  return f.rgb.map((c, i) => c * f.alpha + b.rgb[i] * (1 - f.alpha)) as Rgb;
}

function luminance([r, g, b]: Rgb): number {
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** WCAG contrast ratio of `fg` (alpha allowed) against opaque `bg`. */
export function contrast(fg: string, bg: string): number {
  const a = luminance(flatten(fg, bg));
  const b = luminance(parse(bg).rgb);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

const MODES: ListMode[] = ['light', 'dark'];
const ACCENTS: AccentName[] = ['matcha', 'sakura', 'peach'];

/** The surfaces text is actually painted on. */
function surfaces(t: ListTokens): { name: string; bg: string }[] {
  return [
    { name: 'pageBg', bg: t.pageBg },
    { name: 'panelBg', bg: t.panelBg },
    { name: 'cardBg', bg: t.cardBg },
  ];
}

describe('brand palette contrast (WCAG AA)', () => {
  for (const mode of MODES) {
    for (const accent of ACCENTS) {
      const t = getListTokens(mode, accent);
      const label = `${mode}/${accent}`;

      it(`${label}: body text tokens clear 4.5:1 on every surface`, () => {
        const failures: string[] = [];
        for (const { name, bg } of surfaces(t)) {
          for (const token of ['ink', 'muted', 'faint'] as const) {
            const ratio = contrast(t[token], bg);
            if (ratio < 4.5) failures.push(`${token} on ${name}: ${ratio}`);
          }
        }
        expect(failures).toEqual([]);
      });

      it(`${label}: accent text clears 4.5:1 on every surface`, () => {
        const failures: string[] = [];
        for (const { name, bg } of surfaces(t)) {
          for (const token of ['accent', 'error', 'success'] as const) {
            const ratio = contrast(t[token], bg);
            if (ratio < 4.5) failures.push(`${token} on ${name}: ${ratio}`);
          }
        }
        expect(failures).toEqual([]);
      });

      it(`${label}: text on filled pills clears 4.5:1`, () => {
        const pairs: [string, string, string][] = [
          ['accentText on accent', t.accentText, t.accent],
          ['pFg on pBg', t.pFg, t.pBg],
          ['beenFg on beenBg', t.beenFg, t.beenBg],
          ['wantFg on wantBg', t.wantFg, t.wantBg],
          ['snackFg on snackBg', t.snackFg, t.snackBg],
          ['muted on chip', t.muted, t.chip],
          ['ink on track', t.ink, t.track],
          ['muted on track', t.muted, t.track],
          ['muted on searchBg', t.muted, t.searchBg],
          ['ink on field', t.ink, t.field],
        ];
        const failures = pairs
          .map(([name, fg, bg]) => [name, contrast(fg, bg)] as const)
          .filter(([, ratio]) => ratio < 4.5)
          .map(([name, ratio]) => `${name}: ${ratio}`);
        expect(failures).toEqual([]);
      });

      it(`${label}: non-text boundaries clear 3:1`, () => {
        const pairs: [string, string, string][] = [
          // The empty bubble outline carries the rating's meaning.
          ['notRated on cardBg', t.notRated, t.cardBg],
          ['notRated on panelBg', t.notRated, t.panelBg],
          // Input borders and the focus ring.
          ['fieldBorder on field', t.fieldBorder, t.field],
          ['borderStrong on cardBg', t.borderStrong, t.cardBg],
        ];
        const failures = pairs
          .map(([name, fg, bg]) => [name, contrast(fg, bg)] as const)
          .filter(([, ratio]) => ratio < 3)
          .map(([name, ratio]) => `${name}: ${ratio}`);
        expect(failures).toEqual([]);
      });
    }
  }
});
