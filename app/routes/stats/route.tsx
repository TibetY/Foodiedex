import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import type { LoaderFunction, LinksFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import leafletStylesHref from 'leaflet/dist/leaflet.css?url';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import IconButton from '@mui/material/IconButton';
import Download from '@mui/icons-material/Download';
import { useTranslation } from 'react-i18next';
import { createSupabaseServerClient } from '~/supabase.server';
import { getLists, ensureDefaultList } from '~/services/lists.server';
import { getRestaurants } from '~/services/restaurants.server';
import { getProfile } from '~/services/profiles.server';
import type { Restaurant } from '~/types/restaurant';
import { computeFoodStats, type LabelCount } from '~/utils/foodStats';
import { downloadShareCard, type ShareSize } from '~/utils/shareCard.client';
import { useKanpaiTheme, type ListTokens } from '~/listTheme';
import type { RestaurantMapProps } from '~/components/RestaurantMap';

const RestaurantMap = lazy<React.ComponentType<RestaurantMapProps>>(() =>
  import.meta.env.SSR
    ? Promise.resolve({ default: () => null })
    : import('~/components/RestaurantMap')
);

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: leafletStylesHref }];

type LoaderData = {
  /** Theme the request carries, so SSR paints the user's mode. */
  restaurants: Restaurant[];
  listId: string | null;
  listName: string;
  displayName: string | null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const { supabase, headers } = createSupabaseServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect('/login?next=/stats');

  const requestedListId = new URL(request.url).searchParams.get('list');
  let lists = await getLists(supabase, user.id);
  if (lists.length === 0) {
    await ensureDefaultList(supabase);
    lists = await getLists(supabase, user.id);
  }
  const activeList =
    lists.find((l) => l.id === requestedListId) ||
    lists.find((l) => l.isDefault) ||
    lists[0] ||
    null;

  const restaurants = activeList ? await getRestaurants(supabase, activeList.id) : [];
  const profile = await getProfile(supabase, user.id);

  return json<LoaderData>(
    {
      restaurants,
      listId: activeList?.id ?? null,
      listName: activeList?.name ?? 'My List',
      displayName: profile?.displayName ?? null,
    },
    { headers }
  );
};

export default function StatsPage() {
  const { restaurants, listId, listName } = useLoaderData<LoaderData>();
  const { t: tr } = useTranslation();

  const { mode, accent, tokens: t, setMode } = useKanpaiTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const stats = useMemo(() => computeFoodStats(restaurants), [restaurants]);
  const hasMap = useMemo(
    () =>
      restaurants.some((r) =>
        (r.locations ?? []).some((l) => typeof l.lat === 'number' && typeof l.lng === 'number')
      ),
    [restaurants]
  );

  const backHref = listId ? `/dashboard?list=${listId}` : '/dashboard';

  const share = (size: ShareSize) =>
    downloadShareCard(stats, {
      mode,
      accent,
      size,
      listName,
      brand: tr('brand'),
      labels: {
        spots: tr('stats.spotsWord'),
        cuisines: tr('stats.cuisinesWord'),
        cities: tr('stats.citiesWord'),
        visited: tr('stats.visitedWord'),
        topCuisines: tr('stats.topCuisines'),
        tagline: tr('stats.tagline'),
      },
    });

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
        {/* header — back, and the light/dark switch */}
        <Box
          component="header"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 980, mx: 'auto', padding: { xs: '14px 20px 0', md: '24px 40px 0' }, gap: 2 }}
        >
          <IconButton component={Link} to={backHref} aria-label={tr('stats.back')} sx={{ width: 44, height: 44, background: t.cardBg, color: t.ink, '&:hover': { background: t.raised } }}>
            <ChevronLeft />
          </IconButton>
          <IconButton
            onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
            aria-label={mode === 'light' ? tr('dashboard.themeDark') : tr('dashboard.themeLight')}
            sx={{ width: 44, height: 44, background: t.cardBg, color: t.ink, '&:hover': { background: t.raised } }}
          >
            {mode === 'light' ? <DarkModeOutlined sx={{ fontSize: 20 }} /> : <LightModeOutlined sx={{ fontSize: 20 }} />}
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, width: '100%', maxWidth: 980, mx: 'auto', padding: { xs: '14px 20px 48px', md: '20px 40px 64px' } }}>
          {stats.total === 0 ? (
            <Box sx={{ py: { xs: 6, md: 10 }, px: 3, textAlign: 'center', borderRadius: '28px', background: t.cardBg }}>
              <Box sx={{ fontWeight: 600, fontSize: 24, letterSpacing: '-.03em', mb: 1 }}>{tr('stats.emptyTitle')}</Box>
              <Box sx={{ color: t.muted, fontSize: 16, mb: 3 }}>{tr('stats.emptyBody')}</Box>
              <Button component={Link} to={backHref} variant="contained">{tr('stats.back')}</Button>
            </Box>
          ) : (
            <>
              {/* hero — the collection, as one big light numeral */}
              <Box sx={{ borderRadius: '28px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: t.cardBg, backgroundImage: `radial-gradient(100% 120% at 100% 0%, ${t.halo}, transparent 60%)` }}>
                <Box component="span" sx={{ fontSize: 14, fontWeight: 600, color: t.muted }}>{listName}</Box>
                <Box component="h1" sx={{ m: 0, fontWeight: 300, fontSize: { xs: 72, md: 96 }, letterSpacing: '-.06em', lineHeight: 1 }}>
                  {stats.total}
                  <Box component="span" sx={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}> {tr('stats.spotsWord')}</Box>
                </Box>
                <Box sx={{ color: t.muted, fontSize: 15 }}>
                  {tr('stats.heroLine', { been: stats.beenCount, want: stats.wantCount, favorites: stats.favoriteCount })}
                </Box>
              </Box>

              {/* stat tiles */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: '10px', mt: '10px' }}>
                <StatTile tokens={t} value={stats.cuisines.length} label={tr('stats.cuisinesWord')} />
                <StatTile tokens={t} value={stats.cities.length} label={tr('stats.citiesWord')} />
                <StatTile tokens={t} value={stats.averageRating ?? '—'} label={tr('stats.avgRating')} accent />
                <StatTile tokens={t} value={stats.totalMichelinStars} label={tr('stats.michelin')} />
              </Box>

              {/* breakdowns */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, gap: '10px', mt: '10px', alignItems: 'start' }}>
                <BarSection tokens={t} title={tr('stats.topCuisines')} rows={stats.cuisines.slice(0, 6)} />
                <BarSection tokens={t} title={tr('stats.cities')} rows={stats.cities.slice(0, 6)} emptyLabel={tr('stats.noCities')} />
                <BarSection tokens={t} title={tr('stats.priceRange')} rows={stats.priceTiers} mono />
                {stats.distinctions.length > 0 && (
                  <BarSection tokens={t} title={tr('form.distinctions')} rows={stats.distinctions.slice(0, 6)} longLabels />
                )}
                <MostVisited tokens={t} title={tr('stats.mostVisited')} rows={stats.topVisited} visitsLabel={(n) => tr('dashboard.visitsCount', { count: n })} emptyLabel={tr('stats.noVisits')} />
              </Box>

              {/* map */}
              {hasMap && (
                <Box sx={{ mt: '28px' }}>
                  <SectionTitle tokens={t}>{tr('stats.onMap')}</SectionTitle>
                  <Box sx={{ mt: '12px', height: 420, borderRadius: '28px', overflow: 'hidden', background: t.mapBg }}>
                    {mounted ? (
                      <Suspense fallback={<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: t.muted }}>{tr('dashboard.loadingMap')}</Box>}>
                        <RestaurantMap restaurants={restaurants} accent={t.accent} onSelect={() => undefined} />
                      </Suspense>
                    ) : null}
                  </Box>
                </Box>
              )}

              {/* share */}
              <Box sx={{ mt: '10px', padding: '22px', borderRadius: '28px', background: t.cardBg }}>
                <Box sx={{ fontWeight: 600, fontSize: 24, letterSpacing: '-.03em', color: t.ink }}>{tr('stats.shareTitle')}</Box>
                <Box sx={{ color: t.muted, fontSize: 14, mt: 1, mb: 2.5, maxWidth: 520 }}>{tr('stats.shareBody')}</Box>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Button onClick={() => share('square')} variant="contained" startIcon={<Download />}>{tr('stats.downloadSquare')}</Button>
                  <Button onClick={() => share('story')} variant="outlined" startIcon={<Download />} sx={{ background: t.raised }}>{tr('stats.downloadStory')}</Button>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Box>
  );
}

type Tokens = ListTokens;

function SectionTitle({ children, tokens: t }: { children: React.ReactNode; tokens: Tokens }) {
  return (
    <Box component="h2" sx={{ fontSize: 14, fontWeight: 600, color: t.ink, m: 0 }}>
      {children}
    </Box>
  );
}

function StatTile({ tokens: t, value, label, accent }: { tokens: Tokens; value: number | string; label: string; accent?: boolean }) {
  return (
    <Box sx={{ padding: '16px 18px', borderRadius: '22px', background: t.cardBg }}>
      <Box sx={{ fontWeight: 500, fontSize: 32, letterSpacing: '-.04em', lineHeight: 1.2, color: accent ? t.accent : t.ink }}>{value}</Box>
      <Box sx={{ color: t.muted, fontSize: 14 }}>{label}</Box>
    </Box>
  );
}

function BarSection({
  tokens: t,
  title,
  rows,
  mono,
  longLabels,
  emptyLabel,
}: {
  tokens: Tokens;
  title: string;
  rows: LabelCount[];
  mono?: boolean;
  /** Names too long for one short line (distinctions): a wider label that wraps instead of cutting off. */
  longLabels?: boolean;
  emptyLabel?: string;
}) {
  // Scale to the largest row, wherever it sits: price tiers are ordered by
  // tier, not by count, so the first row is not necessarily the biggest.
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Box sx={{ borderRadius: '22px', background: t.cardBg, padding: '18px' }}>
      <SectionTitle tokens={t}>{title}</SectionTitle>
      <Box sx={{ mt: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {rows.length === 0 ? (
          <Box sx={{ color: t.faint, fontSize: 14 }}>{emptyLabel ?? '—'}</Box>
        ) : (
          rows.map((r) => (
            <Box key={r.label} sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Box sx={{ width: longLabels ? { xs: 150, sm: 200 } : 104, flex: 'none', fontWeight: mono ? 600 : 400, fontSize: 14, lineHeight: 1.3, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: longLabels ? 'normal' : 'nowrap' }}>
                {r.label}
              </Box>
              <Box sx={{ flex: 1, height: 8, borderRadius: '999px', background: t.raised, overflow: 'hidden' }}>
                <Box sx={{ width: `${Math.max(6, (r.count / max) * 100)}%`, height: '100%', background: t.accent, borderRadius: '999px' }} />
              </Box>
              <Box sx={{ width: 24, flex: 'none', textAlign: 'right', fontSize: 14, color: t.muted }}>{r.count}</Box>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}

function MostVisited({
  tokens: t,
  title,
  rows,
  visitsLabel,
  emptyLabel,
}: {
  tokens: Tokens;
  title: string;
  rows: { name: string; visitCount: number }[];
  visitsLabel: (n: number) => string;
  emptyLabel: string;
}) {
  return (
    <Box sx={{ borderRadius: '22px', background: t.cardBg, padding: '18px' }}>
      <SectionTitle tokens={t}>{title}</SectionTitle>
      <Box sx={{ mt: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {rows.length === 0 ? (
          <Box sx={{ color: t.faint, fontSize: 14 }}>{emptyLabel}</Box>
        ) : (
          rows.map((r, i) => (
            <Box key={`${r.name}-${i}`} sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Box sx={{ fontWeight: 300, fontSize: 20, color: t.accent, width: 22, flex: 'none' }}>{i + 1}</Box>
              <Box sx={{ flex: 1, fontWeight: 600, fontSize: 15, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</Box>
              <Box sx={{ color: t.muted, fontSize: 13, flex: 'none' }}>{visitsLabel(r.visitCount)}</Box>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
