import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Dices } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  WildcardConfig,
  MotiveArchetype,
  EvidenceScarcity,
  SceneType,
  SuspectVictimRelationship,
  MethodComplexity,
  MOTIVE_OPTIONS,
  EVIDENCE_SCARCITY_OPTIONS,
  SCENE_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
  METHOD_COMPLEXITY_OPTIONS,
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
  const [motive, setMotive] = useState<MotiveArchetype>('Corporate Cover-up');
  const [scarcity, setScarcity] = useState<EvidenceScarcity>('Tier 2 — Medium Evidence');
  const [scene, setScene] = useState<SceneType>('Commercial');
  const [relationship, setRelationship] = useState<SuspectVictimRelationship>('Colleague');
  const [complexity, setComplexity] = useState<MethodComplexity>('Planned');
  const [isRolling, setIsRolling] = useState<boolean>(false);

  const [rollingFields, setRollingFields] = useState<{
    motive: boolean;
    scarcity: boolean;
    scene: boolean;
    relationship: boolean;
    complexity: boolean;
  }>({
    motive: false,
    scarcity: false,
    scene: false,
    relationship: false,
    complexity: false,
  });

  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    };
  }, []);

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

  const getRandomItem = <T,>(arr: readonly T[], current?: T): T => {
    if (arr.length <= 1) return arr[0];
    let picked = arr[Math.floor(Math.random() * arr.length)];
    let attempts = 0;
    while (picked === current && attempts < 10) {
      picked = arr[Math.floor(Math.random() * arr.length)];
      attempts++;
    }
    return picked;
  };

  const handleDiceRoll = () => {
    if (isRolling) return;
    setIsRolling(true);
    setRollingFields({
      motive: true,
      scarcity: true,
      scene: true,
      relationship: true,
      complexity: true,
    });

    // Pick final target values guaranteeing variance from current
    const finalMotive = getRandomItem(MOTIVE_OPTIONS, motive);
    const finalScarcity = getRandomItem(EVIDENCE_SCARCITY_OPTIONS, scarcity);
    const finalScene = getRandomItem(SCENE_TYPE_OPTIONS, scene);
    const finalRelationship = getRandomItem(RELATIONSHIP_OPTIONS, relationship);
    const finalComplexity = getRandomItem(METHOD_COMPLEXITY_OPTIONS, complexity);

    const startTime = Date.now();
    const duration = 720; // 720ms total cascade for readable roll

    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);

    rollIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;

      // Field 2: Motive settles at ~320ms
      if (elapsed < 320) {
        setMotive(MOTIVE_OPTIONS[Math.floor(Math.random() * MOTIVE_OPTIONS.length)]);
      } else {
        setMotive(finalMotive);
        setRollingFields((prev) => (prev.motive ? { ...prev, motive: false } : prev));
      }

      // Field 3: Scarcity settles at ~420ms
      if (elapsed < 420) {
        setScarcity(EVIDENCE_SCARCITY_OPTIONS[Math.floor(Math.random() * EVIDENCE_SCARCITY_OPTIONS.length)]);
      } else {
        setScarcity(finalScarcity);
        setRollingFields((prev) => (prev.scarcity ? { ...prev, scarcity: false } : prev));
      }

      // Field 4: Scene settles at ~520ms
      if (elapsed < 520) {
        setScene(SCENE_TYPE_OPTIONS[Math.floor(Math.random() * SCENE_TYPE_OPTIONS.length)]);
      } else {
        setScene(finalScene);
        setRollingFields((prev) => (prev.scene ? { ...prev, scene: false } : prev));
      }

      // Field 5: Relationship settles at ~620ms
      if (elapsed < 620) {
        setRelationship(RELATIONSHIP_OPTIONS[Math.floor(Math.random() * RELATIONSHIP_OPTIONS.length)]);
      } else {
        setRelationship(finalRelationship);
        setRollingFields((prev) => (prev.relationship ? { ...prev, relationship: false } : prev));
      }

      // Field 6: Complexity settles at ~720ms
      if (elapsed < 720) {
        setComplexity(METHOD_COMPLEXITY_OPTIONS[Math.floor(Math.random() * METHOD_COMPLEXITY_OPTIONS.length)]);
      } else {
        setComplexity(finalComplexity);
        setRollingFields((prev) => (prev.complexity ? { ...prev, complexity: false } : prev));
      }

      if (elapsed >= duration) {
        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
        setMotive(finalMotive);
        setScarcity(finalScarcity);
        setScene(finalScene);
        setRelationship(finalRelationship);
        setComplexity(finalComplexity);
        setRollingFields({
          motive: false,
          scarcity: false,
          scene: false,
          relationship: false,
          complexity: false,
        });
        setIsRolling(false);
      }
    }, 65);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      incidentMode,
      motiveArchetype: motive,
      evidenceScarcity: scarcity,
      sceneType: scene,
      relationship,
      methodComplexity: complexity,
    });
  };

  // Helper for field styling
  const getFieldClass = (isFieldRolling: boolean) => {
    if (isRandom) {
      if (isFieldRolling) {
        return isDark
          ? 'bg-[#12161F] border-[#74AC95]/50 shadow-sm cursor-default'
          : 'bg-white border-[#1E6147]/50 shadow-sm cursor-default';
      }
      return isDark
        ? 'bg-[#12161F]/90 border-white/[0.08] cursor-default'
        : 'bg-[#FAF8F5] border-black/[0.10] cursor-default';
    }
    // Active Custom state
    return isDark
      ? 'bg-[#12161F] border-white/[0.10] text-[#EDEAE3] focus:border-[#74AC95]/60 cursor-pointer'
      : 'bg-white border-black/[0.12] text-[#1A1C1E] focus:border-[#1E6147]/60 cursor-pointer';
  };

  // Inline style override to guarantee Chromium never washes out disabled text
  const getFieldStyle = (isFieldRolling: boolean): React.CSSProperties | undefined => {
    if (!isRandom) return undefined;
    if (isFieldRolling) {
      return {
        opacity: 1,
        color: isDark ? 'rgba(237, 234, 227, 0.95)' : 'rgba(26, 28, 30, 0.95)',
        WebkitTextFillColor: isDark ? 'rgba(237, 234, 227, 0.95)' : 'rgba(26, 28, 30, 0.95)',
      };
    }
    return {
      opacity: 1,
      color: isDark ? 'rgba(237, 234, 227, 0.65)' : 'rgba(26, 28, 30, 0.65)',
      WebkitTextFillColor: isDark ? 'rgba(237, 234, 227, 0.65)' : 'rgba(26, 28, 30, 0.65)',
    };
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
        className={`relative w-full max-w-[540px] max-h-[90vh] flex flex-col rounded-[14px] border p-6 sm:p-7 z-10 transition-all duration-300 ${
          isDark
            ? 'bg-[#0E1216]/95 border-white/[0.12] text-[#EDEAE3] shadow-[0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl'
            : 'bg-[#FAF8F5] border-black/[0.12] text-[#1A1C1E] shadow-[0_24px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5 shrink-0">
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-0.5 space-y-3.5">
          {/* Field 1: INCIDENT MODE + Top Dice Button */}
          <div>
            <label
              htmlFor="incident-mode"
              className={`font-mono text-[11px] font-medium uppercase tracking-[0.16em] block mb-1.5 ${
                isDark ? 'text-[#EDEAE3]/70' : 'text-[#1A1C1E]/75'
              }`}
            >
              INCIDENT MODE
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  id="incident-mode"
                  value={incidentMode}
                  onChange={(e) => setIncidentMode(e.target.value as 'Random' | 'Custom')}
                  className={`w-full h-10 sm:h-10.5 px-3.5 pr-10 rounded-lg border font-sans text-xs sm:text-sm appearance-none outline-none transition-colors cursor-pointer ${
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

              {/* Top Dice Roll Button: ~36x36px */}
              <button
                type="button"
                onClick={handleDiceRoll}
                disabled={isRolling}
                title="Shuffle random parameters"
                aria-label="Shuffle random parameters"
                className={`w-9 h-9 sm:w-[38px] sm:h-[38px] rounded-lg border flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer focus:outline-none ${
                  isRolling
                    ? isDark
                      ? 'bg-[#12161F] border-[#74AC95]/50 text-[#74AC95]'
                      : 'bg-white border-[#1E6147]/50 text-[#1E6147]'
                    : isDark
                    ? 'bg-[#12161F] border-white/[0.10] text-[#EDEAE3]/55 hover:text-[#EDEAE3] hover:border-white/25 active:scale-95'
                    : 'bg-white border-black/[0.12] text-[#1A1C1E]/55 hover:text-[#1A1C1E] hover:border-black/25 active:scale-95'
                }`}
              >
                <Dices className={`w-[18px] h-[18px] transition-transform duration-500 ${isRolling ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Fields 2-6 Group: Legible Muted State in Random Mode with Standard Chevrons */}
          <div className="space-y-3.5">
            {/* Field 2: MOTIVE ARCHETYPE */}
            <div>
              <label
                htmlFor="motive-archetype"
                className={`font-mono text-[11px] font-medium uppercase tracking-[0.16em] block mb-1.5 transition-colors duration-200 ${
                  isDark ? 'text-[#EDEAE3]/70' : 'text-[#1A1C1E]/75'
                }`}
              >
                MOTIVE ARCHETYPE
              </label>
              <div className="relative">
                <select
                  id="motive-archetype"
                  disabled={isRandom}
                  tabIndex={isRandom ? -1 : 0}
                  value={motive}
                  style={getFieldStyle(rollingFields.motive)}
                  onChange={(e) => setMotive(e.target.value as MotiveArchetype)}
                  className={`w-full h-10 sm:h-10.5 px-3.5 pr-10 rounded-lg border font-sans text-xs sm:text-sm appearance-none outline-none transition-all duration-200 ${getFieldClass(
                    rollingFields.motive
                  )}`}
                >
                  {MOTIVE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200 ${
                    isRandom
                      ? isDark ? 'text-[#EDEAE3]/30' : 'text-[#1A1C1E]/30'
                      : isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'
                  }`}
                />
              </div>
            </div>

            {/* Field 3: EVIDENCE SCARCITY */}
            <div>
              <label
                htmlFor="evidence-scarcity"
                className={`font-mono text-[11px] font-medium uppercase tracking-[0.16em] block mb-1.5 transition-colors duration-200 ${
                  isDark ? 'text-[#EDEAE3]/70' : 'text-[#1A1C1E]/75'
                }`}
              >
                EVIDENCE SCARCITY
              </label>
              <div className="relative">
                <select
                  id="evidence-scarcity"
                  disabled={isRandom}
                  tabIndex={isRandom ? -1 : 0}
                  value={scarcity}
                  style={getFieldStyle(rollingFields.scarcity)}
                  onChange={(e) => setScarcity(e.target.value as EvidenceScarcity)}
                  className={`w-full h-10 sm:h-10.5 px-3.5 pr-10 rounded-lg border font-sans text-xs sm:text-sm appearance-none outline-none transition-all duration-200 ${getFieldClass(
                    rollingFields.scarcity
                  )}`}
                >
                  {EVIDENCE_SCARCITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200 ${
                    isRandom
                      ? isDark ? 'text-[#EDEAE3]/30' : 'text-[#1A1C1E]/30'
                      : isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'
                  }`}
                />
              </div>
            </div>

            {/* Field 4: SCENE TYPE */}
            <div>
              <label
                htmlFor="scene-type"
                className={`font-mono text-[11px] font-medium uppercase tracking-[0.16em] block mb-1.5 transition-colors duration-200 ${
                  isDark ? 'text-[#EDEAE3]/70' : 'text-[#1A1C1E]/75'
                }`}
              >
                SCENE TYPE
              </label>
              <div className="relative">
                <select
                  id="scene-type"
                  disabled={isRandom}
                  tabIndex={isRandom ? -1 : 0}
                  value={scene}
                  style={getFieldStyle(rollingFields.scene)}
                  onChange={(e) => setScene(e.target.value as SceneType)}
                  className={`w-full h-10 sm:h-10.5 px-3.5 pr-10 rounded-lg border font-sans text-xs sm:text-sm appearance-none outline-none transition-all duration-200 ${getFieldClass(
                    rollingFields.scene
                  )}`}
                >
                  {SCENE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200 ${
                    isRandom
                      ? isDark ? 'text-[#EDEAE3]/30' : 'text-[#1A1C1E]/30'
                      : isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'
                  }`}
                />
              </div>
            </div>

            {/* Field 5: SUSPECT–VICTIM RELATIONSHIP */}
            <div>
              <label
                htmlFor="suspect-relationship"
                className={`font-mono text-[11px] font-medium uppercase tracking-[0.16em] block mb-1.5 transition-colors duration-200 ${
                  isDark ? 'text-[#EDEAE3]/70' : 'text-[#1A1C1E]/75'
                }`}
              >
                SUSPECT–VICTIM RELATIONSHIP
              </label>
              <div className="relative">
                <select
                  id="suspect-relationship"
                  disabled={isRandom}
                  tabIndex={isRandom ? -1 : 0}
                  value={relationship}
                  style={getFieldStyle(rollingFields.relationship)}
                  onChange={(e) => setRelationship(e.target.value as SuspectVictimRelationship)}
                  className={`w-full h-10 sm:h-10.5 px-3.5 pr-10 rounded-lg border font-sans text-xs sm:text-sm appearance-none outline-none transition-all duration-200 ${getFieldClass(
                    rollingFields.relationship
                  )}`}
                >
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200 ${
                    isRandom
                      ? isDark ? 'text-[#EDEAE3]/30' : 'text-[#1A1C1E]/30'
                      : isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'
                  }`}
                />
              </div>
            </div>

            {/* Field 6: METHOD COMPLEXITY */}
            <div>
              <label
                htmlFor="method-complexity"
                className={`font-mono text-[11px] font-medium uppercase tracking-[0.16em] block mb-1.5 transition-colors duration-200 ${
                  isDark ? 'text-[#EDEAE3]/70' : 'text-[#1A1C1E]/75'
                }`}
              >
                METHOD COMPLEXITY
              </label>
              <div className="relative">
                <select
                  id="method-complexity"
                  disabled={isRandom}
                  tabIndex={isRandom ? -1 : 0}
                  value={complexity}
                  style={getFieldStyle(rollingFields.complexity)}
                  onChange={(e) => setComplexity(e.target.value as MethodComplexity)}
                  className={`w-full h-10 sm:h-10.5 px-3.5 pr-10 rounded-lg border font-sans text-xs sm:text-sm appearance-none outline-none transition-all duration-200 ${getFieldClass(
                    rollingFields.complexity
                  )}`}
                >
                  {METHOD_COMPLEXITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200 ${
                    isRandom
                      ? isDark ? 'text-[#EDEAE3]/30' : 'text-[#1A1C1E]/30'
                      : isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            className={`pt-5 mt-5 border-t flex items-center justify-between gap-3 shrink-0 ${
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
