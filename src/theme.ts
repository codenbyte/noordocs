import { createTheme } from "@mui/material/styles";
import { colors, typography as dsTypography, radii, shadows } from "@/design-system/tokens";

export const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary[500],
      light: colors.primary[300],
      dark: colors.primary[700],
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: colors.accent[500],
      light: colors.accent[300],
      dark: colors.accent[700],
      contrastText: "#111",
    },
    background: {
      default: colors.background.warm,
      paper: colors.background.paper,
    },
    text: {
      primary: colors.neutral[900],
      secondary: colors.neutral[500],
    },
    error: { main: colors.error },
    success: { main: colors.success },
    warning: { main: colors.warning },
    info: { main: colors.info },
    divider: colors.border.light,
  },
  typography: {
    fontFamily: dsTypography.fontFamily.latin,
    h1: {
      fontFamily: dsTypography.fontFamily.heading,
      fontSize: dsTypography.heading.h1.size,
      fontWeight: dsTypography.heading.h1.weight,
      lineHeight: dsTypography.heading.h1.lineHeight,
      letterSpacing: `${dsTypography.heading.h1.letterSpacing}em`,
    },
    h2: {
      fontFamily: dsTypography.fontFamily.heading,
      fontSize: dsTypography.heading.h2.size,
      fontWeight: dsTypography.heading.h2.weight,
      lineHeight: dsTypography.heading.h2.lineHeight,
      letterSpacing: `${dsTypography.heading.h2.letterSpacing}em`,
    },
    h3: {
      fontFamily: dsTypography.fontFamily.heading,
      fontSize: dsTypography.heading.h3.size,
      fontWeight: dsTypography.heading.h3.weight,
      lineHeight: dsTypography.heading.h3.lineHeight,
      letterSpacing: `${dsTypography.heading.h3.letterSpacing}em`,
    },
    h4: {
      fontFamily: dsTypography.fontFamily.heading,
      fontSize: dsTypography.heading.h4.size,
      fontWeight: dsTypography.heading.h4.weight,
      lineHeight: dsTypography.heading.h4.lineHeight,
    },
    h5: {
      fontFamily: dsTypography.fontFamily.heading,
      fontSize: dsTypography.heading.h5.size,
      fontWeight: dsTypography.heading.h5.weight,
      lineHeight: dsTypography.heading.h5.lineHeight,
    },
    h6: {
      fontFamily: dsTypography.fontFamily.heading,
      fontSize: dsTypography.heading.h6.size,
      fontWeight: dsTypography.heading.h6.weight,
      lineHeight: dsTypography.heading.h6.lineHeight,
    },
    body1: {
      fontSize: dsTypography.body.md.size,
      lineHeight: dsTypography.body.md.lineHeight,
    },
    body2: {
      fontSize: dsTypography.body.sm.size,
      lineHeight: dsTypography.body.sm.lineHeight,
    },
    caption: {
      fontSize: dsTypography.body.xs.size,
      lineHeight: dsTypography.body.xs.lineHeight,
    },
  },
  shape: { borderRadius: radii.lg },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: radii.md,
          boxShadow: shadows.sm,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: radii.xl,
          boxShadow: shadows.card,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: radii.lg,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radii.md,
        },
      },
    },
  },
});
