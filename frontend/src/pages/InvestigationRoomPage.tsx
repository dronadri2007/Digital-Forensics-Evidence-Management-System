import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  MOCK_INVESTIGATION_CASE,
  GraphNodeData,
  CaseInvestigationData,
} from '../data/mockInvestigationData';
import { CaseContextStrip } from '../components/investigation/CaseContextStrip';
import { EvidenceGraph } from '../components/investigation/EvidenceGraph';
import { EntityInspector } from '../components/investigation/EntityInspector';
import { AegisAiPanel } from '../components/investigation/AegisAiPanel';

interface InvestigationRoomPageProps {
  caseId?: string;
  onNavigateBack?: () => void;
}

export const InvestigationRoomPage: React.FC<InvestigationRoomPageProps> = ({
  caseId = 'CASE-001',
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Case investigation state
  const [caseData] = useState<CaseInvestigationData>(MOCK_INVESTIGATION_CASE);
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

  return (
    <div
      className={`relative w-full h-[100dvh] overflow-hidden flex flex-col pt-16 transition-colors duration-300 ${
        isDark ? 'bg-[#080A0C] text-[#EDEAE3]' : 'bg-[#F6F4EE] text-[#1A1C1E]'
      }`}
    >
      {/* 1. TOP CASE CONTEXT STRIP (Compact ~56px) */}
      <CaseContextStrip
        caseId={caseId || caseData.caseId}
        title={caseData.title}
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
        />

      </div>
    </div>
  );
};
