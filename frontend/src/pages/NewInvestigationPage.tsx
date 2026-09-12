import React, { useState } from 'react';
import { Crosshair } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { SCENARIOS, WILDCARD_SCENARIO, WildcardConfig } from '../services/caseService';
import { WildcardConfigModal } from '../components/investigation/WildcardConfigModal';

interface NewInvestigationPageProps {
  onStartCase: (scenarioId: string, wildcardConfig?: WildcardConfig) => void;
}

export const NewInvestigationPage: React.FC<NewInvestigationPageProps> = ({
  onStartCase,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleStart = () => {
    if (!selectedId) return;
    if (selectedId === WILDCARD_SCENARIO.id) {
      setIsConfigModalOpen(true);
      return;
    }
    onStartCase(selectedId);
  };

  const handleGenerateWildcard = (config: WildcardConfig) => {
    setIsConfigModalOpen(false);
    onStartCase(WILDCARD_SCENARIO.id, config);
  };

  const isWildcardSelected = selectedId === WILDCARD_SCENARIO.id;

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-300 ${
        isDark ? 'bg-[#080A0C] text-[#EDEAE3]' : 'bg-[#F6F4EE] text-[#1A1C1E]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-8 sm:px-10 pt-28 sm:pt-32 pb-24">
        {/* HEADER AREA */}
        <div className="mb-12 sm:mb-14">
          <span
            className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] block mb-2 select-none ${
              isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
            }`}
          >
            NEW INVESTIGATION
          </span>
          <p
            className={`font-sans text-sm sm:text-base font-normal leading-relaxed ${
              isDark ? 'text-[#EDEAE3]/65' : 'text-[#1A1C1E]/65'
            }`}
          >
            Select an investigation scenario to begin.
          </p>
        </div>

        {/* FOUR SCENARIO TIERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {SCENARIOS.map((scenario) => {
            const isSelected = selectedId === scenario.id;

            return (
              <div
                key={scenario.id}
                onClick={() => handleSelect(scenario.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(scenario.id);
                  }
                }}
                className={`rounded-lg border p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-[#6B9B85] ${
                  isSelected
                    ? isDark
                      ? 'border-[#74AC95]/50 bg-[#10151D] shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
                      : 'border-[#1E6147]/45 bg-[#FAF9F6] shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                    : isDark
                    ? 'border-white/[0.08] bg-[#0D1117] hover:border-white/[0.16] hover:bg-[#11161E]'
                    : 'border-black/[0.08] bg-white hover:border-black/[0.16] hover:bg-[#FAF8F5] shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
                }`}
              >
                <div>
                  {/* Top Row: Tier Label & Selection Marker */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className={`font-mono text-xs tracking-wider uppercase ${
                        isDark ? 'text-[#EDEAE3]/45' : 'text-[#1A1C1E]/45'
                      }`}
                    >
                      {scenario.tierLabel}
                    </span>

                    {/* Small restrained selection marker */}
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center transition-opacity duration-150 ${
                        isSelected ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isDark ? 'bg-[#74AC95]' : 'bg-[#1E6147]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Scenario Title */}
                  <h3
                    className={`font-sans text-lg sm:text-xl font-bold tracking-tight mb-2.5 leading-snug ${
                      isDark ? 'text-[#EDEAE3]' : 'text-[#1A1C1E]'
                    }`}
                  >
                    {scenario.title}
                  </h3>

                  {/* One-line Description */}
                  <p
                    className={`font-sans text-xs sm:text-sm leading-relaxed ${
                      isDark ? 'text-[#EDEAE3]/60' : 'text-[#1A1C1E]/65'
                    }`}
                  >
                    {scenario.description}
                  </p>
                </div>

                {/* Evidence Availability Indicator (quiet tracked text only) */}
                <div
                  className={`pt-6 mt-6 border-t ${
                    isDark ? 'border-white/[0.05]' : 'border-black/[0.05]'
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.14em] block ${
                      isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'
                    }`}
                  >
                    EVIDENCE {scenario.evidenceAvailability}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* WILDCARD SECTION */}
        <div className="mt-10 sm:mt-12">
          <span
            className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] block mb-3 select-none ${
              isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'
            }`}
          >
            WILDCARD
          </span>

          <div
            onClick={() => handleSelect(WILDCARD_SCENARIO.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelect(WILDCARD_SCENARIO.id);
              }
            }}
            className={`w-full rounded-lg border p-6 sm:p-7 transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-[#6B9B85] ${
              isWildcardSelected
                ? isDark
                  ? 'border-[#74AC95]/50 bg-[#10151D] shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
                  : 'border-[#1E6147]/45 bg-[#FAF9F6] shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                : isDark
                ? 'border-white/[0.08] bg-[#0D1117] hover:border-white/[0.16] hover:bg-[#11161E]'
                : 'border-black/[0.08] bg-white hover:border-black/[0.16] hover:bg-[#FAF8F5] shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {/* Abstract investigative mark: restrained crosshair */}
                <div
                  className={`p-2 rounded border mt-0.5 shrink-0 ${
                    isDark
                      ? 'border-white/[0.08] bg-white/[0.03] text-[#EDEAE3]/60'
                      : 'border-black/[0.08] bg-black/[0.03] text-[#1A1C1E]/60'
                  }`}
                >
                  <Crosshair className="w-4 h-4 stroke-[1.5]" />
                </div>

                <div>
                  <h3
                    className={`font-sans font-bold text-base sm:text-lg tracking-tight mb-1.5 leading-snug ${
                      isDark ? 'text-[#EDEAE3]' : 'text-[#1A1C1E]'
                    }`}
                  >
                    {WILDCARD_SCENARIO.title}
                  </h3>
                  <p
                    className={`font-sans text-xs sm:text-sm leading-relaxed ${
                      isDark ? 'text-[#EDEAE3]/60' : 'text-[#1A1C1E]/65'
                    }`}
                  >
                    {WILDCARD_SCENARIO.description}
                  </p>
                </div>
              </div>

              {/* Right: Restrained selection marker */}
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center transition-opacity duration-150 shrink-0 ${
                  isWildcardSelected ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isDark ? 'bg-[#74AC95]' : 'bg-[#1E6147]'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* START INVESTIGATION / CONFIGURE INCIDENT ACTION */}
        <div className="mt-10 sm:mt-12 flex items-center">
          {selectedId ? (
            <button
              onClick={handleStart}
              className={`px-7 py-3 rounded-full font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-2.5 transition-all duration-200 select-none shadow-sm cursor-pointer ${
                isDark
                  ? 'bg-[#D6C5B6] text-[#1A1C1E] hover:brightness-105 active:scale-[0.99]'
                  : 'bg-[#B6C7D6] text-[#1A1C1E] hover:brightness-105 active:scale-[0.99]'
              }`}
            >
              <span>{isWildcardSelected ? 'CONFIGURE INCIDENT' : 'START INVESTIGATION'}</span>
              <span className="font-sans text-sm">→</span>
            </button>
          ) : (
            <button
              disabled
              aria-disabled="true"
              className={`px-7 py-3 rounded-full font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-2.5 select-none cursor-not-allowed border ${
                isDark
                  ? 'border-white/[0.08] text-white/20 bg-transparent'
                  : 'border-black/[0.08] text-black/25 bg-transparent'
              }`}
            >
              <span>START INVESTIGATION</span>
              <span className="font-sans text-sm">→</span>
            </button>
          )}
        </div>

        {/* WILDCARD CONFIGURATION MODAL */}
        <WildcardConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onGenerate={handleGenerateWildcard}
        />
      </div>
    </div>
  );
};
