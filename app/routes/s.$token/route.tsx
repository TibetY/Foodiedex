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
import type { Restaurant } from '~/types/restaurant';
import RestaurantThumb from '~/components/RestaurantThumb';
import RestaurantDetailDialog from '~/components/RestaurantDetailDialog';
import Bubbles from '~/components/Bubbles';
import PlaceCard from '~/components/PlaceCard';
import { LogoMark } from '~/components/Logo';
import { useKanpaiTheme } from '~/listTheme';
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
type SortMode = 'recent' | 'rating' | 'name' | 'price';
const SORT_MODES: SortMode[] = ['recent', 'rating', 'name', 'price'];

export default function SharedListPage() {
  const { token, signedIn, shared } = useLoaderData<LoaderData>();
  const { t: tr } = useTranslation();

  const { mode, tokens: t, setMode } = useKanpaiTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [view, setView] = useState<ViewMode>('tile');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Restaurant | null>(null);

  const serif = "'Archivo',sans-serif";

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

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case 'rating':
        arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'name':
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price':
        arr.sort((a, b) => (a.priceRange?.length ?? 0) - (b.priceRange?.length ?? 0));
        break;
      default:
        arr.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
        break;
    }
    return arr;
  }, [filtered, sort]);

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
            padding: { xs: '14px 18px', md: '18px 40px' },
            borderBottom: `1px solid ${t.border}`,
            background: t.panelBg,
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
            <LogoMark size={27} />
            <Box component={Link} to="/" sx={{ fontFamily: serif, fontSize: { xs: 20, sm: 26 }, letterSpacing: '.01em', color: t.ink, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              {tr('brand')}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <IconButton
              onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
              aria-label={mode === 'light' ? tr('dashboard.themeDark') : tr('dashboard.themeLight')}
              sx={{ color: t.muted }}
            >
              {mode === 'light' ? <DarkModeOutlined sx={{ fontSize: 20 }} /> : <LightModeOutlined sx={{ fontSize: 20 }} />}
            </IconButton>
          </Box>
        </Box>

        {/* body */}
        <Box sx={{ flexGrow: 1, width: '100%', maxWidth: 1320, mx: 'auto', padding: { xs: '24px 18px 0', md: '30px 40px 0' } }}>
          {/* title + save-a-copy */}
          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Box component="h1" sx={{ fontFamily: serif, fontSize: { xs: 34, md: 44 }, fontWeight: 600, letterSpacing: '-.02em', m: 0, lineHeight: 1.05 }}>
                {shared.list.name}
              </Box>
              <Box component="p" sx={{ color: t.muted, fontSize: 15, mt: '8px', mb: 0 }}>
                {shared.ownerName ? tr('shared.byline', { name: shared.ownerName }) + ' · ' : ''}
                {tr('dashboard.stats', { total, been: beenCount, want: wantCount })}
              </Box>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '6px', mt: '8px', color: t.faint, fontSize: 12.5 }}>
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

          {/* controls — same bar as the dashboard: search · status · sort · view */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: '8px', sm: '12px' }, mt: { xs: '20px', sm: '28px' }, flexWrap: 'wrap' }}>
            <Box
              component="label"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: { xs: '1 1 100%', sm: '1 1 auto' },
                maxWidth: { sm: 340 },
                height: 40,
                background: t.searchBg,
                borderRadius: '10px',
                padding: '0 12px',
                cursor: 'text',
              }}
            >
              <Search aria-hidden sx={{ fontSize: 18, color: t.faint, flex: 'none' }} />
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
                  // ≥16px on phones — iOS auto-zooms on smaller inputs.
                  fontSize: { xs: '16px', sm: '14px' },
                  width: '100%',
                  minWidth: 0,
                  '::placeholder': { color: t.faint },
                }}
              />
            </Box>
            <Box role="group" aria-label={tr('dashboard.filterStatusLabel')} sx={{ display: 'flex', gap: '2px', padding: '3px', background: t.track, borderRadius: '999px' }}>
              {(['all', 'been', 'want'] as FilterMode[]).map((f) => (
                <Box
                  key={f}
                  component="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  sx={{
                    border: 0,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: filter === f ? 600 : 400,
                    padding: { xs: '10px 12px', sm: '6px 14px' },
                    borderRadius: '999px',
                    background: filter === f ? t.cardBg : 'transparent',
                    color: filter === f ? t.ink : t.muted,
                    boxShadow: filter === f ? t.shadow1 : 'none',
                  }}
                >
                  {tr(f === 'all' ? 'dashboard.filterAll' : f === 'been' ? 'dashboard.filterBeen' : 'dashboard.filterWantShort')}
                </Box>
              ))}
            </Box>
            <Box
              component="select"
              value={sort}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSort(e.target.value as SortMode)}
              aria-label={tr('dashboard.sortLabel')}
              sx={{ background: t.searchBg, border: 'none', borderRadius: '10px', height: 40, padding: '0 12px', color: t.muted, fontSize: 14, cursor: 'pointer' }}
            >
              {SORT_MODES.map((m) => (
                <option key={m} value={m}>{tr(`dashboard.sort_${m}`)}</option>
              ))}
            </Box>
            <Box role="group" aria-label={tr('dashboard.viewLabel')} sx={{ ml: { sm: 'auto' }, display: 'flex', gap: '2px', padding: '3px', background: t.track, borderRadius: '999px' }}>
              {viewOptions.map(({ id, label, Icon }) => (
                <Box
                  key={id}
                  component="button"
                  aria-pressed={view === id}
                  aria-label={label}
                  title={label}
                  onClick={() => setView(id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 30,
                    border: 0,
                    cursor: 'pointer',
                    borderRadius: '999px',
                    background: view === id ? t.cardBg : 'transparent',
                    color: view === id ? t.ink : t.muted,
                    boxShadow: view === id ? t.shadow1 : 'none',
                  }}
                >
                  <Icon sx={{ fontSize: 19 }} />
                </Box>
              ))}
            </Box>
          </Box>

          {/* content */}
          {sorted.length === 0 ? (
            <Box sx={{ mt: '24px', mb: '40px', textAlign: 'center', py: { xs: 6, md: 10 }, px: 3, borderRadius: '16px', border: `1px solid ${t.border}`, background: t.cardBg }}>
              <SearchOff aria-hidden sx={{ fontSize: 40, color: t.faint, mb: 1.5 }} />
              <Box sx={{ fontFamily: serif, fontSize: 30, mb: 1 }}>{tr('dashboard.noMatchesTitle')}</Box>
              <Box sx={{ color: t.muted, fontSize: 15 }}>{tr('dashboard.emptyTryFilter')}</Box>
            </Box>
          ) : view === 'map' ? (
            <Box sx={{ padding: '24px 0 40px', display: 'flex', gap: '18px', flexDirection: { xs: 'column', md: 'row' } }}>
              <Box sx={{ flex: 1, height: 540, borderRadius: '16px', border: `1px solid ${t.border}`, overflow: 'hidden', background: t.mapBg }}>
                {mounted ? (
                  <Suspense fallback={<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: t.muted }}>{tr('dashboard.loadingMap')}</Box>}>
                    <RestaurantMap restaurants={sorted} accent={t.accent} onSelect={openDetail} />
                  </Suspense>
                ) : null}
              </Box>
              <Box sx={{ width: { xs: '100%', md: 330 }, flex: 'none', height: 540, overflowY: 'auto', border: `1px solid ${t.border}`, borderRadius: '16px', background: t.cardBg }}>
                {sorted.map((r) => (
                  <Box key={r.id} role="button" tabIndex={0} aria-label={r.name} onClick={() => openDetail(r)} onKeyDown={activateOnKey(() => openDetail(r))}
                    sx={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: `1px solid ${t.borderSoft}`, cursor: 'pointer', '&:hover': { filter: 'brightness(0.98)' } }}>
                    <RestaurantThumb image={r.image} name={r.name} tokens={t} sx={{ width: 54, borderRadius: '8px' }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</Box>
                      {r.meta && <Box sx={{ color: t.muted, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.meta}</Box>}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : view === 'list' ? (
            <Box sx={{ padding: { xs: '12px 0 40px', sm: '16px 0 40px' } }}>
              {sorted.map((r) => (
                <Box
                  key={r.id}
                  onClick={() => openDetail(r)}
                  sx={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', margin: '0 -12px', borderRadius: '10px', cursor: 'pointer', '&:hover': { background: t.rowHover } }}
                >
                  <RestaurantThumb image={r.image} name={r.name} tokens={t} sx={{ width: { xs: 72, sm: 96 }, borderRadius: '8px' }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      component="button"
                      type="button"
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); openDetail(r); }}
                      sx={{ fontSize: 16, fontWeight: 600, border: 'none', background: 'transparent', p: 0, m: 0, color: 'inherit', textAlign: 'left', cursor: 'pointer', display: 'block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {r.name}
                    </Box>
                    {r.meta && <Box sx={{ color: t.muted, fontSize: 14, mt: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.meta}</Box>}
                  </Box>
                  {r.rated && (
                    <Box sx={{ display: { xs: 'none', sm: 'block' }, flex: 'none' }}>
                      <Bubbles value={r.rating ?? 0} tokens={t} size={10} gap={4} />
                    </Box>
                  )}
                  {r.isWant && (
                    <Box component="span" sx={{ flex: 'none', fontSize: 12, color: t.muted, width: { sm: 80 }, textAlign: 'right' }}>
                      {tr('dashboard.statusWant')}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ padding: { xs: '20px 0 56px', sm: '28px 0 56px' } }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(auto-fill, minmax(160px, 1fr))', sm: 'repeat(auto-fill, minmax(240px, 1fr))' }, gap: { xs: '22px 12px', sm: '32px 20px' } }}>
                {sorted.map((r) => (
                  <PlaceCard key={r.id} r={r} tokens={t} onView={openDetail} />
                ))}
              </Box>
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
