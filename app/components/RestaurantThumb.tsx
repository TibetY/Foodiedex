import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { type SxProps, type Theme } from '@mui/material/styles';
import type { ListTokens } from '~/listTheme';
import { RESTAURANT_IMAGE_BUCKET } from '~/supabaseConfig';

type Tokens = ListTokens;

interface RestaurantThumbProps {
  image?: string;
  /** The place's name: the image's alt text, and the placeholder's label. */
  name: string;
  tokens: Tokens;
  /** Size it by width (default 100%); the height always follows the ratio. */
  sx?: SxProps<Theme>;
}

/** The one shape a place photo takes, everywhere: cards, rows, the detail hero. */
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
 * Restaurant thumbnail used by every card, row, popup and dialog: one aspect
 * ratio, lazy-loaded, faded in. A place with no usable photo — none saved, a
 * dead link, or a legacy image that fails the checks above — gets the same
 * flat neutral tile with its name set quietly on it.
 */
export default function RestaurantThumb({ image, name, tokens: t, sx }: RestaurantThumbProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  // Both are keyed by src, so a new `image` prop starts from a clean slate.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [pendingSrc, setPendingSrc] = useState<string | null>(null);

  // A server-rendered <img> can finish — or fail — before React hydrates, and
  // React never replays those events, so `onError` alone leaves the browser's
  // broken-image icon on screen. Read the element's real state once mounted.
  useIsomorphicLayoutEffect(() => {
    const img = imgRef.current;
    if (!image || !img) return;
    if (!img.complete) setPendingSrc(image);
    else if (!isUsable(img, image)) setFailedSrc(image);
  }, [image]);

  const showImage = !!image && failedSrc !== image;

  return (
    <Box
      sx={[
        {
          position: 'relative',
          width: '100%',
          aspectRatio: THUMB_ASPECT,
          flex: 'none',
          overflow: 'hidden',
          borderRadius: '14px',
          background: t.skeleton,
          containerType: 'inline-size',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {showImage ? (
        <Box
          component="img"
          ref={imgRef}
          src={image}
          alt={name}
          loading="lazy"
          decoding="async"
          onLoad={(e: React.SyntheticEvent<HTMLImageElement>) => {
            if (isUsable(e.currentTarget, image)) setPendingSrc(null);
            else setFailedSrc(image);
          }}
          onError={() => setFailedSrc(image)}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            // Hide the alt text and outline browsers draw while (or instead of) loading.
            color: 'transparent',
            opacity: pendingSrc === image ? 0 : 1,
            transition: 'opacity .2s ease',
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        />
      ) : (
        <Box
          component="span"
          sx={{
            px: '10cqw',
            color: t.faint,
            fontSize: 'clamp(12px, 7cqw, 20px)',
            fontWeight: 500,
            letterSpacing: '-.01em',
            lineHeight: 1.25,
            textAlign: 'center',
            textWrap: 'balance',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            // Row-sized thumbs sit right beside the name already; a tile that
            // small stays plain.
            '@container (max-width: 96px)': { display: 'none' },
          }}
        >
          {name}
        </Box>
      )}
    </Box>
  );
}
