import { createTheme } from "@mui/material";
import { grey } from "@mui/material/colors";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      light: "#484848",
      main: "#ab47bc",
    },
    secondary: {
      light: "#ff6090",
      main: "#f8bbd0",
    },
    text: {
      primary: "#ffffff",
      secondary: "#c48b9f",
    },
  },
  typography: {
    subtitle2: {
      fontWeight: 400,
      fontSize: "0.775rem",
      lineHeight: "23px",
      letterSpacing: "0.15px",
      color: grey[400],
    },
  },
});
