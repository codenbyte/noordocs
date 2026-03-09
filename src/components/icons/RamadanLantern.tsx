import type { SVGProps } from "react";

interface RamadanLanternProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export default function RamadanLantern({ size = 24, ...props }: RamadanLanternProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Hanging chain */}
      <path
        d="M24 2v4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Top cap */}
      <path
        d="M20 6h8l1 3H19l1-3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Lantern body — onion dome shape */}
      <path
        d="M19 9c-3 4-5 10-5 16 0 4 2 7 4 9h12c2-2 4-5 4-9 0-6-2-12-5-16H19Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Bottom cap */}
      <path
        d="M18 34h12l-1 3H19l-1-3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Bottom finial */}
      <path
        d="M24 37v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="24" cy="41" r="1" fill="currentColor" opacity="0.4" />
      {/* Decorative arched windows */}
      <path
        d="M21 18c0-2 1.5-3 3-3s3 1 3 3v6h-6v-6Z"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
        strokeLinejoin="round"
      />
      {/* Horizontal bands */}
      <line x1="16" y1="22" x2="32" y2="22" stroke="currentColor" strokeWidth="0.75" opacity="0.25" />
      <line x1="15" y1="28" x2="33" y2="28" stroke="currentColor" strokeWidth="0.75" opacity="0.25" />
      {/* Inner glow / flame */}
      <ellipse
        cx="24"
        cy="20"
        rx="1.5"
        ry="2.5"
        fill="currentColor"
        opacity="0.15"
      />
    </svg>
  );
}
