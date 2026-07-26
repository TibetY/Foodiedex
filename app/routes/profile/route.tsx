import { useState } from 'react';
import type { LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { createSupabaseServerClient } from '~/supabase.server';
import { getProfile } from '~/services/profiles.server';
import { updateProfile, uploadAvatar } from '~/services/profiles.client';
import { getSupabaseBrowserClient } from '~/supabase.client';
<<<<<<< HEAD
import { useKanpaiTheme, ACCENTS, accentSwatch, type AccentName } from '~/listTheme';
=======
import { makeListTheme, getStoredMode, storeMode, type ListMode, modeFromCookieHeader } from '~/listTheme';
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9
import type { Profile } from '~/types/restaurant';
import LanguageSwitcher from '~/components/LanguageSwitcher';

type LoaderData = {
  /** Theme the request carries, so SSR paints the user's mode. */
  initialMode: ListMode; userId: string; profile: Profile | null };

export const loader: LoaderFunction = async ({ request }) => {
  const { supabase, headers } = createSupabaseServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const profile = await getProfile(supabase, user.id);
  return json<LoaderData>(
    { userId: user.id, profile, initialMode: modeFromCookieHeader(request.headers.get('Cookie')) },
    { headers }
  );
};

/** Ruled section wrapper matching the Kanpai Account screen. */
function Section({
  eyebrow,
  children,
  tokens: t,
}: {
  eyebrow: string;
  children: React.ReactNode;
  tokens: ReturnType<typeof useKanpaiTheme>['tokens'];
}) {
  return (
    <Box sx={{ py: 4, borderTop: `2px solid ${t.divider}` }}>
      <Box sx={{ fontSize: 11.5, letterSpacing: '.1em', textTransform: 'uppercase', color: t.faint, mb: 2 }}>
        {eyebrow}
      </Box>
      {children}
    </Box>
  );
}

export default function ProfilePage() {
  const { userId, profile, initialMode } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const { t } = useTranslation();
<<<<<<< HEAD
  const { mode, accent, tokens: tk, setMode, setAccent } = useKanpaiTheme();
=======
  const [mode, setMode] = useState<ListMode>(initialMode);
  // Reconcile with localStorage for visitors who chose a theme before the
  // cookie existed; storeMode then persists it so later loads never flip.
  useEffect(() => {
    const stored = getStoredMode();
    if (stored !== initialMode) {
      setMode(stored);
      storeMode(stored);
    }
  }, [initialMode]);
  const theme = makeListTheme(mode);
>>>>>>> c2f54faee97a5a72a0cc26c02599436a0db58cf9

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? '');
  const [avatarFile, setAvatarFile] = useState<File | undefined>();
  const [preview, setPreview] = useState(profile?.avatarUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let url = avatarUrl;
      if (avatarFile) {
        url = await uploadAvatar(avatarFile, userId);
        setAvatarUrl(url);
      }
      await updateProfile(userId, { displayName: displayName.trim(), avatarUrl: url });
      setSnackbar({ open: true, message: t('profile.saved'), severity: 'success' });
    } catch (error) {
      console.error('Error saving profile:', error);
      setSnackbar({ open: true, message: t('profile.saveFailed'), severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordError(t('profile.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('profile.passwordMismatch'));
      return;
    }
    setSavingPassword(true);
    setPasswordError('');
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      setSnackbar({ open: true, message: t('profile.passwordUpdated'), severity: 'success' });
    } catch (error) {
      console.error('Error updating password:', error);
      setSnackbar({ open: true, message: t('profile.passwordUpdateFailed'), severity: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: tk.pageBg, color: tk.ink }}>
      <Box
        component="header"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: { xs: '18px 18px', md: '20px 40px' },
          borderBottom: `2px solid ${tk.divider}`,
          background: tk.panelBg,
          gap: 2,
        }}
      >
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} sx={{ color: tk.muted }}>
          {t('profile.back')}
        </Button>
        <LanguageSwitcher />
      </Box>

      <Container maxWidth="sm" sx={{ pt: { xs: 5, sm: 7 }, pb: 10 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, pb: 4 }}>
          <Avatar src={preview} alt={t('profile.photoAlt')} sx={{ width: 68, height: 68, fontSize: 26, fontWeight: 600 }}>
            {(displayName?.[0] ?? '?').toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 24, fontWeight: 600 }}>{displayName || t('profile.title')}</Typography>
            <Button
              variant="text"
              component="label"
              size="small"
              startIcon={<PhotoCamera fontSize="small" />}
              sx={{ px: 0, mt: '2px' }}
            >
              {preview ? t('profile.changePhoto') : t('profile.uploadPhoto')}
              <input type="file" hidden accept="image/*" onChange={handleFile} aria-label={t('profile.uploadAvatar')} />
            </Button>
          </Box>
        </Box>

        <Section eyebrow={t('profile.displayName')} tokens={tk}>
          <TextField
            fullWidth
            label={t('profile.displayName')}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            sx={{ mb: 2.5 }}
          />
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ minWidth: 140 }}>
            {saving ? <CircularProgress size={22} color="inherit" /> : t('profile.save')}
          </Button>
        </Section>

        <Section eyebrow={t('profile.appearanceTitle', 'Appearance')} tokens={tk}>
          <Box sx={{ display: 'flex', gap: '10px', mb: '14px', flexWrap: 'wrap' }}>
            {(Object.keys(ACCENTS) as AccentName[]).map((name) => {
              const sw = accentSwatch(name, mode);
              const active = accent === name;
              return (
                <Box
                  key={name}
                  component="button"
                  type="button"
                  onClick={() => setAccent(name)}
                  aria-pressed={active}
                  sx={{
                    flex: '1 1 140px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    background: tk.cardBg,
                    border: `${active ? 2 : 1}px solid ${active ? tk.accent : tk.border}`,
                    borderRadius: '18px',
                    padding: active ? '13px 15px' : '14px 16px',
                    fontFamily: 'inherit',
                    color: tk.ink,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: '5px', mb: '11px' }}>
                    <Box sx={{ width: 17, height: 17, borderRadius: '50%', background: sw.c1 }} />
                    <Box sx={{ width: 17, height: 17, borderRadius: '50%', background: sw.c2 }} />
                    <Box sx={{ width: 17, height: 17, borderRadius: '50%', background: sw.c3 }} />
                  </Box>
                  <Box sx={{ fontSize: 13.5, fontWeight: 600 }}>{sw.label}</Box>
                  <Box sx={{ fontSize: 11, color: tk.muted, mt: '2px' }}>{sw.note}</Box>
                </Box>
              );
            })}
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '13px 17px',
              background: tk.cardBg,
              border: `1px solid ${tk.border}`,
              borderRadius: '18px',
            }}
          >
            <Box>
              <Box sx={{ fontSize: 14, fontWeight: 600 }}>{t('profile.darkModeTitle', 'Dark mode')}</Box>
              <Box sx={{ fontSize: 12, color: tk.muted }}>
                {mode === 'dark'
                  ? t('profile.darkModeOnNote', 'Cream on charcoal — easier at night')
                  : t('profile.darkModeOffNote', 'Charcoal on cream, the daytime default')}
              </Box>
            </Box>
            <Box sx={{ ml: 'auto', display: 'flex', gap: '4px', padding: '4px', background: tk.track, borderRadius: '999px', flex: 'none' }}>
              <Box
                component="button"
                type="button"
                onClick={() => setMode('light')}
                aria-pressed={mode === 'light'}
                sx={{
                  border: 'none', cursor: 'pointer', fontWeight: mode === 'light' ? 600 : 400, fontSize: 12,
                  padding: '7px 15px', borderRadius: '999px',
                  background: mode === 'light' ? tk.cardBg : 'transparent',
                  color: mode === 'light' ? tk.ink : tk.muted,
                  boxShadow: mode === 'light' ? tk.shadow1 : 'none',
                }}
              >
                {t('dashboard.themeLight')}
              </Box>
              <Box
                component="button"
                type="button"
                onClick={() => setMode('dark')}
                aria-pressed={mode === 'dark'}
                sx={{
                  border: 'none', cursor: 'pointer', fontWeight: mode === 'dark' ? 600 : 400, fontSize: 12,
                  padding: '7px 15px', borderRadius: '999px',
                  background: mode === 'dark' ? tk.cardBg : 'transparent',
                  color: mode === 'dark' ? tk.ink : tk.muted,
                  boxShadow: mode === 'dark' ? tk.shadow1 : 'none',
                }}
              >
                {t('dashboard.themeDark')}
              </Box>
            </Box>
          </Box>
        </Section>

        <Section eyebrow={t('profile.security')} tokens={tk}>
          <Typography variant="body2" sx={{ color: tk.muted, mb: 2.5 }}>
            {t('profile.securityIntro')}
          </Typography>

          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }} role="alert">
              {passwordError}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdatePassword();
            }}
          >
            <TextField
              fullWidth
              type="password"
              label={t('profile.newPassword')}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              autoComplete="new-password"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="password"
              label={t('profile.confirmPassword')}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              autoComplete="new-password"
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="outlined"
              disabled={savingPassword || !newPassword || !confirmPassword}
              sx={{ minWidth: 160 }}
            >
              {savingPassword ? <CircularProgress size={22} color="inherit" /> : t('profile.updatePassword')}
            </Button>
          </Box>
        </Section>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
