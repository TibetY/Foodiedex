import Box from '@mui/material/Box';
import { type SxProps, type Theme } from '@mui/material/styles';
import BookmarkBorder from '@mui/icons-material/BookmarkBorder';
import { useTranslation } from 'react-i18next';
import type { Restaurant } from '~/types/restaurant';
import type { ListTokens } from '~/listTheme';
import { distinctionIds, distinctionLabel } from '~/utils/distinctions';
import MichelinStars from '~/components/MichelinStars';

/**
 * Everything drawn over a photograph uses these fixed colours, in both modes:
 * the photo is always under a dark scrim, so the page's own ink would vanish
 * on it in light mode.
 */
export const ON_PHOTO = {
  ink: '#F6F0EA',
  soft: 'rgba(246,240,234,.85)',
  glass: 'rgba(20,17,15,.5)',
  /** Bottom-weighted scrim that keeps a name readable on any photo. */
  scrim: 'linear-gradient(180deg, rgba(10,8,7,0) 35%, rgba(10,8,7,.82) 100%)',
} as const;

/** Frosted fill for pills and round buttons that sit on a photograph. */
export const glassOnPhotoSx = {
  background: ON_PHOTO.glass,
  color: ON_PHOTO.ink,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
} as const;

interface PillProps {
  tokens: ListTokens;
  /** On a photograph (frosted glass) or on a card surface (raised fill). */
  onPhoto?: boolean;
  sx?: SxProps<Theme>;
}

function pillSx(t: ListTokens, onPhoto: boolean | undefined) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    height: 32,
    padding: '0 12px',
    borderRadius: '999px',
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    minWidth: 0,
    ...(onPhoto ? glassOnPhotoSx : { background: t.raised, color: t.ink }),
  } as const;
}

/** "Want to try", with its bookmark. "Been" is the common case and goes unmarked. */
export function WantPill({ tokens: t, onPhoto, sx }: PillProps) {
  const { t: tr } = useTranslation();
  return (
    <Box component="span" sx={[pillSx(t, onPhoto), ...(Array.isArray(sx) ? sx : [sx])]}>
      <BookmarkBorder aria-hidden sx={{ fontSize: 15, ml: '-2px' }} />
      {tr('dashboard.statusWant')}
    </Box>
  );
}

/** A short form of a place's first distinction: stars for Michelin, the name otherwise. */
export function distinctionShort(r: Pick<Restaurant, 'michelinStars' | 'bibGourmand' | 'distinctions'>): {
  stars: number;
  label: string;
} | null {
  const stars = r.michelinStars ?? 0;
  if (stars >= 1 && stars <= 3) return { stars, label: 'Michelin' };
  const first = distinctionIds(r)[0];
  return first ? { stars: 0, label: distinctionLabel(first) } : null;
}

/** The one distinction a card or row shows; the rest are in the detail view. */
export function DistinctionPill({
  r,
  tokens: t,
  onPhoto,
  sx,
}: PillProps & { r: Pick<Restaurant, 'michelinStars' | 'bibGourmand' | 'distinctions'> }) {
  const d = distinctionShort(r);
  if (!d) return null;
  return (
    <Box component="span" sx={[pillSx(t, onPhoto), ...(Array.isArray(sx) ? sx : [sx])]}>
      {d.stars > 0 ? (
        <>
          <MichelinStars count={d.stars} size={13} color={onPhoto ? t.onPhotoAccent : t.accent} />
          <Box component="span" aria-hidden>{d.label}</Box>
        </>
      ) : (
        <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</Box>
      )}
    </Box>
  );
}
