import { Box, Menu, MenuItem, Typography } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import { Message } from "../../assets/svgIcons/message";
import { useThemeMode } from "../../context/ThemeModeContext";
import { Pin } from "../../assets/svgIcons/Pin";
import { Threedot } from "../../assets/svgIcons/ThreeDots";
import { useState } from "react";
import { DeleteIcon } from "../../assets/svgIcons/DeleteIcon";

export const ChatItem = ({ title, active, onClick }) => {
  const { mode } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    event.stopPropagation(); // ⛔ prevent chat click
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        py: 1,
        px: 1,
        borderRadius: 2,
        bgcolor: active ? "background.lightblue1" : "transparent",
        "&:hover": {
          bgcolor: "background.lightblue1",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 1,
          width: "70%",
          cursor: "pointer",
        }}
        onClick={onClick}
      >
        <Message size={22} color={mode === "dark" ? "#1cb0f6" : "#106BA3"} />

        <Typography
          variant="body2"
          sx={{
           width: "80%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: active ? "text.main" : "text.primary",
          }}
        >
          {title ? title : "Untitled session"}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
        {/* <Box
          sx={{
            width: 22,
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            cursor: "pointer",
            "&:hover": {
              bgcolor: "text.placeholder1",
            },
          }}
        >
          <Pin size={16} color={"#FFAE00"} />
        </Box> */}
        <Box
          sx={{
            width: 22,
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            cursor: "pointer",
            "&:hover": {
              bgcolor: "text.placeholder1",
            },
          }}
          onClick={handleMenuOpen}
        >
          <Threedot size={22} color={mode === "dark" ? "#FFFFFF" : "#464646"} />
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: 140,
              border: "1px solid",
              borderColor: "primary.main",
              backgroundColor: "background.paper",
              marginLeft:15
            },
          }}
        >
          <MenuItem onClick={handleMenuClose} sx={{ display: "flex", gap: 1 }}>
            <Pin size={16} color={mode === "dark" ? "#FFFFFF" :"#000"} />
            Pin
          </MenuItem>

          <MenuItem sx={{ display: "flex", gap: 1 }} onClick={handleMenuClose}>
            <DeleteIcon size={18} color={mode === "dark" ? "#FFFFFF" :"#000"} />
            Delete
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};
