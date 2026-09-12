import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export interface CaseItem {
  id: string;
  title: string;
  description: string;
  status: 'INVESTIGATION ACTIVE' | 'INVESTIGATION COMPLETE';
  wildcardConfig?: {
    motive: string;
    scene: string;
    scarcity: string;
    relationship?: string;
    complexity?: string;
    window?: string;
    evidenceCount?: number;
    confidence?: number;
  };
}

interface CasesPageProps {
  cases?: CaseItem[];
  onOpenCase?: (caseId: string) => void;
  onNewInvestigation?: () => void;
}

export const CasesPage: React.FC<CasesPageProps> = ({
  cases: propCases,
  onOpenCase,
  onNewInvestigation,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [internalCases] = useState<CaseItem[]>([]);
  const cases = propCases ?? internalCases;

  return (
    <div 
      className={`min-h-screen w-full transition-colors duration-300 ${
        isDark ? 'bg-[#080A0C] text-[#EDEAE3]' : 'bg-[#F6F4EE] text-[#1A1C1E]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-8 sm:px-10 pt-28 sm:pt-32 pb-24">
        
        {/* HEADING AREA */}
        <div className="mb-12 sm:mb-16">
          <span 
            className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] block mb-2 select-none ${
              isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
            }`}
          >
            CASE FILES
          </span>
          <p 
            className={`font-sans text-sm sm:text-base font-normal leading-relaxed ${
              isDark ? 'text-[#EDEAE3]/65' : 'text-[#1A1C1E]/65'
            }`}
          >
            Your investigations inside the Ashwick environment.
          </p>
        </div>

        {/* CONTENT AREA: Empty State vs Populated Grid */}
        {cases.length === 0 ? (
          /* EMPTY STATE (default for a new user) */
          <div className="w-full flex flex-col items-center justify-center py-12 sm:py-20">
            
            {/* Above the card, a small quiet line: "No investigations yet." */}
            <p 
              className={`font-mono text-xs uppercase tracking-[0.18em] mb-6 text-center select-none ${
                isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'
              }`}
            >
              No investigations yet.
            </p>

            {/* A single centered card */}
            <div
              onClick={onNewInvestigation}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onNewInvestigation?.(); }}
              className={`w-full max-w-lg rounded-lg border p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer group focus:outline-none focus-visible:ring-1 focus-visible:ring-[#6B9B85] ${
                isDark
                  ? 'border-white/[0.08] bg-[#0D1117] hover:border-white/[0.18] hover:bg-[#11161E]'
                  : 'border-black/[0.08] bg-white hover:border-black/[0.18] hover:bg-[#FAF8F5] shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
              }`}
            >
              {/* Plus icon (+) */}
              <div 
                className={`w-10 h-10 rounded-full border flex items-center justify-center mx-auto mb-5 transition-colors duration-200 ${
                  isDark
                    ? 'border-white/[0.08] bg-white/[0.03] text-[#EDEAE3]/70 group-hover:text-[#74AC95] group-hover:border-[#74AC95]/40'
                    : 'border-black/[0.08] bg-black/[0.03] text-[#1A1C1E]/70 group-hover:text-[#1E6147] group-hover:border-[#1E6147]/40'
                }`}
              >
                <Plus className="w-5 h-5 stroke-[1.75]" />
              </div>

              {/* Label: NEW INVESTIGATION */}
              <h2 
                className={`font-sans font-bold text-base sm:text-lg uppercase tracking-[0.14em] transition-colors duration-200 select-none ${
                  isDark 
                    ? 'text-[#EDEAE3] group-hover:text-[#74AC95]' 
                    : 'text-[#1A1C1E] group-hover:text-[#1E6147]'
                }`}
              >
                NEW INVESTIGATION
              </h2>

              {/* Quiet supporting line */}
              <p 
                className={`font-sans text-xs sm:text-sm mt-2.5 max-w-sm mx-auto leading-relaxed ${
                  isDark ? 'text-[#EDEAE3]/55' : 'text-[#1A1C1E]/55'
                }`}
              >
                Begin a new investigation in the Ashwick environment.
              </p>
            </div>

          </div>
        ) : (
          /* POPULATED STATE (grid of case cards) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* NEW INVESTIGATION TILE (Always first tile in populated grid) */}
            <div
              onClick={onNewInvestigation}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onNewInvestigation?.(); }}
              className={`rounded-lg border p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 group cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#6B9B85] ${
                isDark
                  ? 'border-white/[0.08] bg-[#0D1117] hover:border-white/[0.18] hover:bg-[#11161E]'
                  : 'border-black/[0.08] bg-white hover:border-black/[0.18] hover:bg-[#FAF8F5] shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
              }`}
            >
              <div>
                {/* Small plus icon */}
                <div 
                  className={`w-9 h-9 rounded-full border flex items-center justify-center mb-4 transition-colors duration-200 ${
                    isDark
                      ? 'border-white/[0.08] bg-white/[0.03] text-[#EDEAE3]/70 group-hover:text-[#74AC95] group-hover:border-[#74AC95]/40'
                      : 'border-black/[0.08] bg-black/[0.03] text-[#1A1C1E]/70 group-hover:text-[#1E6147] group-hover:border-[#1E6147]/40'
                  }`}
                >
                  <Plus className="w-4 h-4 stroke-[1.75]" />
                </div>

                {/* Label: NEW INVESTIGATION */}
                <h3 
                  className={`font-sans font-bold text-lg sm:text-xl uppercase tracking-[0.14em] mb-2.5 leading-snug transition-colors duration-200 select-none ${
                    isDark 
                      ? 'text-[#EDEAE3] group-hover:text-[#74AC95]' 
                      : 'text-[#1A1C1E] group-hover:text-[#1E6147]'
                  }`}
                >
                  NEW INVESTIGATION
                </h3>

                {/* Quiet supporting line */}
                <p 
                  className={`font-sans text-xs sm:text-sm leading-relaxed ${
                    isDark ? 'text-[#EDEAE3]/55' : 'text-[#1A1C1E]/55'
                  }`}
                >
                  Begin a new investigation in the Ashwick environment.
                </p>
              </div>

              {/* Bottom Row action matching case cards */}
              <div 
                className={`pt-6 mt-6 border-t flex items-center justify-between ${
                  isDark ? 'border-white/[0.05]' : 'border-black/[0.05]'
                }`}
              >
                <span 
                  className={`font-mono text-xs uppercase tracking-widest transition-colors duration-200 flex items-center gap-2 select-none ${
                    isDark
                      ? 'text-[#EDEAE3]/70 group-hover:text-[#74AC95]'
                      : 'text-[#1A1C1E]/70 group-hover:text-[#1E6147]'
                  }`}
                >
                  <span>CREATE CASE</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </span>
              </div>
            </div>

            {cases.map((caseItem) => {
              const isActive = caseItem.status === 'INVESTIGATION ACTIVE';

              return (
                <div
                  key={caseItem.id}
                  onClick={() => onOpenCase?.(caseItem.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') onOpenCase?.(caseItem.id); }}
                  className={`rounded-lg border p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 group cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#6B9B85] ${
                    isDark
                      ? 'border-white/[0.08] bg-[#0D1117] hover:border-white/[0.18] hover:bg-[#11161E]'
                      : 'border-black/[0.08] bg-white hover:border-black/[0.18] hover:bg-[#FAF8F5] shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
                  }`}
                >
                  <div>
                    {/* Top Row: Case ID & Status Tag */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      {/* Case ID (monospace, small, muted) */}
                      <span 
                        className={`font-mono text-xs tracking-wider uppercase select-none ${
                          isDark ? 'text-[#EDEAE3]/45' : 'text-[#1A1C1E]/45'
                        }`}
                      >
                        {caseItem.id}
                      </span>

                      {/* Status Tag */}
                      <span 
                        className={`font-mono text-[10px] uppercase tracking-[0.14em] px-2.5 py-1 rounded-full border select-none ${
                          isActive
                            ? isDark
                              ? 'bg-[#6B9B85]/10 text-[#74AC95] border-[#6B9B85]/25'
                              : 'bg-[#1E6147]/10 text-[#1E6147] border-[#1E6147]/25'
                            : isDark
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                              : 'bg-emerald-700/10 text-emerald-800 border-emerald-700/25'
                        }`}
                      >
                        {caseItem.status}
                      </span>
                    </div>

                    {/* Case Title (larger, primary text) */}
                    <h3 
                      className={`font-sans text-lg sm:text-xl font-bold tracking-tight mb-2.5 leading-snug transition-colors duration-200 ${
                        isDark
                          ? 'text-[#EDEAE3] group-hover:text-[#74AC95]'
                          : 'text-[#1A1C1E] group-hover:text-[#1E6147]'
                      }`}
                    >
                      {caseItem.title}
                    </h3>

                    {/* One-line short description (secondary text) */}
                    <p 
                      className={`font-sans text-xs sm:text-sm leading-relaxed line-clamp-2 ${
                        isDark ? 'text-[#EDEAE3]/60' : 'text-[#1A1C1E]/65'
                      }`}
                    >
                      {caseItem.description}
                    </p>
                  </div>

                  {/* Bottom Row: Quiet "OPEN CASE →" action */}
                  <div 
                    className={`pt-6 mt-6 border-t flex items-center justify-between ${
                      isDark ? 'border-white/[0.05]' : 'border-black/[0.05]'
                    }`}
                  >
                    <span 
                      className={`font-mono text-xs uppercase tracking-widest transition-colors duration-200 flex items-center gap-2 select-none ${
                        isDark
                          ? 'text-[#EDEAE3]/70 group-hover:text-[#74AC95]'
                          : 'text-[#1A1C1E]/70 group-hover:text-[#1E6147]'
                      }`}
                    >
                      <span>OPEN CASE</span>
                      <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
