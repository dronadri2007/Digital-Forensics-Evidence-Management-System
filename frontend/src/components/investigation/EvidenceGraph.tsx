import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { GraphNodeData, GraphEdgeData } from '../../data/mockInvestigationData';

interface EvidenceGraphProps {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  selectedNodeId: string | null;
  isSolved: boolean;
  onSelectNode: (node: GraphNodeData | null) => void;
}

const NODE_WIDTH = 144;
const NODE_HEIGHT = 62;

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({
  nodes: initialNodes,
  edges,
  selectedNodeId,
  isSolved,
  onSelectNode,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Node positions state for dragging
  const [nodes, setNodes] = useState<GraphNodeData[]>(initialNodes);

  // Pan and Zoom transform
  const [transform, setTransform] = useState<{ x: number; y: number; scale: number }>({
    x: 40,
    y: 40,
    scale: 1,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggingNodeRef = useRef<{ id: string; startX: number; startY: number; nodeStartX: number; nodeStartY: number } | null>(null);

  // Sync initial nodes if prop updates
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  // Handle Canvas Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
    setTransform((prev) => {
      const nextScale = Math.min(Math.max(prev.scale * zoomFactor, 0.55), 1.6);
      return { ...prev, scale: nextScale };
    });
  };

  // Canvas Pan Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking canvas background directly
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'grid-rect') {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Node dragging
    if (draggingNodeRef.current) {
      const { id, startX, startY, nodeStartX, nodeStartY } = draggingNodeRef.current;
      const dx = (e.clientX - startX) / transform.scale;
      const dy = (e.clientY - startY) / transform.scale;

      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, x: nodeStartX + dx, y: nodeStartY + dy } : n))
      );
      return;
    }

    // Canvas panning
    if (isPanningRef.current) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      }));
    }
  }, [transform.scale]);

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;
    draggingNodeRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Node Drag Initiation
  const handleNodeMouseDown = (e: React.MouseEvent, node: GraphNodeData) => {
    e.stopPropagation();
    draggingNodeRef.current = {
      id: node.id,
      startX: e.clientX,
      startY: e.clientY,
      nodeStartX: node.x,
      nodeStartY: node.y,
    };
  };

  // Semantic styles for node cards
  const getNodeSemanticClasses = (semantic: string, isDimmed: boolean) => {
    if (isDimmed) {
      return isDark
        ? 'opacity-20 border-white/[0.04] bg-[#0E1216]/60 text-white/30'
        : 'opacity-20 border-black/[0.04] bg-white/60 text-black/30';
    }

    switch (semantic) {
      case 'prime_suspect':
        return isDark
          ? 'bg-[#181113] border-[#C85A5A]/50 text-[#EDEAE3] ring-1 ring-[#C85A5A]/30'
          : 'bg-[#FDF4F4] border-[#B84A4A]/50 text-[#1A1C1E] ring-1 ring-[#B84A4A]/25';
      case 'suspect':
        return isDark
          ? 'bg-[#16130E] border-[#C8955A]/45 text-[#EDEAE3]'
          : 'bg-[#FDF8F0] border-[#B8860B]/40 text-[#1A1C1E]';
      case 'victim':
        return isDark
          ? 'bg-[#121417] border-[#8E9296]/40 text-[#EDEAE3]'
          : 'bg-[#F5F6F8] border-[#71767D]/35 text-[#1A1C1E]';
      default:
        return isDark
          ? 'bg-[#0E1216] border-white/[0.08] text-[#EDEAE3] hover:border-white/[0.18]'
          : 'bg-white border-black/[0.08] text-[#1A1C1E] hover:border-black/[0.18] shadow-[0_1px_4px_rgba(0,0,0,0.03)]';
    }
  };

  const getNodeBadgeColor = (semantic: string) => {
    switch (semantic) {
      case 'prime_suspect':
        return isDark ? 'text-[#E07A7A]' : 'text-[#A83232]';
      case 'suspect':
        return isDark ? 'text-[#D8A66C]' : 'text-[#966822]';
      case 'victim':
        return isDark ? 'text-[#A0B0A8]' : 'text-[#3E5C50]';
      default:
        return isDark ? 'text-[#EDEAE3]/45' : 'text-[#1A1C1E]/45';
    }
  };

  // Node Map for edge calculations
  const nodeMap = new Map<string, GraphNodeData>(nodes.map((n) => [n.id, n]));

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
      className={`relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing transition-colors duration-300 ${
        isDark ? 'bg-[#080A0C]' : 'bg-[#F6F4EE]'
      }`}
    >
      {/* SVG Canvas for background grid & connecting edges */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          {/* Faint coordinate grid pattern (3% opacity) */}
          <pattern id="evidence-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={isDark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(0, 0, 0, 0.035)'}
              strokeWidth="1"
            />
          </pattern>

          <style>{`
            @keyframes contradiction-pulse {
              0%, 100% { opacity: 0.95; stroke-width: 2.2px; }
              50% { opacity: 0.35; stroke-width: 1.6px; }
            }
            .contradiction-edge {
              animation: contradiction-pulse 3.5s ease-in-out infinite;
            }
          `}</style>
        </defs>

        {/* Vast background grid */}
        <rect id="grid-rect" x="-4000" y="-4000" width="8000" height="8000" fill="url(#evidence-grid)" />

        {/* Connective Edges */}
        {edges.map((edge) => {
          const source = nodeMap.get(edge.source);
          const target = nodeMap.get(edge.target);
          if (!source || !target) return null;

          const x1 = source.x + NODE_WIDTH / 2;
          const y1 = source.y + NODE_HEIGHT / 2;
          const x2 = target.x + NODE_WIDTH / 2;
          const y2 = target.y + NODE_HEIGHT / 2;

          // Check if highlighted in resolution mode
          const isPrimeSuspectEdge =
            edge.source === 'elena_rostova' || edge.target === 'elena_rostova';
          const isDimmed = isSolved && !isPrimeSuspectEdge;

          let strokeColor = isDark ? '#5E89A8' : '#3B6E94'; // forensic default
          let strokeDasharray = 'none';
          let edgeClass = '';
          let strokeWidth = '1.75';

          if (edge.semantic === 'circumstantial') {
            strokeColor = isDark ? '#C49B58' : '#A4762E';
            strokeDasharray = '4 4';
            strokeWidth = '1.5';
          } else if (edge.semantic === 'contradiction') {
            strokeColor = isDark ? '#C85A5A' : '#B84A4A';
            edgeClass = 'contradiction-edge';
            strokeWidth = '2';
          }

          if (isDimmed) {
            strokeColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
            edgeClass = '';
          }

          return (
            <g key={edge.id} className="transition-opacity duration-300">
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                className={edgeClass}
              />
            </g>
          );
        })}
      </svg>

      {/* Interactive HTML Node Cards */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
        }}
      >
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isPrimeSuspect = node.semantic === 'prime_suspect';
          const isDimmed = isSolved && !isPrimeSuspect;

          return (
            <div
              key={node.id}
              data-node-id={node.id}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${NODE_WIDTH}px`,
                height: `${NODE_HEIGHT}px`,
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(node);
              }}
              className={`absolute pointer-events-auto rounded-[7px] border p-2.5 flex flex-col justify-between transition-shadow duration-200 cursor-pointer ${getNodeSemanticClasses(
                node.semantic,
                isDimmed
              )} ${isSelected ? 'ring-2 ring-[#6B9B85]' : ''}`}
            >
              {/* Card Top: Type label (tiny mono) + Confidence */}
              <div className="flex items-center justify-between text-[9px] font-mono leading-none">
                <span className={`uppercase tracking-wider font-semibold ${getNodeBadgeColor(node.semantic)}`}>
                  {node.category}
                </span>
                {node.confidence && (
                  <span className={isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'}>
                    {node.confidence}%
                  </span>
                )}
              </div>

              {/* Card Center: Entity Name */}
              <div className="font-sans font-bold text-xs tracking-tight truncate leading-tight mt-1">
                {node.name}
              </div>

              {/* Card Bottom: Role or Subtitle */}
              <div
                className={`text-[9.5px] font-sans truncate leading-none ${
                  isDark ? 'text-[#EDEAE3]/50' : 'text-[#1A1C1E]/50'
                }`}
              >
                {node.roleSubtitle}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Canvas Controls (Bottom-Left) */}
      <div className="absolute left-6 bottom-6 z-20 flex items-center gap-1.5 p-1 rounded-lg border backdrop-blur-md select-none bg-black/10 border-white/[0.08] dark:bg-black/40">
        <button
          onClick={() => setTransform((prev) => ({ ...prev, scale: Math.min(prev.scale * 1.15, 1.6) }))}
          className="w-7 h-7 flex items-center justify-center rounded text-xs font-mono opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setTransform((prev) => ({ ...prev, scale: Math.max(prev.scale * 0.85, 0.55) }))}
          className="w-7 h-7 flex items-center justify-center rounded text-xs font-mono opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={() => setTransform({ x: 40, y: 40, scale: 1 })}
          className="px-2 h-7 flex items-center justify-center rounded text-[10px] font-mono uppercase tracking-wider opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors"
          title="Reset View"
        >
          RESET
        </button>
      </div>
    </div>
  );
};
