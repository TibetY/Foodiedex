import { Box, Container, Typography, Button, Grid } from "@mui/material";
import { Link } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useTranslation } from "react-i18next";
import { createSupabaseServerClient } from "~/supabase.server";
import { heroTokens, listTokens, roundedFont } from "~/listTheme";

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

export default function Index() {
  const { t } = useTranslation();

  const features = [
    { glyph: "📓", tint: t0.tileTint, title: t("landing.curateTitle"), description: t("landing.curateDesc") },
    { glyph: "⭐", tint: t0.tileTint3, title: t("landing.rateTitle"), description: t("landing.rateDesc") },
    { glyph: "💌", tint: t0.tileTint2, title: t("landing.shareTitle"), description: t("landing.shareDesc") },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: heroTokens.bg,
        color: heroTokens.ink,
        overflow: "hidden",
      }}
    >
      {/* Hero */}
      <Container
        maxWidth="lg"
        sx={{
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
          sx={{
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400,
            fontSize: { xs: "2rem", sm: "2.6rem" },
            mb: 4,
            color: heroTokens.ink,
          }}
        >
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
                  sx={{
                    fontFamily: "'Instrument Serif', serif",
                    fontWeight: 400,
                    mb: 1,
                    fontSize: "1.4rem",
                    color: heroTokens.ink,
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography variant="body2" sx={{ color: heroTokens.muted, lineHeight: 1.7 }}>
                  {feature.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

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
        </Typography>
      </Box>
    </Box>
  );
}
