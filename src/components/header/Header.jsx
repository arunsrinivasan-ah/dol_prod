import {
  AppBar,
  Box,
  Button,
  IconButton,
  Popover,
  Slider,
  Stack,
  Toolbar,
  Typography,
  Drawer,
  useMediaQuery,
} from "@mui/material";
import React, { useState } from "react";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MenuIcon from "@mui/icons-material/Menu";
import TextFieldsIcon from "@mui/icons-material/TextFields";

import DolphinIconB from "../../assets/images/dolphin_b.png";
import DolphinIconW from "../../assets/images/dolphin_w.png";
import ShipIconB from "../../assets/images/ship.png";
import ShipIconW from "../../assets/images/ship_w.png";

import { useTheme } from "@mui/material/styles";
import { useThemeMode } from "../../context/ThemeModeContext";

/** 👉 IMPORT YOUR EXISTING SIDEBAR COMPONENT */
import ChatSidebar from "../chat/ChatSideBar"; // adjust path if needed

const Header = ({
  onLogout,
  setActiveIndex,
  setCurrentSessionId,
  setCurrentSessionData,
  setmessages,
  disableNewChat,
   sessionData,
  activeIndex,
  selectSession,
  loading,
}) => {
  const theme = useTheme();
  const { mode } = useThemeMode();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const [anchorElFont, setAnchorElFont] = useState(null);
  const [fontSize, setFontSize] = useState(null);

  /** 🔹 DRAWER STATE */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openFontMenu = Boolean(anchorElFont);

  const handleCreateNewSession = async () => {
    setCurrentSessionData();
    setActiveIndex(null);
    setCurrentSessionId(null);
    setmessages([]);
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          height: "10vh",
          backgroundColor: "background.header",
          justifyContent: "center",
        }}
      >
        <Toolbar
          sx={{
            height: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: { xs: 2, sm: 3, md: 4 },
          }}
        >
          {/* ================= LEFT ================= */}
          <Box
            display="flex"
            alignItems="center"
            gap={{ xs: 1.5, sm: 2, md: 3.5 }}
          >
            {(isMobile || isTablet) && (
              <IconButton onClick={() => setSidebarOpen(true)}>
                <MenuIcon sx={{ color: "text.primary" }} />
              </IconButton>
            )}

            <Box
              component="img"
              src={mode === "dark" ? DolphinIconW : DolphinIconB}
              alt="Dolphin"
              sx={{
                width: { xs: 40, sm: 34, md: 60 },
                height: { xs: 40, sm: 34, md: 60 },
              }}
            />

            <Box
              component="img"
              src={mode === "dark" ? ShipIconW : ShipIconB}
              alt="Ship"
              sx={{
                width: { xs: 30, sm: 34, md: 40 },
                height: { xs: 30, sm: 34, md: 40 },
              }}
            />

            {/* Desktop title (UNCHANGED) */}
            {!isMobile && !isTablet && (
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Typography
                  sx={{ fontSize: 22, fontWeight: 700, color: "text.heading1" }}
                >
                  Dolphin
                </Typography>
                <Typography
                  sx={{ fontSize: 22, fontWeight: 700, color: "text.heading1" }}
                >
                  |
                </Typography>
                <Typography
                  sx={{ fontSize: 22, fontWeight: 700, color: "primary.main" }}
                >
                  AI
                </Typography>
              </Box>
            )}

            {/* Connection */}
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                }}
              />
              {!isMobile && (
                <Typography variant="body2" color="text.secondary">
                  Connected
                </Typography>
              )}
            </Box>
          </Box>

          {/* ================= RIGHT ================= */}
          <Stack
            direction="row"
            spacing={{ xs: 0.5, sm: 1, md: 2 }}
            alignItems="center"
          >
            {/* New Chat */}
            <Button
              disabled={disableNewChat}
              onClick={handleCreateNewSession}
              variant="contained"
              startIcon={!isMobile && <AddRoundedIcon />}
              sx={{
                backgroundColor: "background.light",
                color: "text.primary",
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "none",
                minWidth: isMobile ? 40 : "auto",
                px: isMobile ? 1 : 2,
                "&:hover": {
                  backgroundColor: "background.light",
                  boxShadow: "none",
                },
              }}
            >
              {!isMobile && "New Chat"}
              {isMobile && <AddRoundedIcon />}
            </Button>

            {/* Settings */}
            <Button
              startIcon={
                <SettingsOutlinedIcon sx={{ color: "text.primary" }} />
              }
              sx={{
                textTransform: "none",
                color: "text.primary",
                minWidth: isMobile || isTablet ? 40 : "auto",
                px: isMobile || isTablet ? 1 : 2,
              }}
            >
              {!isMobile && !isTablet && "Settings"}
            </Button>

            {/* Logout */}
            <Button
              startIcon={<LogoutOutlinedIcon sx={{ color: "text.primary" }} />}
              onClick={onLogout}
              sx={{
                textTransform: "none",
                color: "text.primary",
                minWidth: isMobile || isTablet ? 40 : "auto",
                px: isMobile || isTablet ? 1 : 2,
              }}
            >
              {!isMobile && !isTablet && "Logout"}
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* ================= SIDEBAR DRAWER ================= */}
      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ModalProps={{ keepMounted: true }} // better mobile performance
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: "background.default",
            height:"auto",
          },
        }}
      >
        {/* 🔹 YOUR EXISTING CHAT SIDEBAR COMPONENT */}
        <ChatSidebar onClose={() => setSidebarOpen(false)} sessionData={sessionData}
          loading={loading}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          selectSession={selectSession}/>
      </Drawer>

      {/* ================= FONT POPOVER ================= */}
      <Popover
        open={openFontMenu}
        anchorEl={anchorElFont}
        onClose={() => setAnchorElFont(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            py: 2,
            px: 5,
            width: 340,
            borderRadius: 5,
            mt: 3,
            boxShadow: "none",
            border: "1px solid",
            borderColor: "primary.main",
            backgroundColor: "background.paper",
          },
        }}
      >
        <Typography fontWeight={600} mb={1}>
          Font
        </Typography>

        <Slider
          value={fontSize}
          min={0}
          max={10}
          step={5}
          onChange={(_, value) => setFontSize(value)}
        />

        <Stack direction="row" justifyContent="space-between" mt={1}>
          <Stack alignItems="center">
            <TextFieldsIcon fontSize="small" />
            <Typography variant="caption">Small</Typography>
          </Stack>
          <Stack alignItems="center">
            <TextFieldsIcon />
            <Typography variant="caption">Medium</Typography>
          </Stack>
          <Stack alignItems="center">
            <TextFieldsIcon fontSize="large" />
            <Typography variant="caption">Large</Typography>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
};

export default Header;
