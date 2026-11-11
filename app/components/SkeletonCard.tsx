import Box from '@mui/material/Box';
import type { ListTokens } from '~/listTheme';
import { THUMB_ASPECT } from '~/components/RestaurantThumb';

type Tokens = ListTokens;

/**
 * Shimmering placeholders shown while a list's restaurants load (e.g. when
 * switching lists). Each mirrors the real layout — PlaceCard's photo, name and
 * meta line for the grid, a thumb + text lines for rows — so the layout doesn't
 * shift when data lands. The shimmer is a slow gradient sweep (kanpai-shimmer,
 * tailwind.css) that collapses to the flat skeleton tone under
 * prefers-reduced-motion.
 */
function shimmerSx(t: Tokens) {
  return {
    background: `linear-gradient(100deg, ${t.skeleton} 40%, ${t.track} 50%, ${t.skeleton} 60%)`,
    backgroundSize: '200% 100%',
    animation: 'kanpai-shimmer 1.6s linear infinite',
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
      background: t.skeleton,
    },
  } as const;
}

/** One shimmering block; radius/size come from the caller. */
function Blk({ t, sx }: { t: Tokens; sx: object }) {
  return <Box aria-hidden sx={{ ...shimmerSx(t), ...sx }} />;
}

/** Grid placeholder matching PlaceCard's anatomy: photo, name line, meta line. */
export default function SkeletonCard({ tokens: t }: { tokens: Tokens }) {
  return (
    <Box aria-hidden sx={{ minWidth: 0 }}>
      <Blk t={t} sx={{ aspectRatio: THUMB_ASPECT, borderRadius: '14px' }} />
      <Blk t={t} sx={{ mt: '13px', height: 15, width: '60%', borderRadius: '6px' }} />
      <Blk t={t} sx={{ mt: '9px', height: 11, width: '80%', borderRadius: '5px' }} />
    </Box>
  );
}

/** Row placeholder for the list and table views (thumb + two text lines). */
export function SkeletonListRow({ tokens: t }: { tokens: Tokens }) {
  return (
    <Box aria-hidden sx={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderBottom: `1px solid ${t.borderSoft}` }}>
      <Blk t={t} sx={{ width: 60, aspectRatio: THUMB_ASPECT, borderRadius: '8px', flex: 'none' }} />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Blk t={t} sx={{ height: 13, width: '32%', borderRadius: '6px' }} />
        <Blk t={t} sx={{ height: 10, width: '55%', borderRadius: '5px' }} />
      </Box>
    </Box>
  );
}
