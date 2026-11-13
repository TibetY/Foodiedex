import Box from '@mui/material/Box';
import Favorite from '@mui/icons-material/Favorite';
import BookmarkBorder from '@mui/icons-material/BookmarkBorder';
import { useTranslation } from 'react-i18next';
import type { Restaurant } from '~/types/restaurant';
import type { DecoratedRestaurant } from '~/utils/decorateRestaurant';
import type { ListTokens } from '~/listTheme';
import RestaurantThumb from '~/components/RestaurantThumb';
import Bubbles from '~/components/Bubbles';
import MichelinStars from '~/components/MichelinStars';
import { distinctionShort } from '~/components/PlacePills';

interface PlaceRowProps {
  r: DecoratedRestaurant;
  tokens: ListTokens;
  onView: (r: Restaurant) => void;
}

/**
 * One place as a row, for the list view (dashboard and the public shared
 * view): a square thumbnail, the name, one meta line, then the rating dots and
 * its first distinction. A heart marks a favourite and a bookmark a place
 * still on the wish list. The whole row is one button that opens the detail.
 */
export default function PlaceRow({ r, tokens: t, onView }: PlaceRowProps) {
  const { t: tr } = useTranslation();
  const dist = distinctionShort(r);

  return (
    <Box
      component="button"
      type="button"
      onClick={() => onView(r)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        width: '100%',
        minWidth: 0,
        padding: '10px',
        m: 0,
        border: 'none',
        borderRadius: '22px',
        background: t.cardBg,
        color: t.ink,
        font: 'inherit',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'transform .2s ease, background-color .15s ease',
        '&:active': { transform: 'scale(.99)' },
        '@media (hover: hover)': { '&:hover': { background: t.rowHover } },
      }}
    >
      <RestaurantThumb image={r.image} name={r.name} tokens={t} sx={{ width: 66, aspectRatio: '1' }} />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <Box component="span" sx={{ fontSize: 17, fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {r.name}
        </Box>
        {r.meta && (
          <Box component="span" sx={{ fontSize: 14, lineHeight: 1.2, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {r.meta}
          </Box>
        )}
        {(r.rated || dist) && (
          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            {r.rated && <Bubbles value={r.rating ?? 0} tokens={t} size={6} gap={3} />}
            {dist && (
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', minWidth: 0, fontSize: 12, fontWeight: 600, color: t.muted }}>
                {dist.stars > 0 && <MichelinStars count={dist.stars} size={11} color={t.accent} />}
                <Box component="span" aria-hidden={dist.stars > 0} sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {dist.label}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
      {r.isWant && (
        <BookmarkBorder role="img" aria-label={tr('dashboard.statusWant')} sx={{ flex: 'none', fontSize: 20, color: t.muted, mr: '10px' }} />
      )}
      {r.favorite && (
        <Favorite role="img" aria-label={tr('dashboard.favorited')} sx={{ flex: 'none', fontSize: 18, color: t.accent, mr: '10px' }} />
      )}
    </Box>
  );
}
