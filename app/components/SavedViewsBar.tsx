import { useState } from 'react';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Bookmark from '@mui/icons-material/Bookmark';
import BookmarkBorder from '@mui/icons-material/BookmarkBorder';
import MoreVert from '@mui/icons-material/MoreVert';
import Add from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import type { ListView } from '~/types/restaurant';
import type { ListTokens } from '~/listTheme';

type Tokens = ListTokens;

interface SavedViewsBarProps {
  tokens: Tokens;
  views: ListView[];
  /** Canonical serialized current filter params, for the active-view highlight. */
  currentParams: string;
  hasActiveFilters: boolean;
  onApply: (view: ListView) => void;
  onSave: () => void;
  onRename: (view: ListView) => void;
  onDelete: (view: ListView) => void;
}

/**
 * The user's saved filter views, plus a "Save view" affordance when there are
 * active filters worth keeping. Lives at the top of the filter sheet. Applying a view is just applying its
 * stored querystring; the pill highlights when the current filters match it.
 */
export default function SavedViewsBar({
  tokens: t,
  views,
  currentParams,
  hasActiveFilters,
  onApply,
  onSave,
  onRename,
  onDelete,
}: SavedViewsBarProps) {
  const { t: tr } = useTranslation();
  const [menu, setMenu] = useState<{ anchor: HTMLElement; view: ListView } | null>(null);

  if (views.length === 0 && !hasActiveFilters) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      {views.map((view) => {
        const active = view.params === currentParams;
        return (
          <Box
            key={view.id}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 44,
              border: `1px solid ${active ? t.pBg : t.divider}`,
              background: active ? t.pBg : 'transparent',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <Box
              component="button"
              type="button"
              onClick={() => onApply(view)}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                background: 'transparent',
                height: '100%',
                color: active ? t.pFg : t.ink,
                font: 'inherit',
                fontSize: 15,
                fontWeight: 600,
                padding: '0 4px 0 16px',
                cursor: 'pointer',
              }}
            >
              {active ? <Bookmark sx={{ fontSize: 15 }} /> : <BookmarkBorder sx={{ fontSize: 15 }} />}
              {view.name}
            </Box>
            <Box
              component="button"
              type="button"
              aria-label={tr('views.options', { name: view.name })}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => setMenu({ anchor: e.currentTarget, view })}
              sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: 40, border: 'none', background: 'transparent', color: active ? t.pFg : t.muted, cursor: 'pointer', p: 0 }}
            >
              <MoreVert sx={{ fontSize: 16 }} />
            </Box>
          </Box>
        );
      })}

      {hasActiveFilters && (
        <Box
          component="button"
          type="button"
          onClick={onSave}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            height: 44,
            border: `1px dashed ${t.borderStrong}`,
            background: 'transparent',
            color: t.accent,
            borderRadius: '999px',
            font: 'inherit',
            fontSize: 15,
            fontWeight: 600,
            padding: '0 16px',
            cursor: 'pointer',
          }}
        >
          <Add sx={{ fontSize: 16 }} /> {tr('views.save')}
        </Box>
      )}

      <Menu anchorEl={menu?.anchor ?? null} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem
          onClick={() => {
            if (menu) onRename(menu.view);
            setMenu(null);
          }}
        >
          {tr('views.rename')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menu) onDelete(menu.view);
            setMenu(null);
          }}
        >
          {tr('views.delete')}
        </MenuItem>
      </Menu>
    </Box>
  );
}
