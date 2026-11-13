import Box from '@mui/material/Box';
import { type SxProps, type Theme } from '@mui/material/styles';
import { distinctionLabel } from '~/utils/distinctions';


// Six round petals about a centre — our own drawing of the guide's
// flower-shaped star, not their artwork. The petals only just touch, so the
// notches between them survive at 14px.
const PETALS = [0, 60, 120, 180, 240, 300].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return { cx: 12 + 7.6 * Math.sin(rad), cy: 12 - 7.6 * Math.cos(rad) };
});

interface MichelinStarsProps {
  /** 1, 2 or 3. Anything else renders nothing. */
  count: number;
  /** Height of one star in px. */
  size?: number;
  /** Fill colour; defaults to the text colour around it. */
  color?: string;
  sx?: SxProps<Theme>;
}

/** One to three Michelin stars in a row, announced as e.g. "2 Michelin Stars". */
export default function MichelinStars({ count, size = 13, color = 'currentColor', sx }: MichelinStarsProps) {
  if (!Number.isInteger(count) || count < 1 || count > 3) return null;
  return (
    <Box
      component="span"
      role="img"
      aria-label={distinctionLabel(`michelin-${count}`)}
      sx={[{ display: 'inline-flex', alignItems: 'center', gap: '2px', lineHeight: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {Array.from({ length: count }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
          <circle cx="12" cy="12" r="6" />
          {PETALS.map((p, j) => (
            <circle key={j} cx={p.cx.toFixed(2)} cy={p.cy.toFixed(2)} r="4.1" />
          ))}
        </svg>
      ))}
    </Box>
  );
}
