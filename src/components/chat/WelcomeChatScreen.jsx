import { Box, Typography } from "@mui/material";
import React from "react";
import DolphinIcon from "../../assets/images/dolphin_b.png";
import CapIcon from "../../assets/images/ship.png";
const WelcomeChatScreen = () => {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          backgroundColor: "#fff",
          borderRadius: "24px",
          px: 6,
          py: 5,
          maxWidth: 640,
          textAlign: "center",
          boxShadow: "0px 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        {/* Icons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
            mb: 3,
          }}
        >
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
        </Box>

        {/* Title */}
        <Typography
          sx={{
            fontSize: 32,
            fontWeight: 700,
            color: "#0a2f4f",
            mb: 1,
          }}
        >
          Dolphin <span style={{ fontWeight: 300 }}>|</span> AI
        </Typography>

        {/* Subtitle */}
        <Typography
          sx={{
            fontSize: 20,
            fontWeight: 500,
            color: "#0a2f4f",
            mb: 2,
          }}
        >
          How can I help you today?
        </Typography>

        {/* Description */}
        <Typography
          sx={{
            fontSize: 15,
            color: "#6b7a88",
            lineHeight: 1.7,
          }}
        >
          You can ask me anything. I can provide summaries, key takeaways and
          knowledge checks, as well as help you locate specific videos from our
          library and recommend training courses to enhance your skills.
        </Typography>
      </Box>
    </Box>
  );
};

export default WelcomeChatScreen;
