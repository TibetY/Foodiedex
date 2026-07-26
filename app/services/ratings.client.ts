import type { RestaurantRating } from '~/types/restaurant';
import { getSupabaseBrowserClient } from '~/supabase.client';
import { rowToRestaurantRating, type RestaurantRatingRow } from './listMap';

/**
 * Save the signed-in user's own verdict on a spot. Upserts on the
 * (restaurant_id, user_id) unique key, so re-rating replaces rather than
 * stacking. RLS enforces that you can only ever write your own row.
 */
export async function upsertMyRating(
  restaurantId: string,
  userId: string,
  rating: number,
  note?: string
): Promise<RestaurantRating> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('restaurant_ratings')
    .upsert(
      {
        restaurant_id: restaurantId,
        user_id: userId,
        rating,
        note: note?.trim() ? note.trim() : null,
      },
      { onConflict: 'restaurant_id,user_id' }
    )
    .select('id, restaurant_id, user_id, rating, note, updated_at, profiles(id, display_name, avatar_url)')
    .single();

  if (error) throw error;
  return rowToRestaurantRating(data as unknown as RestaurantRatingRow);
}

/** Remove the signed-in user's verdict (back to "not rated by me"). */
export async function deleteMyRating(restaurantId: string, userId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('restaurant_ratings')
    .delete()
    .eq('restaurant_id', restaurantId)
    .eq('user_id', userId);

  if (error) throw error;
}
