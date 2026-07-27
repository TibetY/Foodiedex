import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from "react-i18next";
import { useKanpaiTheme } from "~/listTheme";

/** A size that may differ per breakpoint, as MUI's sx accepts. */
type MarkSize = number | { xs: number; sm: number };

/** Scale one of the mark's ratios (measured against a 26px box) to the
 *  requested size, preserving a responsive shape if one was given. */
function at(size: MarkSize, ratio: number): number | { xs: number; sm: number } {
  const scale = (n: number) => Math.round(n * ratio * 100) / 100;
  return typeof size === 'number'
    ? scale(size)
    : { xs: scale(size.xs), sm: scale(size.sm) };
}

/**
 * The Kanpai mark on its own: three overlapping dots — the live accent, plus
 * the fixed decorative sakura/peach pair. The single source of the geometry,
 * used by the wordmark lockup below and by the app/share headers, so the mark
 * can never drift between surfaces. `public/favicon.svg` mirrors the same
 * arrangement (with stronger dot colours, which is what stays legible at 16px).
 */
export function LogoMark({ size = 26 }: { size?: MarkSize }) {
  const { tokens } = useKanpaiTheme();
  const dot = (leftR: number, topR: number, sizeR: number, background: string) => ({
    position: 'absolute' as const,
    left: at(size, leftR),
    top: at(size, topR),
    width: at(size, sizeR),
    height: at(size, sizeR),
    borderRadius: '50%',
    background,
  });

  return (
    <Box aria-hidden sx={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <Box sx={dot(0, 3 / 26, 17 / 26, tokens.accent)} />
      <Box sx={dot(9 / 26, 0, 12 / 26, tokens.wantBg)} />
      <Box sx={dot(13 / 26, 12 / 26, 8 / 26, tokens.avatar2)} />
    </Box>
  );
}

/** The mark followed by the brand wordmark. */
export default function Logo() {
  const { t } = useTranslation();
  const brand = t("brand");

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "11px", userSelect: "none" }}>
      <LogoMark />
      <Typography
        variant="h5"
        component="span"
        sx={{ fontWeight: 600, letterSpacing: "-0.02em", color: "text.primary" }}
      >
        {brand}
      </Typography>
    </Box>
  );
}
