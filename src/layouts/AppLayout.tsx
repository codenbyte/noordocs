import { Outlet, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Avatar,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import DescriptionIcon from "@mui/icons-material/Description";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/design-system/tokens";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: colors.primary[700],
          borderBottom: `1px solid ${colors.border.light}`,
        }}
      >
        <Toolbar>
          <DescriptionIcon sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, cursor: "pointer", fontWeight: 700 }}
            onClick={() => navigate("/")}
          >
            NoorDocs
          </Typography>

          {user ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar
                src={user.photoURL || undefined}
                sx={{ width: 32, height: 32, bgcolor: colors.primary[300] }}
              >
                {user.displayName?.[0] || "U"}
              </Avatar>
              <Typography variant="body2" sx={{ color: "white", mr: 1 }}>
                {user.displayName}
              </Typography>
              <IconButton color="inherit" onClick={logout} size="small">
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                size="small"
                color="secondary"
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box component="main">
        <Outlet />
      </Box>
    </Box>
  );
}
