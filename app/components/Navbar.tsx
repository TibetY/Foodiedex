import { useState } from "react";
import { useLocation, useRouteLoaderData, Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const location = useLocation();
  const { t } = useTranslation();
  const rootData = useRouteLoaderData("root") as { isLoggedIn: boolean } | undefined;
  const isLoggedIn = !!rootData?.isLoggedIn;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Hide navbar on every screen that ships its own full Kanpai header/back-bar.
  const hasOwnHeader =
    location.pathname === "/dashboard" ||
    location.pathname.startsWith("/s/") ||
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/profile";
  if (hasOwnHeader) {
    return null;
  }

  const navLinks = isLoggedIn
    ? [
        { label: t("nav.dashboard"), to: "/dashboard" },
        { label: t("nav.profile"), to: "/profile" },
      ]
    : [
        { label: t("nav.login"), to: "/login" },
        { label: t("nav.signup"), to: "/signup" },
      ];

  return (
    <AppBar
      position="fixed"
      component="nav"
      aria-label={t("nav.main")}
      sx={{
        background: (theme) => theme.palette.background.paper,
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid",
        borderColor: "divider",
        boxShadow: "none",
      }}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          maxWidth: "1200px",
          width: "100%",
          mx: "auto",
          px: { xs: 2, sm: 3 },
        }}
      >
        <Link to="/" style={{ textDecoration: "none" }} aria-label={t("nav.home")}>
          <Logo />
        </Link>

        {isMobile ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LanguageSwitcher />
            <IconButton
              color="inherit"
              onClick={() => setDrawerOpen(true)}
              aria-label={t("nav.openMenu")}
              sx={{ color: "text.primary" }}
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              PaperProps={{
                sx: {
                  width: 280,
                  background: (theme) => theme.palette.background.paper,
                  borderLeft: "1px solid",
                  borderColor: "divider",
                },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
                <IconButton
                  onClick={() => setDrawerOpen(false)}
                  aria-label={t("nav.closeMenu")}
                  sx={{ color: "text.primary" }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              <List role="navigation" aria-label={t("nav.mobileNav")}>
                {navLinks.map((link) => (
                  <ListItem key={link.to} disablePadding>
                    <ListItemButton
                      component={Link}
                      to={link.to}
                      onClick={() => setDrawerOpen(false)}
                      sx={{
                        px: 3,
                        py: 1.5,
                        "&:hover": {
                          backgroundColor: "action.hover",
                        },
                      }}
                    >
                      <ListItemText
                        primary={link.label}
                        primaryTypographyProps={{
                          fontWeight: 600,
                          fontSize: "1.1rem",
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Drawer>
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <LanguageSwitcher />
            {navLinks.map((link) =>
              link.to === "/signup" ? (
                <Button
                  key={link.to}
                  component={Link}
                  to={link.to}
                  variant="contained"
                  size="small"
                  sx={{ ml: 1 }}
                >
                  {link.label}
                </Button>
              ) : (
                <Button
                  key={link.to}
                  component={Link}
                  to={link.to}
                  sx={{
                    color: "text.secondary",
                    fontWeight: 500,
                    "&:hover": {
                      color: "text.primary",
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  {link.label}
                </Button>
              )
            )}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
