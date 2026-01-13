import { createTheme } from "@mui/material/styles";
import typography from "./typography";
import { lightPalette, darkPalette } from "./palette";

const getTheme = (mode) =>
  createTheme({
    palette: mode === "dark" ? darkPalette : lightPalette,
    typography,

    components: {
      MuiCssBaseline: {
        styleOverrides: (theme) => ({
          /* ===== WebKit Browsers ===== */
          "*::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },

          "*::-webkit-scrollbar-track": {
            background: "transparent",
          },

          "*::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.primary.main,
            borderRadius: "8px",
          },

          "*::-webkit-scrollbar-thumb:hover": {
            backgroundColor: theme.palette.primary.dark ?? theme.palette.primary.main,
          },

          "*::-webkit-scrollbar-button": {
            display: "none",
          },

          /* ===== Firefox ===== */
          "*": {
            scrollbarWidth: "thin",
            scrollbarColor: `${theme.palette.primary.main} transparent`,
          },
        }),
      },
    },
  });

export default getTheme;
