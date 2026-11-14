import type { ReactNode } from 'react';
import { Link } from '@remix-run/react';
import Box from '@mui/material/Box';
import { useKanpaiTheme } from '~/listTheme';

/** Where people write about their data or these terms. Shown on both pages. */
export const LEGAL_CONTACT_EMAIL = 'privacy@example.com';

/** The date both documents last changed. Update it with any edit to either. */
export const LEGAL_UPDATED = 'November 13, 2026';

/**
 * Shared shell for the privacy policy and the terms of service: one readable
 * column, sized for a phone first, with the two documents linked to each other
 * at the foot of the page.
 */
export default function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const { tokens: t } = useKanpaiTheme();

  return (
    <Box sx={{ minHeight: '100dvh', background: t.pageBg, color: t.ink }}>
      <Box
        component="article"
        sx={{
          maxWidth: 680,
          mx: 'auto',
          // Clear the fixed navbar.
          padding: { xs: '88px 18px 56px', sm: '112px 24px 72px' },
          fontSize: 16,
          lineHeight: 1.6,
          '& h2': { fontSize: 20, fontWeight: 600, lineHeight: 1.3, letterSpacing: '-.01em', mt: '36px', mb: '10px' },
          '& p': { m: 0, mb: '14px' },
          // Tailwind's preflight strips list bullets; these lists need them back.
          '& ul': { m: 0, mb: '14px', pl: '22px', listStyle: 'disc' },
          '& li': { mb: '6px' },
          '& a': { color: t.accent, textUnderlineOffset: '2px' },
          '& strong': { fontWeight: 600 },
        }}
      >
        <Box component="h1" sx={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.15, m: 0 }}>
          {title}
        </Box>
        <Box sx={{ mt: '8px', mb: '28px', color: t.muted, fontSize: 14 }}>Last updated {LEGAL_UPDATED}</Box>

        {children}

        <Box
          component="nav"
          aria-label="Legal"
          sx={{ mt: '48px', pt: '20px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: 14 }}
        >
          <Link to="/privacy">Privacy policy</Link>
          <Link to="/terms-of-service">Terms of service</Link>
          <Link to="/">The Foodiedex</Link>
        </Box>
      </Box>
    </Box>
  );
}
