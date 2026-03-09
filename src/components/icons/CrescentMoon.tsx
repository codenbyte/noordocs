import type { SVGProps } from "react";

interface CrescentMoonProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export default function CrescentMoon({ size = 24, ...props }: CrescentMoonProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M32 6C25.373 6 20 11.373 20 18c0 6.627 5.373 12 12 12 2.341 0 4.524-.672 6.371-1.832A16.001 16.001 0 0 1 8 24C8 15.163 15.163 8 24 8c2.842 0 5.51.74 7.821 2.038A11.94 11.94 0 0 0 32 6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="35" cy="12" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="40" cy="18" r="0.75" fill="currentColor" opacity="0.3" />
      <circle cx="37" cy="24" r="0.5" fill="currentColor" opacity="0.25" />
    </svg>
  );
}
