import type { SupabaseClient } from '@supabase/supabase-js';
import type { RestaurantRating } from '~/types/restaurant';
import { rowToRestaurantRating, type RestaurantRatingRow } from './listMap';

/**
 * Every member's verdicts on every spot in one list, keyed by restaurant id —
 * one round trip for the whole dashboard rather than one per open dialog.
 * RLS already limits rows to lists the caller belongs to; the list filter is
 * expressed through the restaurant ids so the query stays a single select.
 */
export async function getListRatings(
  supabase: SupabaseClient,
  restaurantIds: string[]
): Promise<Record<string, RestaurantRating[]>> {
  if (restaurantIds.length === 0) return {};

  const { data, error } = await supabase
    .from('restaurant_ratings')
    .select('id, restaurant_id, user_id, rating, note, updated_at, profiles(id, display_name, avatar_url)')
    .in('restaurant_id', restaurantIds);

  if (error) throw error;

  const byRestaurant: Record<string, RestaurantRating[]> = {};
  for (const row of (data ?? []) as unknown as RestaurantRatingRow[]) {
    const rating = rowToRestaurantRating(row);
    (byRestaurant[rating.restaurantId] ||= []).push(rating);
  }
  return byRestaurant;
}
