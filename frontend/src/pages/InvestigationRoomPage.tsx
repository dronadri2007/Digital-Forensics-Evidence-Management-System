import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  MOCK_INVESTIGATION_CASE,
  GraphNodeData,
  CaseInvestigationData,
  MockEvidencePickerItem,
} from '../data/mockInvestigationData';
import { CaseContextStrip } from '../components/investigation/CaseContextStrip';
import { EvidenceGraph } from '../components/investigation/EvidenceGraph';
import { EntityInspector } from '../components/investigation/EntityInspector';
import { AegisAiPanel } from '../components/investigation/AegisAiPanel';
import { CaseItem } from './CasesPage';
import { loadStoredCases } from '../services/caseService';

interface InvestigationRoomPageProps {
  caseId?: string;
  cases?: CaseItem[];
  onNavigateBack?: () => void;
}

export const InvestigationRoomPage: React.FC<InvestigationRoomPageProps> = ({
  caseId,
  cases: propCases,
  onNavigateBack,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const activeCases = propCases ?? loadStoredCases();
  const resolvedCase = caseId ? activeCases.find((c) => c.id === caseId) : undefined;

  // Handle gracefully when navigating to /cases/:id with no case data
  if (!resolvedCase) {
    return (
      <div
        className={`relative w-full h-[100dvh] overflow-hidden flex flex-col items-center justify-center px-6 transition-colors duration-300 ${
          isDark ? 'bg-[#080A0C] text-[#EDEAE3]' : 'bg-[#F6F4EE] text-[#1A1C1E]'
        }`}
      >
        <div className="w-full max-w-md text-center">
          <span
            className={`font-mono text-xs uppercase tracking-[0.22em] block mb-3 select-none ${
              isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
            }`}
          >
            404 · CASE FILE NOT FOUND
          </span>
          <h2
            className={`font-sans text-xl sm:text-2xl font-bold tracking-tight mb-3 ${
              isDark ? 'text-[#EDEAE3]' : 'text-[#1A1C1E]'
            }`}
          >
            {caseId ? `No investigation record for ${caseId}.` : 'No investigation specified.'}
          </h2>
          <p
            className={`font-sans text-xs sm:text-sm leading-relaxed mb-8 ${
              isDark ? 'text-[#EDEAE3]/55' : 'text-[#1A1C1E]/55'
            }`}
          >
            This case file has not been initiated in the Ashwick environment yet. Start a new investigation to generate case evidence.
          </p>
          <button
            onClick={onNavigateBack}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border font-mono text-xs uppercase tracking-widest transition-all duration-200 cursor-pointer ${
              isDark
                ? 'border-white/[0.12] bg-[#0D1117] text-[#EDEAE3] hover:border-[#74AC95]/50 hover:text-[#74AC95] hover:bg-[#11161E]'
                : 'border-black/[0.12] bg-white text-[#1A1C1E] hover:border-[#1E6147]/50 hover:text-[#1E6147] hover:bg-[#FAF8F5] shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
            }`}
          >
            <span>←</span>
            <span>Return to Case Files</span>
          </button>
        </div>
      </div>
    );
  }

  // Case investigation state
  const [caseData, setCaseData] = useState<CaseInvestigationData>(() => ({
    ...MOCK_INVESTIGATION_CASE,
    caseId: resolvedCase.id,
    title: resolvedCase.title,
    evidenceCount: resolvedCase.wildcardConfig?.evidenceCount ?? MOCK_INVESTIGATION_CASE.evidenceCount,
    confidence: resolvedCase.wildcardConfig?.confidence ?? MOCK_INVESTIGATION_CASE.confidence,
  }));
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [isAiCollapsed, setIsAiCollapsed] = useState<boolean>(false);
  const [isSolved, setIsSolved] = useState<boolean>(false);

  // Handle solve case toggle
  const handleSolveToggle = () => {
    setIsSolved((prev) => !prev);
    // If opening resolution, automatically expand AI panel to present conclusion
    if (!isSolved) {
      setIsAiCollapsed(false);
    }
  };

  // Handle adding mock evidence item
  const handleAddEvidence = (item: MockEvidencePickerItem) => {
    setCaseData((prev) => {
      if (prev.nodes.some((n) => n.id === item.node.id)) {
        return prev;
      }
      return {
        ...prev,
        evidenceCount: prev.evidenceCount + 1,
        nodes: [...prev.nodes, item.node],
        edges: [...prev.edges, item.edge],
      };
    });
  };

  return (
    <div
      className={`relative w-full h-[100dvh] overflow-hidden flex flex-col pt-16 transition-colors duration-300 ${
        isDark ? 'bg-[#080A0C] text-[#EDEAE3]' : 'bg-[#F6F4EE] text-[#1A1C1E]'
      }`}
    >
      {/* 1. TOP CASE CONTEXT STRIP (Compact ~56px) */}
      <CaseContextStrip
        caseId={resolvedCase.id}
        title={resolvedCase.title}
        isSolved={isSolved}
        evidenceCount={caseData.evidenceCount}
        confidence={caseData.confidence}
        onSolveToggle={handleSolveToggle}
      />

      {/* 2. BODY SPLIT CANVAS AREA */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        
        {/* Evidence Graph Canvas (Left / Center - dominates workspace) */}
        <div className="absolute inset-0">
          <EvidenceGraph
            nodes={caseData.nodes}
            edges={caseData.edges}
            selectedNodeId={selectedNode ? selectedNode.id : null}
            isSolved={isSolved}
            onSelectNode={(node) => setSelectedNode(node)}
          />
        </div>

        {/* Entity Inspector (Slides in / floats on left when a node is selected) */}
        {selectedNode && (
          <EntityInspector
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        )}

        {/* Floating AEGIS AI Frosted Glass Panel (Floats on right with ~24px margins) */}
        <AegisAiPanel
          caseData={caseData}
          isCollapsed={isAiCollapsed}
          isSolved={isSolved}
          onToggleCollapse={() => setIsAiCollapsed((prev) => !prev)}
          onReturnToActive={() => setIsSolved(false)}
          onAddEvidence={handleAddEvidence}
        />

      </div>
    </div>
  );
};
