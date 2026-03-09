import type { SVGProps } from "react";

interface QuranOutlineProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export default function QuranOutline({ size = 24, ...props }: QuranOutlineProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Book spine */}
      <path
        d="M24 8v32"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Left page */}
      <path
        d="M24 8C20 8 10 6 8 6v30c2 0 12 2 16 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Right page */}
      <path
        d="M24 8c4 0 14-2 16-2v30c-2 0-12 2-16 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Islamic star decoration on cover */}
      <path
        d="M16 20l1.5-3 1.5 3-3-1.5h3L16 20Z"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.4"
      />
      {/* Text lines on right page */}
      <line x1="28" y1="16" x2="36" y2="16" stroke="currentColor" strokeWidth="0.75" opacity="0.3" />
      <line x1="28" y1="20" x2="35" y2="20" stroke="currentColor" strokeWidth="0.75" opacity="0.3" />
      <line x1="28" y1="24" x2="36" y2="24" stroke="currentColor" strokeWidth="0.75" opacity="0.3" />
      <line x1="28" y1="28" x2="34" y2="28" stroke="currentColor" strokeWidth="0.75" opacity="0.3" />
      {/* Text lines on left page */}
      <line x1="12" y1="24" x2="20" y2="24" stroke="currentColor" strokeWidth="0.75" opacity="0.3" />
      <line x1="12" y1="28" x2="19" y2="28" stroke="currentColor" strokeWidth="0.75" opacity="0.3" />
      <line x1="12" y1="32" x2="20" y2="32" stroke="currentColor" strokeWidth="0.75" opacity="0.3" />
    </svg>
  );
}
