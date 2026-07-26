import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useTranslation } from "react-i18next";
<<<<<<< HEAD
import RestaurantMenu from '@mui/icons-material/RestaurantMenu';
import Star from '@mui/icons-material/Star';
import Share from '@mui/icons-material/Share';
import Logo from "~/components/Logo";
import { createSupabaseServerClient } from "~/supabase.server";
import { useKanpaiTheme } from "~/listTheme";
=======
import { createSupabaseServerClient } from "~/supabase.server";
import { heroTokens, listTokens, roundedFont } from "~/listTheme";
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9

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

<<<<<<< HEAD
=======
const t0 = listTokens.light;
const ACCENT = t0.accent; // terracotta — Daylight's single accent

/** The decorative cuisine bubbles floating under the hero. Glyphs always sit on
 *  one of the three tile tints, never loose in copy — that's what keeps a
 *  heavily-emoji UI feeling systematic instead of noisy. */
const CUISINE_BUBBLES: { glyph: string; tint: string }[] = [
  { glyph: "🍣", tint: t0.tileTint },
  { glyph: "🍜", tint: t0.tileTint2 },
  { glyph: "🍝", tint: t0.tileTint3 },
  { glyph: "🥐", tint: t0.tileTint2 },
  { glyph: "🌮", tint: t0.tileTint },
  { glyph: "🍷", tint: t0.tileTint3 },
  { glyph: "🍰", tint: t0.tileTint2 },
];

/** A small decorative restaurant card for the hero cluster (not interactive). */
function PreviewCard({
  glyph,
  tint,
  name,
  meta,
  price,
  rating,
  statusLabel,
  been,
}: {
  glyph: string;
  tint: string;
  name: string;
  meta: string;
  price: string;
  rating?: number;
  statusLabel: string;
  been?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1.5,
        borderRadius: "18px",
        background: t0.panelBg,
        border: `1px solid ${t0.border}`,
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 44,
          height: 44,
          flex: "none",
          borderRadius: "14px",
          background: tint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}
      >
        {glyph}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ fontFamily: "'Instrument Serif', serif", fontSize: 17, color: t0.ink }}>
            {name}
          </Box>
          <Box sx={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 600, color: t0.cost }}>
            {price}
          </Box>
        </Box>
        <Box sx={{ color: t0.muted, fontSize: 12.5, mt: "1px" }}>{meta}</Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: "5px" }}>
          <Box sx={{ color: ACCENT, fontSize: 13, letterSpacing: "1px" }}>
            {rating ? "★★★★★".slice(0, rating) + "☆☆☆☆☆".slice(0, 5 - rating) : ""}
          </Box>
          <Box
            sx={{
              fontFamily: roundedFont,
              fontSize: 10.5,
              fontWeight: 700,
              px: "10px",
              py: "3px",
              borderRadius: "999px",
              background: been ? t0.beenBg : t0.wantBg,
              color: been ? t0.beenFg : t0.wantFg,
            }}
          >
            {statusLabel}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
export default function Index() {
  const { t } = useTranslation();
  const { tokens: tk } = useKanpaiTheme();

  const features = [
<<<<<<< HEAD
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
=======
    { glyph: "📓", tint: t0.tileTint, title: t("landing.curateTitle"), description: t("landing.curateDesc") },
    { glyph: "⭐", tint: t0.tileTint3, title: t("landing.rateTitle"), description: t("landing.rateDesc") },
    { glyph: "💌", tint: t0.tileTint2, title: t("landing.shareTitle"), description: t("landing.shareDesc") },
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
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
<<<<<<< HEAD
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
=======
          flex: 1,
          pt: { xs: 14, sm: 18 },
          pb: { xs: 6, sm: 8 },
          px: { xs: 3, sm: 4 },
        }}
      >
        <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">
          {/* Left — copy + CTAs */}
          <Grid item xs={12} md={7}>
            {/* The navbar already carries the wordmark — repeating it here read
                as clutter, so the hero opens straight on the eyebrow. */}
            <Typography
              component="p"
              className="animate-fade-in-up delay-100"
              sx={{
                fontFamily: roundedFont,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                fontSize: "0.76rem",
                fontWeight: 700,
                color: ACCENT,
                mb: 2,
              }}
            >
              {t("landing.eyebrow")}
            </Typography>
            <Typography
              component="h1"
              className="animate-fade-in-up delay-100"
              sx={{
                fontFamily: "'Instrument Serif', serif",
                fontWeight: 400,
                fontSize: { xs: "2.7rem", sm: "3.6rem", md: "4.2rem" },
                lineHeight: 1.04,
                letterSpacing: "-0.01em",
                mb: 2.5,
                color: heroTokens.ink,
              }}
            >
              {t("landing.titleLine1")}
              <br />
              <Box component="span" sx={{ color: ACCENT }}>
                {t("landing.titleLine2")}
              </Box>
            </Typography>
            <Typography
              component="p"
              className="animate-fade-in-up delay-200"
              sx={{
                color: heroTokens.muted,
                fontSize: { xs: "1rem", sm: "1.15rem" },
                maxWidth: 520,
                mb: 4,
                lineHeight: 1.65,
              }}
            >
              {t("landing.subtitle")}
            </Typography>
            <Box
              className="animate-fade-in-up delay-300"
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: { xs: "column", sm: "row" },
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {/* Primary CTA — the one place Ember (gradient) is allowed: the hero. */}
              <Button
                component={Link}
                to="/signup"
                size="large"
                sx={{
                  px: 4.5,
                  py: 1.5,
                  fontSize: "1.05rem",
                  color: "#fff",
                  background: heroTokens.ember,
                  boxShadow: "0 14px 30px -14px rgba(168,71,42,.55)",
                  "&:hover": {
                    background: heroTokens.ember,
                    filter: "brightness(1.05)",
                    boxShadow: "0 16px 34px -14px rgba(168,71,42,.6)",
                  },
                }}
              >
                {t("landing.ctaPrimary")}
              </Button>
              <Button
                component="a"
                href="#how-it-works"
                variant="outlined"
                size="large"
                sx={{
                  px: 4.5,
                  py: 1.5,
                  fontSize: "1.05rem",
                }}
              >
                {t("landing.ctaSecondary")}
              </Button>
            </Box>

            {/* Cuisine bubbles — pure decoration, gently bobbing. */}
            <Box
              aria-hidden
              className="animate-fade-in-up delay-400"
              sx={{
                display: "flex",
                gap: { xs: 1.25, sm: 1.75 },
                mt: { xs: 5, sm: 7 },
                flexWrap: "wrap",
              }}
            >
              {CUISINE_BUBBLES.map((b, i) => (
                <Box
                  key={`${b.glyph}-${i}`}
                  className={i % 2 === 0 ? "animate-bob" : "animate-bob-alt"}
                  sx={{
                    width: { xs: 46, sm: 54 },
                    height: { xs: 46, sm: 54 },
                    borderRadius: "18px",
                    background: b.tint,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: { xs: 22, sm: 26 },
                    boxShadow: t0.bubbleShadow,
                    animationDelay: `${(i % 5) * 0.7}s`,
                  }}
                >
                  {b.glyph}
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Right — sample-card cluster + social proof */}
          <Grid item xs={12} md={5}>
            <Box
              className="animate-fade-in-up delay-200"
              sx={{
                p: 2.5,
                borderRadius: "26px",
                background: heroTokens.glass,
                border: `1px solid ${heroTokens.glassBorder}`,
                boxShadow: t0.cardShadow,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, px: 0.5 }}>
                <Box sx={{ display: "flex" }}>
                  {["M", "J", "R"].map((a, i) => (
                    <Box
                      key={a}
                      aria-hidden
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        ml: i === 0 ? 0 : "-9px",
                        border: "2px solid #FFFFFF",
                        background: i === 0 ? ACCENT : i === 1 ? t0.avatar2 : t0.avatar3,
                        color: i === 2 ? t0.ink : "#FFF9EE",
                        fontSize: 12,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {a}
                    </Box>
                  ))}
                </Box>
                <Typography sx={{ color: heroTokens.muted, fontSize: 12.5 }}>
                  {t("landing.socialProof")}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <PreviewCard
                  glyph="🦞"
                  tint={t0.tileTint}
                  name="The Whalesbone"
                  meta={`Ottawa · ${t("cuisines.Seafood", "Seafood")}`}
                  price="$$$"
                  rating={5}
                  statusLabel={t("dashboard.statusBeen")}
                  been
                />
                <PreviewCard
                  glyph="🥐"
                  tint={t0.tileTint2}
                  name="Atelier"
                  meta={`Ottawa · ${t("cuisines.French", "French")}`}
                  price="$$$$"
                  statusLabel={t("dashboard.statusWant")}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* How it works */}
      <Container
        id="how-it-works"
        maxWidth="lg"
        sx={{ pb: { xs: 8, sm: 12 }, px: { xs: 3, sm: 4 }, scrollMarginTop: "90px" }}
      >
        <Typography
          component="h2"
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
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
<<<<<<< HEAD
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 0.5, mb: 0.5 }}>
            <Box sx={{ display: "flex" }}>
              {["M", "N", "S"].map((a, i) => (
                <Box
                  key={a}
                  aria-hidden
=======
          {t("landing.howItWorksTitle")}
        </Typography>
        <Grid container spacing={3}>
          {features.map((feature) => (
            <Grid item xs={12} sm={4} key={feature.title}>
              <Box
                sx={{
                  p: 4,
                  borderRadius: "22px",
                  background: heroTokens.glass,
                  border: `1px solid ${heroTokens.glassBorder}`,
                  boxShadow: t0.bubbleShadow,
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                  height: "100%",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: t0.shadow2,
                  },
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    mb: 2,
                    width: 56,
                    height: 56,
                    borderRadius: "18px",
                    background: feature.tint,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 27,
                  }}
                >
                  {feature.glyph}
                </Box>
                <Typography
                  component="h3"
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
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

<<<<<<< HEAD
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
=======
      {/* Footer */}
      <Box
        component="footer"
        sx={{
          textAlign: "center",
          py: 4,
          borderTop: `1px solid ${heroTokens.glassBorder}`,
          background: t0.footerBg,
        }}
      >
        <Typography variant="body2" sx={{ color: heroTokens.muted }}>
          {t("landing.footer")}
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
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
