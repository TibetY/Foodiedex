import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EventSeat from '@mui/icons-material/EventSeat';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import { useTranslation } from 'react-i18next';
import type { Restaurant, RestaurantLocation } from '~/types/restaurant';
import type { DecoratedRestaurant } from '~/utils/decorateRestaurant';
import type { ListTokens } from '~/listTheme';
import RestaurantThumb from '~/components/RestaurantThumb';
import Bubbles from '~/components/Bubbles';
import { cuisineEmoji } from '~/utils/cuisineEmoji';

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
  serifFont: string;
  canEdit?: boolean;
  onView: (r: Restaurant) => void;
  onToggleStatus?: (r: DecoratedRestaurant) => void;
  onToggleFavorite?: (r: Restaurant) => void;
  onEdit?: (r: Restaurant) => void;
  onDelete?: (id: string) => void;
}

/**
 * THE place card — one source of truth for the tile grid (dashboard and the
 * public shared view). Every slot below the image renders at a FIXED height,
 * whether or not its data exists, so name / meta / note / rating / booking sit
 * at identical positions on every card and the grid reads as one set:
 *
 *   image 158 (status pill · hover actions)
 *   name row 26        — name, cost split ($$ strong + $$ faint), heart right
 *   tag row 22         — cuisine + place-type pills, honours pill last
 *   note slot 38       — the note as a 2-line italic pull-quote (or empty)
 *   rating row 18      — five bubbles + "4.0 avg" / "not rated yet"
 *   footer 30          — hairline rule · place pin + city/visits · booking
 */
export default function PlaceCard({
  r,
  tokens: t,
  serifFont,
  canEdit = false,
  onView,
  onToggleStatus,
  onToggleFavorite,
  onEdit,
  onDelete,
}: PlaceCardProps) {
  const { t: tr } = useTranslation();

  // Tag pills, per the design: cuisine first, then place types; honours
  // (Michelin/Bib) render as one accent-tinted pill at the end. The row is a
  // single fixed-height line, so the budget is small — an honour takes one of
  // the slots rather than overflowing past the card edge.
  const honour =
    (r.michelinStars ?? 0) > 0
      ? `${'★'.repeat(r.michelinStars ?? 0)} ${tr('dashboard.michelinChip')}`
      : r.bibGourmand
        ? tr('dashboard.bibGourmand')
        : null;
  const tagBudget = honour ? 1 : 2;
  const tags: string[] = [tr(`cuisines.${r.cuisine}`, r.cuisine)];
  for (const p of r.placeTypes ?? []) {
    if (tags.length >= tagBudget) break;
    const label = tr(`placeTypes.${p}`, p);
    if (!tags.includes(label)) tags.push(label);
  }
  const footerParts: string[] = [];
  if (r.city) footerParts.push(r.city);
  if ((r.visitCount ?? 0) > 0) footerParts.push(tr('dashboard.visitsCount', { count: r.visitCount ?? 0 }));
  if ((r.locations?.length ?? 0) > 1) footerParts.push(tr('dashboard.locationsCount', { count: r.locations?.length ?? 0 }));
  const note = r.comment?.trim();
  // Cost as the design's filled + faint split: "$$" strong, "$$" quiet.
  const costOn = r.costStr;
  const costOff = costOn ? '$'.repeat(Math.max(0, 4 - costOn.length)) : '';

  const statusInteractive = canEdit && onToggleStatus;

  return (
    <Box
      onClick={() => onView(r)}
      sx={{
        border: `1px solid ${t.border}`,
        borderRadius: '22px',
        overflow: 'hidden',
        // Grid items default to min-width:auto, so the nowrap name/meta lines
        // would force the card wider than its track on narrow (2-up phone)
        // grids and clip the neighbouring column.
        minWidth: 0,
        background: t.cardBg,
        cursor: 'pointer',
        boxShadow: t.cardShadow,
        transition: 'transform .15s, box-shadow .15s',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: t.shadow2 },
        // Hover-only quick actions. Touch devices don't get always-on buttons
        // cluttering every photo — tap → detail dialog carries Edit/Delete.
        '&:hover .card-actions, &:focus-within .card-actions': { opacity: 1 },
      }}
    >
      {/* image */}
      <Box sx={{ position: 'relative', height: { xs: 110, sm: 158 } }}>
        <RestaurantThumb
          image={r.image}
          alt={r.name}
          initial={r.initial}
          serifFont={serifFont}
          tokens={t}
          cuisine={r.cuisine}
          sx={{ height: '100%' }}
        />
        <Box
          component={statusInteractive ? 'button' : 'span'}
          type={statusInteractive ? 'button' : undefined}
          onClick={
            statusInteractive
              ? (e: React.MouseEvent) => {
                  e.stopPropagation();
                  onToggleStatus(r);
                }
              : undefined
          }
          title={statusInteractive ? tr('dashboard.toggleStatus') : undefined}
          aria-label={
            statusInteractive
              ? tr('dashboard.markAs', {
                  name: r.name,
                  status: r.isBeen ? tr('dashboard.markWant') : tr('dashboard.markBeen'),
                })
              : undefined
          }
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: r.isBeen ? t.beenBg : t.wantBg,
            color: r.isBeen ? t.beenFg : t.wantFg,
            border: `1px solid ${r.isBeen ? t.beenFg : t.wantFg}33`,
            fontSize: '11.5px',
            fontWeight: 700,
            padding: '4px 11px',
            borderRadius: '999px',
            backdropFilter: 'blur(4px)',
            cursor: statusInteractive ? 'pointer' : 'default',
          }}
        >
          {r.isBeen ? tr('dashboard.statusBeen') : tr('dashboard.statusWant')}
        </Box>
        {canEdit && onEdit && onDelete && (
          <Box className="card-actions" sx={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: '6px', opacity: 0, transition: 'opacity .15s' }}>
            <CardAction label={tr('dashboard.editX', { name: r.name })} onClick={() => onEdit(r)} tokens={t}>
              <EditIcon sx={{ fontSize: 15 }} />
            </CardAction>
            <CardAction label={tr('dashboard.deleteX', { name: r.name })} onClick={() => r.id && onDelete(r.id)} tokens={t} danger>
              <DeleteIcon sx={{ fontSize: 15 }} />
            </CardAction>
          </Box>
        )}
      </Box>

      {/* body — fixed slots (per breakpoint, so cards still align in the grid) */}
      <Box sx={{ padding: { xs: '10px 12px 12px', sm: '13px 16px 15px' } }}>
        {/* name row */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', height: { xs: 22, sm: 26 } }}>
          <Box
            component="button"
            type="button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onView(r);
            }}
            sx={{
              fontWeight: 600,
              fontSize: { xs: 17, sm: 21 },
              lineHeight: 1.15,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              border: 'none',
              background: 'transparent',
              p: 0,
              m: 0,
              color: 'inherit',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'block',
              maxWidth: '100%',
            }}
          >
            {r.name}
          </Box>
          {/* cost — filled + faint split, then the heart (box always reserved
              so names align) */}
          {costOn && (
            <Box
              component="span"
              aria-label={tr('dashboard.cost') + ' ' + costOn}
              sx={{ flex: 'none', display: { xs: 'none', sm: 'block' }, fontSize: 12.5, letterSpacing: '.06em', color: t.notRated }}
            >
              <Box component="span" sx={{ color: t.muted, fontWeight: 600 }}>{costOn}</Box>
              <Box component="span" aria-hidden>{costOff}</Box>
            </Box>
          )}
          <Box sx={{ width: 26, height: 26, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {canEdit && onToggleFavorite ? (
              <IconButton
                size="small"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onToggleFavorite(r);
                }}
                aria-label={tr(r.favorite ? 'dashboard.unfavorite' : 'dashboard.favorite', { name: r.name })}
                aria-pressed={r.favorite ?? false}
                sx={{ color: r.favorite ? 'error.main' : t.faint, p: '2px' }}
              >
                {r.favorite ? <Favorite sx={{ fontSize: 18 }} /> : <FavoriteBorder sx={{ fontSize: 18 }} />}
              </IconButton>
            ) : r.favorite ? (
              <Favorite role="img" aria-label={tr('dashboard.favorited')} sx={{ fontSize: 18, color: 'error.main' }} />
            ) : null}
          </Box>
        </Box>

        {/* tag pills row */}
        <Box sx={{ height: { xs: 20, sm: 22 }, mt: '5px', display: 'flex', gap: '6px', overflow: 'hidden', alignItems: 'center' }}>
          <Box component="span" aria-hidden sx={{ fontSize: { xs: 11, sm: 12 }, flex: 'none' }}>{cuisineEmoji(r.cuisine)}</Box>
          {costOn && (
            <Box
              component="span"
              aria-label={tr('dashboard.cost') + ' ' + costOn}
              sx={{ flex: 'none', display: { xs: 'block', sm: 'none' }, fontSize: 11.5, letterSpacing: '.06em', color: t.notRated }}
            >
              <Box component="span" sx={{ color: t.muted, fontWeight: 600 }}>{costOn}</Box>
              <Box component="span" aria-hidden>{costOff}</Box>
            </Box>
          )}
          {tags.map((tag, i) => (
            <Box
              key={tag}
              component="span"
              sx={{
                minWidth: 0,
                // On a 2-up phone grid the row also carries the cost, so only
                // the first chip fits whole — and an honour pill (the rarer
                // signal) takes the slot outright.
                display: honour || i > 0 ? { xs: 'none', sm: 'block' } : 'block',
                fontSize: '11px',
                padding: '3px 10px',
                borderRadius: '999px',
                background: t.chip,
                color: t.muted,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {tag}
            </Box>
          ))}
          {honour && (
            <Box
              component="span"
              sx={{
                flex: 'none',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '999px',
                background: t.beenBg,
                color: t.beenFg,
                whiteSpace: 'nowrap',
              }}
            >
              {honour}
            </Box>
          )}
        </Box>

        {/* note slot — reserved even when empty so rating/booking never move */}
        <Box
          sx={{
            mt: { xs: '7px', sm: '9px' },
            height: { xs: 35, sm: 38 },
            fontSize: { xs: 12.5, sm: 13.5 },
            fontStyle: 'italic',
            color: t.muted,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {note ? `“${note}”` : ''}
        </Box>

        {/* rating row — five bubbles, filled to the score, with the numeric
            line beside them (the design's "4.0 avg" / "not rated yet") */}
        <Box sx={{ mt: { xs: '7px', sm: '9px' }, height: 18, display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Bubbles value={r.rating ?? 0} tokens={t} size={11} gap={5} />
          <Box component="span" sx={{ color: t.faint, fontSize: 11.5, pl: '5px', whiteSpace: 'nowrap' }}>
            {r.rated ? tr('dashboard.ratingAvg', { rating: (r.rating ?? 0).toFixed(1) }) : tr('dashboard.notRated')}
          </Box>
        </Box>

        {/* footer — hairline rule, place + visits at left, booking at right */}
        <Box
          sx={{
            mt: { xs: '8px', sm: '10px' },
            pt: { xs: '8px', sm: '10px' },
            height: { xs: 28, sm: 30 },
            boxSizing: 'content-box',
            borderTop: `1px solid ${t.hair}`,
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            color: t.faint,
            fontSize: 11.5,
          }}
        >
          {footerParts.length > 0 && (
            <>
              <PlaceOutlined sx={{ fontSize: 13, flex: 'none' }} aria-hidden />
              <Box component="span" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {footerParts.join(' · ')}
              </Box>
            </>
          )}
          {/* Booking is hidden on phones: at 2-up the pill ate the whole
              footer, clipping the place to a single letter. Tapping through to
              the detail dialog is one step and carries every branch's booking. */}
          <Box sx={{ ml: 'auto', flex: 'none', display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
            <BookingPill locations={r.locations ?? []} tokens={t} />
          </Box>
        </Box>
      </Box>
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
        {tr('dashboard.bookOn', { platform: reservationLabel(booking.reservationPlatform || '') })}
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
