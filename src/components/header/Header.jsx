import { AppBar, Box, Button, Stack, Toolbar, Typography } from '@mui/material'
import React from 'react'
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import AddIcon from "@mui/icons-material/Add";
import DolphinIcon from "../../assets/images/dolphin_b.png";
import CapIcon from "../../assets/images/ship.png"; 

const Header = () => {
  return (
   <AppBar
      position="static"
      elevation={0}
      sx={{
        height: "10vh",
        backgroundColor: "#bfe6ff",
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
        <Box display="flex" alignItems="center" gap={2}>
           <Box
            component="img"
            src={DolphinIcon}
            alt="Dolphin"
            sx={{ width: 40, height: 40 }}
          />
          <Box
            component="img"
            src={CapIcon}
            alt="Cap"
            sx={{ width: 40, height: 40 }}
          />

          <Typography
            variant="body1"
            sx={{ fontWeight: 700, color: "#0f172a" }}
          >
            Dolphin | AI
          </Typography>

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
            startIcon={<AddIcon />}
            sx={{
              backgroundColor: "#fff",
              color: "#0f172a",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#f1f5f9" },
            }}
          >
            New Chat
          </Button>

          <Button
            startIcon={<SettingsOutlinedIcon />}
            sx={{ textTransform: "none", color: "#0f172a" }}
          >
            Settings
          </Button>

          <Button
            startIcon={<LogoutOutlinedIcon />}
            sx={{ textTransform: "none", color: "#0f172a" }}
          >
            Logout
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

export default Header