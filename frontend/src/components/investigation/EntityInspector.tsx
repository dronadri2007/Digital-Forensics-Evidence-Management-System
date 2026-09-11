import React from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { GraphNodeData } from '../../data/mockInvestigationData';

interface EntityInspectorProps {
  node: GraphNodeData | null;
  onClose: () => void;
}

export const EntityInspector: React.FC<EntityInspectorProps> = ({ node, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!node) return null;

  const { inspector } = node;

  return (
    <div
      className={`absolute left-6 top-6 bottom-6 w-[360px] z-40 rounded-xl border flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-300 shadow-2xl animate-in fade-in slide-in-from-left-4 ${
        isDark
          ? 'bg-[#0E1216]/95 border-white/[0.08] text-[#EDEAE3]'
          : 'bg-[#FAF8F3]/95 border-black/[0.08] text-[#1A1C1E]'
      }`}
    >
      {/* Header Strip */}
      <div 
        className={`px-5 py-4 border-b flex items-start justify-between ${
          isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
        }`}
      >
        <div>
          {/* ENTITY TYPE */}
          <span 
            className={`font-mono text-[10px] uppercase tracking-[0.20em] block select-none ${
              isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
            }`}
          >
            {inspector.entityType}
          </span>

          {/* NAME / ID */}
          <h2 className="font-sans font-bold text-base mt-1 tracking-tight">
            {node.name}
          </h2>

          <p 
            className={`font-mono text-[11px] mt-0.5 ${
              isDark ? 'text-[#EDEAE3]/50' : 'text-[#1A1C1E]/50'
            }`}
          >
            {node.roleSubtitle}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`p-1 rounded-md transition-colors duration-150 focus:outline-none ${
            isDark
              ? 'text-[#EDEAE3]/60 hover:text-white hover:bg-white/[0.08]'
              : 'text-[#1A1C1E]/60 hover:text-black hover:bg-black/[0.06]'
          }`}
          aria-label="Close entity inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 text-xs">
        
        {/* Confidence rating */}
        <div>
          <span 
            className={`font-mono text-[10px] uppercase tracking-[0.16em] block mb-1.5 ${
              isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'
            }`}
          >
            CONFIDENCE RATING
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold tracking-wider">
              {inspector.confidence}
            </span>
            <div className={`h-1.5 flex-1 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`}>
              <div 
                className="h-full rounded-full bg-[#6B9B85]"
                style={{ width: inspector.confidence }}
              />
            </div>
          </div>
        </div>

        {/* KNOWN RELATIONSHIPS */}
        <div>
          <span 
            className={`font-mono text-[10px] uppercase tracking-[0.16em] block mb-2 select-none ${
              isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'
            }`}
          >
            KNOWN RELATIONSHIPS
          </span>
          <ul className="space-y-1.5">
            {inspector.knownRelationships.map((rel, idx) => (
              <li 
                key={idx}
                className={`py-1.5 px-2.5 rounded border text-[11px] font-sans leading-relaxed ${
                  isDark
                    ? 'bg-white/[0.02] border-white/[0.05] text-[#EDEAE3]/80'
                    : 'bg-black/[0.02] border-black/[0.05] text-[#1A1C1E]/80'
                }`}
              >
                {rel}
              </li>
            ))}
          </ul>
        </div>

        {/* EVIDENCE */}
        <div>
          <span 
            className={`font-mono text-[10px] uppercase tracking-[0.16em] block mb-2 select-none ${
              isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'
            }`}
          >
            CORRELATED EVIDENCE
          </span>
          <ul className="space-y-1.5">
            {inspector.evidence.map((item, idx) => (
              <li 
                key={idx}
                className={`py-1.5 px-2.5 rounded border text-[11px] font-sans leading-relaxed flex items-start gap-2 ${
                  isDark
                    ? 'bg-white/[0.02] border-white/[0.05] text-[#EDEAE3]/80'
                    : 'bg-black/[0.02] border-black/[0.05] text-[#1A1C1E]/80'
                }`}
              >
                <span className="text-[#6B9B85] font-mono select-none">›</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* TIMELINE */}
        <div>
          <span 
            className={`font-mono text-[10px] uppercase tracking-[0.16em] block mb-2 select-none ${
              isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'
            }`}
          >
            RECORDED TIMELINE
          </span>
          <div className="space-y-2 border-l pl-3 ml-1 border-current opacity-70">
            {inspector.timeline.map((entry, idx) => (
              <div key={idx} className="relative group">
                <span className="font-mono text-[10px] text-[#6B9B85] block tracking-wide">
                  {entry.timestamp}
                </span>
                <p className="font-sans text-[11px] leading-snug mt-0.5 opacity-90">
                  {entry.event}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
