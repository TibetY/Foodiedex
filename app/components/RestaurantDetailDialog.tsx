import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Close from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EventSeat from '@mui/icons-material/EventSeat';
import Language from '@mui/icons-material/Language';
import Facebook from '@mui/icons-material/Facebook';
import Instagram from '@mui/icons-material/Instagram';
import Twitter from '@mui/icons-material/Twitter';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import type { Restaurant, RestaurantRating } from '~/types/restaurant';
import type { ListTokens } from '~/listTheme';
import RestaurantThumb from '~/components/RestaurantThumb';
import Bubbles, { BubbleInput } from '~/components/Bubbles';
import { cuisineEmoji, placeTypeEmoji, dietEmoji, menuTypeEmoji } from '~/utils/cuisineEmoji';

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
  onAddVisit?: (restaurant: Restaurant) => void;
  /** Everyone's verdicts on this spot ("what everyone said"). */
  ratings?: RestaurantRating[];
  /** Signed-in user, so their own row can be split out and made editable. */
  currentUserId?: string;
  /** Save the current user's own bubbles + note. Absent = read-only view. */
  onRate?: (restaurant: Restaurant, rating: number, note: string) => Promise<void> | void;
}

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
  onAddVisit,
  ratings = [],
  currentUserId,
  onRate,
}: RestaurantDetailDialogProps) {
  const { t: tr } = useTranslation();
  const muiTheme = useTheme();
  const fullScreen = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [activeLoc, setActiveLoc] = useState(0);
  const [tab, setTab] = useState<'reservations' | 'hours' | 'instagram' | 'guides'>('reservations');
  // When a different restaurant is opened, default to the first location that
  // actually takes bookings so the "Reserve" action is visible without having to
  // hunt through tabs; fall back to the first location otherwise.
  useEffect(() => {
    const locs = restaurant?.locations ?? [];
    const bookable = locs.findIndex(
      (l) => l.reservationUrl || l.reservationPlatform === 'walkin'
    );
    setActiveLoc(bookable >= 0 ? bookable : 0);
    setTab('reservations');
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
  const rating = Math.round(shownRating);
  const myRating = currentUserId ? ratings.find((x) => x.userId === currentUserId) : undefined;
  const otherRatings = ratings.filter((x) => x.userId !== currentUserId);
  const initial = (r.name.replace(/^The /i, '')[0] || '?').toUpperCase();
  const isBeen = (r.status ?? 'want') === 'been';

  const sectionLabel = {
    display: 'block',
    color: t.muted,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '.05em',
    mb: '6px',
  };

  const chipSx = {
    background: t.searchBg,
    border: `1px solid ${t.pillBorder}`,
    color: t.muted,
    fontSize: 12.5,
  };

  const tabSx = {
    minHeight: 40,
    textTransform: 'none' as const,
    color: t.muted,
    fontSize: 13.5,
    '&.Mui-selected': { color: t.ink },
  };

  const hasLinks = Boolean(
    r.url || r.socialMedia?.facebook || r.socialMedia?.instagram || r.socialMedia?.twitter
  );

  /** Quiet empty state for a tab with no data yet (Hours/Guides, or no bookings). */
  const emptyTab = (label: string) => (
    <Box sx={{ py: '18px', textAlign: 'center', color: t.faint, fontSize: 13.5, fontStyle: 'italic' }}>
      {label}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      aria-labelledby="restaurant-detail-title"
      PaperProps={{
        sx: { background: t.cardBg, color: t.ink, borderRadius: fullScreen ? 0 : '22px', overflow: 'hidden' },
      }}
    >
      {/* Hero image / initial */}
      <Box sx={{ position: 'relative', height: 200 }}>
        <RestaurantThumb
          image={r.image}
          alt={r.name}
          initial={initial}
          serifFont={serifFont}
          tokens={t}
          initialFontSize={88}
          cuisine={r.cuisineType}
          sx={{ height: '100%' }}
        />
        <IconButton
          onClick={onClose}
          aria-label={tr('form.close')}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(0,0,0,0.45)',
            color: '#fff',
            '&:hover': { background: 'rgba(0,0,0,0.65)' },
          }}
        >
          <Close fontSize="small" />
        </IconButton>
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: isBeen ? t.beenBg : t.wantBg,
            color: isBeen ? t.beenFg : t.wantFg,
            fontSize: 11.5,
            fontWeight: 600,
            padding: '5px 11px',
            borderRadius: '999px',
          }}
        >
          {isBeen ? tr('dashboard.statusBeen') : tr('dashboard.statusWant')}
        </Box>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {/* Name + price + favourite */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box id="restaurant-detail-title" component="h2" sx={{ fontFamily: serifFont, fontSize: 30, m: 0, lineHeight: 1.1 }}>
            {r.name}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 'none' }}>
            {r.priceRange && (
              <Box component="span" sx={{ color: t.cost, fontSize: 17, fontWeight: 600, letterSpacing: '.03em' }}>
                {r.priceRange}
              </Box>
            )}
            {canEdit && onToggleFavorite ? (
              <IconButton
                onClick={() => onToggleFavorite(r)}
                aria-label={tr(r.favorite ? 'dashboard.unfavorite' : 'dashboard.favorite', { name: r.name })}
                aria-pressed={r.favorite ?? false}
                sx={{ color: r.favorite ? t.error : t.muted }}
              >
                {r.favorite ? <Favorite /> : <FavoriteBorder />}
              </IconButton>
            ) : r.favorite ? (
              <Favorite role="img" aria-label={tr('dashboard.favorited')} sx={{ color: t.error }} />
            ) : null}
          </Box>
        </Box>

        {/* Rating — group average, with the agreement line from the design */}
        <Box sx={{ mt: '8px', minHeight: 20, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {rating > 0 ? (
            <>
              <Bubbles value={shownRating} tokens={t} size={15} gap={6} />
              <Box component="span" sx={{ color: t.faint, fontSize: 12.5 }}>
                {ratings.length > 0
                  ? tr('detail.ratingSummary', {
                      rating: shownRating.toFixed(1),
                      count: ratings.length,
                    })
                  : shownRating.toFixed(1)}
              </Box>
            </>
          ) : (
            <Box component="span" sx={{ color: t.faint, fontSize: 13, fontStyle: 'italic' }}>
              {tr('detail.notRated')}
            </Box>
          )}
        </Box>

        {/* Times visited */}
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '6px', mt: '10px' }}>
          <Box component="span" sx={{ color: t.muted, fontSize: 13.5 }}>
            {tr('detail.visitedTimes', { count: r.visitCount ?? 0 })}
          </Box>
          {canEdit && onAddVisit && (
            <IconButton
              size="small"
              onClick={() => onAddVisit(r)}
              aria-label={tr('detail.addVisit')}
              title={tr('detail.addVisit')}
              sx={{
                color: t.accent,
                border: `1px solid ${t.pillBorder}`,
                p: '3px',
                '&:hover': { borderColor: t.accent, background: 'transparent' },
              }}
            >
              <AddIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>

        {/* Recognition: Michelin stars + Bib Gourmand */}
        {((r.michelinStars ?? 0) > 0 || r.bibGourmand) && (
          <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap', mt: '14px' }}>
            {(r.michelinStars ?? 0) > 0 && (
              <Chip
                size="small"
                label={tr('detail.michelin', { count: r.michelinStars }) + ' ' + '⭐'.repeat(r.michelinStars ?? 0)}
                sx={{ ...chipSx, background: t.pBg, color: t.pFg, fontWeight: 600 }}
              />
            )}
            {r.bibGourmand && (
              <Chip
                size="small"
                label={tr('form.bibGourmand')}
                sx={{ ...chipSx, background: t.pBg, color: t.pFg, fontWeight: 600 }}
              />
            )}
          </Box>
        )}

        {/* What everyone said — each member's own bubbles and note, with the
            signed-in user's row editable in place (design 1g). */}
        {(otherRatings.length > 0 || onRate) && (
          <Box sx={{ mt: '18px' }}>
            <Box component="span" sx={sectionLabel}>{tr('detail.everyoneSaid')}</Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px', mt: '10px' }}>
              {onRate && currentUserId && (
                <MyVerdict
                  tokens={t}
                  existing={myRating}
                  onSave={(value, note) => onRate(r, value, note)}
                />
              )}
              {otherRatings.map((x) => (
                <Box key={x.id} sx={{ display: 'flex', gap: '13px' }}>
                  <Box
                    aria-hidden
                    sx={{
                      width: 34,
                      height: 34,
                      flex: 'none',
                      borderRadius: '50%',
                      background: t.avatar3,
                      color: t.accent,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 11.5,
                      fontWeight: 600,
                      overflow: 'hidden',
                    }}
                  >
                    {x.profile?.avatarUrl ? (
                      <Box component="img" src={x.profile.avatarUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (x.profile?.displayName?.[0] ?? '?').toUpperCase()
                    )}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '9px', mb: '3px' }}>
                      <Box component="span" sx={{ fontSize: 13.5, fontWeight: 600 }}>
                        {x.profile?.displayName || tr('detail.someone')}
                      </Box>
                      <Bubbles value={x.rating} tokens={t} size={8} gap={3} />
                    </Box>
                    {x.note && (
                      <Box component="p" sx={{ m: 0, fontSize: 13, lineHeight: 1.5, color: t.muted }}>
                        {x.note}
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Cuisine + place types */}
        {(r.cuisineType || (r.placeTypes && r.placeTypes.length > 0)) && (
          <Box sx={{ mt: '16px' }}>
            <Box component="span" sx={sectionLabel}>{tr('detail.about')}</Box>
            <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {r.cuisineType && (
                <Chip
                  size="small"
                  label={`${cuisineEmoji(r.cuisineType)} ${tr(`cuisines.${r.cuisineType}`, r.cuisineType)}`}
                  sx={chipSx}
                />
              )}
              {r.placeTypes?.map((pt) => (
                <Chip key={pt} size="small" label={`${placeTypeEmoji(pt)} ${tr(`placeTypes.${pt}`, pt)}`} sx={chipSx} />
              ))}
            </Box>
          </Box>
        )}

        {/* Dietary */}
        {r.dietaryTags && r.dietaryTags.length > 0 && (
          <Box sx={{ mt: '16px' }}>
            <Box component="span" sx={sectionLabel}>{tr('form.dietaryTags')}</Box>
            <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {r.dietaryTags.map((tag) => (
                <Chip key={tag} size="small" label={`${dietEmoji(tag)} ${tr(`dietary.${tag}`, tag)}`} sx={chipSx} />
              ))}
            </Box>
          </Box>
        )}

        {/* Menu types */}
        {r.menuTypes && r.menuTypes.length > 0 && (
          <Box sx={{ mt: '16px' }}>
            <Box component="span" sx={sectionLabel}>{tr('form.menuTypes')}</Box>
            <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {r.menuTypes.map((m) => (
                <Chip key={m} size="small" label={`${menuTypeEmoji(m)} ${tr(`menuTypes.${m}`, m)}`} sx={chipSx} />
              ))}
            </Box>
          </Box>
        )}

        {/* Enrichment tabs — reservations · hours · instagram · guides */}
        <Box sx={{ mt: '18px' }}>
          <Tabs
            value={tab}
            onChange={(_, v: 'reservations' | 'hours' | 'instagram' | 'guides') => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            aria-label={tr('detail.tabsLabel')}
            sx={{ borderBottom: `1px solid ${t.border}`, minHeight: 40, '& .MuiTabs-indicator': { backgroundColor: t.accent } }}
          >
            <Tab value="reservations" label={tr('detail.tabReservations')} sx={tabSx} />
            <Tab value="hours" label={tr('detail.tabHours')} sx={tabSx} />
            <Tab value="instagram" label={tr('detail.tabInstagram')} sx={tabSx} />
            <Tab value="guides" label={tr('detail.tabGuides')} sx={tabSx} />
          </Tabs>

          <Box sx={{ pt: '14px' }}>
            {tab === 'reservations' && (
              <Box>
                {/* The location switcher lives OUTSIDE the has-details branch:
                    selecting a detail-less branch must never remove the tabs
                    (that trapped the user on the empty branch). */}
                {locations.length > 1 && (
                  <Tabs
                    value={safeIdx}
                    onChange={(_, v: number) => setActiveLoc(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ mb: '10px', minHeight: 36 }}
                  >
                    {locations.map((l, i) => (
                      <Tab
                        key={i}
                        label={l.label?.trim() || tr('form.locationN', { n: i + 1 })}
                        sx={{ minHeight: 36, textTransform: 'none', color: t.muted, '&.Mui-selected': { color: t.ink } }}
                      />
                    ))}
                  </Tabs>
                )}
                {loc.address || loc.phone || loc.email || loc.reservationUrl || loc.reservationPlatform === 'walkin' ? (
                <Box>
                  {loc.address && (
                    <Box sx={{ mb: '10px' }}>
                      <Box component="span" sx={sectionLabel}>{tr('form.address')}</Box>
                      <Box sx={{ color: t.ink, fontSize: 14 }}>{loc.address}</Box>
                    </Box>
                  )}
                  {(loc.phone || loc.email) && (
                    <Box sx={{ display: 'flex', gap: '4px' }}>
                      {loc.phone && (
                        <IconButton component="a" href={`tel:${loc.phone}`} aria-label={tr('detail.phone')} sx={{ color: t.muted }}>
                          <PhoneIcon fontSize="small" />
                        </IconButton>
                      )}
                      {loc.email && (
                        <IconButton component="a" href={`mailto:${loc.email}`} aria-label={tr('detail.email')} sx={{ color: t.muted }}>
                          <EmailIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  )}
                  {loc.reservationUrl && (
                    <Box sx={{ mt: '12px' }}>
                      <Button
                        variant="outlined"
                        component="a"
                        href={loc.reservationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<EventSeat fontSize="small" />}
                      >
                        {tr('dashboard.reserveOn', { platform: reservationLabel(loc.reservationPlatform || '') })}
                      </Button>
                    </Box>
                  )}
                  {!loc.reservationUrl && loc.reservationPlatform === 'walkin' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', mt: '12px', color: t.muted, fontSize: 14 }}>
                      <EventSeat fontSize="small" /> {tr('detail.walkinBadge')}
                    </Box>
                  )}
                </Box>
                ) : (
                  emptyTab(tr('detail.reservationsEmpty'))
                )}
              </Box>
            )}

            {tab === 'hours' && emptyTab(tr('detail.hoursEmpty'))}

            {tab === 'instagram' &&
              (hasLinks ? (
                <Box sx={{ display: 'flex', gap: '4px' }}>
                  {r.url && (
                    <IconButton component="a" href={r.url} target="_blank" rel="noopener noreferrer" aria-label={tr('form.websiteUrl')} sx={{ color: t.muted }}>
                      <Language fontSize="small" />
                    </IconButton>
                  )}
                  {r.socialMedia?.instagram && (
                    <IconButton component="a" href={r.socialMedia.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" sx={{ color: t.muted }}>
                      <Instagram fontSize="small" />
                    </IconButton>
                  )}
                  {r.socialMedia?.facebook && (
                    <IconButton component="a" href={r.socialMedia.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" sx={{ color: t.muted }}>
                      <Facebook fontSize="small" />
                    </IconButton>
                  )}
                  {r.socialMedia?.twitter && (
                    <IconButton component="a" href={r.socialMedia.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" sx={{ color: t.muted }}>
                      <Twitter fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ) : (
                emptyTab(tr('detail.socialEmpty'))
              ))}

            {tab === 'guides' && emptyTab(tr('detail.guidesEmpty'))}
          </Box>
        </Box>

        {/* Comment / notes — pull-quote treatment */}
        {r.comment && (
          <Box sx={{ mt: '18px', padding: '15px 17px', background: t.beenBg, borderRadius: '18px', color: t.ink, fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
            “{r.comment}”
          </Box>
        )}

        {/* Actions */}
        {canEdit && (
          <Box sx={{ display: 'flex', gap: '10px', mt: '24px' }}>
            <Button
              variant="contained"
              startIcon={<EditIcon fontSize="small" />}
              onClick={() => onEdit(r)}
              sx={{ background: t.accent, color: t.accentText, '&:hover': { background: t.accent, filter: 'brightness(0.95)' } }}
            >
              {tr('detail.edit')}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon fontSize="small" />}
              onClick={() => r.id && onDelete(r.id)}
            >
              {tr('detail.delete')}
            </Button>
          </Box>
        )}
      </DialogContent>
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
    <Box sx={{ display: 'flex', gap: '13px' }}>
      <Box
        aria-hidden
        sx={{
          width: 34,
          height: 34,
          flex: 'none',
          borderRadius: '50%',
          background: t.beenBg,
          color: t.beenFg,
          display: 'grid',
          placeItems: 'center',
          fontSize: 11.5,
          fontWeight: 600,
        }}
      >
        ★
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '9px', mb: '5px', flexWrap: 'wrap' }}>
          <Box component="span" sx={{ fontSize: 13.5, fontWeight: 600 }}>{tr('detail.yourBubbles')}</Box>
          <BubbleInput
            value={value}
            onChange={(next) => {
              setValue(next);
              void onSave(next, note);
            }}
            tokens={t}
            size={16}
            gap={6}
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
            fontSize: 13,
            color: t.ink,
            background: t.field,
            border: `1px solid ${t.fieldBorder}`,
            borderRadius: '12px',
            padding: '8px 12px',
            '&::placeholder': { color: t.faint },
            '&:focus': { outline: 'none', borderColor: t.accent },
          }}
        />
      </Box>
    </Box>
  );
}
