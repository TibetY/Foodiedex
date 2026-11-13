import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import type { LoaderFunction, ActionFunction, LinksFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, Link, Form } from '@remix-run/react';
import leafletStylesHref from 'leaflet/dist/leaflet.css?url';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Bookmark from '@mui/icons-material/Bookmark';
import Search from '@mui/icons-material/Search';
import SearchOff from '@mui/icons-material/SearchOff';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import GridViewOutlined from '@mui/icons-material/GridViewOutlined';
import ViewListOutlined from '@mui/icons-material/ViewListOutlined';
import MapOutlined from '@mui/icons-material/MapOutlined';
import { useTranslation } from 'react-i18next';
import { createSupabaseServerClient } from '~/supabase.server';
import { getSharedList, forkSharedList, type SharedList } from '~/services/sharedList.server';
import { decorate } from '~/utils/decorateRestaurant';
import { defaultViewFor } from '~/utils/defaultView';
import { DEFAULT_SORT, sortPlaces, type SortMode } from '~/utils/sortPlaces';
import type { Restaurant } from '~/types/restaurant';
import RestaurantThumb from '~/components/RestaurantThumb';
import RestaurantDetailDialog from '~/components/RestaurantDetailDialog';

import PlaceCard from '~/components/PlaceCard';
import PlaceRow from '~/components/PlaceRow';
import { LogoMark } from '~/components/Logo';
import { useKanpaiTheme, FONT } from '~/listTheme';
import type { RestaurantMapProps } from '~/components/RestaurantMap';

const RestaurantMap = lazy<React.ComponentType<RestaurantMapProps>>(() =>
  import.meta.env.SSR
    ? Promise.resolve({ default: () => null })
    : import('~/components/RestaurantMap')
);

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: leafletStylesHref },
];

type LoaderData = {
  token: string;
  signedIn: boolean;
  shared: SharedList | null;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const token = params.token ?? '';
  const { supabase, headers } = createSupabaseServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const shared = await getSharedList(supabase, token);
  return json<LoaderData>(
    {
      token,
      signedIn: !!user,
      shared,
    },
    { headers }
  );
};

export const action: ActionFunction = async ({ request, params }) => {
  const token = params.token ?? '';
  const { supabase, headers } = createSupabaseServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Must be signed in to fork — send them to sign up / log in and back here.
  if (!user) {
    return redirect(`/login?next=${encodeURIComponent(`/s/${token}`)}`, { headers });
  }
  try {
    const newListId = await forkSharedList(supabase, token);
    return redirect(`/dashboard?list=${newListId}&forked=1`, { headers });
  } catch (error) {
    // The link likely expired between viewing and forking; reloading shows the
    // unavailable state if so.
    console.error('Error forking shared list:', error);
    return redirect(`/s/${encodeURIComponent(token)}`, { headers });
  }
};

const activateOnKey = (fn: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

type ViewMode = 'tile' | 'list' | 'map';
type FilterMode = 'all' | 'been' | 'want';
// The public page offers the orders that make sense without an account's data.
const SHARE_SORT_MODES: SortMode[] = ['name', 'recent', 'rating', 'rating_asc', 'price', 'price_desc'];

export default function SharedListPage() {
  const { token, signedIn, shared } = useLoaderData<LoaderData>();
  const { t: tr } = useTranslation();

  const { mode, tokens: t, setMode } = useKanpaiTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Until the visitor picks a view, a list short on photos opens as rows.
  const [chosenView, setView] = useState<ViewMode | null>(null);
  const view: ViewMode = chosenView ?? defaultViewFor(shared?.restaurants ?? []);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<SortMode>(DEFAULT_SORT);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Restaurant | null>(null);

  const serif = FONT;
  /** One option in a pill-shaped segmented control. */
  const segmentSx = (selected: boolean) => ({
    height: 40,
    padding: '0 14px',
    border: 0,
    borderRadius: '999px',
    cursor: 'pointer',
    font: 'inherit',
    fontSize: 15,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    background: selected ? t.raised : 'transparent',
    color: selected ? t.ink : t.muted,
    boxShadow: selected ? t.shadow1 : 'none',
  });

  const decorated = useMemo(() => (shared?.restaurants ?? []).map((r) => decorate(r)), [shared]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return decorated.filter((r) => {
      const matchesStatus =
        filter === 'all' ||
        (filter === 'been' && r.isBeen) ||
        (filter === 'want' && r.isWant);
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [decorated, filter, searchQuery]);

  const sorted = useMemo(() => sortPlaces(filtered, sort), [filtered, sort]);

  const total = decorated.length;
  const beenCount = decorated.filter((r) => r.isBeen).length;
  const wantCount = decorated.filter((r) => r.isWant).length;

  const openDetail = (r: Restaurant) => {
    setSelected(r);
    setDetailOpen(true);
  };

  const viewOptions: { id: ViewMode; label: string; Icon: typeof GridViewOutlined }[] = [
    { id: 'tile', label: tr('dashboard.viewTile'), Icon: GridViewOutlined },
    { id: 'list', label: tr('dashboard.viewList'), Icon: ViewListOutlined },
    { id: 'map', label: tr('dashboard.viewMap'), Icon: MapOutlined },
  ];

  // ---- Unavailable (missing / revoked / expired) -------------------------
  if (!shared) {
    return (
        <Box
          sx={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: 2,
            px: 3,
            background: t.pageBg,
            color: t.ink,
          }}
        >
          <Box sx={{ fontWeight: 700, fontSize: 34 }}>{tr('shared.unavailableTitle')}</Box>
          <Box sx={{ color: t.muted, maxWidth: 420 }}>{tr('shared.unavailableBody')}</Box>
          <Button component={Link} to="/" variant="contained" sx={{ mt: 1 }}>
            {tr('errors.backHome')}
          </Button>
        </Box>
    );
  }

  return (
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          background: t.pageBg,
          color: t.ink,
        }}
      >
        {/* header */}
        <Box
          component="header"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: 1320,
            mx: 'auto',
            padding: { xs: '14px 20px 0', md: '20px 40px 0' },
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LogoMark size={22} />
            <Box component={Link} to="/" sx={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.03em', color: t.ink, textDecoration: 'none', whiteSpace: 'nowrap', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>
              {tr('brand')}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <IconButton
              onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
              aria-label={mode === 'light' ? tr('dashboard.themeDark') : tr('dashboard.themeLight')}
              sx={{ width: 44, height: 44, background: t.cardBg, color: t.ink, '&:hover': { background: t.raised } }}
            >
              {mode === 'light' ? <DarkModeOutlined sx={{ fontSize: 20 }} /> : <LightModeOutlined sx={{ fontSize: 20 }} />}
            </IconButton>
          </Box>
        </Box>

        {/* body */}
        <Box sx={{ flexGrow: 1, width: '100%', maxWidth: 1320, mx: 'auto', padding: { xs: '20px 20px 0', md: '28px 40px 0' } }}>
          {/* title + save-a-copy */}
          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Box component="h1" sx={{ fontFamily: serif, fontSize: { xs: 34, md: 44 }, fontWeight: 600, letterSpacing: '-.04em', m: 0, lineHeight: 1.05 }}>
                {shared.list.name}
              </Box>
              <Box component="p" sx={{ color: t.muted, fontSize: 15, mt: '8px', mb: 0 }}>
                {shared.ownerName ? tr('shared.byline', { name: shared.ownerName }) + ' · ' : ''}
                {tr('dashboard.stats', { total, been: beenCount, want: wantCount })}
              </Box>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '6px', mt: '6px', color: t.faint, fontSize: 13 }}>
                {tr('shared.readOnly')}
              </Box>
            </Box>
            {/* Save a copy: signed-in posts the fork; signed-out routes via auth. */}
            {signedIn ? (
              <Form method="post">
                <input type="hidden" name="intent" value="fork" />
                <Button type="submit" variant="contained" startIcon={<Bookmark sx={{ fontSize: 18 }} />}>
                  {tr('shared.saveCopy')}
                </Button>
              </Form>
            ) : (
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button component={Link} to={`/signup?next=${encodeURIComponent(`/s/${token}`)}`} variant="contained" startIcon={<Bookmark sx={{ fontSize: 18 }} />}>
                  {tr('shared.createAccountToSave')}
                </Button>
                <Box component={Link} to={`/login?next=${encodeURIComponent(`/s/${token}`)}`} sx={{ color: t.accent, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                  {tr('shared.signInToSave')}
                </Box>
              </Box>
            )}
          </Box>

          {/* controls — the dashboard's: search, then status · sort · view */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: '12px 8px', md: '12px' }, mt: '20px', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            <Box
              component="label"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flex: { xs: '1 1 100%', md: '1 1 auto' },
                maxWidth: { md: 360 },
                minWidth: 0,
                height: 50,
                background: t.cardBg,
                borderRadius: '999px',
                padding: '0 18px',
                cursor: 'text',
                '&:focus-within': { boxShadow: `0 0 0 2px ${t.accent}` },
              }}
            >
              <Search aria-hidden sx={{ fontSize: 20, color: t.muted, flex: 'none' }} />
              <Box
                component="input"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                placeholder={tr('dashboard.searchPlaceholder')}
                aria-label={tr('dashboard.searchLabel')}
                sx={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: t.ink,
                  font: 'inherit',
                  // 16px — iOS auto-zooms on smaller inputs.
                  fontSize: 16,
                  width: '100%',
                  minWidth: 0,
                  '::placeholder': { color: t.muted, opacity: 1 },
                }}
              />
            </Box>
            <Box role="group" aria-label={tr('dashboard.filterStatusLabel')} sx={{ flex: { xs: '1 1 100%', md: 'none' }, ml: { md: 'auto' }, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '4px', background: t.cardBg, borderRadius: '999px' }}>
              {(['all', 'been', 'want'] as FilterMode[]).map((f) => (
                <Box key={f} component="button" type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} sx={segmentSx(filter === f)}>
                  {tr(f === 'all' ? 'dashboard.filterAll' : f === 'been' ? 'dashboard.filterBeen' : 'dashboard.filterWantShort')}
                </Box>
              ))}
            </Box>
            <Box
              component="select"
              value={sort}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSort(e.target.value as SortMode)}
              aria-label={tr('dashboard.sortLabel')}
              sx={{ flex: { xs: 1, md: 'none' }, minWidth: 0, background: t.cardBg, border: 'none', borderRadius: '999px', height: 48, padding: '0 16px', color: t.ink, font: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
            >
              {SHARE_SORT_MODES.map((m) => (
                <option key={m} value={m}>{tr(`dashboard.sort_${m}`)}</option>
              ))}
            </Box>
            <Box role="group" aria-label={tr('dashboard.viewLabel')} sx={{ flex: 'none', display: 'flex', padding: '4px', background: t.cardBg, borderRadius: '999px' }}>
              {viewOptions.map(({ id, label, Icon }) => (
                <Box
                  key={id}
                  component="button"
                  type="button"
                  aria-pressed={view === id}
                  aria-label={label}
                  title={label}
                  onClick={() => setView(id)}
                  sx={{ ...segmentSx(view === id), display: 'grid', placeItems: 'center', width: 44, padding: 0 }}
                >
                  <Icon sx={{ fontSize: 19 }} />
                </Box>
              ))}
            </Box>
          </Box>

          {/* content */}
          {sorted.length === 0 ? (
            <Box sx={{ mt: '24px', mb: '40px', textAlign: 'center', py: { xs: 6, md: 10 }, px: 3, borderRadius: '14px' }}>
              <SearchOff aria-hidden sx={{ fontSize: 40, color: t.faint, mb: 1.5 }} />
              <Box sx={{ fontSize: 24, fontWeight: 600, letterSpacing: '-.03em', mb: 1 }}>{tr('dashboard.noMatchesTitle')}</Box>
              <Box sx={{ color: t.muted, fontSize: 16 }}>{tr('dashboard.emptyTryFilter')}</Box>
            </Box>
          ) : view === 'map' ? (
            <Box sx={{ padding: '20px 0 40px', display: 'flex', gap: '16px', flexDirection: { xs: 'column', md: 'row' } }}>
              <Box sx={{ flex: { xs: 'none', md: 1 }, height: { xs: 420, md: 540 }, borderRadius: '28px', overflow: 'hidden', background: t.mapBg }}>
                {mounted ? (
                  <Suspense fallback={<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: t.muted }}>{tr('dashboard.loadingMap')}</Box>}>
                    <RestaurantMap restaurants={sorted} accent={t.accent} onSelect={openDetail} />
                  </Suspense>
                ) : null}
              </Box>
              <Box sx={{ width: { xs: '100%', md: 340 }, flex: 'none', height: { md: 540 }, overflowY: { md: 'auto' }, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sorted.map((r) => (
                  <Box key={r.id} role="button" tabIndex={0} aria-label={r.name} onClick={() => openDetail(r)} onKeyDown={activateOnKey(() => openDetail(r))}
                    sx={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '18px', background: t.cardBg, cursor: 'pointer' }}>
                    <RestaurantThumb image={r.image} name={r.name} tokens={t} sx={{ width: 48, aspectRatio: '1', borderRadius: '12px' }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</Box>
                      {r.meta && <Box sx={{ color: t.muted, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.meta}</Box>}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : view === 'list' ? (
            <Box sx={{ padding: '20px 0 40px', display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, gap: '8px' }}>
              {sorted.map((r) => (
                <PlaceRow key={r.id} r={r} tokens={t} onView={openDetail} />
              ))}
            </Box>
          ) : (
            <Box sx={{ padding: '20px 0 56px', display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(auto-fill, minmax(300px, 1fr))' }, gap: { xs: '14px', sm: '16px' } }}>
              {sorted.map((r) => (
                <PlaceCard key={r.id} r={r} tokens={t} onView={openDetail} />
              ))}
            </Box>
          )}
        </Box>

        <RestaurantDetailDialog
          open={detailOpen}
          restaurant={selected}
          canEdit={false}
          tokens={t}
          serifFont={serif}
          onClose={() => setDetailOpen(false)}
          onEdit={() => undefined}
          onDelete={() => undefined}
        />
      </Box>
  );
}
