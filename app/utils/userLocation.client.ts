/**
 * A small session cache for the user's coordinates, shared between "Nearby"
 * (which explicitly requests location on a tap) and plain text search (which
 * should benefit from it, but must NEVER trigger a permission prompt itself —
 * see NearbyAdds.tsx: "Opt-in, we never ask for location until the user taps").
 */
let cached: { lat: number; lng: number } | null = null;

export function getCachedLocation(): { lat: number; lng: number } | null {
  return cached;
}

export function setCachedLocation(lat: number, lng: number): void {
  cached = { lat, lng };
}

/**
 * Resolve the user's coordinates for search bias, requesting permission if
 * needed. Unlike a page-load prompt, this is only ever called from inside
 * PlaceSearch once the user has actually typed a query — i.e. in direct
 * response to using the one feature that benefits from it, not proactively
 * on mount. Returns the cached value if we already have one (e.g. from a
 * prior "Nearby" tap, or an earlier call this session); if the user has
 * already said no, skips straight to `null` instead of re-prompting (the
 * browser wouldn't re-show its own dialog either, but this skips the
 * `getCurrentPosition` round trip/timeout too).
 */
export async function requestLocationForSearch(): Promise<{ lat: number; lng: number } | null> {
  if (cached) return cached;
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null;

  if (navigator.permissions?.query) {
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      if (status.state === 'denied') return null;
    } catch {
      // Permissions API can't answer for this query in some browsers — fall
      // through and let getCurrentPosition itself prompt/decide.
    }
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        cached = loc;
        resolve(loc);
      },
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}
