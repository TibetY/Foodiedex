import { useState } from "react";
import type { LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useNavigate, Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useKanpaiTheme } from "~/listTheme";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { createSupabaseServerClient } from "~/supabase.server";
import { getSupabaseBrowserClient } from "~/supabase.client";

/**
 * Lands here after a recovery link is verified by /auth/confirm (which sets a
 * short-lived session). The user picks a new password, which we save with
 * supabase.auth.updateUser. If there's no session (link expired or opened
 * directly), bounce to the request form.
 */
export const loader: LoaderFunction = async ({ request }) => {
  const { supabase, headers } = createSupabaseServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/forgot-password");
  return json({}, { headers });
};

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const { tokens: tk } = useKanpaiTheme();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError(t("reset.tooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("reset.mismatch"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      navigate("/dashboard");
    } catch (err) {
      console.error("Password update failed:", err);
      setError(t("reset.failed"));
      setSaving(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 3, sm: 4 },
        pt: 8,
        background: tk.pageBg,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 440,
          p: { xs: 3, sm: 5 },
          borderRadius: "24px",
          background: tk.cardBg,
          border: `1px solid ${tk.border}`,
          boxShadow: tk.cardShadow,
        }}
        className="animate-fade-in-up"
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 600, mb: 1, letterSpacing: "-0.02em", color: tk.ink }}
        >
          {t("reset.title")}
        </Typography>
        <Typography variant="body1" sx={{ color: tk.muted, mb: 4 }}>
          {t("reset.intro")}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} role="alert">
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="password"
            name="password"
            label={t("reset.newPassword")}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="confirmPassword"
            name="confirmPassword"
            label={t("reset.confirmPassword")}
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={saving}
            sx={{ py: 1.5 }}
          >
            {saving ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              t("reset.submit")
            )}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }}>
          <Box
            component={Link}
            to="/login"
            sx={{
              color: "primary.main",
              textDecoration: "none",
              fontWeight: 600,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {t("reset.backToLogin")}
          </Box>
        </Typography>
      </Box>
    </Container>
  );
}
