import { createContext, useContext, useMemo, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import getTheme from "../theme";

/**
 * Single source of truth for:
 * - light / dark mode
 * - font size level
 */
const ThemeModeContext = createContext(null);

export const useThemeMode = () => useContext(ThemeModeContext);

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState("light");

  // 0 = small, 1 = medium, 2 = large
  const [fontLevel, setFontLevel] = useState(0);

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const theme = useMemo(
    () => getTheme(mode, fontLevel),
    [mode, fontLevel]
  );

  return (
    <ThemeModeContext.Provider
      value={{
        mode,
        toggleMode,
        fontLevel,
        setFontLevel,
      }}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};
