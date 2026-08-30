// Hero illustration matching the reference design:
// monitor mockup with "Deploy to AWS", floating checklist card, AWS cloud and rocket.
export function HeroArt() {
  return (
    <svg viewBox="48 24 536 336" role="img" aria-label="Deploy open source on AWS illustration">
      <defs>
        <linearGradient id="screenBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f7f9fc" />
        </linearGradient>
        <linearGradient id="playBtn" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="rocketBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f8df9" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="60%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="cloudGrad" gradientUnits="userSpaceOnUse" x1="0" y1="12" x2="0" y2="62">
          <stop offset="0%" stopColor="#ffb84d" />
          <stop offset="100%" stopColor="#f2740d" />
        </linearGradient>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="16" stdDeviation="16" floodColor="#0f172a" floodOpacity="0.10" />
        </filter>
        <filter id="floatShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#0f172a" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Subtle floating decorative shapes */}
      <g fill="none" stroke="#dce4ee" strokeWidth="2" opacity="0.9">
        <path d="M56 100 q8 -8 16 0 t16 0" />
        <circle cx="566" cy="92" r="9" />
        <path d="M76 336 l7 -12 l7 12 z" />
        <path d="M566 252 l6 -10 l6 10 z" />
      </g>

      {/* Monitor */}
      <g filter="url(#softShadow)">
        <rect x="130" y="52" width="360" height="232" rx="20" fill="#1e2a3a" />
        <rect x="142" y="64" width="336" height="208" rx="12" fill="url(#screenBg)" />
      </g>

      {/* Screen content */}
      <g>
        <text
          x="166"
          y="98"
          fill="#0f172a"
          fontSize="15"
          fontWeight="800"
          fontFamily="Inter, system-ui, -apple-system, sans-serif"
        >
          Deploy to AWS
        </text>

        {/* Left checklist card */}
        <rect x="166" y="112" width="88" height="72" rx="10" fill="#fff" stroke="#e6ebf2" />
        <circle cx="184" cy="132" r="8" fill="#16a34a" />
        <path d="M180.5 132 l2.5 2.5 l4.5 -4.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="198" y="127" width="40" height="6" rx="3" fill="#cbd5e1" />
        <rect x="198" y="146" width="26" height="6" rx="3" fill="#dbe3ec" />

        {/* Center play button */}
        <circle cx="318" cy="178" r="27" fill="url(#playBtn)" />
        <polygon points="311,166 311,190 332,178" fill="#fff" />

        {/* Right app list card */}
        <rect x="360" y="112" width="92" height="110" rx="10" fill="#fff" stroke="#e6ebf2" />
        <g>
          <rect x="370" y="126" width="18" height="18" rx="5" fill="#cfe0fb" />
          <rect x="394" y="129" width="42" height="5" rx="2.5" fill="#cbd5e1" />
          <rect x="394" y="138" width="30" height="4" rx="2" fill="#e2e8f0" />
        </g>
        <g>
          <rect x="370" y="158" width="18" height="18" rx="5" fill="#d3f2dc" />
          <rect x="394" y="161" width="42" height="5" rx="2.5" fill="#cbd5e1" />
          <rect x="394" y="170" width="30" height="4" rx="2" fill="#e2e8f0" />
        </g>
        <g>
          <rect x="370" y="190" width="18" height="18" rx="5" fill="#ecd9f7" />
          <rect x="394" y="193" width="42" height="5" rx="2.5" fill="#cbd5e1" />
          <rect x="394" y="202" width="30" height="4" rx="2" fill="#e2e8f0" />
        </g>

        {/* Bottom screen bar */}
        <rect x="166" y="240" width="260" height="7" rx="3.5" fill="#edf1f6" />
      </g>

      {/* Monitor stand */}
      <path d="M282 284 L338 284 L326 318 L294 318 Z" fill="#9aa7b8" />
      <rect x="258" y="318" width="104" height="14" rx="7" fill="#c3cdd9" />

      {/* Floating checklist card overlapping the monitor's left edge */}
      <g transform="translate(70 148)" filter="url(#floatShadow)">
        <rect x="0" y="0" width="116" height="64" rx="12" fill="#fff" stroke="#e6ebf2" />
        <circle cx="18" cy="20" r="8" fill="#2563eb" />
        <path d="M14.5 20 l2.5 2.5 l4.5 -4.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="32" y="15" width="64" height="6" rx="3" fill="#cbd5e1" />
        <circle cx="18" cy="44" r="8" fill="#16a34a" />
        <path d="M14.5 44 l2.5 2.5 l4.5 -4.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="32" y="39" width="48" height="6" rx="3" fill="#cbd5e1" />
      </g>

      {/* AWS cloud badge (top-right) */}
      <g transform="translate(452 20)" filter="url(#floatShadow)">
        <g fill="url(#cloudGrad)">
          <circle cx="28" cy="44" r="16" />
          <circle cx="50" cy="32" r="20" />
          <circle cx="72" cy="44" r="15" />
          <rect x="28" y="40" width="44" height="20" />
        </g>
        <text
          x="50"
          y="51"
          textAnchor="middle"
          fill="#fff"
          fontSize="15"
          fontWeight="800"
          fontFamily="Inter, system-ui, -apple-system, sans-serif"
          letterSpacing="0.5"
        >
          AWS
        </text>
      </g>

      {/* Rocket (bottom-right) */}
      <g transform="translate(474 282) rotate(38)" filter="url(#floatShadow)">
        {/* Flame */}
        <path d="M-8 32 C-11 50 -3 60 0 66 C3 60 11 50 8 32 Z" fill="url(#flame)" />
        {/* Fins */}
        <path d="M-20 8 C-34 14 -36 32 -24 39 L-15 28 Z" fill="#f97316" />
        <path d="M20 8 C34 14 36 32 24 39 L15 28 Z" fill="#f97316" />
        {/* Body */}
        <path d="M0 -48 C16 -48 26 -30 26 -6 C26 16 15 30 0 30 C-15 30 -26 16 -26 -6 C-26 -30 -16 -48 0 -48 Z" fill="url(#rocketBody)" />
        {/* White nose cap */}
        <path d="M0 -48 C10 -48 18 -40 22 -27 C15 -37 7 -41 0 -41 C-7 -41 -15 -37 -22 -27 C-18 -40 -10 -48 0 -48 Z" fill="#ffffff" opacity="0.95" />
        {/* Window */}
        <circle cx="0" cy="-8" r="11" fill="#ffffff" />
        <circle cx="0" cy="-8" r="6" fill="#2563eb" />
      </g>
    </svg>
  );
}
