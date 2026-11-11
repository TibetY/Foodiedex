import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import EventSeat from '@mui/icons-material/EventSeat';
import { useTranslation } from 'react-i18next';
import type { Restaurant, RestaurantLocation } from '~/types/restaurant';
import type { DecoratedRestaurant } from '~/utils/decorateRestaurant';
import type { ListTokens } from '~/listTheme';
import RestaurantThumb from '~/components/RestaurantThumb';
import Bubbles from '~/components/Bubbles';

type Tokens = ListTokens;

function reservationLabel(platform: string): string {
  if (platform === 'resy') return 'Resy';
  if (platform === 'opentable') return 'OpenTable';
  if (platform === 'walkin') return '';
  return platform;
}

/** The one booking a card surfaces: the first reservable location, else the
 *  first explicit walk-in. Branch-by-branch detail lives in the detail dialog. */
function primaryBooking(locations: RestaurantLocation[]): RestaurantLocation | null {
  return (
    locations.find((l) => l.reservationUrl) ??
    locations.find((l) => l.reservationPlatform === 'walkin') ??
    null
  );
}

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

/**
 * The card's single booking affordance (comp style): a compact filled accent
 * pill for the primary reservable location, a quiet walk-ins note, or nothing.
 * Also used by the list rows in both the dashboard and the shared view.
 */
export function BookingPill({ locations, tokens: t }: { locations: RestaurantLocation[]; tokens: Tokens }) {
  const { t: tr } = useTranslation();
  const booking = primaryBooking(locations);
  if (!booking) return null;
  if (booking.reservationUrl) {
    return (
      <Box
        component="a"
        href={booking.reservationUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        aria-label={
          reservationLabel(booking.reservationPlatform || '')
            ? tr('dashboard.reserveOn', { platform: reservationLabel(booking.reservationPlatform || '') })
            : undefined
        }
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          background: t.accent,
          color: t.accentText,
          borderRadius: '999px',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 700,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          // Long platform names (FR "Réserver · OpenTable") must never widen a
          // narrow card — clip inside the pill instead.
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          '&:hover': { filter: 'brightness(1.05)' },
        }}
      >
        {tr('dashboard.book')}
      </Box>
    );
  }
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: 12.5, color: t.muted, whiteSpace: 'nowrap' }}>
      <EventSeat sx={{ fontSize: 15 }} /> {tr('dashboard.walkinBadge')}
    </Box>
  );
}

/** Small circular hover action button used on cards and list rows. */
export function CardAction({
  children,
  label,
  onClick,
  tokens,
  danger,
  solid,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  tokens: Tokens;
  danger?: boolean;
  solid?: boolean;
}) {
  return (
    <IconButton
      size="small"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      sx={{
        width: 28,
        height: 28,
        background: solid ? tokens.searchBg : 'rgba(255,255,255,0.9)',
        border: `1px solid ${tokens.border}`,
        color: danger ? tokens.error : tokens.muted,
        '&:hover': {
          background: solid ? tokens.pillBorder : '#fff',
          color: danger ? tokens.error : tokens.accent,
        },
      }}
    >
      {children}
    </IconButton>
  );
}
