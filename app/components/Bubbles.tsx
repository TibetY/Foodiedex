import Box from '@mui/material/Box';
import type { ListTokens } from '~/listTheme';

/** Ratings carry half-bubble precision throughout — snap to the nearest 0.5. */
export function snapToHalf(value: number, max = 5): number {
  return Math.round(Math.max(0, Math.min(max, value || 0)) * 2) / 2;
}

/**
 * How one bubble in the row should paint for a given rating: solid, half, or
 * empty. Shared by the read-only row and the picker so they can never drift.
 */
function bubbleSx(fill: 'full' | 'half' | 'empty', size: number, t: ListTokens) {
  return {
    width: size,
    height: size,
    flex: 'none',
    borderRadius: '50%',
    boxSizing: 'border-box' as const,
    // A half bubble keeps the empty bubble's outline and fills the left half
    // inside it, so a row of them still reads as one rhythm of circles.
    background:
      fill === 'full'
        ? t.rating
        : fill === 'half'
          ? `linear-gradient(90deg, ${t.rating} 0 50%, transparent 50% 100%)`
          : 'transparent',
    border: fill === 'full' ? 'none' : `1.5px solid ${t.notRated}`,
  };
}

/** Which of the `max` bubbles are full, which single one is half. */
function fillFor(index: number, snapped: number): 'full' | 'half' | 'empty' {
  if (index + 1 <= snapped) return 'full';
  if (index + 0.5 === snapped) return 'half';
  return 'empty';
}

interface BubblesProps {
  /** 0–5, may be fractional — snapped to the nearest half bubble. Callers can
   *  print the exact decimal alongside (e.g. "4.3 avg"). */
  value: number;
  tokens: ListTokens;
  size?: number;
  gap?: number;
  max?: number;
}

/** Read-only bubble rating: `max` small circles — solid, half-filled, or
 *  outlined — to the nearest half. */
export default function Bubbles({ value, tokens: t, size = 12, gap = 5, max = 5 }: BubblesProps) {
  const snapped = snapToHalf(value, max);
  return (
    <Box
      role="img"
      aria-label={`${snapped} / ${max}`}
      sx={{ display: 'inline-flex', alignItems: 'center', gap: `${gap}px`, verticalAlign: 'middle' }}
    >
      {Array.from({ length: max }, (_, i) => (
        <Box key={i} aria-hidden sx={bubbleSx(fillFor(i, snapped), size, t)} />
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

/**
 * Bubble rating picker with half-bubble precision.
 *
 * The row is a single slider rather than a strip of buttons: pointer input maps
 * the position within a bubble to a half or a whole (left half of the third
 * bubble = 2.5, right half = 3), and arrow keys step by 0.5, so half values are
 * reachable without a pointer. Clicking the exact current value steps one half
 * back, so the control can still be dialed down to "not rated".
 *
 * The dots are drawn at the design's size and spacing; the slider's own box is
 * the full row height plus half a gap on each side, which is what makes this a
 * comfortable touch target on a phone.
 */
export function BubbleInput({ value, onChange, tokens: t, size = 22, gap = 9, max = 5, ariaLabel }: BubbleInputProps) {
  const snapped = snapToHalf(value, max);
  const padX = Math.round(gap / 2);
  const padY = Math.max(0, Math.round((40 - size) / 2));

  /**
   * Map a pointer x to the half-step value under it. Measured against the
   * bubbles' own stride (size + gap) from the content edge, not the padded
   * box — dividing the whole row evenly puts the boundaries slightly off the
   * circles the user is aiming at.
   */
  const valueAt = (clientX: number, row: HTMLElement): number => {
    const rect = row.getBoundingClientRect();
    const x = clientX - (rect.left + padX);
    const stride = size + gap;
    const idx = Math.min(max - 1, Math.max(0, Math.floor(x / stride)));
    const within = x - idx * stride;
    return idx + (within > size / 2 ? 1 : 0.5);
  };

  const step = (delta: number) => onChange(snapToHalf(snapped + delta, max));

  return (
    <Box
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={snapped}
      aria-valuetext={`${snapped} / ${max}`}
      onClick={(e: React.MouseEvent<HTMLElement>) => {
        const next = valueAt(e.clientX, e.currentTarget);
        onChange(next === snapped ? snapToHalf(next - 0.5, max) : next);
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); step(0.5); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); step(-0.5); }
        else if (e.key === 'Home') { e.preventDefault(); onChange(0); }
        else if (e.key === 'End') { e.preventDefault(); onChange(max); }
      }}
      // Negative margins keep the row's outer box where the layout expects it,
      // so the padded target doesn't shift surrounding content.
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${gap}px`,
        px: `${padX}px`,
        py: `${padY}px`,
        mx: `${-padX}px`,
        my: `${-padY}px`,
        cursor: 'pointer',
        borderRadius: '999px',
        touchAction: 'manipulation',
        '&:hover .bubble': { transform: 'scale(1.08)' },
      }}
    >
      {Array.from({ length: max }, (_, i) => (
        <Box
          key={i}
          aria-hidden
          className="bubble"
          sx={{ ...bubbleSx(fillFor(i, snapped), size, t), transition: 'transform .1s ease' }}
        />
      ))}
    </Box>
  );
}
