import { useState } from 'react';
import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import Drawer from '@mui/material/Drawer';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import FilterList from '@mui/icons-material/FilterList';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import { useTranslation } from 'react-i18next';
import type { ListView } from '~/types/restaurant';
import type { ListTokens } from '~/listTheme';
import SavedViewsBar from '~/components/SavedViewsBar';

type Tokens = ListTokens;
type MultiSetter = (updater: string[] | ((prev: string[]) => string[])) => void;

interface FilterSheetProps {
  tokens: Tokens;
  cuisineOptions: string[];
  cityOptions: string[];
  costOptions: string[];
  placeOptions: string[];
  dietOptions: string[];
  menuOptions: string[];
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
 * Collapses the old overflowing chip row into one Filters button. On desktop it
 * opens a popover; on mobile a bottom sheet. All the facet controls live inside,
 * grouped, so the toolbar stays calm. Reads/writes the same URL-backed filter
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
    (props.sort !== 'recent' ? 1 : 0) +
    (props.sortReversed ? 1 : 0);

  const pillSx = (selected: boolean) => ({
    border: `1px solid ${selected ? t.pBg : t.pillBorder}`,
    background: selected ? t.pBg : 'transparent',
    color: selected ? t.pFg : t.muted,
    borderRadius: '999px',
    padding: '6px 13px',
    fontSize: '14px',
    cursor: 'pointer',
    lineHeight: 1.4,
    transition: 'transform .12s ease',
    '&:active': { transform: 'scale(.96)' },
  });

  const content = (
    <Box sx={{ p: { xs: 2.5, sm: 2 }, width: { xs: 'auto', sm: 340 } }}>
      {/* Saved views */}
      {(props.views.length > 0 || props.hasActiveFilters) && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: t.faint, mb: 1 }}>
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
          sx={{ ...pillSx(props.sortReversed), display: 'inline-flex', alignItems: 'center', padding: '6px 10px' }}
        >
          {props.sortReversed ? <ArrowUpward sx={{ fontSize: 15 }} /> : <ArrowDownward sx={{ fontSize: 15 }} />}
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
            <Box component="button" key={c} type="button" onClick={() => props.setCostFilter(c)} sx={{ ...pillSx(props.costFilter === c), fontWeight: 600 }}>
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

      {/* footer */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2.5, pt: 2, borderTop: `1px solid ${t.border}` }}>
        <Box
          component="button"
          type="button"
          onClick={props.onClear}
          disabled={activeCount === 0}
          sx={{ border: 'none', background: 'transparent', color: activeCount === 0 ? t.faint : t.muted, fontSize: '14px', cursor: activeCount === 0 ? 'default' : 'pointer' }}
        >
          {tr('dashboard.clearFilters')}
        </Box>
        <Box
          component="button"
          type="button"
          onClick={() => setAnchor(null)}
          sx={{ border: 'none', background: t.accent, color: t.accentText, fontWeight: 600, fontSize: '14px', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', transition: 'transform .12s ease', '&:active': { transform: 'scale(.96)' } }}
        >
          {tr('filters.done')}
        </Box>
      </Box>
    </Box>
  );

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
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          border: `1px solid ${activeCount ? t.pBg : t.pillBorder}`,
          background: activeCount ? t.pBg : 'transparent',
          color: activeCount ? t.pFg : t.muted,
          borderRadius: '10px',
          height: 40,
          padding: '0 14px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        <FilterList sx={{ fontSize: 18 }} />
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
          {tr('filters.button')}
        </Box>
        {activeCount > 0 && (
          <Box component="span" sx={{ minWidth: 18, height: 18, px: '5px', borderRadius: '999px', background: activeCount ? t.pFg : t.accent, color: activeCount ? t.pBg : t.accentText, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {activeCount}
          </Box>
        )}
      </Box>

      {isMobile ? (
        <Drawer
          anchor="bottom"
          open={open}
          onClose={() => setAnchor(null)}
          PaperProps={{ sx: { background: t.panelBg, borderRadius: '22px 22px 0 0', maxHeight: '82vh' } }}
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
          slotProps={{ paper: { sx: { mt: 1, background: t.panelBg, border: `1px solid ${t.border}`, borderRadius: '18px' } } }}
        >
          {content}
        </Popover>
      )}
    </>
  );
}

function Section({ tokens: t, label, children }: { tokens: Tokens; label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: t.faint, mb: 1 }}>
        {label}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{children}</Box>
    </Box>
  );
}
