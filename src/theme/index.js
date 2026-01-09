import { createTheme } from "@mui/material/styles";
import typography from "./typography";
import { lightPalette, darkPalette } from "./palette";

const getTheme = (mode) =>
  createTheme({
    palette: mode === "dark" ? darkPalette : lightPalette,
    typography,
  });

export default getTheme;
