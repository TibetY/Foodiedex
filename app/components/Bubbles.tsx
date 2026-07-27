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
 *  back, so the control can be dialed all the way down to "not rated".
 *
 *  The dots are drawn at the design's size and spacing, but each button's hit
 *  area is grown with transparent padding: the full row height (40px) plus
 *  half the gap on each side, so neighbouring targets meet without overlapping
 *  and the visible rhythm is untouched. Rating a spot on a phone was otherwise
 *  a 16–22px target.
 */
export function BubbleInput({ value, onChange, tokens: t, size = 22, gap = 9, max = 5, ariaLabel }: BubbleInputProps) {
  const rounded = Math.round(Math.max(0, Math.min(max, value || 0)));
  const padX = Math.round(gap / 2);
  const padY = Math.max(0, Math.round((40 - size) / 2));
  return (
    <Box
      role="group"
      aria-label={ariaLabel}
      // Negative margins keep the row's outer box where the layout expects it,
      // so the padded targets don't shift surrounding content.
      sx={{ display: 'inline-flex', alignItems: 'center', mx: `${-padX}px`, my: `${-padY}px` }}
    >
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
              flex: 'none',
              px: `${padX}px`,
              py: `${padY}px`,
              m: 0,
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              // The dot itself: the design's size, centred in the touch target.
              '&::before': {
                content: '""',
                display: 'block',
                width: size,
                height: size,
                borderRadius: '50%',
                boxSizing: 'border-box',
                background: filled ? t.rating : 'transparent',
                border: filled ? 'none' : `1.5px solid ${t.notRated}`,
                transition: 'transform .1s ease',
              },
              '&:hover::before': { transform: 'scale(1.12)' },
            }}
          />
        );
      })}
    </Box>
  );
}
