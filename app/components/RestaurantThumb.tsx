import { useState } from 'react';
import Box from '@mui/material/Box';
import { type SxProps, type Theme } from '@mui/material/styles';
import type { ListTokens } from '~/listTheme';
import { cuisineEmoji, cuisineTint } from '~/utils/cuisineEmoji';

type Tokens = ListTokens;

interface RestaurantThumbProps {
  image?: string;
  alt: string;
  initial: string;
  serifFont: string;
  tokens: Tokens;
  initialFontSize?: number;
  /** Cuisine of the place — drives the emoji tile shown when there's no photo. */
  cuisine?: string;
  sx?: SxProps<Theme>;
}

/**
 * Restaurant thumbnail used by every card/popup/dialog. When there's no image —
 * or the URL fails to load (broken/expired scraped images are common) — it
 * falls back to the cuisine tile: the food glyph on its tint, so a list of
 * photo-less places still reads as the cuisine-tile system rather than a wall
 * of grey. Without a known cuisine it keeps the serif-initial placeholder.
 */
export default function RestaurantThumb({
  image,
  alt,
  initial,
  serifFont,
  tokens: t,
  initialFontSize = 68,
  cuisine,
  sx,
}: RestaurantThumbProps) {
  const [failed, setFailed] = useState(false);
  const showTile = (!image || failed) && !!cuisine;

  return (
    <Box
      sx={{
        position: 'relative',
        // Cuisine tint under the glyph; the editorial diagonal stripes stay for
        // places whose cuisine we don't know.
        background: showTile
          ? cuisineTint(cuisine, t)
          : `repeating-linear-gradient(135deg, ${t.thumbStripeA} 0 9px, ${t.thumbStripeB} 9px 18px)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...sx,
      }}
    >
      {image && !failed ? (
        <Box
          component="img"
          src={image}
          alt={alt}
          onError={() => setFailed(true)}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />
      ) : showTile ? (
        <Box component="span" aria-hidden sx={{ fontSize: initialFontSize * 0.72, lineHeight: 1 }}>
          {cuisineEmoji(cuisine)}
        </Box>
      ) : (
        <Box component="span" sx={{ fontFamily: serifFont, fontSize: initialFontSize, color: t.monoInitial, lineHeight: 1 }}>
          {initial}
        </Box>
      )}
    </Box>
  );
}
