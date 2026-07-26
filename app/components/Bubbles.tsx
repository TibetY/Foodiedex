import Box from '@mui/material/Box';
import type { ListTokens } from '~/listTheme';

interface BubblesProps {
  /** 0–5, may be fractional (ratings are stored at 0.5 precision) — rounds to
   *  the nearest whole bubble for the fill count; callers print the exact
   *  decimal alongside (e.g. "4.3 avg"). */
  value: number;
  tokens: ListTokens;
  size?: number;
  gap?: number;
  max?: number;
}

/** Read-only bubble rating: `max` small circles, filled solid up to the
 *  rounded value, outlined after. */
export default function Bubbles({ value, tokens: t, size = 12, gap = 5, max = 5 }: BubblesProps) {
  const rounded = Math.round(Math.max(0, Math.min(max, value || 0)));
  return (
    <Box
      role="img"
      aria-label={`${value} / ${max}`}
      sx={{ display: 'inline-flex', alignItems: 'center', gap: `${gap}px`, verticalAlign: 'middle' }}
    >
      {Array.from({ length: max }, (_, i) => (
        <Box
          key={i}
          aria-hidden
          sx={{
            width: size,
            height: size,
            flex: 'none',
            borderRadius: '50%',
            boxSizing: 'border-box',
            background: i < rounded ? t.rating : 'transparent',
            border: i < rounded ? 'none' : `1.5px solid ${t.notRated}`,
          }}
        />
      ))}
    </Box>
  );
}

interface BubbleInputProps {
  value: number;
  onChange: (value: number) => void;
  tokens: ListTokens;
  size?: number;
  gap?: number;
  max?: number;
  ariaLabel: string;
}

/** Clickable bubble picker for rating input — whole-bubble precision.
 *  Clicking the bubble that already sets the current value clears one step
 *  back, so the control can be dialed all the way down to "not rated". */
export function BubbleInput({ value, onChange, tokens: t, size = 22, gap = 9, max = 5, ariaLabel }: BubbleInputProps) {
  const rounded = Math.round(Math.max(0, Math.min(max, value || 0)));
  return (
    <Box role="group" aria-label={ariaLabel} sx={{ display: 'inline-flex', alignItems: 'center', gap: `${gap}px` }}>
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1;
        const filled = n <= rounded;
        return (
          <Box
            key={n}
            component="button"
            type="button"
            onClick={() => onChange(rounded === n ? n - 1 : n)}
            aria-label={`${n}`}
            aria-pressed={filled}
            sx={{
              width: size,
              height: size,
              flex: 'none',
              p: 0,
              m: 0,
              cursor: 'pointer',
              borderRadius: '50%',
              boxSizing: 'border-box',
              background: filled ? t.rating : 'transparent',
              border: filled ? 'none' : `1.5px solid ${t.notRated}`,
              transition: 'transform .1s ease',
              '&:hover': { transform: 'scale(1.12)' },
            }}
          />
        );
      })}
    </Box>
  );
}
