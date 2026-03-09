import type { SVGProps } from "react";

interface TasbihProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export default function Tasbih({ size = 24, ...props }: TasbihProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Main strand arc */}
      <path
        d="M16 36C10 32 8 24 10 16c2-8 10-12 14-12s12 4 14 12c2 8 0 16-6 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Beads along the strand */}
      <circle cx="11" cy="20" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="12" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="16" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="22" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="28" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="33" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="36" cy="15" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="37" cy="21" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="35" cy="27" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="32" cy="33" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      {/* Imamah (leader bead) */}
      <ellipse
        cx="16"
        cy="38"
        rx="3"
        ry="4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Tassel */}
      <path
        d="M16 42v3M14 42v2M18 42v2"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
