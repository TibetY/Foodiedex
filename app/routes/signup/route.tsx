import { useState } from "react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { createSupabaseServerClient } from "~/supabase.server";
import { safeRedirect } from "~/utils/safeRedirect";
import { getSiteUrl } from "~/utils/siteUrl.server";
import i18nextServer from "~/i18next.server";
import GoogleButton from "~/components/GoogleButton";
import Logo from "~/components/Logo";
import { useKanpaiTheme } from "~/listTheme";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

type LoaderData = {
  next: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const next = safeRedirect(new URL(request.url).searchParams.get("next"));
  const { supabase } = createSupabaseServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    return redirect(next);
  }
  return json<LoaderData>({ next });
};

type ActionData = {
  error?: string;
  message?: string;
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const next = safeRedirect(formData.get("next"));
  const t = await i18nextServer.getFixedT(request);

  if (password !== confirmPassword) {
    return json<ActionData>({ error: t("signup.passwordsNoMatch") });
  }

  const { supabase, headers } = createSupabaseServerClient(request);
  const origin = getSiteUrl(request);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Where the confirmation email link returns to. Our /auth/confirm route
      // verifies the token and signs the user in, then forwards to `next`.
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    console.error("Signup error:", error.message);
    return json<ActionData>({ error: error.message });
  }

  // When email confirmation is enabled, no session is returned yet. Return the
  // headers so any auth cookies set during sign-up are persisted.
  if (!data.session) {
    return json<ActionData>(
      {
        message: t("signup.checkEmail"),
      },
      { headers }
    );
  }

  return redirect(next, { headers });
};

export default function SignUpPage() {
  const actionData = useActionData<ActionData>();
  const { next } = useLoaderData<LoaderData>();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { tokens: tk } = useKanpaiTheme();

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateColumns: { xs: "1fr", md: ".85fr 1fr" }, background: tk.pageBg }}>
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          background: tk.accent,
          color: tk.accentText,
          padding: "40px",
        }}
      >
        <Box sx={{ mb: "auto" }}>
          <Logo onAccent />
        </Box>
        <Typography sx={{ fontSize: 26, fontWeight: 600, lineHeight: 1.3, mb: 1.5, maxWidth: '20ch' }}>
          {t("signup.quote", "“Two lists, six friends, one running argument about the ramen place.”")}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", px: { xs: 3, sm: 4 }, py: 8 }}>
      <Box sx={{ width: "100%", maxWidth: 400 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 600, mb: 1, letterSpacing: "-0.02em", color: tk.ink }}
        >
          {t("signup.title")}
        </Typography>
        <Typography variant="body1" sx={{ color: tk.muted, mb: 4 }}>
          {t("signup.haveAccount")}{" "}
          <Box
            component={Link}
            to={`/login?next=${encodeURIComponent(next)}`}
            sx={{
              color: tk.accent,
              textDecoration: "none",
              fontWeight: 600,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {t("signup.signin")}
          </Box>
        </Typography>

        {actionData?.error && (
          <Alert severity="error" sx={{ mb: 3 }} role="alert">
            {actionData.error}
          </Alert>
        )}

        {actionData?.message && (
          <Alert severity="success" sx={{ mb: 3 }} role="status">
            {actionData.message}
          </Alert>
        )}

        <GoogleButton next={next} />

        <Form method="post" noValidate>
          <input type="hidden" name="next" value={next} />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            name="email"
            label={t("signup.email")}
            type="email"
            autoComplete="email"
            sx={{ mb: 2 }}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            id="password"
            label={t("signup.password")}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    aria-label={t(showPassword ? "a11y.hidePassword" : "a11y.showPassword")}
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            id="confirmPassword"
            label={t("signup.confirmPassword")}
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            sx={{ mb: 3 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    aria-label={t(showConfirm ? "a11y.hidePassword" : "a11y.showPassword")}
                    onClick={() => setShowConfirm((v) => !v)}
                    edge="end"
                  >
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            sx={{ py: 1.5 }}
          >
            {t("signup.submit")}
          </Button>
        </Form>

        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "center",
            mt: 3,
            color: "text.secondary",
            lineHeight: 1.6,
          }}
        >
          {t("signup.disclaimer")}
        </Typography>
      </Box>
      </Box>
    </Box>
  );
}
