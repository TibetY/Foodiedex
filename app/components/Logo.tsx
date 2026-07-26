import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from "react-i18next";
<<<<<<< HEAD
import { useKanpaiTheme } from "~/listTheme";

/** Three overlapping dots — accent, and the fixed decorative sakura/peach pair
 *  — echoing the Kanpai mark, followed by the brand wordmark. */
export default function Logo() {
  const { t } = useTranslation();
  const { tokens } = useKanpaiTheme();
  const brand = t("brand");

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "11px", userSelect: "none" }}>
      <Box sx={{ position: "relative", width: 26, height: 26, flex: "none" }}>
        <Box sx={{ position: "absolute", left: 0, top: 3, width: 17, height: 17, borderRadius: "50%", background: tokens.accent }} />
        <Box sx={{ position: "absolute", left: 9, top: 0, width: 12, height: 12, borderRadius: "50%", background: tokens.wantBg }} />
        <Box sx={{ position: "absolute", left: 13, top: 12, width: 8, height: 8, borderRadius: "50%", background: tokens.avatar2 }} />
      </Box>
      <Typography
        variant="h5"
        component="span"
        sx={{ fontWeight: 600, letterSpacing: "-0.02em", color: "text.primary" }}
      >
        {brand}
=======
import { roundedFont } from "~/listTheme";

/**
 * The brand lockup: a small tracked "THE" eyebrow beside the serif wordmark,
 * "Foodie" in ink + "dex" carried in the accent. Colors come from the active
 * MUI theme, so the same mark works on Daylight cream and Supper green.
 */
export default function Logo() {
  const { t } = useTranslation();
  // Brand reads from i18n (e.g. "The Foodiedex"). A leading "The" becomes the
  // eyebrow; the trailing "dex" takes the accent (mirroring the design handoff).
  const brand = t("brand");
  const hasThe = /^the\s+/i.test(brand);
  const word = hasThe ? brand.replace(/^the\s+/i, "") : brand;
  const dexAt = word.toLowerCase().lastIndexOf("dex");
  const lead = dexAt > 0 ? word.slice(0, dexAt) : word;
  const dex = dexAt > 0 ? word.slice(dexAt) : "";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "baseline",
        gap: "0.45rem",
        userSelect: "none",
      }}
    >
      {hasThe && (
        <Typography
          component="span"
          sx={{
            fontFamily: roundedFont,
            fontWeight: 700,
            fontSize: "0.62rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "text.secondary",
          }}
        >
          {t("brandThe", "The")}
        </Typography>
      )}
      <Typography
        variant="h5"
        component="span"
        sx={{
          fontFamily: "'Instrument Serif', serif",
          fontWeight: 400,
          fontSize: "1.55rem",
          letterSpacing: "-0.01em",
          color: "text.primary",
          lineHeight: 1,
        }}
      >
        {lead}
        {dex && (
          <Box component="span" sx={{ color: "primary.main" }}>
            {dex}
          </Box>
        )}
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
      </Typography>
    </Box>
  );
}
