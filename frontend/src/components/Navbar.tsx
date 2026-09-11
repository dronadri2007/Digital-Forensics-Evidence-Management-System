import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, ArrowLeft, Info as InfoIcon } from 'lucide-react';

interface NavbarProps {
  isInternalPage?: boolean;
  onBack?: () => void;
  onGetStarted?: () => void;
  onInfoClick?: () => void;
  onNavigate?: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isInternalPage = false,
  onBack,
  onGetStarted,
  onInfoClick,
  onNavigate,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 w-full h-16 border-b transition-colors duration-300 backdrop-blur-[16px] ${
        isDark
          ? 'bg-[rgba(12,14,17,0.72)] border-[rgba(255,255,255,0.06)]'
          : 'bg-[rgba(242,238,230,0.94)] border-[rgba(0,0,0,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
      }`}
    >
      <div className="w-full px-8 sm:px-10 h-16 flex items-center justify-between">
        
        {/* Left: Stacked two-line brand wordmark block (universal across all pages) */}
        <div className="flex items-center">
          <a
            href="/"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate('/');
              }
            }}
            className="inline-flex flex-col items-start justify-center group focus:outline-none focus-visible:ring-1 focus-visible:ring-[#6B9B85] rounded-md"
            aria-label="AEGIS Home"
          >
            {/* LINE 1 — AEGIS: Primary brand line */}
            <span 
              className={`font-sans font-bold tracking-[0.08em] text-[24px] uppercase select-none transition-colors duration-300 leading-none ${
                isDark ? 'text-[#EDEAE3]' : 'text-[#1A1C1E]'
              }`}
            >
              AEGIS
            </span>

            {/* LINE 2 — Subtitle: Tracked institutional subtitle */}
            <span 
              className={`mt-[4px] font-sans font-medium text-[9px] uppercase tracking-[0.20em] select-none transition-colors duration-300 leading-none ${
                isDark ? 'text-[rgba(237,234,227,0.55)]' : 'text-[rgba(26,28,30,0.55)]'
              }`}
            >
              AUTOMATED EVIDENCE GOVERNANCE & INTELLIGENCE SYSTEM
            </span>
          </a>
        </div>

        {/* Right-Side Controls:
            Landing Page (/): Theme Toggle → GET STARTED → Info
            Internal Pages (/cases, etc.): Back → Theme Toggle → Info */}
        <div className="flex items-center">
          {isInternalPage ? (
            /* INTERNAL PAGE RIGHT CLUSTER: Theme Toggle → Back → Info */
            <div className="flex items-center">
              {/* 1. THEME TOGGLE: Naked icon on leftmost position */}
              <button
                onClick={toggleTheme}
                className={`p-1.5 mr-4 flex items-center justify-center transition-colors duration-200 focus:outline-none ${
                  isDark
                    ? 'text-[#EDEAE3]/75 hover:text-[#EDEAE3]'
                    : 'text-[#1A1C1E]/75 hover:text-[#1A1C1E]'
                }`}
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
                aria-label="Toggle visual theme"
              >
                {isDark ? (
                  <Sun className="w-[19px] h-[19px]" />
                ) : (
                  <Moon className="w-[19px] h-[19px]" />
                )}
              </button>

              {/* Matched Pill Pair: BACK (filled) + INFO (outlined) with ~8px gap */}
              <div className="flex items-center gap-2">
                {/* 2. BACK: Filled pill with soft neutral surface */}
                <button
                  onClick={onBack}
                  className={`h-[38px] px-[18px] flex items-center justify-center gap-2 rounded-full text-xs font-sans uppercase tracking-wider font-medium transition-colors duration-200 border focus:outline-none ${
                    isDark
                      ? 'bg-[rgba(210,210,210,0.10)] border-white/[0.06] text-[#EDEAE3] hover:bg-[rgba(210,210,210,0.16)]'
                      : 'bg-[#D2D2D2] border-black/[0.04] text-[#1A1C1E] hover:bg-[#C8C8C8]'
                  }`}
                  aria-label="Navigate back"
                >
                  <ArrowLeft className="w-3.5 h-3.5 opacity-90" />
                  <span>BACK</span>
                </button>

                {/* 3. INFO: Outlined transparent pill */}
                <button
                  onClick={onInfoClick}
                  className={`h-[38px] px-[18px] flex items-center justify-center gap-2 rounded-full text-xs font-sans uppercase tracking-wider font-medium transition-colors duration-200 border bg-transparent focus:outline-none ${
                    isDark
                      ? 'border-[rgba(255,255,255,0.14)] text-[#EDEAE3] hover:bg-white/[0.05]'
                      : 'border-[rgba(0,0,0,0.14)] text-[#1A1C1E] hover:bg-black/[0.04]'
                  }`}
                  aria-label="System Info"
                >
                  <InfoIcon className="w-3.5 h-3.5 opacity-80" />
                  <span>INFO</span>
                </button>
              </div>
            </div>
          ) : (
            /* LANDING PAGE RIGHT CLUSTER: Theme Toggle → GET STARTED → Info */
            <div className="flex items-center">
              {/* 1. Theme Toggle: Naked icon */}
              <button
                onClick={toggleTheme}
                className={`p-1.5 mr-4 flex items-center justify-center transition-colors duration-200 focus:outline-none ${
                  isDark
                    ? 'text-[#EDEAE3]/75 hover:text-[#EDEAE3]'
                    : 'text-[#1A1C1E]/75 hover:text-[#1A1C1E]'
                }`}
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
                aria-label="Toggle visual theme"
              >
                {isDark ? (
                  <Sun className="w-[19px] h-[19px]" />
                ) : (
                  <Moon className="w-[19px] h-[19px]" />
                )}
              </button>

              {/* Matched Pill Pair: GET STARTED + INFO with ~8px gap */}
              <div className="flex items-center gap-2">
                {/* 2. GET STARTED: Fully rounded solid pill with deliberate cool-blue / warm-sand pair */}
                <button
                  onClick={onGetStarted}
                  className={`h-[38px] px-5 flex items-center justify-center rounded-full text-xs font-sans uppercase tracking-widest font-semibold text-[#1A1C1E] transition-all duration-200 focus:outline-none ${
                    isDark
                      ? 'bg-[#D6C5B6] hover:bg-[#DFD0C3] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                      : 'bg-[#B6C7D6] hover:bg-[#ADC0D1] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]'
                  }`}
                >
                  <span>GET STARTED</span>
                </button>

                {/* 3. INFO: Fully rounded outlined pill */}
                <button
                  onClick={onInfoClick}
                  className={`h-[38px] px-[18px] flex items-center justify-center gap-2 rounded-full text-xs font-sans uppercase tracking-wider font-medium transition-colors duration-200 border bg-transparent focus:outline-none ${
                    isDark
                      ? 'border-[rgba(255,255,255,0.14)] text-[#EDEAE3] hover:bg-white/[0.05]'
                      : 'border-[rgba(0,0,0,0.14)] text-[#1A1C1E] hover:bg-black/[0.04]'
                  }`}
                  aria-label="System Info"
                >
                  <InfoIcon className="w-3.5 h-3.5 opacity-80" />
                  <span>INFO</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
