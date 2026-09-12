import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  WildcardConfig,
  MotiveArchetype,
  EvidenceScarcity,
  SceneType,
  TemporalWindow,
  MOTIVE_OPTIONS,
  EVIDENCE_SCARCITY_OPTIONS,
  SCENE_TYPE_OPTIONS,
  TEMPORAL_WINDOW_OPTIONS,
} from '../../services/caseService';

interface WildcardConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: WildcardConfig) => void;
}

export const WildcardConfigModal: React.FC<WildcardConfigModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [incidentMode, setIncidentMode] = useState<'Random' | 'Custom'>('Random');
  const [motive, setMotive] = useState<MotiveArchetype>('Financial Dispute');
  const [scarcity, setScarcity] = useState<EvidenceScarcity>('Tier 2 — Medium Evidence');
  const [scene, setScene] = useState<SceneType>('Industrial / Port');
  const [timeWindow, setTimeWindow] = useState<TemporalWindow>('Late Night (22:00 – 04:00)');

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isRandom = incidentMode === 'Random';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      incidentMode,
      motiveArchetype: motive,
      evidenceScarcity: scarcity,
      sceneType: scene,
      temporalWindow: timeWindow,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 transition-opacity duration-200 ${
          isDark ? 'bg-black/75 backdrop-blur-sm' : 'bg-black/45 backdrop-blur-sm'
        }`}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wildcard-modal-title"
        className={`relative w-full max-w-[540px] rounded-[14px] border p-6 sm:p-8 z-10 transition-all duration-300 ${
          isDark
            ? 'bg-[#0E1216]/95 border-white/[0.12] text-[#EDEAE3] shadow-[0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl'
            : 'bg-[#FAF8F5] border-black/[0.12] text-[#1A1C1E] shadow-[0_24px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <span
              className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] block mb-1.5 select-none ${
                isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
              }`}
            >
              WILDCARD INCIDENT
            </span>
            <h2
              id="wildcard-modal-title"
              className="font-sans font-bold text-xl sm:text-2xl tracking-tight leading-snug"
            >
              Generate Synthetic Incident
            </h2>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-md transition-colors duration-150 focus:outline-none ${
              isDark
                ? 'text-[#EDEAE3]/40 hover:text-[#EDEAE3] hover:bg-white/[0.05]'
                : 'text-[#1A1C1E]/40 hover:text-[#1A1C1E] hover:bg-black/[0.05]'
            }`}
            aria-label="Close configuration modal"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 sm:space-y-4.5">
            {/* Field 1: INCIDENT MODE */}
            <div>
              <label
                htmlFor="incident-mode"
                className={`font-mono text-[11px] font-medium uppercase tracking-[0.16em] block mb-1.5 ${
                  isDark ? 'text-[#EDEAE3]/65' : 'text-[#1A1C1E]/70'
                }`}
              >
                INCIDENT MODE
              </label>
              <div className="relative">
                <select
                  id="incident-mode"
                  value={incidentMode}
                  onChange={(e) => setIncidentMode(e.target.value as 'Random' | 'Custom')}
                  className={`w-full h-11 px-3.5 pr-10 rounded-lg border font-sans text-xs sm:text-sm appearance-none outline-none transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#12161F] border-white/[0.10] text-[#EDEAE3] focus:border-[#74AC95]/60'
                      : 'bg-white border-black/[0.12] text-[#1A1C1E] focus:border-[#1E6147]/60'
                  }`}
                >
                  <option value="Random">Random (Recommended) — system chooses all parameters</option>
                  <option value="Custom">Custom Parameters — user specifies each</option>
                </select>
                <ChevronDown
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-opacity ${
                    isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'
                  }`}
                />
              </div>
            </div>

            {/* Field 2: MOTIVE ARCHETYPE */}
            <div className={`transition-opacity duration-200 ${isRandom ? 'opacity-35 pointer-events-none' : 'opacity-100'}`}>
              <label
                htmlFor="motive-archetype"
                className={`font-mono text-[11px] font-medium uppercase tracking-[0.16em] block mb-1.5 ${
                  isDark ? 'text-[#EDEAE3]/65' : 'text-[#1A1C1E]/70'
                }`}
              >
                MOTIVE ARCHETYPE
              </label>
              <div className="relative">
                <select
                  id="motive-archetype"
                  disabled={isRandom}
                  value={motive}
                  onChange={(e) => setMotive(e.target.value as MotiveArchetype)}
                  className={`w-full h-11 px-3.5 pr-10 rounded-lg border font-sans text-xs sm:text-sm appearance-none outline-none transition-colors ${
                    isRandom
                      ? isDark
                        ? 'bg-[#12161F]/40 border-white/[0.05] text-[#EDEAE3]/40 cursor-not-allowed'
                        : 'bg-[#F2EFEB] border-black/[0.05] text-[#1A1C1E]/40 cursor-not-allowed'
                      : isDark
                      ? 'bg-[#12161F] border-white/[0.10] text-[#EDEAE3] focus:border-[#74AC95]/60 cursor-pointer'
                      : 'bg-white border-black/[0.12] text-[#1A1C1E] focus:border-[#1E6147]/60 cursor-pointer'
                  }`}
                >
                  {MOTIVE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-opacity ${
                    isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'
                  }`}
                />
              </div>
            </div>

            {/* Field 3: EVIDENCE SCARCITY */}
            <div className={`transition-opacity duration-200 ${isRandom ? 'opacity-35 pointer-events-none' : 'opacity-100'}`}>
              <label
                htmlFor="evidence-scarcity"
                className={`font-mono text-[11px] font-medium uppercase tracking-[0.16em] block mb-1.5 ${
                  isDark ? 'text-[#EDEAE3]/65' : 'text-[#1A1C1E]/70'
                }`}
              >
                EVIDENCE SCARCITY
              </label>
              <div className="relative">
                <select
                  id="evidence-scarcity"
                  disabled={isRandom}
                  value={scarcity}
                  onChange={(e) => setScarcity(e.target.value as EvidenceScarcity)}
                  className={`w-full h-11 px-3.5 pr-10 rounded-lg border font-sans text-xs sm:text-sm appearance-none outline-none transition-colors ${
                    isRandom
                      ? isDark
                        ? 'bg-[#12161F]/40 border-white/[0.05] text-[#EDEAE3]/40 cursor-not-allowed'
                        : 'bg-[#F2EFEB] border-black/[0.05] text-[#1A1C1E]/40 cursor-not-allowed'
                      : isDark
                      ? 'bg-[#12161F] border-white/[0.10] text-[#EDEAE3] focus:border-[#74AC95]/60 cursor-pointer'
                      : 'bg-white border-black/[0.12] text-[#1A1C1E] focus:border-[#1E6147]/60 cursor-pointer'
                  }`}
                >
                  {EVIDENCE_SCARCITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-opacity ${
                    isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'
                  }`}
                />
              </div>
            </div>

            {/* Field 4: SCENE TYPE */}
            <div className={`transition-opacity duration-200 ${isRandom ? 'opacity-35 pointer-events-none' : 'opacity-100'}`}>
              <label
                htmlFor="scene-type"
                className={`font-mono text-[11px] font-medium uppercase tracking-[0.16em] block mb-1.5 ${
                  isDark ? 'text-[#EDEAE3]/65' : 'text-[#1A1C1E]/70'
                }`}
              >
                SCENE TYPE
              </label>
              <div className="relative">
                <select
                  id="scene-type"
                  disabled={isRandom}
                  value={scene}
                  onChange={(e) => setScene(e.target.value as SceneType)}
                  className={`w-full h-11 px-3.5 pr-10 rounded-lg border font-sans text-xs sm:text-sm appearance-none outline-none transition-colors ${
                    isRandom
                      ? isDark
                        ? 'bg-[#12161F]/40 border-white/[0.05] text-[#EDEAE3]/40 cursor-not-allowed'
                        : 'bg-[#F2EFEB] border-black/[0.05] text-[#1A1C1E]/40 cursor-not-allowed'
                      : isDark
                      ? 'bg-[#12161F] border-white/[0.10] text-[#EDEAE3] focus:border-[#74AC95]/60 cursor-pointer'
                      : 'bg-white border-black/[0.12] text-[#1A1C1E] focus:border-[#1E6147]/60 cursor-pointer'
                  }`}
                >
                  {SCENE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-opacity ${
                    isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'
                  }`}
                />
              </div>
            </div>

            {/* Field 5: TEMPORAL WINDOW */}
            <div className={`transition-opacity duration-200 ${isRandom ? 'opacity-35 pointer-events-none' : 'opacity-100'}`}>
              <label
                htmlFor="temporal-window"
                className={`font-mono text-[11px] font-medium uppercase tracking-[0.16em] block mb-1.5 ${
                  isDark ? 'text-[#EDEAE3]/65' : 'text-[#1A1C1E]/70'
                }`}
              >
                TEMPORAL WINDOW
              </label>
              <div className="relative">
                <select
                  id="temporal-window"
                  disabled={isRandom}
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value as TemporalWindow)}
                  className={`w-full h-11 px-3.5 pr-10 rounded-lg border font-sans text-xs sm:text-sm appearance-none outline-none transition-colors ${
                    isRandom
                      ? isDark
                        ? 'bg-[#12161F]/40 border-white/[0.05] text-[#EDEAE3]/40 cursor-not-allowed'
                        : 'bg-[#F2EFEB] border-black/[0.05] text-[#1A1C1E]/40 cursor-not-allowed'
                      : isDark
                      ? 'bg-[#12161F] border-white/[0.10] text-[#EDEAE3] focus:border-[#74AC95]/60 cursor-pointer'
                      : 'bg-white border-black/[0.12] text-[#1A1C1E] focus:border-[#1E6147]/60 cursor-pointer'
                  }`}
                >
                  {TEMPORAL_WINDOW_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-opacity ${
                    isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            className={`pt-6 mt-6 border-t flex items-center justify-between gap-3 ${
              isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
            }`}
          >
            {/* Left: CANCEL */}
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider font-semibold border transition-all duration-150 cursor-pointer focus:outline-none ${
                isDark
                  ? 'border-white/[0.14] text-[#EDEAE3]/75 hover:text-[#EDEAE3] hover:border-white/30 bg-transparent'
                  : 'border-black/[0.14] text-[#1A1C1E]/75 hover:text-[#1A1C1E] hover:border-black/30 bg-transparent'
              }`}
            >
              CANCEL
            </button>

            {/* Right: GENERATE INCIDENT → */}
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-2 transition-all duration-200 select-none shadow-sm cursor-pointer focus:outline-none ${
                isDark
                  ? 'bg-[#D6C5B6] text-[#1A1C1E] hover:brightness-105 active:scale-[0.99]'
                  : 'bg-[#B6C7D6] text-[#1A1C1E] hover:brightness-105 active:scale-[0.99]'
              }`}
            >
              <span>GENERATE INCIDENT</span>
              <span className="font-sans text-sm">→</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
