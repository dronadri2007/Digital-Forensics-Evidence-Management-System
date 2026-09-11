import React, { useState } from 'react';
import { ChevronRight, Sparkles, Send, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { CaseInvestigationData } from '../../data/mockInvestigationData';

interface AegisAiPanelProps {
  caseData: CaseInvestigationData;
  isCollapsed: boolean;
  isSolved: boolean;
  onToggleCollapse: () => void;
  onReturnToActive: () => void;
}

export const AegisAiPanel: React.FC<AegisAiPanelProps> = ({
  caseData,
  isCollapsed,
  isSolved,
  onToggleCollapse,
  onReturnToActive,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [promptInput, setPromptInput] = useState('');
  const [localLogs, setLocalLogs] = useState(caseData.logs);

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    setLocalLogs((prev) => [
      ...prev,
      {
        timestamp: timeStr,
        label: 'QUERY RESULT',
        text: `Correlated inquiry: "${promptInput.trim()}" matched against primary evidence cluster.`,
      },
    ]);
    setPromptInput('');
  };

  // COLLAPSED STATE: Floating Pill (180x48px) at bottom right
  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className={`absolute bottom-6 right-6 z-30 w-[180px] h-12 rounded-full border flex items-center justify-between px-4 transition-all duration-300 backdrop-blur-[20px] shadow-xl group focus:outline-none select-none ${
          isDark
            ? 'bg-[rgba(14,18,22,0.85)] border-white/[0.10] text-[#EDEAE3] hover:border-white/[0.22] hover:bg-[rgba(20,26,32,0.95)]'
            : 'bg-[rgba(250,248,243,0.92)] border-black/[0.08] text-[#1A1C1E] hover:border-black/[0.18] hover:bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)]'
        }`}
        title="Expand AEGIS AI Panel"
      >
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#6B9B85] transition-transform group-hover:rotate-12 duration-200" />
          <span className="font-sans font-bold text-xs uppercase tracking-widest">
            AEGIS AI
          </span>
        </div>
        <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
      </button>
    );
  }

  // EXPANDED STATE: Floating Frosted Glass Card (~46% width)
  return (
    <div
      className={`absolute top-6 bottom-6 right-6 z-30 w-[46%] max-w-[580px] min-w-[380px] rounded-2xl flex flex-col overflow-hidden transition-all duration-300 select-none ${
        isDark ? 'text-[#EDEAE3]' : 'text-[#1A1C1E]'
      }`}
      style={{
        backgroundColor: isDark ? 'rgba(14, 18, 22, 0.68)' : 'rgba(250, 248, 243, 0.72)',
        border: isDark ? '1px solid rgba(199, 216, 184, 0.18)' : '1px solid rgba(201, 184, 216, 0.35)',
        boxShadow: isDark ? '0 20px 60px rgba(0, 0, 0, 0.4)' : '0 20px 60px rgba(60, 40, 80, 0.08)',
        backdropFilter: 'blur(24px) saturate(120%)',
        WebkitBackdropFilter: 'blur(24px) saturate(120%)',
      }}
    >
      {/* Exact Tint Layer: #C7D8B8 @ 14% (dark) / #C9B8D8 @ 28% (light) */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-300 z-0"
        style={{
          backgroundColor: isDark ? 'rgba(199, 216, 184, 0.14)' : 'rgba(201, 184, 216, 0.28)',
        }}
        aria-hidden="true"
      />

      {/* Top Header Strip */}
      <div
        className="relative z-10 px-6 py-4 flex items-center justify-between shrink-0"
        style={{
          borderBottom: isDark ? '1px solid rgba(199, 216, 184, 0.12)' : '1px solid rgba(201, 184, 216, 0.22)',
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="font-sans font-bold text-sm tracking-tight">AEGIS</span>
            {isSolved && (
              <span className="font-mono text-[9px] tracking-widest px-2 py-0.5 rounded uppercase bg-[#6B9B85]/15 text-[#6B9B85] border border-[#6B9B85]/20">
                RESOLUTION
              </span>
            )}
          </div>
          <span
            className={`font-mono text-[9px] uppercase tracking-[0.20em] block mt-0.5 ${
              isDark ? 'text-[#EDEAE3]/45' : 'text-[#1A1C1E]/45'
            }`}
          >
            INVESTIGATION ASSISTANT
          </span>
        </div>

        {/* Collapse button */}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-md transition-colors duration-150 focus:outline-none ${
            isDark
              ? 'text-[#EDEAE3]/60 hover:text-white hover:bg-white/[0.06]'
              : 'text-[#1A1C1E]/60 hover:text-black hover:bg-black/[0.05]'
          }`}
          title="Collapse Panel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Body: Normal Investigation Mode vs Resolution Mode */}
      {isSolved ? (
        /* RESOLUTION STATE CONTENT */
        <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          
          {/* FINAL CONCLUSION */}
          <div>
            <span
              className={`font-mono text-[10px] uppercase tracking-[0.18em] block mb-2 font-semibold ${
                isDark ? 'text-[#6B9B85]' : 'text-[#1E6147]'
              }`}
            >
              FINAL CONCLUSION
            </span>
            <p className="font-sans text-[13px] leading-relaxed font-normal opacity-90">
              {caseData.resolution.finalConclusion}
            </p>
          </div>

          <div className={`h-px w-full ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`} />

          {/* PRIME SUSPECT */}
          <div>
            <span
              className={`font-mono text-[10px] uppercase tracking-[0.18em] block mb-2 ${
                isDark ? 'text-[#EDEAE3]/45' : 'text-[#1A1C1E]/45'
              }`}
            >
              PRIME SUSPECT
            </span>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-sans font-bold text-base tracking-tight text-[#C85A5A]">
                  {caseData.resolution.primeSuspect.name}
                </span>
                <span
                  className={`block text-[11px] font-sans mt-0.5 ${
                    isDark ? 'text-[#EDEAE3]/60' : 'text-[#1A1C1E]/60'
                  }`}
                >
                  {caseData.resolution.primeSuspect.role}
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-[#C85A5A]">
                {caseData.resolution.primeSuspect.confidence}% CONFIDENCE
              </span>
            </div>
          </div>

          <div className={`h-px w-full ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`} />

          {/* KEY SUPPORTING EVIDENCE */}
          <div>
            <span
              className={`font-mono text-[10px] uppercase tracking-[0.18em] block mb-2.5 ${
                isDark ? 'text-[#EDEAE3]/45' : 'text-[#1A1C1E]/45'
              }`}
            >
              KEY SUPPORTING EVIDENCE
            </span>
            <ul className="space-y-2">
              {caseData.resolution.keyEvidence.map((ev, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-[11.5px] leading-relaxed">
                  <span className="text-[#6B9B85] font-mono select-none">›</span>
                  <span className="opacity-85">{ev}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`h-px w-full ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`} />

          {/* KEY CONTRADICTIONS */}
          <div>
            <span
              className={`font-mono text-[10px] uppercase tracking-[0.18em] block mb-2.5 ${
                isDark ? 'text-[#EDEAE3]/45' : 'text-[#1A1C1E]/45'
              }`}
            >
              KEY CONTRADICTIONS
            </span>
            <ul className="space-y-2">
              {caseData.resolution.keyContradictions.map((ct, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-[11.5px] leading-relaxed text-[#C85A5A]">
                  <span className="font-mono select-none">✕</span>
                  <span className="opacity-90">{ct}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Return Action */}
          <div className="pt-4">
            <button
              onClick={onReturnToActive}
              className={`w-full py-2.5 px-4 rounded-lg font-mono text-xs uppercase tracking-wider font-medium border flex items-center justify-center gap-2 transition-colors duration-200 ${
                isDark
                  ? 'border-white/10 bg-white/[0.04] text-[#EDEAE3] hover:bg-white/[0.08]'
                  : 'border-black/10 bg-black/[0.03] text-[#1A1C1E] hover:bg-black/[0.06]'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Active Investigation</span>
            </button>
          </div>

        </div>
      ) : (
        /* NORMAL INVESTIGATION MODE */
        <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
          
          {/* Scrollable Intelligence Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            
            {/* CURRENT OBJECTIVE */}
            <div>
              <span
                className={`font-mono text-[9.5px] uppercase tracking-[0.18em] block mb-1.5 ${
                  isDark ? 'text-[#EDEAE3]/45' : 'text-[#1A1C1E]/45'
                }`}
              >
                CURRENT OBJECTIVE
              </span>
              <p className="font-sans text-xs sm:text-[13px] font-medium leading-snug">
                {caseData.objective}
              </p>
            </div>

            <div className={`h-px w-full ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`} />

            {/* LATEST FINDING */}
            <div>
              <span
                className={`font-mono text-[9.5px] uppercase tracking-[0.18em] block mb-1.5 ${
                  isDark ? 'text-[#EDEAE3]/45' : 'text-[#1A1C1E]/45'
                }`}
              >
                LATEST FINDING
              </span>
              <p
                className={`font-sans text-xs leading-relaxed ${
                  isDark ? 'text-[#EDEAE3]/80' : 'text-[#1A1C1E]/80'
                }`}
              >
                {caseData.latestFinding}
              </p>
            </div>

            <div className={`h-px w-full ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`} />

            {/* CONFIDENCE */}
            <div className="flex items-center justify-between">
              <span
                className={`font-mono text-[9.5px] uppercase tracking-[0.18em] ${
                  isDark ? 'text-[#EDEAE3]/45' : 'text-[#1A1C1E]/45'
                }`}
              >
                SYSTEM CONFIDENCE
              </span>
              <span className="font-mono text-sm font-bold tracking-wider text-[#6B9B85]">
                {caseData.confidence}%
              </span>
            </div>

            <div className={`h-px w-full ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`} />

            {/* NEXT LEAD */}
            <div>
              <span
                className={`font-mono text-[9.5px] uppercase tracking-[0.18em] block mb-1.5 ${
                  isDark ? 'text-[#EDEAE3]/45' : 'text-[#1A1C1E]/45'
                }`}
              >
                NEXT LEAD
              </span>
              <p className="font-sans text-xs leading-snug font-medium text-[#C8955A]">
                {caseData.nextLead}
              </p>
            </div>

            <div className={`h-px w-full ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`} />

            {/* INVESTIGATION LOG */}
            <div>
              <span
                className={`font-mono text-[9.5px] uppercase tracking-[0.18em] block mb-3 ${
                  isDark ? 'text-[#EDEAE3]/45' : 'text-[#1A1C1E]/45'
                }`}
              >
                INVESTIGATION LOG
              </span>

              <div className="space-y-3">
                {localLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-[11px] leading-relaxed">
                    <span className="font-mono text-[10px] opacity-40 shrink-0 select-none pt-0.5">
                      {log.timestamp}
                    </span>
                    <span
                      className={`font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 select-none ${
                        isDark ? 'bg-white/[0.05] text-[#74AC95]' : 'bg-black/[0.05] text-[#1E6147]'
                      }`}
                    >
                      {log.label}
                    </span>
                    <span className="font-sans opacity-85">{log.text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Input Area */}
          <div
            className="p-4 shrink-0"
            style={{
              borderTop: isDark ? '1px solid rgba(199, 216, 184, 0.12)' : '1px solid rgba(201, 184, 216, 0.22)',
            }}
          >
            <form
              onSubmit={handleSendPrompt}
              className={`w-full h-10 px-2 rounded-lg border flex items-center gap-2 transition-colors focus-within:ring-1 focus-within:ring-[#6B9B85] ${
                isDark
                  ? 'bg-black/30 border-white/[0.08]'
                  : 'bg-white border-black/[0.08] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]'
              }`}
            >
              {/* Boxed "+ ADD EVIDENCE" control on the left */}
              <button
                type="button"
                className={`h-[24px] px-2 rounded-[6px] border flex items-center justify-center shrink-0 transition-colors select-none ${
                  isDark
                    ? 'border-white/[0.10] text-[#EDEAE3]/45 hover:bg-white/[0.06] hover:text-[#EDEAE3]/75'
                    : 'border-black/[0.10] text-[#1A1C1E]/45 hover:bg-black/[0.04] hover:text-[#1A1C1E]/75'
                }`}
              >
                <span className="font-mono text-[9px] uppercase tracking-wider">
                  + ADD EVIDENCE
                </span>
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Ask AEGIS..."
                className={`flex-1 h-full bg-transparent border-none outline-none text-xs font-sans px-1 focus:outline-none focus:ring-0 ${
                  isDark
                    ? 'text-[#EDEAE3] placeholder-[#EDEAE3]/30'
                    : 'text-[#1A1C1E] placeholder-[#1A1C1E]/30'
                }`}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!promptInput.trim()}
                className="p-1.5 rounded text-[#6B9B85] disabled:opacity-30 transition-opacity hover:opacity-100 focus:outline-none shrink-0"
                aria-label="Send query"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
};
