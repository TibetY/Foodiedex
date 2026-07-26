import Box from '@mui/material/Box';
import type { ListTokens } from '~/listTheme';

type Tokens = ListTokens;

/**
 * Shimmering placeholders shown while a list's restaurants load (e.g. when
 * switching lists). Each mirrors the real layout — PlaceCard's slots for the
 * grid, a thumb + text lines for rows — at the same fixed heights, so the
 * layout doesn't shift when data lands. The shimmer is a slow gradient sweep
 * (kanpai-shimmer, tailwind.css) that collapses to the flat skeleton tone
 * under prefers-reduced-motion.
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

/** Grid placeholder matching PlaceCard's anatomy: image block, title line,
 *  tag pills, bubble row, footer line. */
export default function SkeletonCard({ tokens: t }: { tokens: Tokens }) {
  return (
    <Box
      aria-hidden
      sx={{
        border: `1px solid ${t.border}`,
        borderRadius: '22px',
        overflow: 'hidden',
        minWidth: 0,
        background: t.cardBg,
        boxShadow: t.cardShadow,
      }}
    >
      {/* image block */}
      <Blk t={t} sx={{ height: { xs: 110, sm: 158 } }} />
      <Box sx={{ padding: { xs: '10px 12px 12px', sm: '13px 16px 15px' } }}>
        {/* title line + cost stub */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', height: { xs: 22, sm: 26 } }}>
          <Blk t={t} sx={{ height: 16, width: '55%', borderRadius: '6px' }} />
          <Blk t={t} sx={{ height: 12, width: 34, borderRadius: '6px' }} />
        </Box>
        {/* tag pills */}
        <Box sx={{ height: { xs: 20, sm: 22 }, mt: '5px', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Blk t={t} sx={{ height: 18, width: 64, borderRadius: '999px' }} />
          <Blk t={t} sx={{ height: 18, width: 84, borderRadius: '999px' }} />
        </Box>
        {/* note lines */}
        <Box sx={{ mt: { xs: '7px', sm: '9px' }, height: { xs: 35, sm: 38 }, display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
          <Blk t={t} sx={{ height: 10, width: '92%', borderRadius: '5px' }} />
          <Blk t={t} sx={{ height: 10, width: '70%', borderRadius: '5px' }} />
        </Box>
        {/* bubble row */}
        <Box sx={{ mt: { xs: '7px', sm: '9px' }, height: 18, display: 'flex', alignItems: 'center', gap: '5px' }}>
          {Array.from({ length: 5 }, (_, i) => (
            <Blk key={i} t={t} sx={{ width: 11, height: 11, borderRadius: '50%' }} />
          ))}
          <Blk t={t} sx={{ height: 10, width: 48, borderRadius: '5px', ml: '5px' }} />
        </Box>
        {/* footer line */}
        <Box sx={{ mt: { xs: '8px', sm: '10px' }, pt: { xs: '8px', sm: '10px' }, height: { xs: 28, sm: 30 }, boxSizing: 'content-box', borderTop: `1px solid ${t.hair}`, display: 'flex', alignItems: 'center' }}>
          <Blk t={t} sx={{ height: 10, width: '45%', borderRadius: '5px' }} />
        </Box>
      </Box>
    </Box>
  );
}

/** Row placeholder for the list and table views (thumb + two text lines). */
export function SkeletonListRow({ tokens: t }: { tokens: Tokens }) {
  return (
    <Box aria-hidden sx={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderBottom: `1px solid ${t.borderSoft}` }}>
      <Blk t={t} sx={{ width: 46, height: 46, borderRadius: '14px', flex: 'none' }} />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Blk t={t} sx={{ height: 13, width: '32%', borderRadius: '6px' }} />
        <Blk t={t} sx={{ height: 10, width: '55%', borderRadius: '5px' }} />
      </Box>
      <Box sx={{ display: 'flex', gap: '5px', flex: 'none' }}>
        {Array.from({ length: 5 }, (_, i) => (
          <Blk key={i} t={t} sx={{ width: 10, height: 10, borderRadius: '50%' }} />
        ))}
      </Box>
    </Box>
  );
}
