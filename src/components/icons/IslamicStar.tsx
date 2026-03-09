import type { SVGProps } from "react";

interface IslamicStarProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export default function IslamicStar({ size = 24, ...props }: IslamicStarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* 8-pointed star (Rub el Hizb) — two overlapping squares rotated 45deg */}
      <g stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        {/* Square 1 */}
        <rect x="12" y="12" width="24" height="24" rx="1" />
        {/* Square 2 rotated 45deg */}
        <rect
          x="12"
          y="12"
          width="24"
          height="24"
          rx="1"
          transform="rotate(45 24 24)"
        />
      </g>
      {/* Inner circle */}
      <circle
        cx="24"
        cy="24"
        r="6"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Center dot */}
      <circle cx="24" cy="24" r="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}
