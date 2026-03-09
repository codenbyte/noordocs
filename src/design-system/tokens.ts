/**
 * NoorSpace Design System — Theme Tokens
 *
 * Aesthetic: Calm × Airbnb × Stripe
 * Spiritual. Calm. Modern. Premium.
 *
 * Typography pairing:
 *   Arabic  — "Noto Naskh Arabic" (body), "Amiri" (display)
 *   Latin   — "Inter" (body), "Plus Jakarta Sans" (headings)
 *
 * Grid: 4pt base unit
 */

// ─── Colors ──────────────────────────────────────────────

export const colors = {
  // Core brand
  primary: {
    50: "#E8F0ED",
    100: "#C5DAD1",
    200: "#9FC2B3",
    300: "#79AA95",
    400: "#5D987F",
    500: "#0F3D2E", // Main brand green
    600: "#0D3528",
    700: "#0A2B20",
    800: "#072119",
    900: "#041710",
  },

  // Warm gold accent (subtle, not heavy)
  accent: {
    50: "#FDF8EE",
    100: "#FAF0D5",
    200: "#F5E1AA",
    300: "#F0D280",
    400: "#EBC355",
    500: "#C8A951", // Main accent
    600: "#B3944A",
    700: "#8F763B",
    800: "#6B582C",
    900: "#47391D",
  },

  // Ramadan seasonal accent (soft amethyst purple)
  ramadan: {
    50: "#F3EFF8",
    100: "#E1D7ED",
    200: "#CEBDE2",
    300: "#BAA3D7",
    400: "#A78FCC",
    500: "#7B5EA7",
    600: "#6B5192",
    700: "#56417A",
    800: "#413162",
    900: "#2C214A",
  },

  // Surfaces
  background: {
    light: "#FAFAF8",
    warm: "#F8F7F4",
    paper: "#FFFFFF",
    dark: "#0C1B14",
    darkSurface: "#132A1E",
    darkElevated: "#1A3828",
  },

  // Neutrals
  neutral: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },

  // Semantic
  error: "#D94141",
  success: "#22A06B",
  warning: "#E9A23B",
  info: "#2563EB",

  // Special
  glow: "rgba(200, 169, 81, 0.12)",
  glowStrong: "rgba(200, 169, 81, 0.24)",
  border: {
    light: "#E6E4DF",
    subtle: "rgba(15, 61, 46, 0.08)",
    dark: "rgba(255, 255, 255, 0.08)",
  },
} as const;

// ─── Typography ──────────────────────────────────────────

export const typography = {
  fontFamily: {
    latin: '"Inter", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    heading: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    arabic: '"Noto Naskh Arabic", "Amiri", "Traditional Arabic", serif',
    arabicDisplay: '"Amiri", "Noto Naskh Arabic", "Traditional Arabic", serif',
  },

  // Heading scale (modular scale ~1.25)
  heading: {
    h1: { size: 36, lineHeight: 1.2, weight: 700, letterSpacing: -0.02 },
    h2: { size: 28, lineHeight: 1.25, weight: 700, letterSpacing: -0.015 },
    h3: { size: 22, lineHeight: 1.3, weight: 600, letterSpacing: -0.01 },
    h4: { size: 18, lineHeight: 1.35, weight: 600, letterSpacing: -0.005 },
    h5: { size: 16, lineHeight: 1.4, weight: 600, letterSpacing: 0 },
    h6: { size: 14, lineHeight: 1.45, weight: 600, letterSpacing: 0.005 },
  },

  // Body scale
  body: {
    lg: { size: 18, lineHeight: 1.6, weight: 400 },
    md: { size: 16, lineHeight: 1.6, weight: 400 },
    sm: { size: 14, lineHeight: 1.5, weight: 400 },
    xs: { size: 12, lineHeight: 1.5, weight: 400 },
  },

  // Arabic-specific
  arabic: {
    display: { size: 32, lineHeight: 1.6, weight: 400 },
    heading: { size: 24, lineHeight: 1.5, weight: 400 },
    body: { size: 18, lineHeight: 1.8, weight: 400 },
    caption: { size: 14, lineHeight: 1.6, weight: 400 },
  },
} as const;

// ─── Spacing (4pt grid) ─────────────────────────────────

export const spacing = {
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

// ─── Border Radius ──────────────────────────────────────

export const radii = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  "2xl": 28,
  full: 9999,
} as const;

// ─── Shadows (soft glow, spiritual feel) ─────────────────

export const shadows = {
  // Subtle elevation
  sm: "0 1px 2px rgba(15, 61, 46, 0.04), 0 1px 3px rgba(15, 61, 46, 0.06)",
  md: "0 2px 4px rgba(15, 61, 46, 0.04), 0 4px 12px rgba(15, 61, 46, 0.06)",
  lg: "0 4px 8px rgba(15, 61, 46, 0.04), 0 8px 24px rgba(15, 61, 46, 0.08)",
  xl: "0 8px 16px rgba(15, 61, 46, 0.06), 0 16px 48px rgba(15, 61, 46, 0.1)",

  // Spiritual glow effects
  glowSoft: "0 0 20px rgba(200, 169, 81, 0.08), 0 0 40px rgba(200, 169, 81, 0.04)",
  glowMedium: "0 0 24px rgba(200, 169, 81, 0.12), 0 0 48px rgba(200, 169, 81, 0.06)",
  glowStrong: "0 0 32px rgba(200, 169, 81, 0.18), 0 0 64px rgba(200, 169, 81, 0.08)",

  // Card-specific
  card: "0 1px 3px rgba(15, 61, 46, 0.04), 0 4px 16px rgba(15, 61, 46, 0.04)",
  cardHover: "0 4px 12px rgba(15, 61, 46, 0.06), 0 8px 32px rgba(15, 61, 46, 0.08)",
  cardElevated: "0 8px 24px rgba(15, 61, 46, 0.08), 0 16px 48px rgba(15, 61, 46, 0.06)",

  // Dark mode shadows
  dark: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.3)",
    md: "0 2px 4px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3)",
    lg: "0 4px 8px rgba(0, 0, 0, 0.2), 0 8px 24px rgba(0, 0, 0, 0.4)",
    glow: "0 0 24px rgba(200, 169, 81, 0.15), 0 0 48px rgba(200, 169, 81, 0.08)",
  },
} as const;

// ─── Gradients ──────────────────────────────────────────

export const gradients = {
  // Brand gradients
  emeraldDeep: "linear-gradient(135deg, #0F3D2E 0%, #1A5C44 50%, #0F3D2E 100%)",
  emeraldToMidnight: "linear-gradient(160deg, #0F3D2E 0%, #0A2B20 40%, #0C1B2E 100%)",
  nightSky: "linear-gradient(180deg, #0C1B2E 0%, #0A1420 40%, #111827 100%)",

  // Subtle surface gradients
  warmSurface: "linear-gradient(180deg, #FAFAF8 0%, #F8F7F4 100%)",
  coolSurface: "linear-gradient(180deg, #F8FAFB 0%, #F3F4F6 100%)",

  // Accent gradients
  goldSubtle: "linear-gradient(135deg, rgba(200,169,81,0.08) 0%, rgba(200,169,81,0.02) 100%)",
  goldWarm: "linear-gradient(135deg, #C8A951 0%, #E0C06A 100%)",

  // Ramadan
  ramadanNight: "linear-gradient(160deg, #1A1040 0%, #2C214A 30%, #0C1B2E 100%)",
  ramadanGlow: "linear-gradient(180deg, rgba(123,94,167,0.1) 0%, transparent 60%)",
} as const;

// ─── Transitions ────────────────────────────────────────

export const transitions = {
  fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  normal: "250ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "400ms cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;
