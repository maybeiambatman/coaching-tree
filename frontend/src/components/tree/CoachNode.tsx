'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { CoachTreeNode, Sport } from '@/types';

interface CoachNodeData extends CoachTreeNode {
  isSelected?: boolean;
  isRoot?: boolean;
}

// Sport-specific colors
const sportColors: Record<Sport, { bg: string; border: string; text: string }> = {
  NFL: {
    bg: 'bg-blue-900/80',
    border: 'border-blue-500',
    text: 'text-blue-100',
  },
  NBA: {
    bg: 'bg-orange-900/80',
    border: 'border-orange-500',
    text: 'text-orange-100',
  },
  Soccer: {
    bg: 'bg-green-900/80',
    border: 'border-green-500',
    text: 'text-green-100',
  },
};

function CoachNode({ data, selected }: NodeProps<CoachNodeData>) {
  const colors = sportColors[data.sport];
  const isSelected = data.isSelected || selected;
  const isRoot = data.isRoot;

  // Size based on CIS score
  const baseSize = 180;
  const scoreMultiplier = 1 + (data.cisScore / 100) * 0.3;
  const nodeWidth = baseSize * (isRoot ? 1.2 : scoreMultiplier);

  // Championship badges
  const championshipBadge =
    data.championships > 0 ? (
      <div className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
        {data.championships}
      </div>
    ) : null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        relative px-4 py-3 rounded-xl shadow-lg border-2 backdrop-blur-sm
        ${colors.bg} ${colors.border} ${colors.text}
        ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}
        ${isRoot ? 'border-4' : ''}
        transition-all duration-200 hover:scale-105 cursor-pointer
      `}
      style={{ width: nodeWidth }}
    >
      {/* Handle for incoming connections (from mentors) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-gray-600"
      />

      {championshipBadge}

      <div className="flex flex-col items-center text-center">
        {/* Coach avatar placeholder */}
        <div
          className={`
            w-12 h-12 rounded-full mb-2 flex items-center justify-center
            bg-gradient-to-br from-gray-600 to-gray-800 border-2 ${colors.border}
          `}
        >
          <span className="text-lg font-bold text-white">
            {data.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </span>
        </div>

        {/* Coach name */}
        <h3 className="font-bold text-sm leading-tight mb-1">{data.name}</h3>

        {/* Role and status */}
        <p className="text-xs opacity-80 leading-tight">{data.role}</p>

        {/* Years active */}
        <p className="text-xs opacity-60 mt-1">{data.years}</p>

        {/* CIS Score */}
        <div className="mt-2 px-2 py-1 bg-black/30 rounded-full">
          <span className="text-xs font-medium">
            CIS: {data.cisScore.toFixed(1)}
          </span>
        </div>

        {/* Active indicator */}
        {data.isActive && (
          <div className="absolute top-2 left-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
        )}
      </div>

      {/* Handle for outgoing connections (to disciples) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-400 border-2 border-gray-600"
      />
    </motion.div>
  );
}

export default memo(CoachNode);
