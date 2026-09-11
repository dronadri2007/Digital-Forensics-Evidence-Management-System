import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface CaseContextStripProps {
  caseId: string;
  title: string;
  isSolved: boolean;
  evidenceCount: number;
  confidence: number;
  onSolveToggle: () => void;
}

export const CaseContextStrip: React.FC<CaseContextStripProps> = ({
  caseId,
  title,
  isSolved,
  evidenceCount,
  confidence,
  onSolveToggle,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`w-full h-14 border-b transition-colors duration-300 flex items-center justify-between px-8 sm:px-10 select-none z-30 ${
        isDark
          ? 'bg-[#0B0E12] border-white/[0.06] text-[#EDEAE3]'
          : 'bg-[#F2EEE6] border-black/[0.08] text-[#1A1C1E]'
      }`}
    >
      {/* Left side: Case ID, Title, and Compact Dividers */}
      <div className="flex items-center gap-4 sm:gap-6 min-w-0">
        {/* Case ID */}
        <span 
          className={`font-mono text-xs uppercase tracking-wider shrink-0 ${
            isDark ? 'text-[#EDEAE3]/45' : 'text-[#1A1C1E]/45'
          }`}
        >
          {caseId}
        </span>

        {/* Case Title */}
        <span className="font-sans font-bold text-sm sm:text-base tracking-tight truncate">
          {title}
        </span>

        {/* Thin vertical divider */}
        <div className={`h-3.5 w-[1px] shrink-0 ${isDark ? 'bg-white/15' : 'bg-black/15'}`} />

        {/* Compact Metadata Cluster */}
        <div className="flex items-center gap-4 sm:gap-6 text-xs shrink-0 font-mono">
          
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className={`uppercase tracking-widest text-[11px] ${isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'}`}>
              STATUS
            </span>
            <span className="font-medium tracking-wide">
              {isSolved ? 'COMPLETE' : 'ACTIVE'}
            </span>
          </div>

          {/* Divider */}
          <div className={`h-3 w-[1px] ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

          {/* Evidence Count */}
          <div className="flex items-center gap-2">
            <span className={`uppercase tracking-widest text-[11px] ${isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'}`}>
              EVIDENCE
            </span>
            <span className="font-medium tracking-wide">
              {evidenceCount} nodes
            </span>
          </div>

          {/* Divider */}
          <div className={`h-3 w-[1px] ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

          {/* Confidence */}
          <div className="flex items-center gap-2">
            <span className={`uppercase tracking-widest text-[11px] ${isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'}`}>
              CONFIDENCE
            </span>
            <span className="font-medium tracking-wide">
              {confidence}%
            </span>
          </div>

        </div>
      </div>

      {/* Right side: SOLVE CASE or Return Action */}
      <div className="shrink-0 ml-4">
        {isSolved ? (
          <button
            onClick={onSolveToggle}
            className={`h-8 px-3.5 rounded-md font-mono text-xs uppercase tracking-wider font-medium border transition-colors duration-200 focus:outline-none ${
              isDark
                ? 'border-white/20 bg-white/[0.05] text-[#EDEAE3] hover:bg-white/[0.10]'
                : 'border-black/20 bg-black/[0.04] text-[#1A1C1E] hover:bg-black/[0.08]'
            }`}
          >
            ← Return to Active Investigation
          </button>
        ) : (
          <button
            onClick={onSolveToggle}
            className={`h-8 px-4 rounded-full font-sans text-xs uppercase tracking-widest font-semibold transition-all duration-200 focus:outline-none text-[#1A1C1E] ${
              isDark
                ? 'bg-[#D6C5B6] hover:bg-[#DFD0C3] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                : 'bg-[#B6C7D6] hover:bg-[#ADC0D1] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]'
            }`}
          >
            SOLVE CASE
          </button>
        )}
      </div>
    </div>
  );
};
