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
    icon: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M5 21V10M19 21V10M9 21V10M14 21V10M2 10l10-6 10 6" />
      </svg>
    ),
  },
  {
    id: 'amp',
    name: 'Ashwick Metropolitan Police',
    icon: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    id: 'acsb',
    name: 'Ashwick Cyber Security Bureau',
    icon: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
      </svg>
    ),
  },
  {
    id: 'ata',
    name: 'Ashwick Telecommunications Authority',
    icon: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0 1 10 10M12 6a6 6 0 0 1 6 6M12 10a2 2 0 0 1 2 2" />
        <line x1="12" y1="12" x2="12" y2="22" />
      </svg>
    ),
  },
  {
    id: 'afn',
    name: 'Ashwick Financial Network',
    icon: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 21 7.5 21 16.5 12 22 3 16.5 3 7.5 12 2" />
        <circle cx="12" cy="12" r="3.5" />
      </svg>
    ),
  },
  {
    id: 'adfl',
    name: 'Ashwick Digital Forensics Lab',
    icon: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
        <line x1="12" y1="4" x2="12" y2="8" />
        <line x1="12" y1="16" x2="12" y2="20" />
        <line x1="4" y1="12" x2="8" y2="12" />
        <line x1="16" y1="12" x2="20" y2="12" />
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
              className="flex flex-col items-center text-center gap-1.5 group cursor-default"
            >
              {/* Prominent vector mark: sage in dark, forest/sage in light */}
              <div className={`${isDark ? 'text-[#6B9B85]' : 'text-[#1E6147]'} opacity-85 group-hover:opacity-100 transition-all duration-200`}>
                <Icon className="w-6 h-6 stroke-[1.5]" />
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
