import React from 'react';
import {
  Search,
  Radio,
  Camera,
  UserCheck,
  Fingerprint,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { SuggestionChipItem, SuggestionIconType } from '../../data/investigationDiscoverySequence';

interface SuggestedNextStepsProps {
  suggestions: SuggestionChipItem[];
  consumedActions?: string[];
  pendingActionId?: string | null;
  onSelectSuggestion: (item: SuggestionChipItem) => void;
  disabled?: boolean;
}

export const SuggestedNextSteps: React.FC<SuggestedNextStepsProps> = ({
  suggestions,
  consumedActions = [],
  pendingActionId = null,
  onSelectSuggestion,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Filter out any chips that are already consumed
  const consumedSet = new Set((consumedActions || []).map((a) => a.toLowerCase().trim()));
  const availableChips = suggestions.filter(
    (chip) =>
      !consumedSet.has(chip.id.toLowerCase().trim()) &&
      !consumedSet.has(chip.label.toLowerCase().trim())
  );

  // If the strip becomes empty, hide the entire section including label
  if (!availableChips || availableChips.length === 0) {
    return null;
  }

  const renderIcon = (type: SuggestionIconType) => {
    const iconClass = "w-3 h-3 shrink-0 opacity-80";
    switch (type) {
      case 'radio':
        return <Radio className={iconClass} />;
      case 'camera':
        return <Camera className={iconClass} />;
      case 'user-check':
        return <UserCheck className={iconClass} />;
      case 'fingerprint':
        return <Fingerprint className={iconClass} />;
      case 'file-text':
        return <FileText className={iconClass} />;
      case 'shield-check':
        return <ShieldCheck className={iconClass} />;
      case 'search':
      default:
        return <Search className={iconClass} />;
    }
  };

  return (
    <div className="w-full px-4 pt-2.5 pb-2 shrink-0 select-none">
      {/* Label: small tracked uppercase */}
      <span
        className={`font-mono text-[9.5px] uppercase tracking-[0.18em] block mb-2 font-medium ${
          isDark ? 'text-[#EDEAE3]/45' : 'text-[#1A1C1E]/45'
        }`}
      >
        SUGGESTED NEXT STEPS
      </span>

      {/* Chips Container: flex wrap with smooth gap */}
      <div className="flex flex-wrap items-center gap-2">
        {availableChips.map((chip) => {
          const isPending = pendingActionId === chip.id;
          const isChipDisabled = disabled || isPending;

          return (
            <button
              key={chip.id}
              data-chip-id={chip.id}
              type="button"
              disabled={isChipDisabled}
              onClick={() => {
                if (isChipDisabled) return;
                onSelectSuggestion(chip);
              }}
              className={`h-7 px-3 rounded-full border text-[11px] font-sans font-medium transition-all duration-200 flex items-center gap-1.5 focus:outline-none select-none group ${
                isPending
                  ? 'opacity-40 cursor-not-allowed pointer-events-none ' +
                    (isDark
                      ? 'border-white/[0.04] bg-white/[0.01] text-[#EDEAE3]/40'
                      : 'border-black/[0.04] bg-black/[0.01] text-[#1A1C1E]/40')
                  : isDark
                  ? 'border-white/[0.09] bg-white/[0.03] text-[#EDEAE3]/80 hover:bg-white/[0.08] hover:text-[#EDEAE3] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'border-black/[0.08] bg-black/[0.02] text-[#1A1C1E]/80 hover:bg-black/[0.06] hover:text-[#1A1C1E] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
              title={chip.label}
            >
              {renderIcon(chip.icon)}
              <span className="truncate max-w-[260px] sm:max-w-[320px]">
                {chip.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
