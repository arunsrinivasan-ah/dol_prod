import {
  Box,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  Skeleton,
  Avatar,
  Button,
  IconButton,
  Tabs,
  Tab,
  minor,
} from "@mui/material";
import React, { useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { ChatItem } from "./ChatItem";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useThemeMode } from "../../context/ThemeModeContext";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import { Message } from "../../assets/svgIcons/message";
import TurnedInIcon from "@mui/icons-material/TurnedIn";

const tabStyle = (active) => ({
  textTransform: "none",
  px: 0.5,
  py: 0.5,
  borderRadius: 2,
  fontSize: 13,
  minHeight: 35,
  fontWeight: 500,
  color: active ? "#fff" : "#9fb3c8",
  bgcolor: active ? "primary.main" : "transparent",
  transition: "all 0.25s ease",
  "&:hover": {
    bgcolor: active ? "primary.main" : "rgba(255,255,255,0.08)",
  },
});

const ChatSideBar = ({
  sessionData,
  activeIndex,
  setActiveIndex,
  selectSession,
  loading,
}) => {
  const { mode, toggleMode } = useThemeMode();
  const [valueTab, setValueTab] = useState(0);

  const userData = JSON.parse(localStorage.getItem("userData"));
  return (
    <Box
      sx={{
        width: "20vw",
        p: 2,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      {/* <Box
        sx={{
          width: "100%",
          bgcolor: "background.lightblue1",
          p: .5,
          borderRadius: 2,
        }}
      >
        <Tabs
          value={valueTab}
          onChange={(_, newValue) => setValueTab(newValue)}
          TabIndicatorProps={{ style: { display: "none" } }}
          sx={{
            minHeight: 35,
            height: 35,
            "& .MuiTabs-flexContainer": {
              gap: .5,
            },
          }}
        >
          <Tab
            icon={<Message size={22} color="#ffffff"/>}
            iconPosition="start"
            label="My Chats"
            sx={tabStyle(valueTab === 0)}
          />

          <Tab
            icon={<TurnedInIcon sx={{color:"primary.main"}}/>}
            iconPosition="start"
            label="Saved Chats"
            sx={tabStyle(valueTab === 1)}
          />
        </Tabs>
      </Box> */}

      <TextField
        placeholder="Search here..."
        size="small"
        sx={{
          mb: 2,
          "& .MuiOutlinedInput-root": {
            borderRadius: 100,
            fontSize: 10,
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18 }} />
            </InputAdornment>
          ),
        }}
      />

      <Typography variant={"body2"} sx={{ mb: 1, fontWeight: 600 }}>
        Your Chats
      </Typography>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          pr: 0.5,
        }}
      >
        {loading ? (
          <Stack spacing={1}>
            {[...Array(6)].map((_, index) => (
              <Skeleton
                key={index}
                variant="rounded"
                height={35}
                animation="wave"
                sx={{ borderRadius: 2 }}
              />
            ))}
          </Stack>
        ) : sessionData && sessionData.length ? (
          sessionData.map((chat, index) => (
            <ChatItem
              key={chat.session_id || index}
              title={chat.title}
              active={index === activeIndex}
              onClick={() => {
                setActiveIndex(index);
                selectSession(chat.session_id);
              }}
            />
          ))
        ) : (
          <Typography
            variant={"body2"}
            sx={{ fontSize: 12, color: "text.secondary" }}
          >
            You can start your conversation by asking something with the bot.
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Avatar sx={{ width: 35, height: 35, bgcolor: "primary.main" }} />
        <Box
          sx={{ display: "flex", flexDirection: "column", width: "70%", pl: 1 }}
        >
          <Typography variant="body1" color="primary.main" fontSize={15}>
            {userData?.name
              ? userData.name.charAt(0).toUpperCase() + userData.name.slice(1)
              : ""}
          </Typography>
          <Typography variant="body2" color="primary.main" fontSize={10}>
            {userData.email}
          </Typography>
        </Box>
        <IconButton
          onClick={toggleMode}
          sx={{
            width: 35,
            height: 35,
            background: "linear-gradient(180deg, #1187D6 0%, #2F428D 100%)",
            padding: 2,
            "&:hover": {
              bgcolor: "primary.main",
            },
          }}
        >
          {mode === "dark" ? (
            <DarkModeOutlinedIcon sx={{ color: "text.primary" }} />
          ) : (
            <LightModeIcon sx={{ color: "background.default" }} />
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChatSideBar;
