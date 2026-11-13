import Box from '@mui/material/Box';
import type { ListTokens } from '~/listTheme';

type Tokens = ListTokens;

/**
 * Shimmering placeholders shown while a list's restaurants load (e.g. when
 * switching lists). Each mirrors the real layout — PlaceCard's full-bleed tile
 * for the grid, PlaceRow's thumb + text lines for rows — so the layout doesn't
 * shift when data lands. The shimmer is a slow gradient sweep (kanpai-shimmer,
 * tailwind.css) that collapses to the flat skeleton tone under
 * prefers-reduced-motion.
 */
function shimmerSx(t: Tokens) {
  return {
    background: `linear-gradient(100deg, ${t.cardBg} 40%, ${t.raised} 50%, ${t.cardBg} 60%)`,
    backgroundSize: '200% 100%',
    animation: 'kanpai-shimmer 1.6s linear infinite',
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
      background: t.cardBg,
    },
  } as const;
}

/** One shimmering block; radius/size come from the caller. */
function Blk({ t, sx }: { t: Tokens; sx: object }) {
  return <Box aria-hidden sx={{ ...shimmerSx(t), ...sx }} />;
}

/** Grid placeholder: the card is one tile. */
export default function SkeletonCard({ tokens: t }: { tokens: Tokens }) {
  return <Blk t={t} sx={{ aspectRatio: '3 / 2.15', borderRadius: '28px', minWidth: 0 }} />;
}

/** Row placeholder for the list and table views (thumb + two text lines). */
export function SkeletonListRow({ tokens: t }: { tokens: Tokens }) {
  return (
    <Box aria-hidden sx={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px', borderRadius: '22px', background: t.cardBg }}>
      <Box sx={{ width: 66, height: 66, borderRadius: '16px', flex: 'none', background: t.raised }} />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '9px' }}>
        <Box sx={{ height: 14, width: '42%', borderRadius: '7px', background: t.raised }} />
        <Box sx={{ height: 11, width: '60%', borderRadius: '6px', background: t.raised }} />
      </Box>
    </Box>
  );
}
