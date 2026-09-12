import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface Entity {
  id: string;
  name: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

const entities: Entity[] = [
  {
    id: 'aca',
    name: 'Ashwick Civil Authority',
    icon: ({ className = "w-7 h-7" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        {/* Classical Pediment with layered cornice moulding */}
        <path d="M12 2.5L2.5 6.5h19L12 2.5z" />
        <path d="M12 4.2v.01" strokeWidth="2" />
        <line x1="3.5" y1="8" x2="20.5" y2="8" strokeWidth="1.3" />
        <line x1="4.5" y1="9.2" x2="19.5" y2="9.2" strokeWidth="0.8" />
        {/* 4 Fluted Columns with Capitols and Bases */}
        <line x1="5.5" y1="9.2" x2="5.5" y2="16.5" strokeWidth="1.2" />
        <line x1="9.5" y1="9.2" x2="9.5" y2="16.5" strokeWidth="1.2" />
        <line x1="14.5" y1="9.2" x2="14.5" y2="16.5" strokeWidth="1.2" />
        <line x1="18.5" y1="9.2" x2="18.5" y2="16.5" strokeWidth="1.2" />
        {/* Central Civic Arch Portal */}
        <path d="M10.5 16.5v-3a1.5 1.5 0 0 1 3 0v3" strokeWidth="1" />
        {/* Stepped Foundation (Stylobate) */}
        <line x1="3.5" y1="16.5" x2="20.5" y2="16.5" strokeWidth="1.2" />
        <line x1="2" y1="18.2" x2="22" y2="18.2" strokeWidth="1.3" />
        <line x1="1" y1="20" x2="23" y2="20" strokeWidth="1.4" />
        {/* Small civic seal star above peak */}
        <circle cx="12" cy="1" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'amp',
    name: 'Ashwick Metropolitan Police',
    icon: ({ className = "w-7 h-7" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        {/* Heraldic Police Shield */}
        <path d="M12 2.5l7.5 3.2v6.8c0 5.2-3.8 9.2-7.5 10.3-3.7-1.1-7.5-5.1-7.5-10.3V5.7L12 2.5z" strokeWidth="1.3" />
        {/* Inner Shield Contour */}
        <path d="M12 4.6l5.6 2.4v4.8c0 3.8-2.8 6.9-5.6 7.8-2.8-.9-5.6-4-5.6-7.8V7L12 4.6z" strokeWidth="0.8" opacity="0.6" />
        {/* Official 8-Point Faceted Police Star */}
        <polygon points="12 6.5 13.3 9.7 16.5 9.7 14 11.5 14.9 14.6 12 12.8 9.1 14.6 10 11.5 7.5 9.7 10.7 9.7" strokeWidth="1.1" />
        {/* Central Badge Core */}
        <circle cx="12" cy="11.2" r="1.2" strokeWidth="1" />
        <circle cx="12" cy="11.2" r="0.4" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'acsb',
    name: 'Ashwick Cyber Security Bureau',
    icon: ({ className = "w-7 h-7" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        {/* Hexagonal Defense Vault Perimeter */}
        <polygon points="12 2 20.5 6.8 20.5 17.2 12 22 3.5 17.2 3.5 6.8" strokeWidth="1.3" />
        {/* Inner Concentric Circuit Hexagon */}
        <polygon points="12 4.5 18.5 8.2 18.5 15.8 12 19.5 5.5 15.8 5.5 8.2" strokeWidth="0.8" opacity="0.5" />
        {/* Cryptographic Vault Core & Keyway */}
        <rect x="9.5" y="10.5" width="5" height="4.5" rx="1" strokeWidth="1.2" />
        <path d="M10.5 10.5V8.5a1.5 1.5 0 0 1 3 0v2" strokeWidth="1.1" />
        <circle cx="12" cy="12.2" r="0.6" fill="currentColor" />
        <line x1="12" y1="12.8" x2="12" y2="13.8" strokeWidth="0.9" />
        {/* Branching Circuit Traces to Vertices */}
        <line x1="12" y1="4.5" x2="12" y2="7" strokeWidth="0.9" />
        <line x1="12" y1="15" x2="12" y2="19.5" strokeWidth="0.9" />
        <line x1="9.5" y1="12" x2="5.5" y2="12" strokeWidth="0.9" />
        <line x1="14.5" y1="12" x2="18.5" y2="12" strokeWidth="0.9" />
        <circle cx="12" cy="7" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'ata',
    name: 'Ashwick Telecommunications Authority',
    icon: ({ className = "w-7 h-7" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        {/* Central Lattice Transmission Mast */}
        <path d="M12 2v20" strokeWidth="1.3" />
        {/* Lattice Truss Bracing */}
        <path d="M9 21.5l3-4.5 3 4.5" strokeWidth="1" />
        <path d="M9.8 17l2.2-3.5 2.2 3.5" strokeWidth="0.9" />
        <path d="M10.5 13.5l1.5-2.5 1.5 2.5" strokeWidth="0.8" />
        {/* Ground Base Plinth */}
        <line x1="7.5" y1="21.5" x2="16.5" y2="21.5" strokeWidth="1.4" />
        {/* Emitter Feed & Beacon */}
        <circle cx="12" cy="3" r="1.2" strokeWidth="1.2" />
        <circle cx="12" cy="3" r="0.4" fill="currentColor" />
        {/* Concentric Parabolic Wavefront Arrays */}
        <path d="M8.5 6a5 5 0 0 1 7 0" strokeWidth="1.1" />
        <path d="M6 4a8.5 8.5 0 0 1 12 0" strokeWidth="1" opacity="0.75" />
        <path d="M3.5 2a12 12 0 0 1 17 0" strokeWidth="0.9" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: 'afn',
    name: 'Ashwick Financial Network',
    icon: ({ className = "w-7 h-7" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer Sovereign Coin / Guilloche Border */}
        <circle cx="12" cy="12" r="9.5" strokeWidth="1.3" />
        {/* 12 Clearing Clock Ticks */}
        <path d="M12 3v1.2M12 19.8v1.2M3 12h1.2M19.8 12h1.2M5.6 5.6l.8.8M17.6 17.6l.8.8M5.6 18.4l.8-.8M17.6 6.4l.8-.8" strokeWidth="0.8" opacity="0.6" />
        {/* Nested Faceted Diamond / Reserve Vault Core */}
        <polygon points="12 5.5 18.5 12 12 18.5 5.5 12" strokeWidth="1.1" />
        {/* Inner Interlocking Ledger Square */}
        <rect x="8.5" y="8.5" width="7" height="7" rx="0.8" strokeWidth="0.9" transform="rotate(45 12 12)" opacity="0.7" />
        {/* Sovereign Bullion / Node Center */}
        <circle cx="12" cy="12" r="2.2" strokeWidth="1.1" />
        <circle cx="12" cy="12" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'adfl',
    name: 'Ashwick Digital Forensics Lab',
    icon: ({ className = "w-7 h-7" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        {/* Analytical Precision Reticle Outer Ring */}
        <circle cx="12" cy="12" r="9.5" strokeWidth="1.3" />
        {/* Calibrated Micrometer Sub-Ring */}
        <circle cx="12" cy="12" r="7" strokeWidth="0.8" strokeDasharray="1.2 1.8" opacity="0.6" />
        {/* Cardinal & Diagonal Target Crosshairs */}
        <line x1="12" y1="1" x2="12" y2="4.5" strokeWidth="1.2" />
        <line x1="12" y1="19.5" x2="12" y2="23" strokeWidth="1.2" />
        <line x1="1" y1="12" x2="4.5" y2="12" strokeWidth="1.2" />
        <line x1="19.5" y1="12" x2="23" y2="12" strokeWidth="1.2" />
        {/* Center Biometric & Forensic Focus Ring */}
        <circle cx="12" cy="12" r="4" strokeWidth="1" />
        {/* Focal Aperture / Micro-Target */}
        <polygon points="12 9.5 14.5 12 12 14.5 9.5 12" strokeWidth="0.9" opacity="0.8" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
];

export const AshwickBottomStrip: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="w-full pointer-events-auto flex flex-col items-center gap-4 pb-4 pt-2 px-4 sm:px-6 lg:px-8 bg-transparent">
      
      {/* 1. Six institutional marks first, six readable names second — sitting directly on video */}
      <div className="w-full max-w-6xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-3 gap-x-6 items-start justify-between select-none">
        {entities.map((entity) => {
          const Icon = entity.icon;
          return (
            <div 
              key={entity.id} 
              className="flex flex-col items-center text-center gap-2 group cursor-default"
            >
              {/* Prominent vector mark: sage in dark, forest/sage in light */}
              <div className={`${isDark ? 'text-[#6B9B85]' : 'text-[#1E6147]'} opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-200`}>
                <Icon className="w-7 h-7 stroke-[1.25]" />
              </div>
              {/* Caption name in Space Grotesk (font-sans) */}
              <span className={`font-sans text-[9.5px] uppercase tracking-wider transition-colors duration-200 leading-tight max-w-[140px] ${
                isDark ? 'text-[#EDEAE3]/60 group-hover:text-[#EDEAE3]/90' : 'text-[#1A1C1E]/65 group-hover:text-[#1A1C1E]/90'
              }`}>
                {entity.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* 2. Thin row of policy links: Space Grotesk */}
      <div className={`flex items-center gap-3 text-[10px] font-sans uppercase tracking-widest select-none pt-1 transition-colors duration-200 ${
        isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/45'
      }`}>
        <a href="#privacy" onClick={(e) => e.preventDefault()} className={isDark ? "hover:text-[#EDEAE3] transition-colors" : "hover:text-[#1A1C1E] transition-colors"}>PRIVACY</a>
        <span>·</span>
        <a href="#security" onClick={(e) => e.preventDefault()} className={isDark ? "hover:text-[#EDEAE3] transition-colors" : "hover:text-[#1A1C1E] transition-colors"}>SECURITY</a>
        <span>·</span>
        <a href="#data-policy" onClick={(e) => e.preventDefault()} className={isDark ? "hover:text-[#EDEAE3] transition-colors" : "hover:text-[#1A1C1E] transition-colors"}>DATA POLICY</a>
        <span>·</span>
        <a href="#terms" onClick={(e) => e.preventDefault()} className={isDark ? "hover:text-[#EDEAE3] transition-colors" : "hover:text-[#1A1C1E] transition-colors"}>TERMS</a>
      </div>

    </div>
  );
};
