import { useState } from 'react';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import Add from '@mui/icons-material/Add';
import Check from '@mui/icons-material/Check';
import People from '@mui/icons-material/People';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import type { RestaurantList } from '~/types/restaurant';

interface ListSwitcherProps {
  lists: RestaurantList[];
  activeList: RestaurantList | null;
  serifFont: string;
  onSelect: (listId: string) => void;
  onCreate: () => void;
  onRename?: (list: RestaurantList) => void;
  onDelete?: (list: RestaurantList) => void;
}

export default function ListSwitcher({
  lists,
  activeList,
  serifFont,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: ListSwitcherProps) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const activeName = activeList?.name ?? t('lists.defaultName');
  const close = () => setAnchor(null);

  return (
    <>
      <Box
        component="button"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
          setAnchor(e.currentTarget)
        }
        aria-label={t('lists.switchLabel', { name: activeName })}
        aria-haspopup="true"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          p: 0,
          color: 'inherit',
          fontFamily: serifFont,
          fontSize: { xs: 34, md: 44 },
          fontWeight: 600,
          letterSpacing: '-.02em',
          lineHeight: 1.05,
          textAlign: 'left',
        }}
      >
        {activeName}
        <KeyboardArrowDown sx={{ fontSize: 28, opacity: 0.6, mb: '6px' }} />
      </Box>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {lists.map((list) => {
          const isOwner = list.role === 'owner';
          const canDelete = isOwner && !list.isDefault && !!onDelete;
          return (
            <MenuItem
              key={list.id}
              selected={list.id === activeList?.id}
              onClick={() => {
                close();
                onSelect(list.id);
              }}
            >
              <ListItemIcon>
                {list.id === activeList?.id ? (
                  <Check fontSize="small" />
                ) : (
                  <Box sx={{ width: 20 }} />
                )}
              </ListItemIcon>
              <ListItemText primary={list.name} />
              {list.role !== 'owner' && (
                <Chip
                  size="small"
                  label={t(`roles.${list.role}`)}
                  sx={{ ml: 1, height: 20, fontSize: 11 }}
                />
              )}
              {(list.memberCount ?? 1) > 1 && (
                <Box
                  sx={{
                    ml: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    color: 'text.secondary',
                    fontSize: 12,
                  }}
                >
                  <People sx={{ fontSize: 14 }} />
                  {list.memberCount}
                </Box>
              )}
              {isOwner && onRename && (
                <IconButton
                  size="small"
                  edge="end"
                  aria-label={`${t('lists.rename')} ${list.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    close();
                    onRename(list);
                  }}
                  sx={{ ml: 1, color: 'text.secondary' }}
                >
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
              {canDelete && (
                <IconButton
                  size="small"
                  edge="end"
                  aria-label={`${t('lists.delete')} ${list.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    close();
                    onDelete(list);
                  }}
                  sx={{ ml: 0.5, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </MenuItem>
          );
        })}
        <Divider />
        <MenuItem
          onClick={() => {
            close();
            onCreate();
          }}
        >
          <ListItemIcon>
            <Add fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('lists.newList')} />
        </MenuItem>
      </Menu>
    </>
  );
}
