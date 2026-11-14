-- ============================================================
-- One-time backfill: turn each place's old shared rating into a personal
-- rating for whoever added it.
--
-- Before personal ratings existed, the add form saved its rating into
-- restaurants.rating, tied to nobody. The app now saves it to
-- restaurant_ratings as the adder's own verdict, and the group average only
-- counts restaurant_ratings once anyone has rated a place, so these old
-- scores would otherwise drop out of the average.
--
-- Run in the Supabase SQL editor. Safe to re-run: it never overwrites a
-- rating someone already gave, and skips places with no known adder.
-- restaurants.rating itself is left as it is (the fallback for the rest).
-- ============================================================

-- 1. Preview: how many ratings would be created.
select count(*) as ratings_to_create
from public.restaurants r
join public.profiles p on p.id = coalesce(r.added_by, r.user_id)
where r.rating > 0
  and not exists (
    select 1 from public.restaurant_ratings rr
    where rr.restaurant_id = r.id
      and rr.user_id = coalesce(r.added_by, r.user_id)
  );

-- 2. Create them.
insert into public.restaurant_ratings (restaurant_id, user_id, rating)
select r.id, coalesce(r.added_by, r.user_id), r.rating
from public.restaurants r
join public.profiles p on p.id = coalesce(r.added_by, r.user_id)
where r.rating > 0
on conflict (restaurant_id, user_id) do nothing;
