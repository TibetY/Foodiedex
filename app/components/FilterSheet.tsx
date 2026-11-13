import { useState } from 'react';
import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import Drawer from '@mui/material/Drawer';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Tune from '@mui/icons-material/Tune';
import Close from '@mui/icons-material/Close';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import { useTranslation } from 'react-i18next';
import type { ListView } from '~/types/restaurant';
import type { ListTokens } from '~/listTheme';
import SavedViewsBar from '~/components/SavedViewsBar';
import { distinctionLabel } from '~/utils/distinctions';
import { DEFAULT_SORT } from '~/utils/sortPlaces';

type Tokens = ListTokens;
type MultiSetter = (updater: string[] | ((prev: string[]) => string[])) => void;

interface FilterSheetProps {
  tokens: Tokens;
  /** How many places the current filters leave, for the sheet's main button. */
  resultCount: number;
  cuisineOptions: string[];
  cityOptions: string[];
  costOptions: string[];
  placeOptions: string[];
  dietOptions: string[];
  menuOptions: string[];
  /** Distinction ids present in this list (see app/utils/distinctions.ts). */
  awardOptions: string[];
  sortModes: readonly string[];
  cuisineFilter: string;
  setCuisineFilter: (v: string) => void;
  cityFilter: string;
  setCityFilter: (v: string) => void;
  costFilter: string;
  setCostFilter: (v: string) => void;
  ratingFilter: number;
  setRatingFilter: (v: number) => void;
  placeFilter: string[];
  setPlaceFilter: MultiSetter;
  dietFilter: string[];
  setDietFilter: MultiSetter;
  menuFilter: string[];
  setMenuFilter: MultiSetter;
  awardFilter: string[];
  setAwardFilter: MultiSetter;
  sort: string;
  setSort: (v: string) => void;
  sortReversed: boolean;
  setSortReversed: (updater: boolean | ((prev: boolean) => boolean)) => void;
  onClear: () => void;
  views: ListView[];
  /** Canonical serialized current filter params, for the active-view highlight. */
  currentParams: string;
  hasActiveFilters: boolean;
  onApplyView: (view: ListView) => void;
  onSaveView: () => void;
  onRenameView: (view: ListView) => void;
  onDeleteView: (view: ListView) => void;
}

function toggle(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

/**
 * One Filters button. On a phone it opens a glass sheet from the bottom; on
 * wider screens a popover. All the facet controls live inside, grouped, so the
 * toolbar stays calm. Reads/writes the same URL-backed filter
 * state the dashboard owns (setters passed in), so views stay linkable.
 */
export default function FilterSheet(props: FilterSheetProps) {
  const { tokens: t } = props;
  const { t: tr } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);

  const activeCount =
    (props.cuisineFilter ? 1 : 0) +
    (props.cityFilter ? 1 : 0) +
    (props.costFilter ? 1 : 0) +
    (props.ratingFilter ? 1 : 0) +
    (props.placeFilter.length ? 1 : 0) +
    (props.dietFilter.length ? 1 : 0) +
    (props.menuFilter.length ? 1 : 0) +
    (props.awardFilter.length ? 1 : 0) +
    (props.sort !== DEFAULT_SORT ? 1 : 0) +
    (props.sortReversed ? 1 : 0);

  const pillSx = (selected: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    height: 44,
    padding: '0 16px',
    border: 'none',
    borderRadius: '999px',
    background: selected ? t.pBg : t.cardBg,
    color: selected ? t.pFg : t.ink,
    font: 'inherit',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'transform .12s ease',
    '&:active': { transform: 'scale(.96)' },
  });

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, maxHeight: 'inherit', width: { xs: 'auto', sm: 400 } }}>
      <Box sx={{ flex: 'none', padding: { xs: '10px 20px 0', sm: '20px 20px 0' } }}>
        <Box aria-hidden sx={{ display: { sm: 'none' }, width: 36, height: 5, borderRadius: '3px', background: t.divider, mx: 'auto', mb: '10px' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box component="h2" sx={{ m: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-.04em', lineHeight: 1.1 }}>
            {tr('filters.title')}
          </Box>
          <Box
            component="button"
            type="button"
            aria-label={tr('form.close')}
            onClick={() => setAnchor(null)}
            sx={{ display: 'grid', placeItems: 'center', flex: 'none', width: 44, height: 44, p: 0, border: 'none', borderRadius: '50%', background: t.cardBg, color: t.ink, cursor: 'pointer' }}
          >
            <Close sx={{ fontSize: 18 }} />
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px 4px' }}>
      {/* Saved views */}
      {(props.views.length > 0 || props.hasActiveFilters) && (
        <Box sx={{ mb: '18px' }}>
          <Box sx={{ fontSize: 13, fontWeight: 600, color: t.muted, mb: '10px' }}>
            {tr('views.title')}
          </Box>
          <SavedViewsBar
            tokens={t}
            views={props.views}
            currentParams={props.currentParams}
            hasActiveFilters={props.hasActiveFilters}
            onApply={props.onApplyView}
            onSave={props.onSaveView}
            onRename={props.onRenameView}
            onDelete={props.onDeleteView}
          />
        </Box>
      )}

      {/* Sort */}
      <Section tokens={t} label={tr('dashboard.sortLabel', 'Sort')}>
        {props.sortModes.map((m) => (
          <Box component="button" key={m} type="button" onClick={() => props.setSort(m)} sx={pillSx(props.sort === m)}>
            {tr(`dashboard.sort_${m}`)}
          </Box>
        ))}
        <Box
          component="button"
          type="button"
          onClick={() => props.setSortReversed((v) => !v)}
          aria-pressed={props.sortReversed}
          aria-label={tr('dashboard.sortReverse')}
          title={tr('dashboard.sortReverse')}
          sx={{ ...pillSx(props.sortReversed), justifyContent: 'center', width: 44, padding: 0 }}
        >
          {props.sortReversed ? <ArrowUpward sx={{ fontSize: 17 }} /> : <ArrowDownward sx={{ fontSize: 17 }} />}
        </Box>
      </Section>

      {/* Rating */}
      <Section tokens={t} label={tr('dashboard.rating')}>
        <Box component="button" type="button" onClick={() => props.setRatingFilter(0)} sx={pillSx(props.ratingFilter === 0)}>
          {tr('dashboard.anyRating')}
        </Box>
        {[5, 4, 3, 2, 1].map((n) => (
          <Box component="button" key={n} type="button" onClick={() => props.setRatingFilter(n)} sx={pillSx(props.ratingFilter === n)}>
            {tr('dashboard.ratingStars', { count: n })}
          </Box>
        ))}
      </Section>

      {/* Cost */}
      {props.costOptions.length > 0 && (
        <Section tokens={t} label={tr('dashboard.cost')}>
          <Box component="button" type="button" onClick={() => props.setCostFilter('')} sx={pillSx(!props.costFilter)}>
            {tr('dashboard.anyCost')}
          </Box>
          {props.costOptions.map((c) => (
            <Box component="button" key={c} type="button" onClick={() => props.setCostFilter(c)} sx={pillSx(props.costFilter === c)}>
              {c}
            </Box>
          ))}
        </Section>
      )}

      {/* Cuisine */}
      {props.cuisineOptions.length > 0 && (
        <Section tokens={t} label={tr('dashboard.cuisine')}>
          <Box component="button" type="button" onClick={() => props.setCuisineFilter('')} sx={pillSx(!props.cuisineFilter)}>
            {tr('dashboard.anyCuisine')}
          </Box>
          {props.cuisineOptions.map((c) => (
            <Box component="button" key={c} type="button" onClick={() => props.setCuisineFilter(c)} sx={pillSx(props.cuisineFilter === c)}>
              {tr(`cuisines.${c}`, c)}
            </Box>
          ))}
        </Section>
      )}

      {/* City */}
      {props.cityOptions.length > 0 && (
        <Section tokens={t} label={tr('dashboard.city')}>
          <Box component="button" type="button" onClick={() => props.setCityFilter('')} sx={pillSx(!props.cityFilter)}>
            {tr('dashboard.anyCity')}
          </Box>
          {props.cityOptions.map((c) => (
            <Box component="button" key={c} type="button" onClick={() => props.setCityFilter(c)} sx={pillSx(props.cityFilter === c)}>
              {c}
            </Box>
          ))}
        </Section>
      )}

      {/* Place types */}
      {props.placeOptions.length > 0 && (
        <Section tokens={t} label={tr('dashboard.placeType')}>
          {props.placeOptions.map((p) => (
            <Box component="button" key={p} type="button" aria-pressed={props.placeFilter.includes(p)} onClick={() => props.setPlaceFilter((prev) => toggle(prev, p))} sx={pillSx(props.placeFilter.includes(p))}>
              {tr(`placeTypes.${p}`, p)}
            </Box>
          ))}
        </Section>
      )}

      {/* Dietary */}
      {props.dietOptions.length > 0 && (
        <Section tokens={t} label={tr('dashboard.dietary')}>
          {props.dietOptions.map((d) => (
            <Box component="button" key={d} type="button" aria-pressed={props.dietFilter.includes(d)} onClick={() => props.setDietFilter((prev) => toggle(prev, d))} sx={pillSx(props.dietFilter.includes(d))}>
              {tr(`dietary.${d}`, d)}
            </Box>
          ))}
        </Section>
      )}

      {/* Menu types */}
      {props.menuOptions.length > 0 && (
        <Section tokens={t} label={tr('dashboard.menuType')}>
          {props.menuOptions.map((m) => (
            <Box component="button" key={m} type="button" aria-pressed={props.menuFilter.includes(m)} onClick={() => props.setMenuFilter((prev) => toggle(prev, m))} sx={pillSx(props.menuFilter.includes(m))}>
              {tr(`menuTypes.${m}`, m)}
            </Box>
          ))}
        </Section>
      )}

      {/* Distinctions */}
      {props.awardOptions.length > 0 && (
        <Section tokens={t} label={tr('form.distinctions')}>
          {props.awardOptions.map((a) => (
            <Box component="button" key={a} type="button" aria-pressed={props.awardFilter.includes(a)} onClick={() => props.setAwardFilter((prev) => toggle(prev, a))} sx={pillSx(props.awardFilter.includes(a))}>
              {distinctionLabel(a)}
            </Box>
          ))}
        </Section>
      )}

      </Box>

      {/* footer — the one accent button says what you'll get */}
      <Box sx={{ flex: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: { xs: '12px 20px calc(20px + env(safe-area-inset-bottom))', sm: '12px 20px 20px' } }}>
        {activeCount > 0 && (
          <Box
            component="button"
            type="button"
            onClick={props.onClear}
            sx={{ flex: 'none', height: 56, padding: '0 18px', border: 'none', borderRadius: '999px', background: 'transparent', color: t.muted, font: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            {tr('filters.clear')}
          </Box>
        )}
        <Box
          component="button"
          type="button"
          onClick={() => setAnchor(null)}
          sx={{ flex: 1, height: 56, border: 'none', borderRadius: '999px', background: t.accent, color: t.accentText, font: 'inherit', fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'transform .12s ease', '&:active': { transform: 'scale(.98)' } }}
        >
          {tr('filters.show', { count: props.resultCount })}
        </Box>
      </Box>
    </Box>
  );

  // Glass: a translucent surface with the page blurred behind it.
  const glassPaper = {
    backgroundColor: t.glass,
    backgroundImage: `radial-gradient(120% 70% at 100% 0%, ${t.halo} 0%, transparent 62%)`,
    color: t.ink,
    backdropFilter: 'blur(30px) saturate(1.2)',
    WebkitBackdropFilter: 'blur(30px) saturate(1.2)',
    boxShadow: `0 0 0 1px ${t.border}, 0 24px 60px rgba(0,0,0,.35)`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  } as const;

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={tr('filters.button')}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => setAnchor(e.currentTarget)}
        sx={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          flex: 'none',
          // A round button on a phone, a labelled pill beyond.
          width: { xs: 48, sm: 'auto' },
          height: { xs: 48, sm: 50 },
          padding: { xs: 0, sm: '0 18px' },
          border: 'none',
          borderRadius: '999px',
          background: t.cardBg,
          color: t.ink,
          font: 'inherit',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <Tune sx={{ fontSize: 20 }} />
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
          {tr('filters.button')}
        </Box>
        {/* An ember dot is the whole "filters are on" signal; the count is for screen readers. */}
        {activeCount > 0 && (
          <Box
            component="span"
            role="img"
            aria-label={tr('filters.activeCount', { count: activeCount })}
            sx={{ position: { xs: 'absolute', sm: 'static' }, top: 9, right: 10, width: 8, height: 8, borderRadius: '50%', background: t.accent }}
          />
        )}
      </Box>

      {isMobile ? (
        <Drawer
          anchor="bottom"
          open={open}
          onClose={() => setAnchor(null)}
          PaperProps={{ sx: { ...glassPaper, margin: '0 8px calc(8px + env(safe-area-inset-bottom))', borderRadius: '36px', maxHeight: 'calc(100dvh - 68px)' } }}
        >
          {content}
        </Drawer>
      ) : (
        <Popover
          open={open}
          anchorEl={anchor}
          onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ paper: { sx: { ...glassPaper, mt: 1, borderRadius: '28px', maxHeight: 'min(720px, calc(100dvh - 120px))' } } }}
        >
          {content}
        </Popover>
      )}
    </>
  );
}

function Section({ tokens: t, label, children }: { tokens: Tokens; label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: '18px' }}>
      <Box sx={{ fontSize: 13, fontWeight: 600, color: t.muted, mb: '10px' }}>
        {label}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{children}</Box>
    </Box>
  );
}
