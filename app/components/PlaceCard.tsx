import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import type { Restaurant } from '~/types/restaurant';
import type { DecoratedRestaurant } from '~/utils/decorateRestaurant';
import type { ListTokens } from '~/listTheme';
import RestaurantThumb from '~/components/RestaurantThumb';
import Bubbles from '~/components/Bubbles';
import MichelinStars from '~/components/MichelinStars';

type Tokens = ListTokens;

interface PlaceCardProps {
  r: DecoratedRestaurant;
  tokens: Tokens;
  onView: (r: Restaurant) => void;
}

/**
 * THE place card — one source of truth for the tile grid (dashboard and the
 * public shared view). It carries only what you scan a grid for:
 *
 *   photo            3:2, with a "Want to try" label when that's the status
 *                    and its Michelin stars, if it has any, top right
 *   name             its own line, up to two
 *   meta             one quiet line — cuisine · city · price
 *   rating           only when the place has one
 *
 * There is no card surface: the photo sits straight on the page. Everything
 * else about a place (favourite, note, visits, booking, tags, honours, status
 * toggle, edit/delete) lives one tap away in the detail dialog, so the whole
 * card is a single button that opens it.
 */
export default function PlaceCard({ r, tokens: t, onView }: PlaceCardProps) {
  const { t: tr } = useTranslation();

  return (
    <Box
      component="button"
      type="button"
      onClick={() => onView(r)}
      sx={{
        display: 'block',
        width: '100%',
        // A stretched <button> centres its content vertically, which would drop
        // shorter cards (no rating) below their neighbours in the same row.
        alignSelf: 'start',
        // Grid items default to min-width:auto, so a long name would force the
        // card wider than its track on narrow (2-up phone) grids.
        minWidth: 0,
        p: 0,
        m: 0,
        border: 'none',
        background: 'transparent',
        color: 'inherit',
        font: 'inherit',
        textAlign: 'left',
        cursor: 'pointer',
        borderRadius: '14px',
        '& .place-photo': { transition: 'filter .15s ease' },
        '&:hover .place-photo': { filter: 'brightness(.95)' },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <RestaurantThumb className="place-photo" image={r.image} name={r.name} tokens={t} />
        {/* "Been" is the common case and goes unmarked; only the exception is labelled. */}
        {r.isWant && (
          <Box
            component="span"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: t.cardBg,
              color: t.ink,
              fontSize: 12,
              fontWeight: 500,
              lineHeight: 1,
              padding: '5px 9px',
              borderRadius: '999px',
            }}
          >
            {tr('dashboard.statusWant')}
          </Box>
        )}
        {/* Michelin stars are the one honour shown on the card; the rest are in the
            detail view. White in both modes, so the red reads the same everywhere. */}
        {(r.michelinStars ?? 0) > 0 && (
          <Box
            component="span"
            sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', background: '#fff', padding: '4px 7px', borderRadius: '999px' }}
          >
            <MichelinStars count={r.michelinStars ?? 0} size={14} />
          </Box>
        )}
      </Box>

      <Box
        sx={{
          mt: '10px',
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 1.3,
          letterSpacing: '-.01em',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {r.name}
      </Box>

      {r.meta && (
        <Box sx={{ mt: '2px', fontSize: 14, lineHeight: 1.4, color: t.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {r.meta}
        </Box>
      )}

      {r.rated && (
        <Box sx={{ mt: '6px', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Bubbles value={r.rating ?? 0} tokens={t} size={9} gap={4} />
          <Box component="span" sx={{ fontSize: 12, color: t.muted, lineHeight: 1 }}>
            {(r.rating ?? 0).toFixed(1)}
          </Box>
        </Box>
      )}
    </Box>
  );
}
