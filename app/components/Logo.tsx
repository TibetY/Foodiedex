import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from "react-i18next";
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
      </Typography>
    </Box>
  );
}
