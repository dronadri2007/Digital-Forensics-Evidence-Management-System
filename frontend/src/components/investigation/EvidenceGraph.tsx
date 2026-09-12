import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { GraphNodeData, GraphEdgeData } from '../../data/mockInvestigationData';

interface EvidenceGraphProps {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  selectedNodeId: string | null;
  isSolved: boolean;
  isCaseComplete?: boolean;
  onSelectNode: (node: GraphNodeData | null) => void;
}

const NODE_WIDTH = 144;
const NODE_HEIGHT = 62;
const MIN_GAP = 32;
const REQ_WIDTH = NODE_WIDTH + MIN_GAP; // 176
const REQ_HEIGHT = NODE_HEIGHT + MIN_GAP; // 94

/**
 * Resolves rectangle overlaps and maintains minimum margin between nodes.
 * User-placed nodes are treated as fixed anchors (0 displacement).
 * For new vs existing node collisions, new node takes 85% displacement and existing nudges 15%.
 */
function resolveCollisions(
  nodes: GraphNodeData[],
  userPlacedIds: Set<string> = new Set(),
  newlyAddedIds: Set<string> = new Set()
): GraphNodeData[] {
  const resolved = nodes.map((n) => ({ ...n }));
  if (resolved.length <= 1) return resolved;

  const MAX_ITERATIONS = 20;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let anyCollision = false;

    // Centroid of graph to determine outward direction if nodes are perfectly stacked
    const centroidX = resolved.reduce((sum, n) => sum + n.x, 0) / resolved.length;
    const centroidY = resolved.reduce((sum, n) => sum + n.y, 0) / resolved.length;

    for (let i = 0; i < resolved.length; i++) {
      for (let j = i + 1; j < resolved.length; j++) {
        const a = resolved[i];
        const b = resolved[j];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const ox = REQ_WIDTH - Math.abs(dx);
        const oy = REQ_HEIGHT - Math.abs(dy);

        if (ox > 0 && oy > 0) {
          anyCollision = true;

          const isAUser = userPlacedIds.has(a.id);
          const isBUser = userPlacedIds.has(b.id);

          // If both are manually placed by the user, both are fixed anchors
          if (isAUser && isBUser) {
            continue;
          }

          let ratioA = 0.5;
          let ratioB = 0.5;

          if (isAUser) {
            ratioA = 0;
            ratioB = 1.0;
          } else if (isBUser) {
            ratioA = 1.0;
            ratioB = 0;
          } else {
            const isANew = newlyAddedIds.has(a.id);
            const isBNew = newlyAddedIds.has(b.id);
            if (isANew && !isBNew) {
              ratioA = 0.85;
              ratioB = 0.15;
            } else if (isBNew && !isANew) {
              ratioA = 0.15;
              ratioB = 0.85;
            }
          }

          // Choose axis of minimal normalized overlap to preserve intended placement
          const nx = ox / REQ_WIDTH;
          const ny = oy / REQ_HEIGHT;

          if (nx < ny) {
            // Separate along X
            let dirX = Math.sign(dx);
            if (dirX === 0) {
              dirX = b.x >= centroidX ? 1 : -1;
            }
            a.x -= dirX * ox * ratioA;
            b.x += dirX * ox * ratioB;
          } else {
            // Separate along Y
            let dirY = Math.sign(dy);
            if (dirY === 0) {
              dirY = b.y >= centroidY ? 1 : -1;
            }
            a.y -= dirY * oy * ratioA;
            b.y += dirY * oy * ratioB;
          }
        }
      }
    }

    if (!anyCollision) break;
  }

  return resolved.map((n) => ({
    ...n,
    x: Math.round(n.x * 10) / 10,
    y: Math.round(n.y * 10) / 10,
  }));
}

// Smooth 600ms animated confidence number component
export const AnimatedConfidence: React.FC<{ value?: number; className?: string }> = ({
  value,
  className,
}) => {
  const [displayValue, setDisplayValue] = useState<number | undefined>(value);
  const prevValueRef = useRef<number | undefined>(value);

  useEffect(() => {
    if (value === undefined) {
      setDisplayValue(undefined);
      return;
    }
    const startVal = prevValueRef.current ?? value;
    prevValueRef.current = value;

    if (startVal === value) {
      setDisplayValue(value);
      return;
    }

    let startTimestamp: number | null = null;
    const duration = 600; // 600ms per specification
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Quad ease-out: progress * (2 - progress)
      const ease = progress * (2 - progress);
      const current = Math.round(startVal + (value - startVal) * ease);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value]);

  if (displayValue === undefined) return null;
  return <span className={className}>{displayValue}%</span>;
};

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({
  nodes: initialNodes,
  edges,
  selectedNodeId,
  isSolved,
  isCaseComplete = false,
  onSelectNode,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Tracks nodes that have been explicitly dragged by user to a custom position
  const userPlacedNodeIdsRef = useRef<Set<string>>(new Set());

  // Tracks settled positions of nodes in canvas coordinates so layout stays stable across re-renders
  const settledPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Active dragging state for instantaneous response
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // Initialize node state with collision-resolved coordinates
  const [nodes, setNodes] = useState<GraphNodeData[]>(() => {
    const resolved = resolveCollisions(
      initialNodes,
      new Set(),
      new Set(initialNodes.map((n) => n.id))
    );
    resolved.forEach((n) => settledPositionsRef.current.set(n.id, { x: n.x, y: n.y }));
    return resolved;
  });

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

  // Track animated nodes and edges so animations run only when newly revealed
  const animatedNodeIdsRef = useRef<Set<string>>(new Set());
  const animatedEdgeIdsRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef<boolean>(true);

  // If the case is already complete or loaded solved on mount, mark all current nodes/edges as already animated
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      if (isCaseComplete || isSolved) {
        initialNodes.forEach((n) => animatedNodeIdsRef.current.add(n.id));
        edges.forEach((e) => animatedEdgeIdsRef.current.add(e.id));
      }
    }
  }, [isCaseComplete, isSolved, initialNodes, edges]);

  // Sync initial nodes when prop updates (e.g. progressive discovery stage advancement)
  useEffect(() => {
    // Prune stale IDs from userPlaced and settled positions if case changed
    const currentPropIds = new Set(initialNodes.map((n) => n.id));
    for (const id of Array.from(userPlacedNodeIdsRef.current)) {
      if (!currentPropIds.has(id)) userPlacedNodeIdsRef.current.delete(id);
    }
    for (const id of Array.from(settledPositionsRef.current.keys())) {
      if (!currentPropIds.has(id)) settledPositionsRef.current.delete(id);
    }

    // Build candidates: keep settled/dragged coordinates for existing nodes, identify newly added nodes
    const newlyAddedIds = new Set<string>();
    const candidates = initialNodes.map((n) => {
      const settled = settledPositionsRef.current.get(n.id);
      if (settled) {
        return { ...n, x: settled.x, y: settled.y };
      }
      newlyAddedIds.add(n.id);
      return { ...n };
    });

    const resolved = resolveCollisions(
      candidates,
      userPlacedNodeIdsRef.current,
      newlyAddedIds
    );

    resolved.forEach((n) => {
      settledPositionsRef.current.set(n.id, { x: n.x, y: n.y });
    });

    setNodes(resolved);
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

      // Mark as user-placed if dragged more than 3px
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > 3) {
        userPlacedNodeIdsRef.current.add(id);
      }

      const nextX = Math.round((nodeStartX + dx) * 10) / 10;
      const nextY = Math.round((nodeStartY + dy) * 10) / 10;

      settledPositionsRef.current.set(id, { x: nextX, y: nextY });

      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, x: nextX, y: nextY } : n))
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
    setDraggingNodeId(null);
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
    setDraggingNodeId(node.id);
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

  // Find newly added nodes and edges for staggered entrance animations
  let newNodeCounter = 0;
  const newNodesStaggerMap = new Map<string, number>();
  nodes.forEach((n) => {
    if (!animatedNodeIdsRef.current.has(n.id)) {
      newNodesStaggerMap.set(n.id, newNodeCounter++);
    }
  });

  let newEdgeCounter = 0;
  const newEdgesStaggerMap = new Map<string, number>();
  edges.forEach((e) => {
    if (!animatedEdgeIdsRef.current.has(e.id)) {
      newEdgesStaggerMap.set(e.id, newEdgeCounter++);
    }
  });

  // Mark newly processed items into the ref
  useEffect(() => {
    nodes.forEach((n) => animatedNodeIdsRef.current.add(n.id));
    edges.forEach((e) => animatedEdgeIdsRef.current.add(e.id));
  }, [nodes, edges]);

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
            @keyframes aegis-node-appear {
              0% {
                opacity: 0;
                transform: scale(0.85);
              }
              100% {
                opacity: 1;
                transform: scale(1);
              }
            }
            .aegis-node-enter {
              animation: aegis-node-appear 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
              transform-origin: center center;
            }
            @keyframes aegis-edge-draw-line {
              from {
                stroke-dashoffset: var(--edge-len);
              }
              to {
                stroke-dashoffset: 0;
              }
            }
            .aegis-edge-entering {
              animation: aegis-edge-draw-line 500ms ease-out both;
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

          // Edge draw animation calculation for newly added edge
          const isNewEdge = newEdgesStaggerMap.has(edge.id);
          const edgeLength = Math.round(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))) || 200;
          const staggerIdx = newEdgesStaggerMap.get(edge.id) ?? 0;
          const animDelayMs = staggerIdx * 180 + 80;

          return (
            <g key={edge.id} className="transition-opacity duration-300">
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={isNewEdge ? edgeLength : strokeDasharray}
                strokeDashoffset={isNewEdge ? edgeLength : undefined}
                style={{
                  transition: draggingNodeId
                    ? 'none'
                    : 'x1 350ms cubic-bezier(0.16, 1, 0.3, 1), y1 350ms cubic-bezier(0.16, 1, 0.3, 1), x2 350ms cubic-bezier(0.16, 1, 0.3, 1), y2 350ms cubic-bezier(0.16, 1, 0.3, 1)',
                  ...(isNewEdge
                    ? ({
                        ['--edge-len' as any]: `${edgeLength}px`,
                        animationDelay: `${animDelayMs}ms`,
                      } as React.CSSProperties)
                    : {}),
                }}
                className={`${edgeClass} ${isNewEdge ? 'aegis-edge-entering' : ''}`}
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

          const isNewNode = newNodesStaggerMap.has(node.id);
          const staggerIdx = newNodesStaggerMap.get(node.id) ?? 0;
          const animDelayMs = staggerIdx * 180;
          const isBeingDragged = draggingNodeId === node.id;

          return (
            <div
              key={node.id}
              data-node-id={node.id}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${NODE_WIDTH}px`,
                height: `${NODE_HEIGHT}px`,
                animationDelay: isNewNode ? `${animDelayMs}ms` : undefined,
                transition: isBeingDragged
                  ? 'box-shadow 200ms ease, opacity 200ms ease'
                  : 'left 350ms cubic-bezier(0.16, 1, 0.3, 1), top 350ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms ease, opacity 200ms ease',
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(node);
              }}
              className={`absolute pointer-events-auto rounded-[7px] border p-2.5 flex flex-col justify-between cursor-pointer ${
                isNewNode ? 'aegis-node-enter' : ''
              } ${getNodeSemanticClasses(
                node.semantic,
                isDimmed
              )} ${isSelected ? 'ring-2 ring-[#6B9B85]' : ''}`}
            >
              {/* Card Top: Type label (tiny mono) + Confidence */}
              <div className="flex items-center justify-between text-[9px] font-mono leading-none">
                <span className={`uppercase tracking-wider font-semibold ${getNodeBadgeColor(node.semantic)}`}>
                  {node.category}
                </span>
                {node.confidence !== undefined && (
                  <AnimatedConfidence
                    value={node.confidence}
                    className={isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'}
                  />
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
