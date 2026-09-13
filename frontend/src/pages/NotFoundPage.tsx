import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface NotFoundPageProps {
  onNavigate?: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-300 flex flex-col justify-center ${
        isDark ? 'bg-[#080A0C] text-[#EDEAE3]' : 'bg-[#F6F4EE] text-[#1A1C1E]'
      }`}
    >
      <div className="w-full max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-0 pt-24 sm:pt-32 pb-20">
        <section className="w-full max-w-[680px]">
          {/* Tracked Eyebrow: 404 */}
          <span
            className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] block select-none ${
              isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
            }`}
          >
            404
          </span>

          {/* Minimal Divider */}
          <div className={`w-12 h-[1px] my-4 ${isDark ? 'bg-white/15' : 'bg-black/15'}`} />

          {/* Heading */}
          <h1 className="font-sans font-bold text-3xl sm:text-5xl tracking-tight leading-tight uppercase select-none">
            Route not found
          </h1>

          {/* Supporting Line */}
          <p
            className={`font-sans text-sm sm:text-base leading-relaxed mt-4 font-normal ${
              isDark ? 'text-[#EDEAE3]/70' : 'text-[#1A1C1E]/70'
            }`}
          >
            The requested page does not exist inside the Ashwick investigation environment.
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 mt-8">
            <button
              onClick={() => onNavigate?.('/cases')}
              className={`px-5 py-2.5 rounded-lg border font-mono text-xs uppercase tracking-widest transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                isDark
                  ? 'border-[#74AC95]/40 bg-[#74AC95]/10 text-[#74AC95] hover:bg-[#74AC95]/20 hover:border-[#74AC95]/60'
                  : 'border-[#1E6147]/40 bg-[#1E6147]/10 text-[#1E6147] hover:bg-[#1E6147]/20 hover:border-[#1E6147]/60'
              }`}
            >
              <span>RETURN TO CASE FILES</span>
              <span>→</span>
            </button>

            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  window.history.back();
                } else {
                  onNavigate?.('/cases');
                }
              }}
              className={`px-4 py-2.5 rounded-lg border font-mono text-xs uppercase tracking-widest transition-all duration-200 cursor-pointer ${
                isDark
                  ? 'border-white/[0.12] bg-[#0D1117] text-[#EDEAE3]/80 hover:border-white/[0.24] hover:text-[#EDEAE3] hover:bg-[#11161E]'
                  : 'border-black/[0.12] bg-white text-[#1A1C1E]/80 hover:border-black/[0.24] hover:text-[#1A1C1E] hover:bg-[#FAF8F5]'
              }`}
            >
              BACK
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
