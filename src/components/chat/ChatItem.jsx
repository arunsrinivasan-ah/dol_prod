import { Box, Typography } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import { Message } from "../../assets/svgIcons/message";
import { useThemeMode } from "../../context/ThemeModeContext";

export const ChatItem = ({ title, active, onClick }) => {
   const { mode } = useThemeMode();
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        py: 1,
        // pl: 1,
        borderRadius: 2,
        cursor: "pointer",
        bgcolor: active ? "#d4ecfdcc" : "transparent",
        "&:hover": {
          bgcolor: "#d4ecfdcc",
        },
      }}
    >
      <Message size={22} color= {mode === "dark" ? "#1cb0f6"  : "#106BA3"} />

      <Typography
        variant="body2"
        sx={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: active ? "#0A4D7C" : "inherit",
        }}
      >
        {title ? title:"Untitled session"}
      </Typography>
    </Box>
  );
};
