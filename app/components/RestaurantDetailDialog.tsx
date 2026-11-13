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
import EventOutlined from '@mui/icons-material/EventOutlined';
import NearMeOutlined from '@mui/icons-material/NearMeOutlined';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import Check from '@mui/icons-material/Check';
import BookmarkBorder from '@mui/icons-material/BookmarkBorder';
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
import ChevronRight from '@mui/icons-material/ChevronRight';
import { useTranslation } from 'react-i18next';
import type { Restaurant, RestaurantRating } from '~/types/restaurant';
import { haloSx, type ListTokens } from '~/listTheme';
import { decorate, monogram } from '~/utils/decorateRestaurant';
import { distinctionIds, distinctionLabel } from '~/utils/distinctions';
import { usePlacePhoto, photoSx } from '~/components/RestaurantThumb';
import MichelinStars from '~/components/MichelinStars';
import { ON_PHOTO, glassOnPhotoSx } from '~/components/PlacePills';
import { safeHttpUrl } from '~/utils/safeHref';
import Bubbles, { BubbleInput } from '~/components/Bubbles';

type Tokens = ListTokens;

function reservationLabel(platform: string): string {
  if (platform === 'resy') return 'Resy';
  if (platform === 'opentable') return 'OpenTable';
  if (platform === 'walkin') return '';
  return platform;
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
 * Everything about one place, read top to bottom on a phone: the photograph
 * with the name on it, the one-line summary and rating, a row of round actions
 * (Reserve, Directions, Call, Website), status and visits, the note, what
 * everyone said, a few plain tags, then the remaining links. Sections with no
 * data are simply absent; nothing renders an empty state.
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
  const photo = usePlacePhoto(restaurant?.image);
  if (!restaurant) return null;

  const r = restaurant;
  const locations = r.locations ?? [];
  const safeIdx = locations.length ? Math.min(activeLoc, locations.length - 1) : 0;
  const loc = locations[safeIdx] ?? {};
  const reservationUrl = safeHttpUrl(loc.reservationUrl);
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
  const honourIds = distinctionIds(r);

  // Cuisine is already in the meta line, and "Restaurant" says nothing here.
  const tags = [
    ...(r.placeTypes ?? []).filter((p) => p !== 'Restaurant' && p !== r.cuisineType).map((p) => tr(`placeTypes.${p}`, p)),
    ...(r.menuTypes ?? []).map((m) => tr(`menuTypes.${m}`, m)),
    ...(r.dietaryTags ?? []).map((d) => tr(`dietary.${d}`, d)),
  ];

  const links: { key: string; Icon: typeof SvgIcon; label: string; href: string; external?: boolean }[] = [];
  // Directions, call and website are the round action buttons; this list is
  // the rest.
  if (loc.email) links.push({ key: 'email', Icon: MailOutline, label: loc.email, href: `mailto:${loc.email}` });
  // Every stored link is re-checked here: rows can be written straight through
  // the database API, and this dialog is also shown on the public share page.
  const website = safeHttpUrl(r.url);
  const social = {
    instagram: safeHttpUrl(r.socialMedia?.instagram),
    facebook: safeHttpUrl(r.socialMedia?.facebook),
    twitter: safeHttpUrl(r.socialMedia?.twitter),
    tiktok: safeHttpUrl(r.socialMedia?.tiktok),
  };
  if (social.instagram) links.push({ key: 'ig', Icon: Instagram, label: 'Instagram', href: social.instagram, external: true });
  if (social.facebook) links.push({ key: 'fb', Icon: Facebook, label: 'Facebook', href: social.facebook, external: true });
  if (social.twitter) links.push({ key: 'x', Icon: Twitter, label: 'Twitter / X', href: social.twitter, external: true });
  if (social.tiktok) links.push({ key: 'tt', Icon: MusicNote, label: 'TikTok', href: social.tiktok, external: true });

  const sectionLabel = { color: t.muted, fontSize: 13, fontWeight: 600, mb: '10px' };
  const blockSx = { borderRadius: '22px', ...haloSx(t), padding: '18px' };
  const onPhoto = photo.show;
  /** Round button in the hero: frosted over a photo, a plain surface otherwise. */
  const heroButtonSx = {
    width: 44,
    height: 44,
    flex: 'none',
    ...(onPhoto ? glassOnPhotoSx : { background: t.cardBg, color: t.ink }),
    '&:hover': onPhoto ? { background: 'rgba(20,17,15,.65)' } : { background: t.raised },
  };
  const honourPillSx = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    height: 30,
    padding: '0 12px',
    borderRadius: '999px',
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    ...(onPhoto ? glassOnPhotoSx : { background: t.raised, color: t.ink }),
  };

  // The few things you do with a place, as one row of round buttons. Reserve is
  // the one in the accent.
  const actions: { key: string; Icon: typeof SvgIcon; label: string; href: string; external?: boolean; primary?: boolean }[] = [];
  if (reservationUrl) {
    actions.push({ key: 'reserve', Icon: EventOutlined, label: tr('detail.actionReserve'), href: reservationUrl, external: true, primary: true });
  }
  if (loc.address) {
    actions.push({
      key: 'directions',
      Icon: NearMeOutlined,
      label: tr('detail.actionDirections'),
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name} ${loc.address}`)}`,
      external: true,
    });
  }
  if (loc.phone) actions.push({ key: 'call', Icon: PhoneOutlined, label: tr('detail.actionCall'), href: `tel:${loc.phone}` });
  if (website) actions.push({ key: 'web', Icon: Language, label: tr('detail.actionWebsite'), href: website, external: true });

  const reservePlatform = reservationLabel(loc.reservationPlatform || '');

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
        // The photo scrolls away with the content instead of pinning half a
        // phone screen in place.
        sx: { background: t.pageBg, color: t.ink, borderRadius: fullScreen ? 0 : '28px', overflowY: 'auto', overflowX: 'hidden' },
      }}
    >
      {/* Hero — the photograph edge to edge with the name on it. A place with
          no photo gets its monogram on a softly lit header instead. */}
      <Box
        sx={{
          position: 'relative',
          flex: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '28px',
          minHeight: onPhoto ? { xs: 420, sm: 360 } : 0,
          // 28px of the hero sits under the sheet's rounded top edge.
          padding: { xs: '16px 16px 52px', sm: '16px 16px 52px' },
          color: onPhoto ? ON_PHOTO.ink : t.ink,
          ...(onPhoto ? {} : haloSx(t, t.pageBg)),
        }}
      >
        {r.image && photo.show && (
          <>
            <Box component="img" alt="" {...photo.imgProps} sx={photoSx(photo.pending)} />
            <Box aria-hidden sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,8,7,.35) 0%, rgba(10,8,7,0) 30%, rgba(10,8,7,.78) 100%)' }} />
          </>
        )}
        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
          <IconButton onClick={onClose} aria-label={tr('form.close')} sx={heroButtonSx}>
            {fullScreen ? <ChevronLeft /> : <Close fontSize="small" />}
          </IconButton>
          {canEdit && onToggleFavorite ? (
            <IconButton
              onClick={() => onToggleFavorite(r)}
              aria-label={tr(r.favorite ? 'dashboard.unfavorite' : 'dashboard.favorite', { name: r.name })}
              aria-pressed={r.favorite ?? false}
              sx={{ ...heroButtonSx, color: r.favorite ? (onPhoto ? t.onPhotoAccent : t.accent) : heroButtonSx.color }}
            >
              {r.favorite ? <Favorite sx={{ fontSize: 20 }} /> : <FavoriteBorder sx={{ fontSize: 20 }} />}
            </IconButton>
          ) : r.favorite ? (
            <Box sx={{ ...heroButtonSx, borderRadius: '50%', display: 'grid', placeItems: 'center', color: onPhoto ? t.onPhotoAccent : t.accent }}>
              <Favorite role="img" aria-label={tr('dashboard.favorited')} sx={{ fontSize: 20 }} />
            </Box>
          ) : null}
        </Box>

        <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px', px: '8px' }}>
          {!onPhoto && (
            <Box component="span" aria-hidden sx={{ fontSize: 72, fontWeight: 300, letterSpacing: '-.05em', lineHeight: 0.9, color: t.accent }}>
              {monogram(r.name)}
            </Box>
          )}
          {honourIds.length > 0 && (
            <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {honourIds.map((id) => {
                const stars = /^michelin-[123]$/.test(id) ? Number(id.slice(-1)) : 0;
                return (
                  <Box key={id} component="span" sx={honourPillSx}>
                    {stars > 0 ? (
                      <>
                        <MichelinStars count={stars} size={13} color={onPhoto ? t.onPhotoAccent : t.accent} />
                        <Box component="span" aria-hidden>Michelin</Box>
                      </>
                    ) : (
                      distinctionLabel(id)
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
          <Box id="restaurant-detail-title" component="h2" sx={{ fontFamily: serifFont, fontSize: { xs: 36, sm: 40 }, fontWeight: 600, letterSpacing: '-.045em', m: 0, lineHeight: 1.02, textWrap: 'balance' }}>
            {r.name}
          </Box>
        </Box>
      </Box>

      {/* The sheet: everything else, on the page colour, lapping over the hero. */}
      <Box
        sx={{
          position: 'relative',
          mt: '-28px',
          borderRadius: '28px 28px 0 0',
          ...haloSx(t, t.pageBg),
          padding: { xs: '24px 20px calc(28px + env(safe-area-inset-bottom))', sm: '24px 24px 28px' },
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Summary line and rating */}
        {(meta || shownRating > 0 || loc.address) && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(meta || shownRating > 0) && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <Box component="span" sx={{ color: t.muted, fontSize: 15, minWidth: 0 }}>{meta}</Box>
                {shownRating > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 'none' }}>
                    <Bubbles value={shownRating} tokens={t} size={8} gap={5} />
                    <Box component="span" sx={{ color: t.muted, fontSize: 14 }}>
                      {ratings.length > 0
                        ? tr('detail.ratingSummary', { rating: shownRating.toFixed(1), count: ratings.length })
                        : shownRating.toFixed(1)}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
            {loc.address && <Box sx={{ color: t.muted, fontSize: 14, lineHeight: 1.4 }}>{loc.address}</Box>}
          </Box>
        )}

        {/* The location switcher sits above everything that depends on it. */}
        {locations.length > 1 && (
          <Box role="group" sx={{ display: 'flex', padding: '4px', background: t.cardBg, borderRadius: '999px', width: 'fit-content', maxWidth: '100%', overflowX: 'auto' }}>
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
                  fontSize: 15,
                  fontWeight: 600,
                  height: 40,
                  padding: '0 16px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                  background: safeIdx === i ? t.raised : 'transparent',
                  color: safeIdx === i ? t.ink : t.muted,
                }}
              >
                {l.label?.trim() || tr('form.locationN', { n: i + 1 })}
              </Box>
            ))}
          </Box>
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px' }}>
            {actions.map(({ key, Icon, label, href, external, primary }) => (
              <Box
                key={key}
                component="a"
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                aria-label={key === 'reserve' && reservePlatform ? tr('dashboard.reserveOn', { platform: reservePlatform }) : undefined}
                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: t.ink, textDecoration: 'none', fontSize: 13, fontWeight: 600, textAlign: 'center', '&:active .action-disc': { transform: 'scale(.94)' } }}
              >
                <Box
                  className="action-disc"
                  sx={{ width: 60, height: 60, borderRadius: '50%', display: 'grid', placeItems: 'center', background: primary ? t.accent : t.cardBg, color: primary ? t.accentText : t.ink, transition: 'transform .12s ease' }}
                >
                  <Icon sx={{ fontSize: 22 }} />
                </Box>
                {label}
              </Box>
            ))}
          </Box>
        )}
        {!reservationUrl && loc.reservationPlatform === 'walkin' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', color: t.muted, fontSize: 14 }}>
            <EventSeatOutlined sx={{ fontSize: 18 }} /> {tr('detail.walkinBadge')}
          </Box>
        )}

        {/* Status + visits: the two things you update after a meal */}
        <Box sx={{ ...blockSx, padding: '10px 10px 10px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Box component="span" sx={{ flex: 1, minWidth: 0, color: t.muted, fontSize: 15 }}>
            {tr('detail.visitedTimes', { count: r.visitCount ?? 0 })}
          </Box>
          {canEdit && onAddVisit && (
            <IconButton onClick={() => onAddVisit(r)} aria-label={tr('detail.addVisit')} title={tr('detail.addVisit')} sx={{ width: 44, height: 44, background: t.raised, color: t.ink, '&:hover': { background: t.raised } }}>
              <AddIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flex: 'none',
              height: 44,
              padding: '0 16px',
              border: 'none',
              font: 'inherit',
              background: isBeen ? t.beenBg : t.wantBg,
              color: isBeen ? t.beenFg : t.wantFg,
              fontSize: 15,
              fontWeight: 600,
              borderRadius: '999px',
              cursor: statusInteractive ? 'pointer' : 'default',
            }}
          >
            {isBeen ? <Check sx={{ fontSize: 17 }} /> : <BookmarkBorder sx={{ fontSize: 17 }} />}
            {isBeen ? tr('dashboard.statusBeen') : tr('dashboard.statusWant')}
          </Box>
        </Box>

        {/* Note */}
        {r.comment && (
          <Box sx={blockSx}>
            <Box sx={{ ...sectionLabel, mb: '8px' }}>{tr('detail.noteLabel')}</Box>
            <Box sx={{ fontSize: 16, lineHeight: 1.5, whiteSpace: 'pre-wrap', textWrap: 'pretty' }}>{r.comment}</Box>
          </Box>
        )}

        {/* What everyone said — each member's own bubbles and note, with the
            signed-in user's row editable in place. */}
        {(otherRatings.length > 0 || onRate) && (
          <Box sx={blockSx}>
            <Box sx={sectionLabel}>{tr('detail.everyoneSaid')}</Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {onRate && currentUserId && (
                <MyVerdict tokens={t} existing={myRating} onSave={(value, note) => onRate(r, value, note)} />
              )}
              {otherRatings.map((x) => (
                <Box key={x.id} sx={{ display: 'flex', gap: '12px' }}>
                  <Box
                    aria-hidden
                    sx={{ width: 32, height: 32, flex: 'none', borderRadius: '50%', background: t.raised, color: t.ink, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600, overflow: 'hidden' }}
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
                      <Bubbles value={x.rating} tokens={t} size={7} gap={3} />
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
          <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <Box key={tag} component="span" sx={{ display: 'inline-flex', alignItems: 'center', height: 36, background: t.cardBg, color: t.muted, fontSize: 14, fontWeight: 600, padding: '0 14px', borderRadius: '999px' }}>
                {tag}
              </Box>
            ))}
          </Box>
        )}

        {/* Other ways to reach it — one grouped list, each row a full-width tap target */}
        {links.length > 0 && (
          <Box sx={{ ...blockSx, padding: 0, overflow: 'hidden' }}>
            {links.map(({ key, Icon, label, href, external }, i) => (
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
                  minHeight: 56,
                  padding: '10px 18px',
                  borderTop: i === 0 ? 'none' : `1px solid ${t.border}`,
                  color: t.ink,
                  textDecoration: 'none',
                  fontSize: 16,
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
          <Box sx={{ display: 'flex', gap: '10px' }}>
            <Button variant="outlined" onClick={() => onEdit(r)} sx={{ flex: 1, minHeight: 52 }}>
              {tr('detail.edit')}
            </Button>
            <Button variant="text" color="error" onClick={() => r.id && onDelete(r.id)} sx={{ color: t.error, minHeight: 52 }}>
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
          background: t.raised,
          border: `1px solid ${t.fieldBorder}`,
          borderRadius: '16px',
          padding: '12px 14px',
          '&::placeholder': { color: t.faint },
          '&:focus': { outline: 'none', borderColor: t.accent },
        }}
      />
    </Box>
  );
}
