import {
  AppBar,
  Box,
  Button,
  Popover,
  Slider,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DolphinIconB from "../../assets/images/dolphin_b.png";
import DolphinIconW from "../../assets/images/dolphin_w.png";
import ShipIconB from "../../assets/images/ship.png";
import ShipIconW from "../../assets/images/ship_w.png";
import { useThemeMode } from "../../context/ThemeModeContext";
import TextFieldsIcon from "@mui/icons-material/TextFields";

const Header = ({ onLogout }) => {
  const { mode } = useThemeMode();
  const [anchorElFont, setAnchorElFont] = useState(null);
  const [fontSize, setFontSize] = useState(null);

  const openFontMenu = Boolean(anchorElFont);

  const handleOpen = (event) => {
    setAnchorElFont(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorElFont(null);
  };
  return (
    <>
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
            px: 4,
          }}
        >
          <Box display="flex" alignItems="center" gap={3.5}>
            <Box
              component="img"
              src={mode === "dark" ? DolphinIconW : DolphinIconB}
              alt="Dolphin"
              sx={{ width: 60, height: 60 }}
            />
            <Box
              component="img"
              src={mode === "dark" ? ShipIconW : ShipIconB}
              alt="Cap"
              sx={{ width: 40, height: 40 }}
            />

            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Typography
                variant="h3"
                sx={{ fontSize: 22, fontWeight: 700, color: "text.heading1" }}
              >
                Dolphin
              </Typography>
              <Typography
                variant="h3"
                sx={{ fontSize: 22, fontWeight: 700, color: "text.heading1" }}
              >
                |
              </Typography>
              <Typography
                variant="h3"
                sx={{ fontSize: 22, fontWeight: 700, color: "primary.main" }}
              >
                AI
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                }}
              />
              <Typography variant="body2" color="text.secondary">
                Connected
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              sx={{
                backgroundColor: "background.light",
                color: "text.primary",
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: "background.light",
                  boxShadow: "none",
                },
              }}
            >
              New Chat
            </Button>

            <Button
              startIcon={
                <SettingsOutlinedIcon sx={{ color: "text.primary" }} />
              }
              sx={{ textTransform: "none", color: "text.primary" }}
              onClick={handleOpen}
            >
              Settings
            </Button>

            <Button
              startIcon={<LogoutOutlinedIcon sx={{ color: "text.primary" }} />}
              sx={{ textTransform: "none", color: "text.primary" }}
              onClick={onLogout}
            >
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Popover
        open={openFontMenu}
        anchorEl={anchorElFont}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
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
