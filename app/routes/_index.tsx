import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useTranslation } from "react-i18next";
import RestaurantMenu from '@mui/icons-material/RestaurantMenu';
import Star from '@mui/icons-material/Star';
import Share from '@mui/icons-material/Share';
import Logo from "~/components/Logo";
import { createSupabaseServerClient } from "~/supabase.server";
import { useKanpaiTheme } from "~/listTheme";

// Signed-in users don't need the marketing page — send them straight to their
// lists so the hero's CTAs are never shown out of context.
export const loader: LoaderFunction = async ({ request }) => {
  const { supabase } = createSupabaseServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return redirect("/dashboard");
  return json({});
};

export default function Index() {
  const { t } = useTranslation();
  const { tokens: tk } = useKanpaiTheme();

  const features = [
    {
      icon: <RestaurantMenu sx={{ fontSize: 19 }} />,
      title: t("landing.curateTitle"),
      description: t("landing.curateDesc"),
    },
    {
      icon: <Star sx={{ fontSize: 19 }} />,
      title: t("landing.rateTitle"),
      description: t("landing.rateDesc"),
    },
    {
      icon: <Share sx={{ fontSize: 19 }} />,
      title: t("landing.shareTitle"),
      description: t("landing.shareDesc"),
    },
  ];

  const stats = [
    { value: t("landing.statPlaces", "9"), label: t("landing.statPlacesLabel", "places we've been") },
    { value: t("landing.statWishlist", "6"), label: t("landing.statWishlistLabel", "still on the wishlist") },
    { value: t("landing.statRating", "4.1"), label: t("landing.statRatingLabel", "average bubbles given") },
    { value: t("landing.statFriends", "6"), label: t("landing.statFriendsLabel", "of us arguing about it") },
  ];

  return (
    <Box sx={{ minHeight: "100vh", background: tk.pageBg, color: tk.ink }}>
      {/* header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 4, padding: { xs: "18px 20px", md: "20px 44px" }, borderBottom: `2px solid ${tk.divider}` }}>
        <Box sx={{ mr: "auto" }}>
          <Logo />
        </Box>
        <Box component={Link} to="/login" sx={{ fontSize: 14, textDecoration: "none", color: tk.ink, display: { xs: "none", sm: "block" } }}>
          {t("nav.login")}
        </Box>
        <Button component={Link} to="/signup" variant="contained" sx={{ borderRadius: "999px" }}>
          {t("landing.ctaPrimary")}
        </Button>
      </Box>

      {/* hero */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.05fr .95fr" },
          gap: { xs: 5, md: 7 },
          padding: { xs: "44px 20px", md: "64px 44px" },
          alignItems: "center",
        }}
      >
        <Box>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              background: tk.beenBg,
              color: tk.beenFg,
              borderRadius: "999px",
              padding: "7px 15px",
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              mb: "22px",
            }}
          >
            {t("landing.eyebrow")}
          </Box>
          <Typography
            component="h1"
            sx={{ fontSize: { xs: 40, sm: 56 }, lineHeight: 1.05, fontWeight: 600, letterSpacing: "-.03em", mb: "18px", maxWidth: "16ch" }}
          >
            {t("landing.titleLine1")}{" "}
            <Box component="span" sx={{ color: tk.accent }}>
              {t("landing.titleLine2")}
            </Box>
          </Typography>
          <Typography sx={{ color: tk.muted, fontSize: 17, lineHeight: 1.6, maxWidth: "44ch", mb: "26px" }}>
            {t("landing.subtitle")}
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, flexDirection: { xs: "column", sm: "row" } }}>
            <Button component={Link} to="/signup" variant="contained" size="large" sx={{ borderRadius: "999px", px: 3.5 }}>
              {t("landing.ctaPrimary")}
            </Button>
            <Button component="a" href="#how-it-works" variant="outlined" size="large" sx={{ borderRadius: "999px", px: 3.5 }}>
              {t("landing.ctaSecondary")}
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            background: tk.cardBg,
            border: `1px solid ${tk.border}`,
            borderRadius: "22px",
            boxShadow: tk.cardShadow,
            padding: "18px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 0.5, mb: 0.5 }}>
            <Box sx={{ display: "flex" }}>
              {["M", "N", "S"].map((a, i) => (
                <Box
                  key={a}
                  aria-hidden
                  sx={{
                    width: 26, height: 26, borderRadius: "50%", ml: i === 0 ? 0 : "-8px",
                    border: `2px solid ${tk.cardBg}`,
                    background: i === 0 ? tk.avatar3 : i === 1 ? tk.wantBg : tk.avatar2,
                    color: tk.ink, fontSize: 11, fontWeight: 600,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {a}
                </Box>
              ))}
            </Box>
            <Typography sx={{ color: tk.muted, fontSize: 12.5 }}>{t("landing.socialProof")}</Typography>
          </Box>
          {[
            { name: "Hoshiba", meta: `${t("cuisines.Japanese", "Izakaya")} · Fremont`, price: "$$", rating: 4, been: true },
            { name: "Yuzu Kōbō", meta: `${t("cuisines.Japanese", "Sake Bar")} · Madrona`, price: "$$$", rating: 0, been: false },
          ].map((c) => (
            <Box key={c.name} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "16px", background: tk.panelBg }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <Box sx={{ fontWeight: 600, fontSize: 15 }}>{c.name}</Box>
                  <Box sx={{ fontSize: 12.5, fontWeight: 600, color: tk.cost }}>{c.price}</Box>
                </Box>
                <Box sx={{ color: tk.muted, fontSize: 12, mt: "1px" }}>{c.meta}</Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: "6px" }}>
                  <Box sx={{ display: "flex", gap: "4px" }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 8, height: 8, borderRadius: "50%", boxSizing: "border-box",
                          background: i < c.rating ? tk.rating : "transparent",
                          border: i < c.rating ? "none" : `1.5px solid ${tk.notRated}`,
                        }}
                      />
                    ))}
                  </Box>
                  <Box sx={{ fontSize: 10.5, fontWeight: 600, px: "9px", py: "3px", borderRadius: "999px", background: c.been ? tk.beenBg : tk.wantBg, color: c.been ? tk.beenFg : tk.wantFg }}>
                    {c.been ? t("dashboard.statusBeen") : t("dashboard.statusWant")}
                  </Box>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* stat band */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", md: "repeat(4,1fr)" }, borderTop: `2px solid ${tk.divider}`, borderBottom: `2px solid ${tk.divider}` }}>
        {stats.map((s, i) => (
          <Box key={s.label} sx={{ padding: "26px 24px", borderRight: i < stats.length - 1 ? `1px solid ${tk.border}` : "none" }}>
            <Box sx={{ fontSize: 34, fontWeight: 800, letterSpacing: "-.03em" }}>{s.value}</Box>
            <Box sx={{ fontSize: 12, color: tk.muted, mt: "2px" }}>{s.label}</Box>
          </Box>
        ))}
      </Box>

      {/* how it works */}
      <Box id="how-it-works" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3,1fr)" }, gap: "1px", background: tk.hair, borderBottom: `2px solid ${tk.divider}`, scrollMarginTop: "20px" }}>
        {features.map((f) => (
          <Box key={f.title} sx={{ background: tk.panelBg, padding: "34px 30px" }}>
            <Box sx={{ width: 40, height: 40, borderRadius: "50%", background: tk.beenBg, color: tk.beenFg, display: "grid", placeItems: "center", mb: 2 }}>
              {f.icon}
            </Box>
            <Typography sx={{ fontSize: 19, fontWeight: 600, mb: 1 }}>{f.title}</Typography>
            <Typography sx={{ color: tk.muted, fontSize: 13.5, lineHeight: 1.6 }}>{f.description}</Typography>
          </Box>
        ))}
      </Box>

      {/* closing band */}
      <Box sx={{ padding: { xs: "40px 20px", md: "48px 44px" }, background: tk.accent, color: tk.accentText }}>
        <Box sx={{ fontSize: 11.5, letterSpacing: ".14em", textTransform: "uppercase", opacity: 0.7, mb: "18px" }}>
          {t("landing.closingEyebrow", "Where we want to go next")}
        </Box>
        <Typography sx={{ fontSize: { xs: 30, md: 40 }, lineHeight: 1.1, fontWeight: 600, letterSpacing: "-.03em", mb: "22px", maxWidth: "24ch" }}>
          {t("landing.closingTitle", "Six places on the list. Two of them close at nine.")}
        </Typography>
        <Button component={Link} to="/signup" variant="contained" sx={{ borderRadius: "999px", background: tk.accentText, color: tk.accent, "&:hover": { background: tk.accentText, filter: "brightness(0.95)" } }}>
          {t("landing.closingCta", "Start your own list")}
        </Button>
      </Box>

      {/* footer */}
      <Box sx={{ display: "flex", alignItems: "center", gap: "20px", padding: { xs: "22px 20px", md: "22px 44px" }, fontSize: 12, color: tk.faint }}>
        <Box component="span">{t("landing.footer")}</Box>
      </Box>
    </Box>
  );
}
