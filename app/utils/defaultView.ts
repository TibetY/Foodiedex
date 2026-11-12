/**
 * The view a list opens in before the user picks one. The tile grid is built
 * around photos, and most places have none (few restaurant sites publish a
 * usable one), so a list where under half the places have a photo opens as
 * rows instead of a wall of empty tiles.
 */
export function defaultViewFor(places: { image?: string }[]): 'tile' | 'list' {
  if (places.length === 0) return 'tile';
  const withPhoto = places.filter((p) => !!p.image).length;
  return withPhoto * 2 < places.length ? 'list' : 'tile';
}
