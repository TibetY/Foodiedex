import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { type SxProps, type Theme } from '@mui/material/styles';
import type { ListTokens } from '~/listTheme';
import { RESTAURANT_IMAGE_BUCKET } from '~/supabaseConfig';
import { monogram } from '~/utils/decorateRestaurant';

type Tokens = ListTokens;

interface RestaurantThumbProps {
  image?: string;
  /** The place's name — the image's alt text, and the source of its monogram. */
  name: string;
  tokens: Tokens;
  /** Size it by width (default 100%); the height follows the ratio. */
  sx?: SxProps<Theme>;
  className?: string;
}

/** The shape a place photo takes on cards and in the detail hero. */
export const THUMB_ASPECT = '3 / 2';

// Photos saved before the save-time gate existed are still hotlinked from
// restaurant sites, and many are logos or banners. Until the backfill replaces
// them, refuse the ones a browser can cheaply recognise: too small to fill the
// frame, or a shape that crops to nonsense.
const LEGACY_MIN_SHORT_SIDE = 300;
const LEGACY_MIN_ASPECT = 3 / 4;
const LEGACY_MAX_ASPECT = 2.2;

/** Anything in our own bucket already passed the gate, or the user chose it. */
function isOurs(src: string): boolean {
  return src.includes(`/storage/v1/object/public/${RESTAURANT_IMAGE_BUCKET}/`);
}

function isUsable(img: HTMLImageElement, src: string): boolean {
  const { naturalWidth: w, naturalHeight: h } = img;
  if (!w || !h) return false; // broken, or not an image
  if (isOurs(src)) return true;
  const aspect = w / h;
  return Math.min(w, h) >= LEGACY_MIN_SHORT_SIDE && aspect >= LEGACY_MIN_ASPECT && aspect <= LEGACY_MAX_ASPECT;
}

// useLayoutEffect so a rejected or still-loading image is hidden before the
// browser paints; the server has no layout pass (and React warns), hence the swap.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Whether a place's photo can be shown, for anything that lays itself out
 * differently with and without one (the card, the detail hero). `show` turns
 * false when there is no image, the link is dead, or a legacy image fails the
 * checks above; spread `imgProps` on the <img>.
 */
export function usePlacePhoto(image?: string) {
  const ref = useRef<HTMLImageElement>(null);
  // Both are keyed by src, so a new `image` starts from a clean slate.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [pendingSrc, setPendingSrc] = useState<string | null>(null);

  // A server-rendered <img> can finish — or fail — before React hydrates, and
  // React never replays those events, so `onError` alone leaves the browser's
  // broken-image icon on screen. Read the element's real state once mounted.
  useIsomorphicLayoutEffect(() => {
    const img = ref.current;
    if (!image || !img) return;
    if (!img.complete) setPendingSrc(image);
    else if (!isUsable(img, image)) setFailedSrc(image);
  }, [image]);

  return {
    show: !!image && failedSrc !== image,
    pending: pendingSrc === image,
    imgProps: {
      ref,
      src: image,
      loading: 'lazy' as const,
      decoding: 'async' as const,
      onLoad: (e: React.SyntheticEvent<HTMLImageElement>) => {
        if (image && isUsable(e.currentTarget, image)) setPendingSrc(null);
        else setFailedSrc(image ?? null);
      },
      onError: () => setFailedSrc(image ?? null),
    },
  };
}

/** How a photo fills its frame and fades in once it has loaded. */
export function photoSx(pending: boolean) {
  return {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    display: 'block',
    // Hide the alt text and outline browsers draw while (or instead of) loading.
    color: 'transparent',
    opacity: pending ? 0 : 1,
    transition: 'opacity .25s ease',
    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
  } as const;
}

/** The fill behind a monogram: a raised tile with the accent glowing in from one corner. */
export function haloSx(t: Tokens, base: string = t.cardBg) {
  return {
    backgroundColor: base,
    backgroundImage: `radial-gradient(120% 100% at 100% 0%, ${t.halo} 0%, transparent 62%)`,
  } as const;
}

/**
 * Restaurant thumbnail used by rows, popups and pickers: lazy-loaded, faded
 * in. A place with no usable photo — none saved, a dead link, or a legacy
 * image that fails the checks above — gets its monogram on a softly lit tile.
 */
export default function RestaurantThumb({ image, name, tokens: t, sx, className }: RestaurantThumbProps) {
  const photo = usePlacePhoto(image);

  return (
    <Box
      className={className}
      sx={[
        {
          position: 'relative',
          width: '100%',
          aspectRatio: THUMB_ASPECT,
          flex: 'none',
          overflow: 'hidden',
          borderRadius: '16px',
          containerType: 'inline-size',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...haloSx(t, t.raised),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {photo.show ? (
        <Box component="img" alt={name} {...photo.imgProps} sx={photoSx(photo.pending)} />
      ) : (
        <Box
          component="span"
          aria-hidden
          sx={{
            color: t.accent,
            fontWeight: 300,
            letterSpacing: '-.04em',
            lineHeight: 1,
            fontSize: 'clamp(15px, 34cqw, 72px)',
          }}
        >
          {monogram(name)}
        </Box>
      )}
    </Box>
  );
}
