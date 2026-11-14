import type { Restaurant, RestaurantStatus } from '~/types/restaurant';
import { getSupabaseBrowserClient } from '~/supabase.client';
import {
  restaurantToRow,
  rowToRestaurant,
  type RestaurantRow,
} from './restaurantMap';

/**
 * True when a write failed only because the database has no `distinctions`
 * column yet (the schema update has not been run). The write is then retried
 * without it, so a place still saves — minus those distinctions — instead of
 * failing outright because a website happened to list an award.
 */
function isMissingDistinctionsColumn(error: { code?: string; message?: string } | null): boolean {
  return !!error && error.code === 'PGRST204' && /distinctions/.test(error.message ?? '');
}

function withoutDistinctions<T extends { distinctions?: unknown }>(row: T): Omit<T, 'distinctions'> {
  const { distinctions, ...rest } = row;
  void distinctions;
  console.warn('restaurants.distinctions column is missing; saved without distinctions. Run supabase/schema.sql.');
  return rest;
}

/** Create a restaurant in `listId`, added by `userId`. Returns the saved record. */
export async function createRestaurant(
  data: Partial<Restaurant>,
  listId: string,
  userId: string
): Promise<Restaurant> {
  const supabase = getSupabaseBrowserClient();
  const payload = restaurantToRow(data, listId, userId);
  let { data: row, error } = await supabase.from('restaurants').insert(payload).select().single();
  if (isMissingDistinctionsColumn(error)) {
    ({ data: row, error } = await supabase
      .from('restaurants')
      .insert(withoutDistinctions(payload))
      .select()
      .single());
  }

  if (error) throw error;
  return rowToRestaurant(row as RestaurantRow);
}

/** Update an existing restaurant. Returns the saved record. */
export async function updateRestaurant(
  id: string,
  data: Partial<Restaurant>,
  listId: string,
  userId: string
): Promise<Restaurant> {
  const supabase = getSupabaseBrowserClient();
  // list_id / added_by are immutable on update; RLS already scopes the row.
  const { list_id, added_by, rating, ...rest } = restaurantToRow(data, listId, userId);
  void list_id;
  void added_by;
  // The shared `rating` column is a legacy fallback; personal ratings live in
  // restaurant_ratings. Only write it when the caller passed one explicitly,
  // so an ordinary edit never wipes it.
  const payload = data.rating === undefined ? rest : { ...rest, rating };
  let { data: row, error } = await supabase.from('restaurants').update(payload).eq('id', id).select().single();
  if (isMissingDistinctionsColumn(error)) {
    ({ data: row, error } = await supabase
      .from('restaurants')
      .update(withoutDistinctions(payload))
      .eq('id', id)
      .select()
      .single());
  }

  if (error) throw error;
  return rowToRestaurant(row as RestaurantRow);
}

/** Quick status toggle (been / want) without opening the full editor. */
export async function setRestaurantStatus(
  id: string,
  status: RestaurantStatus
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('restaurants')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

/** Quick favourite toggle without opening the full editor. */
export async function setRestaurantFavorite(
  id: string,
  favorite: boolean
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('restaurants')
    .update({ favorite })
    .eq('id', id);
  if (error) throw error;
}

/** Quick visit-count update (e.g. +1) without opening the full editor. */
export async function setRestaurantVisitCount(
  id: string,
  visitCount: number
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('restaurants')
    .update({ visit_count: Math.max(0, Math.round(visitCount)) })
    .eq('id', id);
  if (error) throw error;
}

/** Delete a restaurant by id. */
export async function deleteRestaurant(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from('restaurants').delete().eq('id', id);
  if (error) throw error;
}
