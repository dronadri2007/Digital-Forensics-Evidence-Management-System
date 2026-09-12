import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import {
  ChevronRight,
  Sparkles,
  Send,
  Video,
  Fingerprint,
  FileText,
  Activity,
  Car,
  Plus,
  Check,
  X,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  CaseInvestigationData,
  MockEvidencePickerItem,
  MOCK_EVIDENCE_PICKER_ITEMS,
} from '../../data/mockInvestigationData';
import { SuggestedNextSteps } from './SuggestedNextSteps';
import { SuggestionChipItem } from '../../data/investigationDiscoverySequence';

interface AegisAiPanelProps {
  caseData: CaseInvestigationData;
  suggestions?: SuggestionChipItem[];
  consumedActions?: string[];
  pendingActionId?: string | null;
  isCollapsed: boolean;
  isSolved: boolean;
  onToggleCollapse: () => void;
  onAddEvidence?: (item: MockEvidencePickerItem) => void;
  onSelectSuggestion?: (item: SuggestionChipItem) => void;
  onSubmitDispatch?: (text: string) => void;
}

export const AegisAiPanel: React.FC<AegisAiPanelProps> = ({
  caseData,
  suggestions = [],
  consumedActions = [],
  pendingActionId = null,
  isCollapsed,
  isSolved,
  onToggleCollapse,
  onAddEvidence,
  onSelectSuggestion,
  onSubmitDispatch,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [promptInput, setPromptInput] = useState('');
  const [localLogs, setLocalLogs] = useState(caseData.logs);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const [addedEvidenceIds, setAddedEvidenceIds] = useState<Set<string>>(() => {
    const initialSet = new Set<string>();
    for (const item of MOCK_EVIDENCE_PICKER_ITEMS) {
      if (caseData.nodes.some((n) => n.id === item.node.id)) {
        initialSet.add(item.id);
      }
    }
    return initialSet;
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Sync logs from caseData whenever caseData.logs updates
  useEffect(() => {
    setLocalLogs(caseData.logs);
  }, [caseData.logs]);

  // Auto-scroll feed on new log arrival
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTo({
        top: feedRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [localLogs]);

  // Close evidence picker on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        addBtnRef.current &&
        !addBtnRef.current.contains(e.target as Node)
      ) {
        setIsPickerOpen(false);
      }
    };

    if (isPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPickerOpen]);

  // Adjust textarea height on input changes
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = 'auto';
    const scrollH = el.scrollHeight;
    const MIN_H = 18; // 1 line height
    const MAX_H = 136; // ~7-8 lines of text

    if (scrollH > MAX_H) {
      el.style.height = `${MAX_H}px`;
      setIsScrollable(true);
    } else {
      el.style.height = `${Math.max(scrollH, MIN_H)}px`;
      setIsScrollable(false);
    }
  }, [promptInput]);

  const handleSendPrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = promptInput.trim();
    if (!trimmed) return;

    if (onSubmitDispatch) {
      onSubmitDispatch(trimmed);
    } else {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setLocalLogs((prev) => [
        ...prev,
        {
          timestamp: timeStr,
          label: 'USER DISPATCH',
          text: trimmed,
        },
      ]);
    }
    setPromptInput('');
  };

  const handleSuggestionClick = (item: SuggestionChipItem) => {
    if (onSelectSuggestion) {
      onSelectSuggestion(item);
    } else if (onSubmitDispatch) {
      onSubmitDispatch(item.label);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: allow newline insertion
        return;
      }
      // Enter alone: send message
      e.preventDefault();
      handleSendPrompt();
    }
  };

  const handleSelectEvidence = (item: MockEvidencePickerItem) => {
    if (addedEvidenceIds.has(item.id)) return;

    setAddedEvidenceIds((prev) => new Set([...prev, item.id]));
    onAddEvidence?.(item);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    setLocalLogs((prev) => [
      ...prev,
      {
        timestamp: timeStr,
        label: 'EVIDENCE INGEST',
        text: `Forensic item "${item.name}" registered to investigation cluster.`,
      },
    ]);
  };

  const renderItemIcon = (iconType: MockEvidencePickerItem['iconType']) => {
    switch (iconType) {
      case 'video':
        return <Video className="w-3.5 h-3.5" />;
      case 'image':
        return <Fingerprint className="w-3.5 h-3.5" />;
      case 'data':
        return <Activity className="w-3.5 h-3.5" />;
      case 'vehicle':
        return <Car className="w-3.5 h-3.5" />;
      case 'doc':
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
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

        </div>
      ) : (
        /* NORMAL INVESTIGATION MODE */
        <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
          
          {/* Scrollable Intelligence Feed with soft dissolving alpha mask */}
          <div
            ref={feedRef}
            className="flex-1 overflow-y-auto p-6 space-y-5 text-xs"
            style={{
              maskImage: 'linear-gradient(to bottom, black calc(100% - 48px), transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 48px), transparent 100%)',
            }}
          >
            <style>{`
              @keyframes log-enter-pulse-dark {
                0% {
                  opacity: 0;
                  transform: translateY(6px);
                  background-color: rgba(107, 155, 133, 0.28);
                }
                20% {
                  opacity: 1;
                  transform: translateY(0);
                  background-color: rgba(107, 155, 133, 0.22);
                }
                100% {
                  opacity: 1;
                  transform: translateY(0);
                  background-color: transparent;
                }
              }
              @keyframes log-enter-pulse-light {
                0% {
                  opacity: 0;
                  transform: translateY(6px);
                  background-color: rgba(30, 97, 71, 0.16);
                }
                20% {
                  opacity: 1;
                  transform: translateY(0);
                  background-color: rgba(30, 97, 71, 0.10);
                }
                100% {
                  opacity: 1;
                  transform: translateY(0);
                  background-color: transparent;
                }
              }
              .log-item-pulse-dark {
                animation: log-enter-pulse-dark 800ms ease-out both;
              }
              .log-item-pulse-light {
                animation: log-enter-pulse-light 800ms ease-out both;
              }
            `}</style>
            
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
                {localLogs.map((log, idx) => {
                  const isLatest = idx === localLogs.length - 1;
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 text-[11px] leading-relaxed p-1.5 -mx-1.5 rounded-lg transition-colors ${
                        isLatest
                          ? isDark
                            ? 'log-item-pulse-dark'
                            : 'log-item-pulse-light'
                          : ''
                      }`}
                    >
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
                  );
                })}
              </div>
            </div>

          </div>

          {/* Suggested Next Steps Strip (positioned between the Investigation Log and the composer) */}
          <SuggestedNextSteps
            suggestions={suggestions}
            consumedActions={consumedActions}
            pendingActionId={pendingActionId}
            onSelectSuggestion={handleSuggestionClick}
          />

          {/* Bottom Input Area: Floating card zone with soft fade transition above */}
          <div className="px-4 pb-4 pt-1 shrink-0 relative">
            {/* Fade gradient: Clean alpha mask dissolves the feed content without artificial dark overlays */}
            <form
              onSubmit={handleSendPrompt}
              className={`relative w-full rounded-[20px] border flex flex-col justify-between transition-all duration-150 ease-out focus-within:ring-1 focus-within:ring-[#6B9B85] backdrop-blur-md ${
                isDark
                  ? 'bg-white/[0.07] border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
                  : 'bg-white/90 border-black/[0.06] shadow-[0_4px_20px_rgba(60,40,80,0.06)]'
              }`}
            >
              {/* Growing Multi-line Textarea */}
              <div className="w-full px-3 sm:px-3.5 pt-3 pb-1">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask AEGIS..."
                  className={`w-full bg-transparent border-none outline-none text-xs font-sans p-0 focus:outline-none focus:ring-0 resize-none leading-[18px] transition-[height] duration-140 ease-out block ${
                    isDark
                      ? 'text-[#EDEAE3] placeholder-[#EDEAE3]/30'
                      : 'text-[#1A1C1E] placeholder-[#1A1C1E]/30'
                  }`}
                  style={{
                    height: '18px',
                    maxHeight: '136px',
                    overflowY: isScrollable ? 'auto' : 'hidden',
                  }}
                />
              </div>

              {/* Bottom Controls Row: Anchored at the bottom with breathing room */}
              <div className="flex items-center justify-between px-3 sm:px-3.5 pb-3 pt-2.5 relative">
                {/* "+ ADD EVIDENCE" Button & Popover Anchor */}
                <div className="relative">
                  <button
                    ref={addBtnRef}
                    type="button"
                    onClick={() => setIsPickerOpen((prev) => !prev)}
                    className="h-[26px] px-2.5 rounded-[8px] flex items-center gap-1.5 shrink-0 bg-[#B6C7D6] text-[#1A1C1E] hover:brightness-105 active:scale-[0.98] transition-all duration-150 select-none cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span className="font-mono text-[9px] uppercase tracking-wider font-semibold">
                      ADD EVIDENCE
                    </span>
                  </button>

                  {/* Mock Evidence Picker Popover */}
                  {isPickerOpen && (
                    <div
                      ref={pickerRef}
                      className="absolute bottom-full left-0 mb-2.5 z-50 w-[340px] sm:w-[350px] max-w-[calc(100vw-48px)] rounded-xl border overflow-hidden transition-all duration-200 select-none shadow-xl"
                      style={{
                        backgroundColor: isDark ? 'rgba(14, 18, 22, 0.94)' : 'rgba(250, 248, 243, 0.96)',
                        border: isDark ? '1px solid rgba(199, 216, 184, 0.22)' : '1px solid rgba(201, 184, 216, 0.40)',
                        boxShadow: isDark ? '0 16px 40px rgba(0, 0, 0, 0.55)' : '0 16px 40px rgba(60, 40, 80, 0.12)',
                        backdropFilter: 'blur(24px) saturate(120%)',
                        WebkitBackdropFilter: 'blur(24px) saturate(120%)',
                      }}
                    >
                      {/* Subtle Tint Layer matching AI Panel */}
                      <div
                        className="absolute inset-0 pointer-events-none rounded-xl z-0"
                        style={{
                          backgroundColor: isDark ? 'rgba(199, 216, 184, 0.08)' : 'rgba(201, 184, 216, 0.18)',
                        }}
                        aria-hidden="true"
                      />

                      {/* Popover Header */}
                      <div
                        className="relative z-10 px-3.5 py-2.5 flex items-center justify-between shrink-0"
                        style={{
                          borderBottom: isDark ? '1px solid rgba(199, 216, 184, 0.12)' : '1px solid rgba(201, 184, 216, 0.22)',
                        }}
                      >
                        <span
                          className={`font-mono text-[9px] uppercase tracking-[0.16em] font-medium ${
                            isDark ? 'text-[#EDEAE3]/50' : 'text-[#1A1C1E]/50'
                          }`}
                        >
                          SELECT EVIDENCE TO ADD
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsPickerOpen(false)}
                          className={`p-1 rounded transition-opacity cursor-pointer ${
                            isDark ? 'text-[#EDEAE3]/45 hover:text-[#EDEAE3]' : 'text-[#1A1C1E]/45 hover:text-[#1A1C1E]'
                          }`}
                          aria-label="Close evidence picker"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Evidence Item List (Max 6, no scroll) */}
                      <div className="relative z-10 p-1.5 space-y-0.5">
                        {MOCK_EVIDENCE_PICKER_ITEMS.map((item) => {
                          const isAdded = addedEvidenceIds.has(item.id);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              disabled={isAdded}
                              onClick={() => handleSelectEvidence(item)}
                              className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-3 transition-colors group ${
                                isAdded
                                  ? 'opacity-65 cursor-default'
                                  : isDark
                                  ? 'hover:bg-white/[0.06] cursor-pointer'
                                  : 'hover:bg-black/[0.05] cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`p-1.5 rounded shrink-0 border ${
                                    isDark
                                      ? 'border-white/[0.08] bg-white/[0.04] text-[#EDEAE3]/70'
                                      : 'border-black/[0.08] bg-black/[0.04] text-[#1A1C1E]/70'
                                  }`}
                                >
                                  {renderItemIcon(item.iconType)}
                                </div>
                                <div className="min-w-0">
                                  <div
                                    className={`font-sans text-xs font-medium truncate leading-tight ${
                                      isDark ? 'text-[#EDEAE3]' : 'text-[#1A1C1E]'
                                    }`}
                                  >
                                    {item.name}
                                  </div>
                                  <div
                                    className={`font-mono text-[9.5px] leading-tight mt-0.5 ${
                                      isDark ? 'text-[#EDEAE3]/45' : 'text-[#1A1C1E]/45'
                                    }`}
                                  >
                                    {item.meta}
                                  </div>
                                </div>
                              </div>

                              {/* Right Add Affordance / Checkmark */}
                              <div className="shrink-0 flex items-center justify-center">
                                {isAdded ? (
                                  <div className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-[#74AC95]">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>ADDED</span>
                                  </div>
                                ) : (
                                  <div
                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                      isDark
                                        ? 'border-white/[0.12] bg-white/[0.03] text-[#EDEAE3]/60 group-hover:border-[#74AC95]/50 group-hover:text-[#74AC95]'
                                        : 'border-black/[0.12] bg-black/[0.03] text-[#1A1C1E]/60 group-hover:border-[#1E6147]/50 group-hover:text-[#1E6147]'
                                    }`}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!promptInput.trim()}
                  className="p-1 rounded text-[#6B9B85] disabled:opacity-30 transition-opacity hover:opacity-100 focus:outline-none shrink-0 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Send query"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

        </div>
      )}
    </div>
  );
};
