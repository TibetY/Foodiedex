import { useState } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
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

type ActionData = {
  error?: string;
  // Set when sign-in failed because the email hasn't been confirmed yet, so the
  // page can offer a "resend confirmation" action (with the email to resend to).
  unconfirmed?: boolean;
  email?: string;
  resent?: boolean;
};

/** Supabase reports an unconfirmed email via code or message, depending on version. */
function isEmailNotConfirmed(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  if (!e) return false;
  return e.code === "email_not_confirmed" || /not confirmed/i.test(e.message ?? "");
}

type LoaderData = {
  next: string;
  error: string | null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const next = safeRedirect(url.searchParams.get("next"));
  const error = url.searchParams.get("error");
  const { supabase } = createSupabaseServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    return redirect(next);
  }
  return json<LoaderData>({ next, error });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const email = (formData.get("email") as string) ?? "";
  const next = safeRedirect(formData.get("next"));

  const { supabase, headers } = createSupabaseServerClient(request);
  const t = await i18nextServer.getFixedT(request);

  // Re-send the confirmation email for an unconfirmed account.
  if (intent === "resend") {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${getSiteUrl(request)}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      console.error("Resend confirmation error:", error.message);
      return json<ActionData>({ error: t("login.resendFailed"), unconfirmed: true, email });
    }
    return json<ActionData>({ resent: true });
  }

  const password = formData.get("password") as string;
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("Login error:", error.message);
    // Give the unconfirmed-email case its own message + a resend affordance
    // instead of surfacing Supabase's terse "Email not confirmed".
    if (isEmailNotConfirmed(error)) {
      return json<ActionData>({ error: t("login.emailNotConfirmed"), unconfirmed: true, email });
    }
    return json<ActionData>({ error: error.message });
  }

  return redirect(next, { headers });
};

export default function LoginPage() {
  const actionData = useActionData<ActionData>();
  const { next, error: loaderError } = useLoaderData<LoaderData>();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
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
          {t("login.quote", "“Finally made it to the place on the list. Five bubbles, no notes.”")}
        </Typography>
        <Box sx={{ fontSize: 12, opacity: 0.75 }}>{t("login.quoteAttribution", "— a happy user")}</Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", px: { xs: 3, sm: 4 }, py: 8 }}>
      <Box sx={{ width: "100%", maxWidth: 400 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 600, mb: 1, letterSpacing: "-0.02em", color: tk.ink }}
        >
          {t("login.title")}
        </Typography>
        <Typography variant="body1" sx={{ color: tk.muted, mb: 4 }}>
          {t("login.noAccount")}{" "}
          <Box
            component={Link}
            to={`/signup?next=${encodeURIComponent(next)}`}
            sx={{
              color: tk.accent,
              textDecoration: "none",
              fontWeight: 600,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {t("login.createFree")}
          </Box>
        </Typography>

        {actionData?.resent && (
          <Alert severity="success" sx={{ mb: 3 }} role="status">
            {t("login.confirmationResent")}
          </Alert>
        )}

        {(actionData?.error || loaderError) && (
          <Alert
            severity={actionData?.unconfirmed ? "warning" : "error"}
            sx={{ mb: actionData?.unconfirmed ? 1.5 : 3 }}
            role="alert"
          >
            {actionData?.error ?? loaderError}
          </Alert>
        )}

        {actionData?.unconfirmed && (
          <Box sx={{ mb: 3 }}>
            <Form method="post">
              <input type="hidden" name="intent" value="resend" />
              <input type="hidden" name="email" value={actionData.email ?? ""} />
              <input type="hidden" name="next" value={next} />
              <Button type="submit" variant="text" size="small" sx={{ px: 0, fontWeight: 600 }}>
                {t("login.resendConfirmation")}
              </Button>
            </Form>
          </Box>
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
            label={t("login.email")}
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
            label={t("login.password")}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            sx={{ mb: 3 }}
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
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            sx={{ py: 1.5 }}
          >
            {t("login.submit")}
          </Button>
        </Form>

        <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }}>
          <Box
            component={Link}
            to="/forgot-password"
            sx={{
              color: "text.secondary",
              textDecoration: "none",
              fontWeight: 500,
              "&:hover": { color: "primary.main", textDecoration: "underline" },
            }}
          >
            {t("login.forgotPassword")}
          </Box>
        </Typography>
      </Box>
      </Box>
    </Box>
  );
}
