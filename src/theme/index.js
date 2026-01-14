import { createTheme } from "@mui/material/styles";
import typography from "./typography";
import { lightPalette, darkPalette } from "./palette";
import componentOverrides from "./component";

const getTheme = (mode, fontLevel = 0) =>
  createTheme({
    palette: mode === "dark" ? darkPalette : lightPalette,

    typography: typography(fontLevel),

    components: {
      // 🔹 Your scalable components (Button, etc.)
      ...componentOverrides(fontLevel),

      // 🔹 CssBaseline scrollbar styles
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
            backgroundColor:
              theme.palette.primary.dark ?? theme.palette.primary.main,
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
