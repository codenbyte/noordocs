import type { SVGProps } from "react";

interface MosqueSilhouetteProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export default function MosqueSilhouette({ size = 24, ...props }: MosqueSilhouetteProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Dome */}
      <path
        d="M14 28C14 28 14 20 24 14C34 20 34 28 34 28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dome finial */}
      <path
        d="M24 14V10M23 10h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Crescent on dome */}
      <path
        d="M24 8a1.5 1.5 0 1 0 0-3 2 2 0 0 1 0 3Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Base walls */}
      <path
        d="M10 28h28v10H10V28Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Door arch */}
      <path
        d="M20 38v-5a4 4 0 0 1 8 0v5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Minaret */}
      <path
        d="M40 38V18l-2-2-2 2v20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Minaret cap */}
      <path
        d="M38 16V13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Ground line */}
      <line
        x1="6"
        y1="38"
        x2="42"
        y2="38"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
