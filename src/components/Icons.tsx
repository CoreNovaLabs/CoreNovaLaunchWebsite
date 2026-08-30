// Inline SVG icon set. No extra dependency in mock stage.
// All icons are 24×24 viewBox, stroke-based, consistent 1.5px stroke.

import type { CSSProperties } from "react";

const base: CSSProperties = {
  width: "1em",
  height: "1em",
  display: "inline-block",
  verticalAlign: "middle",
  flexShrink: 0,
};

function Icon({
  children,
  size = 20,
  style,
}: {
  children: React.ReactNode;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ ...base, width: size, height: size, ...style }}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </Icon>
);

export const CheckCircleIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);

export const RocketIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </Icon>
);

export const ZapIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </Icon>
);

export const RefreshCwIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </Icon>
);

export const ShieldCheckIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);

export const GlobeIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Icon>
);

export const StarIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </Icon>
);

export const ChevronRightIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <path d="m9 18 6-6-6-6" />
  </Icon>
);

export const ExternalLinkIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
  </Icon>
);

export const ServerIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </Icon>
);

export const CpuIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <path d="M15 2v2" />
    <path d="M15 20v2" />
    <path d="M2 15h2" />
    <path d="M2 9h2" />
    <path d="M20 15h2" />
    <path d="M20 9h2" />
    <path d="M9 2v2" />
    <path d="M9 20v2" />
  </Icon>
);

export const HardDriveIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <line x1="12" y1="10" x2="12.01" y2="10" />
    <path d="M22 13.5V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14.5" />
    <path d="M22 17.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z" />
  </Icon>
);

export const ClockIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </Icon>
);

export const ArrowRightIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </Icon>
);

export const PackageIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </Icon>
);

export const LayoutGridIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </Icon>
);

export const SparklesIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M9 5H5" />
    <path d="M19 18v4" />
    <path d="M21 20h-4" />
  </Icon>
);

export const LayersIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </Icon>
);

export const GitCommitIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <circle cx="12" cy="12" r="3" />
    <line x1="3" y1="12" x2="9" y2="12" />
    <line x1="15" y1="12" x2="21" y2="12" />
  </Icon>
);

export const TrendingUpIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </Icon>
);

export const SunIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </Icon>
);

export const MoonIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Icon>
);

export const DownloadIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </Icon>
);

export const LockIcon = ({ size, style }: { size?: number; style?: CSSProperties }) => (
  <Icon size={size} style={style}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Icon>
);
