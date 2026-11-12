import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import type SvgIcon from '@mui/material/SvgIcon';
import Close from '@mui/icons-material/Close';
import EventSeatOutlined from '@mui/icons-material/EventSeatOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import Language from '@mui/icons-material/Language';
import Facebook from '@mui/icons-material/Facebook';
import Instagram from '@mui/icons-material/Instagram';
import Twitter from '@mui/icons-material/Twitter';
import MusicNote from '@mui/icons-material/MusicNote';
import MailOutline from '@mui/icons-material/MailOutline';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import AddIcon from '@mui/icons-material/Add';
import Star from '@mui/icons-material/Star';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { useTranslation } from 'react-i18next';
import type { Restaurant, RestaurantRating } from '~/types/restaurant';
import type { ListTokens } from '~/listTheme';
import { decorate } from '~/utils/decorateRestaurant';
import { distinctionLabels } from '~/utils/distinctions';
import RestaurantThumb from '~/components/RestaurantThumb';
import Bubbles, { BubbleInput } from '~/components/Bubbles';

type Tokens = ListTokens;

function reservationLabel(platform: string): string {
  if (platform === 'resy') return 'Resy';
  if (platform === 'opentable') return 'OpenTable';
  if (platform === 'walkin') return '';
  return platform;
}

/** "https://www.lecoucou.com/menus" → "lecoucou.com", for a link row's label. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

interface RestaurantDetailDialogProps {
  open: boolean;
  restaurant: Restaurant | null;
  canEdit: boolean;
  tokens: Tokens;
  serifFont: string;
  onClose: () => void;
  onEdit: (restaurant: Restaurant) => void;
  onDelete: (id: string) => void;
  onToggleFavorite?: (restaurant: Restaurant) => void;
  /** Flip been / want. The cards no longer carry this, so it lives here. */
  onToggleStatus?: (restaurant: Restaurant) => void;
  onAddVisit?: (restaurant: Restaurant) => void;
  /** Everyone's verdicts on this spot ("what everyone said"). */
  ratings?: RestaurantRating[];
  /** Signed-in user, so their own row can be split out and made editable. */
  currentUserId?: string;
  /** Save the current user's own bubbles + note. Absent = read-only view. */
  onRate?: (restaurant: Restaurant, rating: number, note: string) => Promise<void> | void;
}

/**
 * Everything about one place, read top to bottom on a phone: the photo, the
 * name and its one-line summary, the rating, the one primary action (Reserve),
 * the note, what everyone said, a few plain tags, then a single list of links —
 * address, phone, email, website, socials. Sections with no data are simply
 * absent; nothing renders an empty state.
 */
export default function RestaurantDetailDialog({
  open,
  restaurant,
  canEdit,
  tokens: t,
  serifFont,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  onToggleStatus,
  onAddVisit,
  ratings = [],
  currentUserId,
  onRate,
}: RestaurantDetailDialogProps) {
  const { t: tr } = useTranslation();
  const muiTheme = useTheme();
  const fullScreen = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [activeLoc, setActiveLoc] = useState(0);
  // When a different restaurant is opened, default to the first location that
  // actually takes bookings so the "Reserve" action is visible straight away;
  // fall back to the first location otherwise.
  useEffect(() => {
    const locs = restaurant?.locations ?? [];
    const bookable = locs.findIndex(
      (l) => l.reservationUrl || l.reservationPlatform === 'walkin'
    );
    setActiveLoc(bookable >= 0 ? bookable : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id]);
  if (!restaurant) return null;

  const r = restaurant;
  const locations = r.locations ?? [];
  const safeIdx = locations.length ? Math.min(activeLoc, locations.length - 1) : 0;
  const loc = locations[safeIdx] ?? {};
  // The headline score is the group's average once anyone has rated
  // individually; the spot's own column stays the fallback for everything
  // added before per-person ratings existed.
  const groupAvg =
    ratings.length > 0
      ? ratings.reduce((sum, x) => sum + x.rating, 0) / ratings.length
      : null;
  const shownRating = groupAvg ?? r.rating ?? 0;
  const myRating = currentUserId ? ratings.find((x) => x.userId === currentUserId) : undefined;
  const otherRatings = ratings.filter((x) => x.userId !== currentUserId);
  const isBeen = (r.status ?? 'want') === 'been';
  const statusInteractive = canEdit && onToggleStatus;
  const meta = decorate(r).meta;
  const honours = distinctionLabels(r);

  // Cuisine is already in the meta line, and "Restaurant" says nothing here.
  const tags = [
    ...(r.placeTypes ?? []).filter((p) => p !== 'Restaurant' && p !== r.cuisineType).map((p) => tr(`placeTypes.${p}`, p)),
    ...(r.menuTypes ?? []).map((m) => tr(`menuTypes.${m}`, m)),
    ...(r.dietaryTags ?? []).map((d) => tr(`dietary.${d}`, d)),
  ];

  const links: { key: string; Icon: typeof SvgIcon; label: string; href: string; external?: boolean }[] = [];
  if (loc.address) {
    links.push({
      key: 'address',
      Icon: PlaceOutlined,
      label: loc.address,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name} ${loc.address}`)}`,
      external: true,
    });
  }
  if (loc.phone) links.push({ key: 'phone', Icon: PhoneOutlined, label: loc.phone, href: `tel:${loc.phone}` });
  if (loc.email) links.push({ key: 'email', Icon: MailOutline, label: loc.email, href: `mailto:${loc.email}` });
  if (r.url) links.push({ key: 'web', Icon: Language, label: hostOf(r.url), href: r.url, external: true });
  if (r.socialMedia?.instagram) links.push({ key: 'ig', Icon: Instagram, label: 'Instagram', href: r.socialMedia.instagram, external: true });
  if (r.socialMedia?.facebook) links.push({ key: 'fb', Icon: Facebook, label: 'Facebook', href: r.socialMedia.facebook, external: true });
  if (r.socialMedia?.twitter) links.push({ key: 'x', Icon: Twitter, label: 'Twitter / X', href: r.socialMedia.twitter, external: true });
  if (r.socialMedia?.tiktok) links.push({ key: 'tt', Icon: MusicNote, label: 'TikTok', href: r.socialMedia.tiktok, external: true });

  const sectionLabel = { color: t.muted, fontSize: 12, fontWeight: 600, mb: '10px' };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      scroll="paper"
      aria-labelledby="restaurant-detail-title"
      PaperProps={{
        // The photo scrolls away with the content instead of pinning a third of
        // a phone screen in place.
        sx: { background: t.cardBg, color: t.ink, borderRadius: fullScreen ? 0 : '22px', overflowY: 'auto', border: 'none' },
      }}
    >
      {/* Hero — a place with no photo gets no hero at all, just room for the
          close button, instead of a large empty tile repeating its name. */}
      <Box sx={{ position: 'relative', flex: 'none', minHeight: 60 }}>
        {r.image && <RestaurantThumb image={r.image} name={r.name} tokens={t} sx={{ borderRadius: 0 }} />}
        <IconButton
          onClick={onClose}
          aria-label={tr('form.close')}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 44,
            height: 44,
            background: r.image ? 'rgba(0,0,0,0.45)' : t.track,
            color: r.image ? '#fff' : t.ink,
            '&:hover': { background: r.image ? 'rgba(0,0,0,0.65)' : t.skeleton },
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ padding: { xs: '20px 18px 28px', sm: '24px 28px 28px' }, pt: r.image ? undefined : '4px !important' }}>
        {/* Name + favourite */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box id="restaurant-detail-title" component="h2" sx={{ fontFamily: serifFont, fontSize: 28, fontWeight: 600, letterSpacing: '-.02em', m: 0, lineHeight: 1.15 }}>
            {r.name}
          </Box>
          {canEdit && onToggleFavorite ? (
            <IconButton
              onClick={() => onToggleFavorite(r)}
              aria-label={tr(r.favorite ? 'dashboard.unfavorite' : 'dashboard.favorite', { name: r.name })}
              aria-pressed={r.favorite ?? false}
              sx={{ color: r.favorite ? t.error : t.muted, width: 44, height: 44, mt: '-8px', mr: '-10px', flex: 'none' }}
            >
              {r.favorite ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
          ) : r.favorite ? (
            <Favorite role="img" aria-label={tr('dashboard.favorited')} sx={{ color: t.error, flex: 'none', mt: '4px' }} />
          ) : null}
        </Box>

        {meta && <Box sx={{ mt: '4px', color: t.muted, fontSize: 16 }}>{meta}</Box>}

        {/* Rating — group average, with how many of us rated it */}
        {shownRating > 0 && (
          <Box sx={{ mt: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bubbles value={shownRating} tokens={t} size={13} gap={5} />
            <Box component="span" sx={{ color: t.muted, fontSize: 14 }}>
              {ratings.length > 0
                ? tr('detail.ratingSummary', { rating: shownRating.toFixed(1), count: ratings.length })
                : shownRating.toFixed(1)}
            </Box>
          </Box>
        )}

        {/* Recognition */}
        {honours.length > 0 && (
          <Box sx={{ mt: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: t.ink, fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
            <Star aria-hidden sx={{ fontSize: 16, flex: 'none', alignSelf: 'flex-start', mt: '2px' }} />
            <Box component="span" sx={{ minWidth: 0 }}>{honours.join(' · ')}</Box>
          </Box>
        )}

        {/* Status + visits: the two things you update after a meal */}
        <Box sx={{ mt: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Box
            component={statusInteractive ? 'button' : 'span'}
            type={statusInteractive ? 'button' : undefined}
            onClick={statusInteractive ? () => onToggleStatus(r) : undefined}
            title={statusInteractive ? tr('dashboard.toggleStatus') : undefined}
            aria-label={
              statusInteractive
                ? tr('dashboard.markAs', {
                    name: r.name,
                    status: isBeen ? tr('dashboard.markWant') : tr('dashboard.markBeen'),
                  })
                : undefined
            }
            sx={{
              border: 'none',
              font: 'inherit',
              background: isBeen ? t.beenBg : t.wantBg,
              color: isBeen ? t.beenFg : t.wantFg,
              fontSize: 14,
              fontWeight: 600,
              padding: '8px 14px',
              borderRadius: '999px',
              cursor: statusInteractive ? 'pointer' : 'default',
              // The pill stays compact; its tap area reaches 44px.
              position: 'relative',
              '&::after': statusInteractive ? { content: '""', position: 'absolute', inset: '-4px' } : undefined,
            }}
          >
            {isBeen ? tr('dashboard.statusBeen') : tr('dashboard.statusWant')}
          </Box>
          <Box component="span" sx={{ color: t.muted, fontSize: 14 }}>
            {tr('detail.visitedTimes', { count: r.visitCount ?? 0 })}
          </Box>
          {canEdit && onAddVisit && (
            <IconButton
              onClick={() => onAddVisit(r)}
              aria-label={tr('detail.addVisit')}
              title={tr('detail.addVisit')}
              sx={{
                color: t.ink,
                border: `1px solid ${t.border}`,
                width: 36,
                height: 36,
                p: 0,
                ml: '-2px',
                // Same compact look; the tap area reaches 44px.
                '&::after': { content: '""', position: 'absolute', inset: '-5px' },
              }}
            >
              <AddIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </Box>

        {/* The location switcher sits above everything that depends on it. */}
        {locations.length > 1 && (
          <Box role="group" sx={{ mt: '20px', display: 'flex', gap: '2px', padding: '3px', background: t.track, borderRadius: '999px', width: 'fit-content', maxWidth: '100%', overflowX: 'auto' }}>
            {locations.map((l, i) => (
              <Box
                key={i}
                component="button"
                type="button"
                aria-pressed={safeIdx === i}
                onClick={() => setActiveLoc(i)}
                sx={{
                  border: 0,
                  cursor: 'pointer',
                  font: 'inherit',
                  fontSize: 14,
                  fontWeight: safeIdx === i ? 600 : 400,
                  padding: '7px 14px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                  background: safeIdx === i ? t.cardBg : 'transparent',
                  color: safeIdx === i ? t.ink : t.muted,
                  boxShadow: safeIdx === i ? t.shadow1 : 'none',
                }}
              >
                {l.label?.trim() || tr('form.locationN', { n: i + 1 })}
              </Box>
            ))}
          </Box>
        )}

        {/* The one primary action */}
        {loc.reservationUrl ? (
          <Button
            variant="contained"
            component="a"
            href={loc.reservationUrl}
            target="_blank"
            rel="noopener noreferrer"
            fullWidth
            sx={{ mt: '20px' }}
          >
            {reservationLabel(loc.reservationPlatform || '')
              ? tr('dashboard.reserveOn', { platform: reservationLabel(loc.reservationPlatform || '') })
              : tr('dashboard.book')}
          </Button>
        ) : loc.reservationPlatform === 'walkin' ? (
          <Box sx={{ mt: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: t.muted, fontSize: 14 }}>
            <EventSeatOutlined sx={{ fontSize: 18 }} /> {tr('detail.walkinBadge')}
          </Box>
        ) : null}

        {/* Note */}
        {r.comment && (
          <Box sx={{ mt: '24px', color: t.ink, fontSize: 16, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
            {r.comment}
          </Box>
        )}

        {/* What everyone said — each member's own bubbles and note, with the
            signed-in user's row editable in place. */}
        {(otherRatings.length > 0 || onRate) && (
          <Box sx={{ mt: '28px' }}>
            <Box sx={sectionLabel}>{tr('detail.everyoneSaid')}</Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {onRate && currentUserId && (
                <MyVerdict tokens={t} existing={myRating} onSave={(value, note) => onRate(r, value, note)} />
              )}
              {otherRatings.map((x) => (
                <Box key={x.id} sx={{ display: 'flex', gap: '12px' }}>
                  <Box
                    aria-hidden
                    sx={{ width: 32, height: 32, flex: 'none', borderRadius: '50%', background: t.avatar3, color: t.ink, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600, overflow: 'hidden' }}
                  >
                    {x.profile?.avatarUrl ? (
                      <Box component="img" src={x.profile.avatarUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (x.profile?.displayName?.[0] ?? '?').toUpperCase()
                    )}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '9px', mb: '3px' }}>
                      <Box component="span" sx={{ fontSize: 14, fontWeight: 600 }}>
                        {x.profile?.displayName || tr('detail.someone')}
                      </Box>
                      <Bubbles value={x.rating} tokens={t} size={8} gap={3} />
                    </Box>
                    {x.note && (
                      <Box component="p" sx={{ m: 0, fontSize: 14, lineHeight: 1.5, color: t.muted }}>
                        {x.note}
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Tags — plain labels, one row */}
        {tags.length > 0 && (
          <Box sx={{ mt: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <Box key={tag} component="span" sx={{ background: t.chip, color: t.muted, fontSize: 14, padding: '5px 10px', borderRadius: '8px' }}>
                {tag}
              </Box>
            ))}
          </Box>
        )}

        {/* Links — one list, each row a full-width tap target */}
        {links.length > 0 && (
          <Box sx={{ mt: '24px', borderTop: `1px solid ${t.border}` }}>
            {links.map(({ key, Icon, label, href, external }) => (
              <Box
                key={key}
                component="a"
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  minHeight: 52,
                  padding: '10px 0',
                  borderBottom: `1px solid ${t.border}`,
                  color: t.ink,
                  textDecoration: 'none',
                  fontSize: 16,
                  '&:hover': { color: t.accent },
                }}
              >
                <Icon sx={{ fontSize: 20, color: t.muted, flex: 'none' }} />
                <Box component="span" sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{label}</Box>
                <ChevronRight aria-hidden sx={{ fontSize: 20, color: t.faint, flex: 'none' }} />
              </Box>
            ))}
          </Box>
        )}

        {/* Edit / delete — quiet, at the very end */}
        {canEdit && (
          <Box sx={{ display: 'flex', gap: '10px', mt: '24px' }}>
            <Button variant="outlined" onClick={() => onEdit(r)} sx={{ flex: 1 }}>
              {tr('detail.edit')}
            </Button>
            <Button variant="text" color="error" onClick={() => r.id && onDelete(r.id)} sx={{ color: t.error }}>
              {tr('detail.delete')}
            </Button>
          </Box>
        )}
      </Box>
    </Dialog>
  );
}

/**
 * The signed-in user's own row in "what everyone said": their bubbles, always
 * editable in place, plus an optional one-line note. Saves on change (bubbles)
 * or on blur (note) so there's no separate submit button to hunt for.
 */
function MyVerdict({
  tokens: t,
  existing,
  onSave,
}: {
  tokens: Tokens;
  existing?: RestaurantRating;
  onSave: (rating: number, note: string) => Promise<void> | void;
}) {
  const { t: tr } = useTranslation();
  const [value, setValue] = useState(existing?.rating ?? 0);
  const [note, setNote] = useState(existing?.note ?? '');

  // Re-seed when the dialog is pointed at a different spot (or the saved row
  // arrives after a revalidate) — otherwise the previous spot's verdict sticks.
  useEffect(() => {
    setValue(existing?.rating ?? 0);
    setNote(existing?.note ?? '');
  }, [existing?.id, existing?.rating, existing?.note]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', mb: '8px', flexWrap: 'wrap' }}>
        <Box component="span" sx={{ fontSize: 14, fontWeight: 600 }}>{tr('detail.yourBubbles')}</Box>
        <BubbleInput
          value={value}
          onChange={(next) => {
            setValue(next);
            void onSave(next, note);
          }}
          tokens={t}
          size={20}
          gap={8}
          ariaLabel={tr('detail.yourBubbles')}
        />
      </Box>
      <Box
        component="input"
        value={note}
        placeholder={tr('detail.yourNotePlaceholder')}
        aria-label={tr('detail.yourNote')}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNote(e.target.value)}
        onBlur={() => {
          if ((existing?.note ?? '') !== note && value > 0) void onSave(value, note);
        }}
        sx={{
          width: '100%',
          font: 'inherit',
          // 16px so iOS doesn't zoom the page when the field takes focus.
          fontSize: 16,
          color: t.ink,
          background: t.field,
          border: `1px solid ${t.fieldBorder}`,
          borderRadius: '10px',
          padding: '10px 12px',
          '&::placeholder': { color: t.faint },
          '&:focus': { outline: 'none', borderColor: t.accent },
        }}
      />
    </Box>
  );
}
