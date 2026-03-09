import { Box } from "@mui/material";

interface IslamicPatternProps {
  visible?: boolean;
  opacity?: number;
  darkMode?: boolean;
  variant?: "diamond" | "star" | "hexagonal";
}

const PATTERNS: Record<string, string> = {
  diamond: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M28 0L56 28L28 56L0 28Z' fill='none' stroke='%230F3D2E' stroke-width='0.4'/%3E%3Cpath d='M28 8L48 28L28 48L8 28Z' fill='none' stroke='%230F3D2E' stroke-width='0.25'/%3E%3C/svg%3E")`,

  star: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect x='8' y='8' width='32' height='32' fill='none' stroke='%230F3D2E' stroke-width='0.3' transform='rotate(0 24 24)'/%3E%3Crect x='8' y='8' width='32' height='32' fill='none' stroke='%230F3D2E' stroke-width='0.3' transform='rotate(45 24 24)'/%3E%3Ccircle cx='24' cy='24' r='4' fill='none' stroke='%230F3D2E' stroke-width='0.2'/%3E%3C/svg%3E")`,

  hexagonal: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='48'%3E%3Cpath d='M28 0l28 16v32L28 64 0 48V16z' fill='none' stroke='%230F3D2E' stroke-width='0.3' transform='translate(0 -8) scale(0.85)'/%3E%3Cpath d='M28 8l20 12v24L28 56 8 44V20z' fill='none' stroke='%230F3D2E' stroke-width='0.2' transform='translate(0 -8) scale(0.85)'/%3E%3C/svg%3E")`,
};

const DARK_PATTERNS: Record<string, string> = {
  diamond: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M28 0L56 28L28 56L0 28Z' fill='none' stroke='white' stroke-width='0.4'/%3E%3Cpath d='M28 8L48 28L28 48L8 28Z' fill='none' stroke='white' stroke-width='0.25'/%3E%3C/svg%3E")`,

  star: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect x='8' y='8' width='32' height='32' fill='none' stroke='white' stroke-width='0.3' transform='rotate(0 24 24)'/%3E%3Crect x='8' y='8' width='32' height='32' fill='none' stroke='white' stroke-width='0.3' transform='rotate(45 24 24)'/%3E%3Ccircle cx='24' cy='24' r='4' fill='none' stroke='white' stroke-width='0.2'/%3E%3C/svg%3E")`,

  hexagonal: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='48'%3E%3Cpath d='M28 0l28 16v32L28 64 0 48V16z' fill='none' stroke='white' stroke-width='0.3' transform='translate(0 -8) scale(0.85)'/%3E%3Cpath d='M28 8l20 12v24L28 56 8 44V20z' fill='none' stroke='white' stroke-width='0.2' transform='translate(0 -8) scale(0.85)'/%3E%3C/svg%3E")`,
};

export default function IslamicPattern({
  visible = true,
  opacity = 0.035,
  darkMode = false,
  variant = "diamond",
}: IslamicPatternProps) {
  if (!visible) return null;

  const patterns = darkMode ? DARK_PATTERNS : PATTERNS;

  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundImage: patterns[variant],
        backgroundSize: variant === "hexagonal" ? "56px 48px" : variant === "star" ? "48px 48px" : "56px 56px",
        opacity,
        zIndex: 0,
      }}
    />
  );
}
