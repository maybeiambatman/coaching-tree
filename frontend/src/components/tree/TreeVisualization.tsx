'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CoachTreeNode, Sport } from '@/types';
import CoachNode from './CoachNode';
import { motion } from 'framer-motion';

interface TreeVisualizationProps {
  rootCoachId: string;
  data: CoachTreeNode;
  showMentors?: boolean;
  maxGenerationsUp?: number;
  maxGenerationsDown?: number;
  onNodeClick?: (coachId: string) => void;
  colorScheme?: 'default' | 'by-team' | 'by-era' | 'by-success';
}

// Node types registration
const nodeTypes: NodeTypes = {
  coach: CoachNode,
};

// Convert tree data to React Flow nodes and edges
function convertTreeToFlow(
  tree: CoachTreeNode,
  showMentors: boolean = true
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const visited = new Set<string>();

  const HORIZONTAL_SPACING = 250;
  const VERTICAL_SPACING = 180;

  // Process disciples (going down)
  function processDescendants(
    node: CoachTreeNode,
    x: number,
    y: number,
    level: number
  ): number {
    if (visited.has(node.id)) return 0;
    visited.add(node.id);

    nodes.push({
      id: node.id,
      type: 'coach',
      position: { x, y },
      data: { ...node, isRoot: level === 0 },
    });

    if (node.children.length === 0) return 1;

    let totalWidth = 0;
    const childWidths: number[] = [];

    // First pass: calculate widths
    for (const child of node.children) {
      const width = calculateSubtreeWidth(child, visited);
      childWidths.push(width);
      totalWidth += width;
    }

    // Second pass: position children
    let currentX = x - ((totalWidth - 1) * HORIZONTAL_SPACING) / 2;
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const childX = currentX + ((childWidths[i] - 1) * HORIZONTAL_SPACING) / 2;

      edges.push({
        id: `${node.id}-${child.id}`,
        source: node.id,
        target: child.id,
        type: 'smoothstep',
        animated: child.isActive,
        style: { stroke: '#6b7280', strokeWidth: 2 },
      });

      processDescendants(child, childX, y + VERTICAL_SPACING, level + 1);
      currentX += childWidths[i] * HORIZONTAL_SPACING;
    }

    return totalWidth;
  }

  // Calculate subtree width for better layout
  function calculateSubtreeWidth(
    node: CoachTreeNode,
    visitedCalc: Set<string>
  ): number {
    if (visitedCalc.has(node.id)) return 0;
    if (node.children.length === 0) return 1;

    let width = 0;
    for (const child of node.children) {
      width += calculateSubtreeWidth(child, visitedCalc);
    }
    return Math.max(1, width);
  }

  // Process ancestors (going up) if showMentors is enabled
  function processAncestors(
    node: CoachTreeNode,
    x: number,
    y: number,
    level: number
  ): void {
    if (!showMentors || node.parents.length === 0) return;

    const parentY = y - VERTICAL_SPACING;
    const parentSpacing = HORIZONTAL_SPACING * 1.5;
    const startX = x - ((node.parents.length - 1) * parentSpacing) / 2;

    node.parents.forEach((parent, index) => {
      if (visited.has(parent.id)) return;
      visited.add(parent.id);

      const parentX = startX + index * parentSpacing;

      nodes.push({
        id: parent.id,
        type: 'coach',
        position: { x: parentX, y: parentY },
        data: { ...parent },
      });

      edges.push({
        id: `${parent.id}-${node.id}`,
        source: parent.id,
        target: node.id,
        type: 'smoothstep',
        style: { stroke: '#6b7280', strokeWidth: 2, strokeDasharray: '5,5' },
      });

      // Recursively process grandparents
      processAncestors(parent, parentX, parentY, level + 1);
    });
  }

  // Start from the root
  processDescendants(tree, 0, 0, 0);

  // Clear visited for ancestors (root should be in both)
  visited.delete(tree.id);
  processAncestors(tree, 0, 0, 0);

  return { nodes, edges };
}

export default function TreeVisualization({
  rootCoachId,
  data,
  showMentors = true,
  maxGenerationsUp = 2,
  maxGenerationsDown = 3,
  onNodeClick,
  colorScheme = 'default',
}: TreeVisualizationProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => convertTreeToFlow(data, showMentors),
    [data, showMentors]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Update nodes when data changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = convertTreeToFlow(
      data,
      showMentors
    );
    setNodes(newNodes);
    setEdges(newEdges);
  }, [data, showMentors, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  // Sport color for minimap
  const sportColors: Record<Sport, string> = {
    NFL: '#3b82f6',
    NBA: '#f97316',
    Soccer: '#22c55e',
  };

  const minimapNodeColor = useCallback(
    (node: Node) => {
      return sportColors[node.data.sport as Sport] || '#6b7280';
    },
    []
  );

  return (
    <div className="w-full h-full bg-gray-900 rounded-xl overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#374151"
        />

        <Controls
          className="bg-gray-800 border-gray-700 rounded-lg"
          showInteractive={false}
        />

        <MiniMap
          nodeColor={minimapNodeColor}
          className="bg-gray-800 border-gray-700 rounded-lg"
          maskColor="rgba(0, 0, 0, 0.8)"
        />

        <Panel position="top-left" className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700"
          >
            <h3 className="text-white font-bold text-lg mb-2">{data.name}</h3>
            <p className="text-gray-400 text-sm">{data.role}</p>
            <p className="text-gray-500 text-xs mt-1">{data.years}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-400">CIS Score:</span>
              <span className="text-lg font-bold text-white">
                {data.cisScore.toFixed(1)}
              </span>
            </div>
            {data.championships > 0 && (
              <div className="mt-2 flex items-center gap-1">
                <span className="text-yellow-500">🏆</span>
                <span className="text-sm text-gray-400">
                  {data.championships} Championship
                  {data.championships > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </motion.div>
        </Panel>

        <Panel position="top-right" className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 border border-gray-700"
          >
            <h4 className="text-gray-400 text-xs font-medium mb-2">LEGEND</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-gray-400">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-xs text-gray-400">Championships</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-gray-500" style={{ borderStyle: 'dashed' }} />
                <span className="text-xs text-gray-400">Mentor</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-gray-500" />
                <span className="text-xs text-gray-400">Disciple</span>
              </div>
            </div>
          </motion.div>
        </Panel>

        <Panel position="bottom-left" className="text-xs text-gray-500">
          Click on a coach to see their details • Scroll to zoom • Drag to pan
        </Panel>
      </ReactFlow>
    </div>
  );
}
