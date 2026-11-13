import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { LoaderFunction, ActionFunction, LinksFunction, redirect, json } from '@remix-run/node';
import leafletStylesHref from 'leaflet/dist/leaflet.css?url';
import {
  useLoaderData,
  useRevalidator,
  useSearchParams,
  useNavigate,
  useNavigation,
  type ShouldRevalidateFunction,
} from '@remix-run/react';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Add from '@mui/icons-material/Add';
import Logout from '@mui/icons-material/Logout';
import PersonAddAlt1 from '@mui/icons-material/PersonAddAlt1';
import Person from '@mui/icons-material/Person';
import Close from '@mui/icons-material/Close';
import Search from '@mui/icons-material/Search';
import SearchOff from '@mui/icons-material/SearchOff';
import RestaurantOutlined from '@mui/icons-material/RestaurantOutlined';
import Insights from '@mui/icons-material/Insights';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import GridViewOutlined from '@mui/icons-material/GridViewOutlined';
import ViewListOutlined from '@mui/icons-material/ViewListOutlined';
import TableRowsOutlined from '@mui/icons-material/TableRowsOutlined';
import MapOutlined from '@mui/icons-material/MapOutlined';
import { createSupabaseServerClient } from '~/supabase.server';
import { getRestaurants } from '~/services/restaurants.server';
import {
  getLists,
  getListMembers,
  getInviteLink,
  getShareLink,
  ensureDefaultList,
} from '~/services/lists.server';
import { getProfile } from '~/services/profiles.server';
import { getListViews } from '~/services/views.server';
import { getListRatings } from '~/services/ratings.server';
import type {
  Restaurant,
  RestaurantList,
  ListMember,
  InviteLink,
  ShareLink,
  Profile,
  ListView,
  RestaurantRating,
} from '~/types/restaurant';
import { decorate, type DecoratedRestaurant } from '~/utils/decorateRestaurant';
import { defaultViewFor } from '~/utils/defaultView';
import { DEFAULT_SORT, SORT_MODES, parseSortMode, sortPlaces, type SortMode } from '~/utils/sortPlaces';
import { DISTINCTIONS, distinctionIds } from '~/utils/distinctions';
import {
  FILTER_PARAM_KEYS,
  serializeFilterParams,
  applyViewParams,
} from '~/utils/filterParams';
import RestaurantFormDialog from '~/components/RestaurantFormDialog';
import RestaurantDetailDialog from '~/components/RestaurantDetailDialog';
import RestaurantThumb from '~/components/RestaurantThumb';
import DeleteConfirmDialog from '~/components/DeleteConfirmDialog';
import ListSwitcher from '~/components/ListSwitcher';
import ShareListDialog from '~/components/ShareListDialog';
import Onboarding from '~/components/Onboarding';
import FilterSheet from '~/components/FilterSheet';
import Bubbles from '~/components/Bubbles';
import PlaceCard from '~/components/PlaceCard';
import PlaceRow from '~/components/PlaceRow';
import SkeletonCard, { SkeletonListRow } from '~/components/SkeletonCard';
import { LogoMark } from '~/components/Logo';
import { uploadRestaurantImage, ingestRestaurantImage } from '~/services/storage.client';
import {
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  setRestaurantStatus,
  setRestaurantFavorite,
  setRestaurantVisitCount,
} from '~/services/restaurants.client';
import { createList, updateList, deleteList } from '~/services/lists.client';
import { createListView, renameListView, deleteListView } from '~/services/views.client';
import { upsertMyRating } from '~/services/ratings.client';
import { geocodeAddress } from '~/services/geocode.client';
import type { RestaurantMapProps } from '~/components/RestaurantMap';

// Leaflet touches `window` at import time, so it must never load on the server.
// `import.meta.env.SSR` is inlined as a constant per build, so the real import
// is dead code in the SSR bundle (Rollup tree-shakes it out entirely) and only
// the browser bundle ever pulls in Leaflet.
const RestaurantMap = lazy<React.ComponentType<RestaurantMapProps>>(() =>
  import.meta.env.SSR
    ? Promise.resolve({ default: () => null })
    : import('~/components/RestaurantMap')
);

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: leafletStylesHref },
];
import { useTranslation } from 'react-i18next';
import { useKanpaiTheme, FONT } from '~/listTheme';

/**
 * Turn whatever was thrown into a human-readable message. Supabase/PostgREST
 * errors are plain objects (not Error instances), so `error.message` alone is
 * lost behind a generic fallback — pull message/details/hint/code off them so
 * the banner shows the real cause (missing table, RLS recursion, bad key, …).
 */
function describeError(e: unknown): string {
  if (e && typeof e === 'object') {
    const o = e as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };
    const parts = [o.message, o.details, o.hint].filter(Boolean);
    if (parts.length) {
      return parts.join(' — ') + (o.code ? ` (${o.code})` : '');
    }
  }
  if (e instanceof Error) return e.message;
  return 'Could not load your lists. Please try again.';
}

type LoaderData = {
  userId: string;
  lists: RestaurantList[];
  activeList: RestaurantList | null;
  restaurants: Restaurant[];
  members: ListMember[];
  inviteLink: InviteLink | null;
  shareLink: ShareLink | null;
  profile: Profile | null;
  views: ListView[];
  /** Everyone's per-person verdicts, keyed by restaurant id. */
  ratings: Record<string, RestaurantRating[]>;
  error: string | null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const { supabase, headers } = createSupabaseServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const requestedListId = new URL(request.url).searchParams.get('list');

  try {
    let lists = await getLists(supabase, user.id);
    // Recover accounts that predate the new-user bootstrap trigger: give them a
    // default list once, then reload.
    if (lists.length === 0) {
      await ensureDefaultList(supabase);
      lists = await getLists(supabase, user.id);
    }
    const activeList =
      lists.find((l) => l.id === requestedListId) ||
      lists.find((l) => l.isDefault) ||
      lists[0] ||
      null;

    let restaurants: Restaurant[] = [];
    let members: ListMember[] = [];
    let inviteLink: InviteLink | null = null;
    let shareLink: ShareLink | null = null;
    let views: ListView[] = [];
    let ratings: Record<string, RestaurantRating[]> = {};
    if (activeList) {
      restaurants = await getRestaurants(supabase, activeList.id);
      members = await getListMembers(supabase, activeList.id);
      views = await getListViews(supabase, activeList.id, user.id);
      ratings = await getListRatings(
        supabase,
        restaurants.map((r) => r.id).filter((id): id is string => !!id)
      );
      if (activeList.role === 'owner') {
        inviteLink = await getInviteLink(supabase, activeList.id);
        shareLink = await getShareLink(supabase, activeList.id);
      }
    }
    const profile = await getProfile(supabase, user.id);

    return json<LoaderData>(
      {
        userId: user.id,
        lists,
        activeList,
        restaurants,
        members,
        inviteLink,
        shareLink,
        profile,
        views,
        ratings,
        error: null,
      },
      { headers }
    );
  } catch (error) {
    console.error('Error loading dashboard:', error);
    return json<LoaderData>(
      {
        userId: user.id,
        lists: [],
        activeList: null,
        restaurants: [],
        members: [],
        inviteLink: null,
        shareLink: null,
        profile: null,
        views: [],
        ratings: {},
        error: describeError(error),
      },
      { headers }
    );
  }
};

export const action: ActionFunction = async ({ request }) => {
  const { supabase, headers } = createSupabaseServerClient(request);
  const formData = await request.formData();
  if (formData.get('intent') === 'logout') {
    await supabase.auth.signOut();
    return redirect('/login', { headers });
  }
  return json({ success: true });
};

/**
 * The filter/sort/search params live in the URL, but the loader never reads them
 * (filtering is client-side) — so a navigation that only changes those keys must
 * NOT re-run the loader. Without this, every search keystroke triggered a loader
 * round-trip and the controlled input reverted to the stale URL value, eating
 * characters. Manual revalidation (same URL) and real changes (list/join/forked,
 * form posts) still revalidate normally.
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}) => {
  if (formMethod && formMethod !== 'GET') return defaultShouldRevalidate;
  if (currentUrl.pathname !== nextUrl.pathname) return defaultShouldRevalidate;
  // Same href = a manual revalidator.revalidate() after a mutation — let it run.
  if (currentUrl.href === nextUrl.href) return defaultShouldRevalidate;
  const withoutFilters = (url: URL) => {
    const p = new URLSearchParams(url.search);
    FILTER_PARAM_KEYS.forEach((k) => p.delete(k));
    p.sort();
    return p.toString();
  };
  if (withoutFilters(currentUrl) === withoutFilters(nextUrl)) return false;
  return defaultShouldRevalidate;
};

type ViewMode = 'tile' | 'list' | 'table' | 'map';
type FilterMode = 'all' | 'been' | 'want';

/** Parse a comma-joined multi-select param into a clean string[] ('' → []). */
function parseCsv(raw: string | null): string[] {
  return raw ? raw.split(',').filter(Boolean) : [];
}

/** Set a searchParam to a value, or remove it entirely when the value is empty. */
function setOrDelete(params: URLSearchParams, key: string, value: string): void {
  if (value) params.set(key, value);
  else params.delete(key);
}

/** Make a non-button clickable element keyboard-operable (Enter/Space). */
function activateOnKey(fn: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn();
    }
  };
}

export default function Dashboard() {
  const data = useLoaderData<LoaderData>();
  const {
    userId,
    lists,
    activeList,
    restaurants: initialRestaurants,
    members,
    inviteLink,
    shareLink,
    profile,
    views,
    ratings,
    error,
  } = data;
  const revalidator = useRevalidator();
  const navigation = useNavigation();
  const { t: tr } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants);
  const { mode, tokens: t, setMode } = useKanpaiTheme();
  // The Leaflet map is client-only; render it after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Until the user picks a view, a list short on photos opens as rows.
  const [chosenView, setView] = useState<ViewMode | null>(null);
  const view: ViewMode = chosenView ?? defaultViewFor(restaurants);
  // Switching lists re-runs the loader while the OLD list's rows are still on
  // screen — show shimmering placeholders for that window. Filter-only URL
  // changes are skipped by shouldRevalidate and never flash skeletons.
  const pendingListId =
    navigation.state === 'loading' && navigation.location?.pathname === '/dashboard'
      ? new URLSearchParams(navigation.location.search).get('list')
      : undefined;
  const listLoading = pendingListId !== undefined && pendingListId !== searchParams.get('list');
  // Map ↔ side-list hover sync (map view). The id is a restaurant's sync key
  // (`id ?? name`, matching RestaurantMap); refs let a pin-hover scroll its row
  // into view.
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const mapRowRefs = useRef<Map<string, HTMLElement>>(new Map());
  useEffect(() => {
    if (!hoveredId) return;
    mapRowRefs.current.get(hoveredId)?.scrollIntoView({ block: 'nearest' });
  }, [hoveredId]);

  // Filters & sort live in the URL (searchParams) so any view is linkable and
  // the browser's back/forward steps through filter states — this is also the
  // foundation for saved views. Only non-default values are written, so a clean
  // list keeps a clean URL. The theme (`mode`), the active `view`, and the
  // `list`/`join`/`forked` params are managed separately and left untouched here.
  const filter: FilterMode = ((): FilterMode => {
    const s = searchParams.get('status');
    return s === 'been' || s === 'want' ? s : 'all';
  })();
  // Search text is LOCAL state so typing is instant (a controlled input bound
  // straight to the URL reverts to the stale param while the navigation is
  // pending, eating keystrokes). It syncs both ways with the `q` param below:
  // local → URL debounced, URL → local when q changes externally (saved view,
  // clear filters, back/forward).
  const urlQ = searchParams.get('q') ?? '';
  const [searchQuery, setSearchQuery] = useState(urlQ);
  const lastPushedQ = useRef(urlQ);
  useEffect(() => {
    // q changed in the URL and it wasn't our own debounced write — adopt it.
    if (urlQ !== lastPushedQ.current) {
      lastPushedQ.current = urlQ;
      setSearchQuery(urlQ);
    }
  }, [urlQ]);
  const cuisineFilter = searchParams.get('cuisine') ?? '';
  const cityFilter = searchParams.get('city') ?? '';
  const costFilter = searchParams.get('cost') ?? '';
  const ratingFilter = Math.min(5, Math.max(0, Math.floor(Number(searchParams.get('rating')) || 0)));
  // Multi-select facets are comma-joined; memoize on the raw string so the array
  // reference is stable across renders (keeps `filtered`/`sorted` from churning).
  const placeParam = searchParams.get('place');
  const dietParam = searchParams.get('diet');
  const menuParam = searchParams.get('menu');
  const awardParam = searchParams.get('award');
  const placeFilter = useMemo(() => parseCsv(placeParam), [placeParam]);
  const dietFilter = useMemo(() => parseCsv(dietParam), [dietParam]);
  const menuFilter = useMemo(() => parseCsv(menuParam), [menuParam]);
  const awardFilter = useMemo(() => parseCsv(awardParam), [awardParam]);
  const sort: SortMode = ((): SortMode => {
    const s = searchParams.get('sort');
    return parseSortMode(s);
  })();
  // Flip whatever the chosen sort's natural order is (e.g. Name Z→A, oldest
  // first, lowest rated first). Kept separate from `sort` so the dropdown still
  // names the primary key.
  const sortReversed = searchParams.get('rev') === '1';

  // Mutate one or more filter params while preserving everything else (list,
  // join, forked, …). Discrete changes push a history entry (so back/forward
  // works); the free-text search replaces so typing doesn't flood history.
  const updateFilterParams = (
    mutate: (p: URLSearchParams) => void,
    opts?: { replace?: boolean }
  ) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        mutate(next);
        return next;
      },
      { replace: opts?.replace ?? false }
    );
  };
  const setFilter = (v: FilterMode) =>
    updateFilterParams((p) => setOrDelete(p, 'status', v === 'all' ? '' : v));
  const setCuisineFilter = (v: string) =>
    updateFilterParams((p) => setOrDelete(p, 'cuisine', v));
  const setCityFilter = (v: string) =>
    updateFilterParams((p) => setOrDelete(p, 'city', v));
  const setCostFilter = (v: string) =>
    updateFilterParams((p) => setOrDelete(p, 'cost', v));
  const setRatingFilter = (v: number) =>
    updateFilterParams((p) => setOrDelete(p, 'rating', v ? String(v) : ''));
  const setSort = (v: SortMode) =>
    updateFilterParams((p) => setOrDelete(p, 'sort', v === DEFAULT_SORT ? '' : v));
  // Array setters accept a value or a functional updater (mirroring useState),
  // reading prev from the params being mutated so rapid toggles never go stale.
  const makeCsvSetter =
    (key: string) => (next: string[] | ((prev: string[]) => string[])) =>
      updateFilterParams((p) => {
        const prev = parseCsv(p.get(key));
        const value = typeof next === 'function' ? next(prev) : next;
        setOrDelete(p, key, value.join(','));
      });
  const setPlaceFilter = makeCsvSetter('place');
  const setDietFilter = makeCsvSetter('diet');
  const setMenuFilter = makeCsvSetter('menu');
  const setAwardFilter = makeCsvSetter('award');
  const setSortReversed = (next: boolean | ((prev: boolean) => boolean)) =>
    updateFilterParams((p) => {
      const prev = p.get('rev') === '1';
      const value = typeof next === 'function' ? next(prev) : next;
      setOrDelete(p, 'rev', value ? '1' : '');
    });

  // Local search → `q` param, debounced. `replace` keeps typing out of history;
  // filtering itself reads the local state, so results update instantly.
  useEffect(() => {
    if (searchQuery === urlQ) return;
    const timer = setTimeout(() => {
      lastPushedQ.current = searchQuery;
      updateFilterParams((p) => setOrDelete(p, 'q', searchQuery), { replace: true });
    }, 250);
    return () => clearTimeout(timer);
    // Re-arming on urlQ/updateFilterParams changes would reset the debounce on
    // every unrelated render; the adopt-effect above handles external q changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);


  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [newListOpen, setNewListOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [renameListTarget, setRenameListTarget] = useState<RestaurantList | null>(null);
  const [renameListName, setRenameListName] = useState('');
  // Saved-view name dialog (create a new view or rename an existing one).
  const [viewDialog, setViewDialog] = useState<{ mode: 'create' | 'rename'; id?: string; name: string } | null>(null);
  const [deleteListTarget, setDeleteListTarget] = useState<RestaurantList | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [restaurantToDelete, setRestaurantToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning';
    // Optional inline action (Undo / Retry) shown on the right of the snackbar.
    action?: { label: string; onClick: () => void };
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    setRestaurants(initialRestaurants);
  }, [initialRestaurants]);

  // Surface the result of redeeming an invite link (?join=ok|invalid) or saving
  // a copy of a shared list (?forked=1), then strip the param so a refresh
  // doesn't show the toast again.
  useEffect(() => {
    const join = searchParams.get('join');
    const forked = searchParams.get('forked');
    if (!join && !forked) return;
    if (join === 'ok') {
      setSnackbar({ open: true, message: tr('dashboard.joinedList'), severity: 'success' });
    } else if (join === 'invalid') {
      setSnackbar({ open: true, message: tr('dashboard.joinInvalid'), severity: 'error' });
    } else if (forked) {
      setSnackbar({ open: true, message: tr('dashboard.snackForked'), severity: 'success' });
    }
    const params = new URLSearchParams(searchParams);
    params.delete('join');
    params.delete('forked');
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const role = activeList?.role ?? 'viewer';
  const canEdit = role === 'owner' || role === 'editor';
  const canManage = role === 'owner';

  const decorated = useMemo(
    () => restaurants.map((r) => decorate(r, r.id ? ratings[r.id] : undefined)),
    [restaurants, ratings]
  );

  // Distinct cuisine / cost values present in this list, for the filter menus.
  const cuisineOptions = useMemo(
    () =>
      Array.from(
        new Set(restaurants.map((r) => r.cuisineType).filter(Boolean) as string[])
      ).sort(),
    [restaurants]
  );
  const costOptions = useMemo(
    () =>
      Array.from(
        new Set(restaurants.map((r) => r.priceRange).filter(Boolean) as string[])
      ).sort((a, b) => a.length - b.length),
    [restaurants]
  );
  // Cities come from the decorated rows (heuristic, derived from addresses).
  const cityOptions = useMemo(
    () => Array.from(new Set(decorated.map((r) => r.city).filter(Boolean) as string[])).sort(),
    [decorated]
  );
  // Distinct multi-select facet values actually present in this list.
  const placeOptions = useMemo(
    () => Array.from(new Set(restaurants.flatMap((r) => r.placeTypes ?? []))).sort(),
    [restaurants]
  );
  const dietOptions = useMemo(
    () => Array.from(new Set(restaurants.flatMap((r) => r.dietaryTags ?? []))).sort(),
    [restaurants]
  );
  // Distinctions held by at least one place here, in pick-list order.
  const awardOptions = useMemo(() => {
    const present = new Set(restaurants.flatMap((r) => distinctionIds(r)));
    return DISTINCTIONS.map((d) => d.id).filter((id) => present.has(id));
  }, [restaurants]);
  const menuOptions = useMemo(
    () => Array.from(new Set(restaurants.flatMap((r) => r.menuTypes ?? []))).sort(),
    [restaurants]
  );

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
      const matchesCuisine = !cuisineFilter || r.cuisineType === cuisineFilter;
      const matchesCity = !cityFilter || r.city === cityFilter;
      const matchesCost = !costFilter || r.priceRange === costFilter;
      const matchesRating = ratingFilter === 0 || (r.rating ?? 0) >= ratingFilter;
      // AND within a facet: a place must carry every selected tag.
      const matchesPlace = placeFilter.every((v) => (r.placeTypes ?? []).includes(v));
      const matchesDiet = dietFilter.every((v) => (r.dietaryTags ?? []).includes(v));
      const matchesMenu = menuFilter.every((v) => (r.menuTypes ?? []).includes(v));
      const held = awardFilter.length > 0 ? distinctionIds(r) : [];
      const matchesAward = awardFilter.every((v) => held.includes(v));
      return (
        matchesStatus &&
        matchesSearch &&
        matchesCuisine &&
        matchesCity &&
        matchesCost &&
        matchesRating &&
        matchesPlace &&
        matchesDiet &&
        matchesMenu &&
        matchesAward
      );
    });
  }, [decorated, filter, searchQuery, cuisineFilter, cityFilter, costFilter, ratingFilter, placeFilter, dietFilter, menuFilter, awardFilter]);

  // Apply the chosen sort to the filtered set (order-independent metrics like
  // counts still read from `filtered`).
  const sorted = useMemo(() => sortPlaces(filtered, sort, sortReversed), [filtered, sort, sortReversed]);

  const hasActiveFilters =
    filter !== 'all' ||
    !!searchQuery ||
    !!cuisineFilter ||
    !!cityFilter ||
    !!costFilter ||
    ratingFilter > 0 ||
    placeFilter.length > 0 ||
    dietFilter.length > 0 ||
    menuFilter.length > 0 ||
    awardFilter.length > 0 ||
    sort !== DEFAULT_SORT ||
    sortReversed;

  // Drop every filter/sort param in a single history entry (leaves list/… intact).
  // Also reset the local search text directly — the URL adopt-effect can't see a
  // value that was typed but not yet debounced into the URL.
  const clearFilters = () => {
    setSearchQuery('');
    lastPushedQ.current = '';
    updateFilterParams((p) => FILTER_PARAM_KEYS.forEach((k) => p.delete(k)));
  };

  // Canonical querystring of the current filters, for the saved-view highlight.
  const currentViewParams = useMemo(
    () => serializeFilterParams(searchParams),
    [searchParams]
  );

  const total = decorated.length;
  // How many locations (across the currently-shown places) have an address but
  // can't be plotted yet (no coordinates).
  const mapMissingCount = filtered.reduce(
    (sum, r) =>
      sum +
      (r.locations ?? []).filter(
        (l) =>
          (l.address ?? '').trim() !== '' &&
          (typeof l.lat !== 'number' || typeof l.lng !== 'number')
      ).length,
    0
  );

  const shownMembers = members.slice(0, 3);
  const extraMembers = members.length - shownMembers.length;

  // --- handlers ------------------------------------------------------------
  const handleAddRestaurant = () => {
    if (!canEdit) return;
    setSelectedRestaurant(null);
    setFormOpen(true);
  };

  // Clicking a card/row opens the read-only detail view first (everyone can view).
  const handleViewRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setDetailOpen(true);
  };

  const handleEditRestaurant = (restaurant: Restaurant) => {
    if (!canEdit) return;
    setDetailOpen(false);
    setSelectedRestaurant(restaurant);
    setFormOpen(true);
  };

  const handleSaveRestaurant = async (
    restaurantData: Partial<Restaurant>,
    imageFile?: File,
    imageOrigin: 'scraped' | 'user' = 'scraped'
  ) => {
    if (!activeList) return;
    try {
      // The photo we store is always our own copy: an uploaded file goes
      // straight to storage, and an image URL passes the server's quality gate
      // first. A refused image saves the place with no photo.
      let imageUrl = restaurantData.image;
      let imageRejected = false;
      if (imageFile) {
        imageUrl = await uploadRestaurantImage(imageFile, userId);
      } else {
        const ingested = await ingestRestaurantImage(imageUrl, imageOrigin, {
          name: restaurantData.name,
          address: restaurantData.locations?.[0]?.address,
        });
        imageUrl = ingested.url;
        imageRejected = ingested.rejected;
      }
      const dataToSave: Partial<Restaurant> = { ...restaurantData, image: imageUrl };

      // Geocode each location for the map. Re-geocode when an address changed or
      // when it has an address but no coordinates yet (the latter back-fills rows
      // saved before geocoding succeeded, e.g. older international entries). We go
      // location-by-location to stay within Nominatim's ~1/sec rate limit.
      const prevLocations = selectedRestaurant?.locations ?? [];
      const locations = dataToSave.locations ?? [];
      let geocodeFailed = false;
      for (let i = 0; i < locations.length; i++) {
        const loc = locations[i];
        const address = (loc.address ?? '').trim();
        if (!address) {
          locations[i] = { ...loc, lat: undefined, lng: undefined };
          continue;
        }
        const prev = prevLocations[i];
        const prevAddress = (prev?.address ?? '').trim();
        // Only a change to a PREVIOUSLY SAVED address invalidates coordinates.
        // A new location that already carries coords (seeded from a search /
        // nearby candidate) keeps its precise POI point instead of being
        // re-geocoded to a coarser — or failed — result.
        const addressChanged = prevAddress !== '' && prevAddress !== address;
        const hasCoords = loc.lat != null && loc.lng != null;
        if (hasCoords && !addressChanged) continue; // keep existing coordinates
        const point = await geocodeAddress(address);
        // On failure keep whatever coords we already had rather than wiping the
        // pin — a slightly stale pin beats none.
        locations[i] = { ...loc, lat: point?.lat ?? loc.lat, lng: point?.lng ?? loc.lng };
        if (!point && !hasCoords) geocodeFailed = true;
      }
      dataToSave.locations = locations;

      if (selectedRestaurant?.id) {
        await updateRestaurant(selectedRestaurant.id, dataToSave, activeList.id, userId);
      } else {
        await createRestaurant(dataToSave, activeList.id, userId);
      }
      // Saved fine — but if the address couldn't be located, tell the user the
      // map pin won't appear (rather than failing silently and looking buggy).
      if (geocodeFailed) {
        setSnackbar({ open: true, message: tr('dashboard.snackGeocodeFailed'), severity: 'warning' });
      } else if (imageRejected) {
        setSnackbar({ open: true, message: tr('dashboard.snackImageRejected'), severity: 'warning' });
      } else {
        setSnackbar({
          open: true,
          message: selectedRestaurant?.id ? tr('dashboard.snackUpdated') : tr('dashboard.snackAdded'),
          severity: 'success',
        });
      }
      revalidator.revalidate();
      setFormOpen(false);
    } catch (error) {
      console.error('Error saving restaurant:', error);
      setSnackbar({ open: true, message: tr('dashboard.snackSaveFailed'), severity: 'error' });
      throw error;
    }
  };

  const handleToggleStatus = async (r: DecoratedRestaurant) => {
    if (!canEdit || !r.id) return;
    const newStatus = r.isBeen ? 'want' : 'been';
    try {
      await setRestaurantStatus(r.id, newStatus);
      // Marking "been" with no recorded visits implies a first visit.
      const firstVisit = newStatus === 'been' && (r.visitCount ?? 0) === 0;
      if (firstVisit) {
        await setRestaurantVisitCount(r.id, 1);
      }
      // Reflect immediately in an open detail dialog (loader revalidate lags).
      setSelectedRestaurant((cur) =>
        cur && cur.id === r.id
          ? { ...cur, status: newStatus, visitCount: firstVisit ? 1 : cur.visitCount }
          : cur
      );
      revalidator.revalidate();
    } catch (error) {
      console.error('Error updating status:', error);
      setSnackbar({ open: true, message: tr('dashboard.snackStatusFailed'), severity: 'error' });
    }
  };

  const handleToggleFavorite = async (r: Restaurant) => {
    if (!canEdit || !r.id) return;
    const next = !r.favorite;
    try {
      await setRestaurantFavorite(r.id, next);
      // Reflect immediately in an open detail dialog (loader revalidate lags).
      setSelectedRestaurant((cur) => (cur && cur.id === r.id ? { ...cur, favorite: next } : cur));
      revalidator.revalidate();
    } catch (error) {
      console.error('Error updating favourite:', error);
      setSnackbar({ open: true, message: tr('dashboard.snackStatusFailed'), severity: 'error' });
    }
  };

  const handleAddVisit = async (r: Restaurant) => {
    if (!canEdit || !r.id) return;
    const next = (r.visitCount ?? 0) + 1;
    const becomesBeen = r.status !== 'been';
    try {
      await setRestaurantVisitCount(r.id, next);
      // A recorded visit means the place has been visited.
      if (becomesBeen) {
        await setRestaurantStatus(r.id, 'been');
      }
      setSelectedRestaurant((cur) =>
        cur && cur.id === r.id ? { ...cur, visitCount: next, status: 'been' } : cur
      );
      revalidator.revalidate();
    } catch (error) {
      console.error('Error updating visit count:', error);
      setSnackbar({ open: true, message: tr('dashboard.snackStatusFailed'), severity: 'error' });
    }
  };

  /**
   * Save the signed-in user's own bubbles + note on a spot. Every member can
   * rate — including viewers — because a verdict is participation, not an edit
   * to the shared record (the RLS policies draw the same line).
   */
  const handleRate = async (r: Restaurant, rating: number, note: string) => {
    if (!r.id) return;
    try {
      await upsertMyRating(r.id, userId, rating, note);
      revalidator.revalidate();
    } catch (error) {
      console.error('Error saving rating:', error);
      setSnackbar({ open: true, message: tr('dashboard.snackRatingFailed'), severity: 'error' });
    }
  };

  const handleDeleteClick = (id: string) => {
    const restaurant = restaurants.find((r) => r.id === id);
    if (restaurant) {
      setRestaurantToDelete({ id, name: restaurant.name });
      setDeleteOpen(true);
    }
  };

  // Re-create a just-deleted place from a kept snapshot (Undo). Re-creating
  // assigns a new id/timestamp, which is fine for a restore.
  const handleRestoreRestaurant = async (snapshot: Restaurant) => {
    if (!activeList) return;
    const { id, listId, createdAt, updatedAt, addedBy, ...payload } = snapshot;
    void id; void listId; void createdAt; void updatedAt; void addedBy;
    try {
      await createRestaurant(payload, activeList.id, userId);
      revalidator.revalidate();
      setSnackbar({ open: true, message: tr('dashboard.snackRestored'), severity: 'success' });
    } catch (error) {
      console.error('Error restoring restaurant:', error);
      setSnackbar({ open: true, message: tr('dashboard.snackSaveFailed'), severity: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!restaurantToDelete) return;
    // Snapshot the full row before deleting so Undo can restore it.
    const snapshot = restaurants.find((r) => r.id === restaurantToDelete.id);
    try {
      await deleteRestaurant(restaurantToDelete.id);
      setSnackbar({
        open: true,
        message: tr('dashboard.snackDeleted'),
        severity: 'success',
        action: snapshot
          ? { label: tr('dashboard.undo'), onClick: () => handleRestoreRestaurant(snapshot) }
          : undefined,
      });
      revalidator.revalidate();
      setDeleteOpen(false);
      setRestaurantToDelete(null);
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      setSnackbar({
        open: true,
        message: tr('dashboard.snackDeleteFailed'),
        severity: 'error',
        action: { label: tr('dashboard.retry'), onClick: () => handleConfirmDelete() },
      });
    }
  };

  const handleSelectList = (listId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('list', listId);
    setSearchParams(params);
  };

  const handleCreateList = async () => {
    const name = newListName.trim();
    if (!name) return;
    try {
      const id = await createList(name, userId);
      setNewListOpen(false);
      setNewListName('');
      const params = new URLSearchParams(searchParams);
      params.set('list', id);
      setSearchParams(params);
      setSnackbar({ open: true, message: tr('dashboard.snackListCreated'), severity: 'success' });
    } catch (error) {
      console.error('Error creating list:', error);
      setSnackbar({ open: true, message: tr('dashboard.snackListFailed'), severity: 'error' });
    }
  };

  const handleRenameList = (list: RestaurantList) => {
    setRenameListTarget(list);
    setRenameListName(list.name);
  };

  const handleConfirmRename = async () => {
    const name = renameListName.trim();
    if (!renameListTarget || !name) return;
    try {
      await updateList(renameListTarget.id, { name });
      setRenameListTarget(null);
      revalidator.revalidate();
      setSnackbar({ open: true, message: tr('dashboard.snackListRenamed'), severity: 'success' });
    } catch (error) {
      console.error('Error renaming list:', error);
      setSnackbar({ open: true, message: tr('dashboard.snackListUpdateFailed'), severity: 'error' });
    }
  };

  const handleConfirmDeleteList = async () => {
    if (!deleteListTarget) return;
    try {
      await deleteList(deleteListTarget.id);
      setDeleteListTarget(null);
      // Move off the deleted list (drop the ?list param so the loader picks the default).
      const params = new URLSearchParams(searchParams);
      params.delete('list');
      setSearchParams(params);
      revalidator.revalidate();
      setSnackbar({ open: true, message: tr('dashboard.snackListDeleted'), severity: 'success' });
    } catch (error) {
      console.error('Error deleting list:', error);
      setSnackbar({ open: true, message: tr('dashboard.snackListUpdateFailed'), severity: 'error' });
    }
  };

  const handleLeaveList = () => {
    setShareOpen(false);
    // Drop the ?list param so the loader falls back to the user's default list,
    // then refresh now that they're no longer a member of the one they left.
    const params = new URLSearchParams(searchParams);
    params.delete('list');
    setSearchParams(params);
    revalidator.revalidate();
    setSnackbar({ open: true, message: tr('share.snackLeft'), severity: 'success' });
  };

  // --- saved views ---------------------------------------------------------
  const handleApplyView = (view: ListView) => {
    const next = applyViewParams(searchParams, view.params);
    // Adopt the view's q locally too — otherwise text typed within the debounce
    // window survives the switch and the armed timer re-pushes it onto the view.
    const q = next.get('q') ?? '';
    setSearchQuery(q);
    lastPushedQ.current = q;
    setSearchParams(next);
  };

  const handleConfirmView = async () => {
    const name = viewDialog?.name.trim();
    if (!viewDialog || !name || !activeList) return;
    try {
      if (viewDialog.mode === 'create') {
        await createListView(activeList.id, userId, name, serializeFilterParams(searchParams));
      } else if (viewDialog.id) {
        await renameListView(viewDialog.id, name);
      }
      setViewDialog(null);
      revalidator.revalidate();
      setSnackbar({ open: true, message: tr('views.saved'), severity: 'success' });
    } catch (error) {
      console.error('Error saving view:', error);
      setSnackbar({ open: true, message: tr('views.saveFailed'), severity: 'error' });
    }
  };

  const handleDeleteView = async (view: ListView) => {
    try {
      await deleteListView(view.id);
      revalidator.revalidate();
      setSnackbar({ open: true, message: tr('views.deleted'), severity: 'success' });
    } catch (error) {
      console.error('Error deleting view:', error);
      setSnackbar({ open: true, message: tr('views.saveFailed'), severity: 'error' });
    }
  };

  const handleLogout = () => {
    const form = document.createElement('form');
    form.method = 'POST';
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'intent';
    input.value = 'logout';
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  };

  // --- view switch ------------------------------------------------------
  const viewOptions: { id: ViewMode; label: string; Icon: typeof GridViewOutlined }[] = [
    { id: 'tile', label: tr('dashboard.viewTile'), Icon: GridViewOutlined },
    { id: 'list', label: tr('dashboard.viewList'), Icon: ViewListOutlined },
    { id: 'table', label: tr('dashboard.viewTable', 'Table'), Icon: TableRowsOutlined },
    { id: 'map', label: tr('dashboard.viewMap'), Icon: MapOutlined },
  ];

  const beenTotal = decorated.filter((r) => r.isBeen).length;
  const statusOptions: { id: FilterMode; label: string; shortLabel: string; count: number }[] = [
    { id: 'all', label: tr('dashboard.allPlaces'), shortLabel: tr('dashboard.filterAll'), count: total },
    { id: 'been', label: tr('dashboard.filterBeen'), shortLabel: tr('dashboard.filterBeen'), count: beenTotal },
    { id: 'want', label: tr('dashboard.filterWant'), shortLabel: tr('dashboard.filterWantShort'), count: total - beenTotal },
  ];
  const statsHref = activeList ? `/stats?list=${activeList.id}` : '/stats';

  const serif = FONT;

  /** A bare round (or pill) icon button. */
  const roundSx = { display: 'grid', placeItems: 'center', flex: 'none', p: 0, border: 'none', borderRadius: '50%', cursor: 'pointer' } as const;
  /** One option in a pill-shaped segmented control. */
  const segmentSx = (selected: boolean) => ({
    height: { xs: 40, md: 42 },
    padding: { xs: '0 10px', md: '0 18px' },
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
  /** One row in the side panel. */
  const sideItemSx = (selected: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    minWidth: 0,
    height: 44,
    padding: '0 14px',
    border: 0,
    borderRadius: '14px',
    cursor: 'pointer',
    font: 'inherit',
    fontSize: 15,
    fontWeight: 600,
    textAlign: 'left' as const,
    background: selected ? t.raised : 'transparent',
    color: selected ? t.ink : t.muted,
    '@media (hover: hover)': { '&:hover': { color: t.ink } },
  });

  const renderAvatar = (m: ListMember, idx: number) => {
    const name = m.profile?.displayName?.trim();
    const initial = (name?.[0] ?? '?').toUpperCase();
    const bg = idx === 0 ? t.raised : idx === 1 ? t.avatar2 : t.avatar3;
    const fg = t.ink;
    return (
      <Box
        key={m.id}
        title={name || tr('share.member')}
        role="img"
        aria-label={name || tr('share.member')}
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: m.profile?.avatarUrl ? `center/cover url(${m.profile.avatarUrl})` : bg,
          color: fg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 600,
          border: `2px solid ${t.pageBg}`,
          ml: idx === 0 ? 0 : '-10px',
        }}
      >
        {!m.profile?.avatarUrl && initial}
      </Box>
    );
  };

  return (
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          background: t.pageBg,
          color: t.ink,
          transition: 'background .25s',
          '& *::-webkit-scrollbar': { width: 10, height: 10 },
          '& *::-webkit-scrollbar-thumb': {
            background: t.skeleton,
            borderRadius: 8,
          },
        }}
      >
        {/* Visually-hidden page heading for screen-reader / landmark navigation
            (the visible list title is a button, not a heading). */}
        <Box
          component="h1"
          sx={{
            position: 'absolute',
            width: 1,
            height: 1,
            p: 0,
            m: '-1px',
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          {(activeList?.name ?? 'My List') + ' — ' + tr('brand')}
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            width: '100%',
            maxWidth: 1760,
            mx: 'auto',
            display: { lg: 'grid' },
            gridTemplateColumns: { lg: '280px minmax(0, 1fr)' },
            gap: { lg: '16px' },
            padding: { lg: '16px' },
            alignItems: 'start',
          }}
        >
          {/* side panel — wide screens only: brand, status, stats, saved views, add */}
          <Box
            component="nav"
            aria-label={tr('nav.main')}
            sx={{
              display: { xs: 'none', lg: 'flex' },
              flexDirection: 'column',
              gap: '28px',
              position: 'sticky',
              top: 16,
              height: 'calc(100dvh - 32px)',
              overflowY: 'auto',
              borderRadius: '28px',
              background: t.cardBg,
              padding: '28px 20px 20px',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', px: '14px' }}>
              <LogoMark size={22} />
              <Box component="span" sx={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.03em', whiteSpace: 'nowrap' }}>
                {tr('brand')}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {statusOptions.map(({ id, label, count }) => (
                <Box key={id} component="button" type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} sx={sideItemSx(filter === id)}>
                  {label}
                  <Box component="span" sx={{ color: t.muted }}>{count}</Box>
                </Box>
              ))}
              <Box component="button" type="button" onClick={() => navigate(statsHref)} sx={sideItemSx(false)}>
                {tr('stats.navLabel')}
              </Box>
            </Box>
            {views.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Box sx={{ fontSize: 13, fontWeight: 600, color: t.muted, padding: '0 14px 6px' }}>{tr('views.title')}</Box>
                {views.map((v) => (
                  <Box key={v.id} component="button" type="button" aria-pressed={v.params === currentViewParams} onClick={() => handleApplyView(v)} sx={{ ...sideItemSx(v.params === currentViewParams), color: t.ink }}>
                    <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</Box>
                  </Box>
                ))}
              </Box>
            )}
            {canEdit && (
              <Box
                component="button"
                type="button"
                onClick={handleAddRestaurant}
                sx={{ mt: 'auto', flex: 'none', height: 52, border: 'none', cursor: 'pointer', borderRadius: '999px', background: t.accent, color: t.accentText, font: 'inherit', fontSize: 15, fontWeight: 700 }}
              >
                {tr('dashboard.addPlace')}
              </Box>
            )}
          </Box>

          <Box sx={{ minWidth: 0, padding: { xs: '0 20px', sm: '0 24px', lg: '4px 24px 0' } }}>
            {/* header — the list is the page title; add and account sit beside it */}
            <Box
              component="header"
              sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', pt: { xs: '18px', sm: '24px', lg: '20px' } }}
            >
              <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <Box component="span" sx={{ display: { lg: 'none' }, fontSize: 13, fontWeight: 600, color: t.muted }}>
                  {tr('brand')}
                </Box>
                <ListSwitcher
                  lists={lists}
                  activeList={activeList}
                  serifFont={serif}
                  onSelect={handleSelectList}
                  onCreate={() => setNewListOpen(true)}
                  onRename={handleRenameList}
                  onDelete={(l) => setDeleteListTarget(l)}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 'none' }}>
                {canEdit && (
                  <Box
                    component="button"
                    type="button"
                    onClick={handleAddRestaurant}
                    aria-label={tr('dashboard.addRestaurant')}
                    title={tr('dashboard.addPlace')}
                    sx={{ ...roundSx, display: { xs: 'grid', lg: 'none' }, width: 44, height: 44, background: t.accent, color: t.accentText }}
                  >
                    <Add sx={{ fontSize: 22 }} />
                  </Box>
                )}

                {/* avatar stack → account menu */}
                <Box
                  component="button"
                  type="button"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => setMenuAnchor(e.currentTarget)}
                  aria-label={tr('dashboard.accountMenu')}
                  aria-haspopup="true"
                  sx={{ display: 'flex', alignItems: 'center', minHeight: 44, border: 'none', background: 'transparent', cursor: 'pointer', p: 0 }}
                >
                  {shownMembers.length > 0
                    ? shownMembers.map((m, i) => renderAvatar(m, i))
                    : (
                      <Box sx={{ width: 36, height: 36, borderRadius: '50%', background: t.cardBg, color: t.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>
                        {(profile?.displayName?.[0] ?? '?').toUpperCase()}
                      </Box>
                    )}
                  {extraMembers > 0 && (
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', background: t.raised, color: t.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, border: `2px solid ${t.pageBg}`, ml: '-10px' }}>
                      +{extraMembers}
                    </Box>
                  )}
                </Box>
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={() => setMenuAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <MenuItem onClick={() => { setMenuAnchor(null); navigate('/profile'); }}>
                    <ListItemIcon><Person fontSize="small" sx={{ color: t.muted }} /></ListItemIcon>
                    <ListItemText>{tr('nav.profile')}</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => { setMenuAnchor(null); navigate(statsHref); }}>
                    <ListItemIcon><Insights fontSize="small" sx={{ color: t.muted }} /></ListItemIcon>
                    <ListItemText>{tr('stats.menuItem')}</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => { setMenuAnchor(null); setShareOpen(true); }}>
                    <ListItemIcon><PersonAddAlt1 fontSize="small" sx={{ color: t.muted }} /></ListItemIcon>
                    <ListItemText>{tr('dashboard.shareMembers')}</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => { setMenuAnchor(null); setMode(mode === 'light' ? 'dark' : 'light'); }}>
                    <ListItemIcon>
                      {mode === 'light' ? <DarkModeOutlined fontSize="small" sx={{ color: t.muted }} /> : <LightModeOutlined fontSize="small" sx={{ color: t.muted }} />}
                    </ListItemIcon>
                    <ListItemText>{mode === 'light' ? tr('dashboard.themeDark') : tr('dashboard.themeLight')}</ListItemText>
                  </MenuItem>
                  <Divider sx={{ my: 0.5 }} />
                  <MenuItem onClick={() => { setMenuAnchor(null); handleLogout(); }}>
                    <ListItemIcon><Logout fontSize="small" sx={{ color: t.muted }} /></ListItemIcon>
                    <ListItemText>{tr('dashboard.signOut')}</ListItemText>
                  </MenuItem>
                </Menu>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 3, mb: 3 }} role="alert">
                {tr('dashboard.loadError', { error })}
              </Alert>
            )}

            {/* Controls: search, then status · filters (· view on wider screens).
                A brand-new, empty-and-unfiltered list has nothing to filter yet,
                so they wait for data or a filter. */}
            {(total > 0 || hasActiveFilters) && (
              <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, alignItems: 'center', gap: { xs: '12px 8px', md: '12px' }, mt: { xs: '16px', sm: '20px' } }}>
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
                      // 16px so iOS doesn't auto-zoom on focus.
                      fontSize: 16,
                      width: '100%',
                      minWidth: 0,
                      '::placeholder': { color: t.muted, opacity: 1 },
                    }}
                  />
                  {searchQuery && (
                    <Box
                      component="button"
                      type="button"
                      aria-label={tr('dashboard.searchClear')}
                      onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                      onClick={() => setSearchQuery('')}
                      sx={{ ...roundSx, width: 44, height: 44, mr: '-14px', background: 'transparent', color: t.muted }}
                    >
                      <Close sx={{ fontSize: 18 }} />
                    </Box>
                  )}
                </Box>

                {/* all / been / want */}
                <Box
                  role="group"
                  aria-label={tr('dashboard.filterStatusLabel')}
                  sx={{ flex: { xs: 1, md: 'none' }, ml: { md: 'auto' }, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '4px', background: t.cardBg, borderRadius: '999px' }}
                >
                  {statusOptions.map(({ id, shortLabel }) => (
                    <Box key={id} component="button" type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} sx={segmentSx(filter === id)}>
                      {shortLabel}
                    </Box>
                  ))}
                </Box>

                <FilterSheet
                  tokens={t}
                  resultCount={filtered.length}
                  cuisineOptions={cuisineOptions}
                  cityOptions={cityOptions}
                  costOptions={costOptions}
                  placeOptions={placeOptions}
                  dietOptions={dietOptions}
                  menuOptions={menuOptions}
                  awardOptions={awardOptions}
                  sortModes={SORT_MODES}
                  cuisineFilter={cuisineFilter}
                  setCuisineFilter={setCuisineFilter}
                  cityFilter={cityFilter}
                  setCityFilter={setCityFilter}
                  costFilter={costFilter}
                  setCostFilter={setCostFilter}
                  ratingFilter={ratingFilter}
                  setRatingFilter={setRatingFilter}
                  placeFilter={placeFilter}
                  setPlaceFilter={setPlaceFilter}
                  dietFilter={dietFilter}
                  setDietFilter={setDietFilter}
                  menuFilter={menuFilter}
                  setMenuFilter={setMenuFilter}
                  awardFilter={awardFilter}
                  setAwardFilter={setAwardFilter}
                  sort={sort}
                  setSort={(v) => setSort(v as SortMode)}
                  sortReversed={sortReversed}
                  setSortReversed={setSortReversed}
                  onClear={clearFilters}
                  views={views}
                  currentParams={currentViewParams}
                  hasActiveFilters={hasActiveFilters}
                  onApplyView={handleApplyView}
                  onSaveView={() => setViewDialog({ mode: 'create', name: '' })}
                  onRenameView={(v) => setViewDialog({ mode: 'rename', id: v.id, name: v.name })}
                  onDeleteView={handleDeleteView}
                />

                {/* view switch — on a phone this is the floating bar at the foot of the screen */}
                <Box
                  role="group"
                  aria-label={tr('dashboard.viewLabel')}
                  sx={{ display: { xs: 'none', sm: 'flex' }, padding: '4px', background: t.cardBg, borderRadius: '999px', flex: 'none' }}
                >
                  {viewOptions.map(({ id, label, Icon }) => (
                    <Box
                      key={id}
                      component="button"
                      type="button"
                      aria-pressed={view === id}
                      aria-label={label}
                      title={label}
                      onClick={() => setView(id)}
                      sx={{ ...segmentSx(view === id), display: 'grid', placeItems: 'center', padding: { sm: '0 13px', xl: '0 14px' } }}
                    >
                      <Icon sx={{ fontSize: 19, display: { xl: 'none' } }} />
                      <Box component="span" sx={{ display: { xs: 'none', xl: 'inline' } }}>{label}</Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* empty state */}
            {filtered.length === 0 && !listLoading ? (
              // A brand-new, editable list gets the first-run onboarding; the plain
              // empty card is kept for filtered-empty and view-only cases.
              total === 0 && !hasActiveFilters && canEdit && activeList ? (
                <Onboarding
                  tokens={t}
                  serifFont={serif}
                  listId={activeList.id}
                  userId={userId}
                  onCreated={() => revalidator.revalidate()}
                  onAddManually={handleAddRestaurant}
                />
              ) : (
              <Box sx={{ mt: '24px', mb: '40px', textAlign: 'center', py: { xs: 6, md: 10 }, px: 3 }}>
                {hasActiveFilters ? (
                  <SearchOff aria-hidden sx={{ fontSize: 40, color: t.faint, mb: 1.5 }} />
                ) : (
                  <RestaurantOutlined aria-hidden sx={{ fontSize: 40, color: t.faint, mb: 1.5 }} />
                )}
                <Box sx={{ fontSize: 24, fontWeight: 600, letterSpacing: '-.03em', mb: 1 }}>
                  {hasActiveFilters ? tr('dashboard.noMatchesTitle') : tr('dashboard.emptyTitle')}
                </Box>
                <Box sx={{ color: t.muted, fontSize: 16, mb: 3, maxWidth: 420, mx: 'auto' }}>
                  {hasActiveFilters
                    ? tr('dashboard.emptyTryFilter')
                    : canEdit
                    ? tr('dashboard.emptyAddFirst')
                    : tr('dashboard.emptyNothing')}
                </Box>
                {!hasActiveFilters && canEdit && (
                  <Button variant="contained" onClick={handleAddRestaurant} startIcon={<Add />}>
                    {tr('dashboard.addFirst')}
                  </Button>
                )}
                {hasActiveFilters && (
                  <Button variant="outlined" onClick={clearFilters}>
                    {tr('dashboard.clearFilters')}
                  </Button>
                )}
              </Box>
              )
            ) : (
              // Extra bottom clearance on phones so the floating view bar never
              // covers the last place.
              <Box sx={{ padding: { xs: '16px 0 112px', sm: '20px 0 56px' } }}>
                {/* TILE — one photograph per row on a phone, a grid beyond */}
                {view === 'tile' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(auto-fill, minmax(300px, 1fr))' }, gap: { xs: '14px', sm: '16px' } }}>
                    {listLoading
                      ? Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} tokens={t} />)
                      : sorted.map((r) => <PlaceCard key={r.id} r={r} tokens={t} onView={handleViewRestaurant} />)}
                  </Box>
                )}

                {/* LIST — the dense view: thumb, name, meta, rating */}
                {view === 'list' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, gap: '8px' }}>
                    {listLoading
                      ? Array.from({ length: 6 }, (_, i) => <SkeletonListRow key={i} tokens={t} />)
                      : sorted.map((r) => <PlaceRow key={r.id} r={r} tokens={t} onView={handleViewRestaurant} />)}
                  </Box>
                )}

                {/* TABLE — an index for when the list gets long */}
                {view === 'table' && (
                  <Box sx={{ overflowX: 'auto', borderRadius: '22px', background: t.cardBg, padding: '6px 8px' }}>
                    <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                      <Box component="thead">
                        <Box component="tr">
                          {[
                            '', tr('dashboard.tableColPlace', 'Place'), tr('dashboard.tableColCuisine', 'Cuisine'),
                            tr('dashboard.tableColRating', 'Rating'), tr('dashboard.tableColCost', 'Cost'),
                            tr('dashboard.tableColCity', 'City'), tr('dashboard.tableColStatus', 'Status'),
                          ].map((h) => (
                            <Box key={h} component="th" sx={{ textAlign: 'left', fontSize: 13, fontWeight: 600, color: t.muted, padding: '12px', whiteSpace: 'nowrap' }}>
                              {h}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                      <Box component="tbody">
                        {listLoading &&
                          Array.from({ length: 7 }, (_, i) => (
                            <Box component="tr" key={i} aria-hidden>
                              <Box component="td" colSpan={8} sx={{ padding: 0, borderTop: `1px solid ${t.border}` }}>
                                <SkeletonListRow tokens={t} />
                              </Box>
                            </Box>
                          ))}
                        {!listLoading && sorted.map((r) => (
                          <Box
                            component="tr"
                            key={r.id}
                            onClick={() => handleViewRestaurant(r)}
                            sx={{ cursor: 'pointer', '& td': { padding: '8px 12px', borderTop: `1px solid ${t.border}` }, '@media (hover: hover)': { '&:hover': { background: t.rowHover } } }}
                          >
                            <Box component="td" sx={{ width: 68 }}>
                              <RestaurantThumb image={r.image} name={r.name} tokens={t} sx={{ width: 44, aspectRatio: '1', borderRadius: '12px' }} />
                            </Box>
                            <Box component="td" sx={{ fontWeight: 600, fontSize: 15, minWidth: 160 }}>
                              <Box
                                component="button"
                                type="button"
                                onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleViewRestaurant(r); }}
                                sx={{ border: 'none', background: 'transparent', p: 0, color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                              >
                                {r.name}
                              </Box>
                            </Box>
                            <Box component="td" sx={{ color: t.muted }}>{r.cuisine}</Box>
                            <Box component="td">{r.rated ? <Bubbles value={r.rating ?? 0} tokens={t} /> : null}</Box>
                            <Box component="td" sx={{ fontWeight: 600 }}>{r.costStr}</Box>
                            <Box component="td" sx={{ color: t.muted }}>{r.city ?? '—'}</Box>
                            <Box component="td" sx={{ color: t.muted, whiteSpace: 'nowrap' }}>{r.isWant ? tr('dashboard.statusWant') : null}</Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* MAP */}
                {view === 'map' && (
                  <Box sx={{ display: 'flex', gap: '16px', flexDirection: { xs: 'column', md: 'row' } }}>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <Box sx={{ flex: 'none', position: 'relative', height: { xs: 420, md: 540 }, borderRadius: '28px', overflow: 'hidden', background: t.mapBg }}>
                        {mounted ? (
                          <Suspense
                            fallback={
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: t.muted }}>
                                {tr('dashboard.loadingMap')}
                              </Box>
                            }
                          >
                            <RestaurantMap
                              restaurants={sorted}
                              accent={t.accent}
                              onSelect={handleViewRestaurant}
                              hoveredId={hoveredId}
                              onHoverChange={setHoveredId}
                            />
                          </Suspense>
                        ) : null}
                      </Box>
                      {mapMissingCount > 0 && (
                        <Box sx={{ color: t.faint, fontSize: 13 }}>
                          {tr('dashboard.missingAddress', { count: mapMissingCount })}
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ width: { xs: '100%', md: 340 }, flex: 'none', height: { md: 540 }, overflowY: { md: 'auto' }, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {sorted.map((r) => {
                        const syncKey = r.id ?? r.name;
                        return (
                        <Box
                          key={r.id}
                          ref={(el: HTMLElement | null) => {
                            if (el) mapRowRefs.current.set(syncKey, el);
                            else mapRowRefs.current.delete(syncKey);
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={r.name}
                          onClick={() => handleViewRestaurant(r)}
                          onKeyDown={activateOnKey(() => handleViewRestaurant(r))}
                          onMouseEnter={() => setHoveredId(syncKey)}
                          onMouseLeave={() => setHoveredId((cur) => (cur === syncKey ? null : cur))}
                          sx={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '18px', cursor: 'pointer', background: hoveredId === syncKey ? t.raised : t.cardBg, transition: 'background .12s' }}
                        >
                          <RestaurantThumb image={r.image} name={r.name} tokens={t} sx={{ width: 48, aspectRatio: '1', borderRadius: '12px' }} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</Box>
                            {r.meta && <Box sx={{ color: t.muted, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.meta}</Box>}
                          </Box>
                        </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* view switch on a phone: a glass bar floating over the list */}
        {total > 0 && (
          <Box
            role="group"
            aria-label={tr('dashboard.viewLabel')}
            sx={{
              display: { xs: 'flex', sm: 'none' },
              alignItems: 'center',
              gap: '2px',
              position: 'fixed',
              left: '50%',
              transform: 'translateX(-50%)',
              // Clear the home indicator / browser chrome.
              bottom: 'calc(18px + env(safe-area-inset-bottom))',
              height: 56,
              padding: '0 6px',
              borderRadius: '999px',
              background: t.glass,
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: `0 0 0 1px ${t.border}, 0 12px 32px rgba(0,0,0,.35)`,
              zIndex: 1000,
            }}
          >
            {viewOptions.map(({ id, label, Icon }) => (
              <Box
                key={id}
                component="button"
                type="button"
                aria-pressed={view === id}
                aria-label={label}
                onClick={() => setView(id)}
                sx={{ ...roundSx, width: 52, height: 44, borderRadius: '999px', background: view === id ? t.raised : 'transparent', color: view === id ? t.ink : t.muted }}
              >
                <Icon sx={{ fontSize: 20 }} />
              </Box>
            ))}
          </Box>
        )}

        {/* dialogs */}
        <RestaurantDetailDialog
          open={detailOpen}
          restaurant={selectedRestaurant}
          canEdit={canEdit}
          tokens={t}
          serifFont={serif}
          onClose={() => setDetailOpen(false)}
          onEdit={handleEditRestaurant}
          onDelete={(id) => { setDetailOpen(false); handleDeleteClick(id); }}
          onToggleFavorite={handleToggleFavorite}
          onToggleStatus={(r) => handleToggleStatus(decorate(r))}
          onAddVisit={handleAddVisit}
          ratings={selectedRestaurant?.id ? ratings[selectedRestaurant.id] ?? [] : []}
          currentUserId={userId}
          onRate={handleRate}
        />
        <RestaurantFormDialog
          open={formOpen}
          restaurant={selectedRestaurant}
          onClose={() => setFormOpen(false)}
          onSave={handleSaveRestaurant}
          tokens={t}
          serifFont={serif}
        />
        <DeleteConfirmDialog
          open={deleteOpen}
          restaurantName={restaurantToDelete?.name || ''}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleConfirmDelete}
        />
        <ShareListDialog
          open={shareOpen}
          list={activeList}
          members={members}
          inviteLink={inviteLink}
          shareLink={shareLink}
          currentUserId={userId}
          canManage={canManage}
          onClose={() => setShareOpen(false)}
          onChanged={() => revalidator.revalidate()}
          onLeave={handleLeaveList}
        />

        {/* new list dialog */}
        <Dialog open={newListOpen} onClose={() => setNewListOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>{tr('dashboard.newList')}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label={tr('dashboard.listName')}
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateList(); }}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setNewListOpen(false)} sx={{ color: 'text.secondary' }}>{tr('dashboard.cancel')}</Button>
            <Button onClick={handleCreateList} variant="contained" disabled={!newListName.trim()}>{tr('dashboard.create')}</Button>
          </DialogActions>
        </Dialog>

        {/* rename list dialog */}
        <Dialog open={Boolean(renameListTarget)} onClose={() => setRenameListTarget(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>{tr('lists.renameTitle')}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label={tr('dashboard.listName')}
              value={renameListName}
              onChange={(e) => setRenameListName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmRename(); }}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setRenameListTarget(null)} sx={{ color: 'text.secondary' }}>{tr('dashboard.cancel')}</Button>
            <Button onClick={handleConfirmRename} variant="contained" disabled={!renameListName.trim()}>{tr('lists.rename')}</Button>
          </DialogActions>
        </Dialog>

        {/* delete list confirmation */}
        <Dialog open={Boolean(deleteListTarget)} onClose={() => setDeleteListTarget(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>{tr('lists.deleteTitle')}</DialogTitle>
          <DialogContent>
            <Box sx={{ color: 'text.secondary' }}>
              {tr('lists.deleteConfirm', { name: deleteListTarget?.name ?? '' })}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDeleteListTarget(null)} sx={{ color: 'text.secondary' }}>{tr('dashboard.cancel')}</Button>
            <Button onClick={handleConfirmDeleteList} variant="contained" color="error">{tr('lists.delete')}</Button>
          </DialogActions>
        </Dialog>

        {/* save / rename view dialog */}
        <Dialog open={Boolean(viewDialog)} onClose={() => setViewDialog(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {viewDialog?.mode === 'rename' ? tr('views.renameTitle') : tr('views.saveTitle')}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label={tr('views.nameLabel')}
              placeholder={tr('views.namePlaceholder')}
              value={viewDialog?.name ?? ''}
              onChange={(e) => setViewDialog((v) => (v ? { ...v, name: e.target.value } : v))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmView(); }}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setViewDialog(null)} sx={{ color: 'text.secondary' }}>{tr('dashboard.cancel')}</Button>
            <Button onClick={handleConfirmView} variant="contained" disabled={!viewDialog?.name.trim()}>
              {viewDialog?.mode === 'rename' ? tr('lists.rename') : tr('views.save')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* snackbar — ink surface, 5s, optional Undo/Retry action */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ bottom: { xs: 'calc(86px + env(safe-area-inset-bottom))', sm: 24 } }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
            action={
              snackbar.action ? (
                <Button
                  size="small"
                  onClick={() => {
                    snackbar.action?.onClick();
                    setSnackbar((s) => ({ ...s, open: false }));
                  }}
                  sx={{ color: t.accent, fontWeight: 700, minHeight: 'auto', py: 0.25 }}
                >
                  {snackbar.action.label}
                </Button>
              ) : undefined
            }
            sx={{
              width: '100%',
              background: t.snackBg,
              color: t.snackFg,
              borderRadius: '16px',
              '& .MuiAlert-icon': { color: t.snackFg },
              '& .MuiAlert-action': { color: t.snackFg, alignItems: 'center', pt: 0 },
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
  );
}
