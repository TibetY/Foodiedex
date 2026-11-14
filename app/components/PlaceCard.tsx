import Box from '@mui/material/Box';
import type { Restaurant } from '~/types/restaurant';
import type { DecoratedRestaurant } from '~/utils/decorateRestaurant';
import { haloSx, type ListTokens } from '~/listTheme';
import { usePlacePhoto, photoSx } from '~/components/RestaurantThumb';
import Bubbles from '~/components/Bubbles';
import { DistinctionPill, WantPill, FavoritePill, ON_PHOTO } from '~/components/PlacePills';

type Tokens = ListTokens;

interface PlaceCardProps {
  r: DecoratedRestaurant;
  tokens: Tokens;
  onView: (r: Restaurant) => void;
}

const nameSx = {
  fontSize: 24,
  fontWeight: 600,
  letterSpacing: '-.03em',
  lineHeight: 1.1,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  overflowWrap: 'anywhere',
} as const;

/**
 * THE place card — one source of truth for the grid (dashboard and the public
 * shared view). The photograph runs edge to edge and everything sits on it:
 *
 *   top       its first distinction (left), "Want to try" and a favourite heart
 *             (right), as glass pills
 *   bottom    name, then one line — cuisine · city · price — with the rating dots
 *
 * A place with no usable photo gets the same card as a softly lit surface with
 * its monogram, so the grid never shows an empty frame.
 *
 * Everything else about a place (note, visits, booking, tags, status
 * toggle, edit/delete) lives one tap away in the detail view, so the whole card
 * is a single button that opens it.
 */
export default function PlaceCard({ r, tokens: t, onView }: PlaceCardProps) {
  const photo = usePlacePhoto(r.image);

  const meta = (color: string, dots: string) => (
    <Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', fontSize: 14, lineHeight: 1.3, color }}>
      <Box component="span" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.meta}</Box>
      {r.rated && <Bubbles value={r.rating ?? 0} tokens={t} color={dots} />}
    </Box>
  );

  return (
    <Box
      component="button"
      type="button"
      onClick={() => onView(r)}
      sx={{
        display: 'block',
        position: 'relative',
        width: '100%',
        // Grid items default to min-width:auto, so a long name would force the
        // card wider than its track.
        minWidth: 0,
        p: 0,
        m: 0,
        border: 'none',
        color: t.ink,
        font: 'inherit',
        textAlign: 'left',
        cursor: 'pointer',
        overflow: 'hidden',
        borderRadius: '28px',
        // A photograph holds its shape. Without one, a phone gets a compact card
        // (most places have no photo, and a column of empty frames is a long
        // scroll); in a grid it keeps the shape so the rows stay even.
        aspectRatio: photo.show ? { xs: '3 / 2.15', sm: '3 / 2' } : { sm: '3 / 2' },
        ...haloSx(t),
        transition: 'transform .2s ease',
        '&:active': { transform: 'scale(.985)' },
        '& .place-photo': { transition: 'opacity .25s ease, transform .5s ease' },
        '@media (hover: hover)': { '&:hover .place-photo': { transform: 'scale(1.03)' } },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          '& .place-photo': { transition: 'none', transform: 'none !important' },
        },
      }}
    >
      {photo.show ? (
        <>
          <Box component="img" className="place-photo" alt="" {...photo.imgProps} sx={photoSx(photo.pending)} />
          <Box aria-hidden sx={{ position: 'absolute', inset: 0, background: ON_PHOTO.scrim }} />
          <Box sx={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            <DistinctionPill r={r} tokens={t} onPhoto />
            {(r.isWant || r.favorite) && (
              <Box sx={{ ml: 'auto', flex: 'none', display: 'flex', gap: '6px' }}>
                {r.isWant && <WantPill tokens={t} onPhoto />}
                {r.favorite && <FavoritePill tokens={t} onPhoto />}
              </Box>
            )}
          </Box>
          <Box sx={{ position: 'absolute', left: 20, right: 20, bottom: 18, color: ON_PHOTO.ink, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Box component="span" sx={nameSx}>{r.name}</Box>
            {(r.meta || r.rated) && meta(ON_PHOTO.soft, t.onPhotoAccent)}
          </Box>
        </>
      ) : (
        <Box sx={{ position: { sm: 'absolute' }, inset: { sm: 0 }, minHeight: { xs: 150, sm: 0 }, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '22px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <Box component="span" aria-hidden sx={{ fontSize: { xs: 56, sm: 64 }, fontWeight: 300, letterSpacing: '-.05em', lineHeight: 0.9, color: t.accent }}>
              {r.initial}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', minWidth: 0 }}>
              {(r.isWant || r.favorite) && (
                <Box sx={{ display: 'flex', gap: '6px' }}>
                  {r.isWant && <WantPill tokens={t} />}
                  {r.favorite && <FavoritePill tokens={t} />}
                </Box>
              )}
              <DistinctionPill r={r} tokens={t} sx={{ maxWidth: '100%' }} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Box component="span" sx={nameSx}>{r.name}</Box>
            {(r.meta || r.rated) && meta(t.muted, t.rating)}
          </Box>
        </Box>
      )}
    </Box>
  );
}
