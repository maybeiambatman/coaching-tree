'use client';

import { motion } from 'framer-motion';
import { Sport } from '@/types';

interface SportSelectorProps {
  selected: Sport | 'all';
  onChange: (sport: Sport | 'all') => void;
  showAll?: boolean;
  className?: string;
}

const sports: { id: Sport | 'all'; label: string; icon: string; color: string }[] = [
  { id: 'all', label: 'All Sports', icon: '🏆', color: 'from-purple-500 to-pink-500' },
  { id: 'NFL', label: 'NFL', icon: '🏈', color: 'from-blue-500 to-blue-700' },
  { id: 'NBA', label: 'NBA', icon: '🏀', color: 'from-orange-500 to-red-500' },
  { id: 'Soccer', label: 'Soccer', icon: '⚽', color: 'from-green-500 to-emerald-700' },
];

export default function SportSelector({
  selected,
  onChange,
  showAll = true,
  className = '',
}: SportSelectorProps) {
  const displaySports = showAll ? sports : sports.filter((s) => s.id !== 'all');

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displaySports.map((sport) => (
        <motion.button
          key={sport.id}
          onClick={() => onChange(sport.id)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            relative px-4 py-2 rounded-lg font-medium text-sm
            flex items-center gap-2 transition-all duration-200
            ${
              selected === sport.id
                ? `bg-gradient-to-r ${sport.color} text-white shadow-lg`
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }
          `}
        >
          <span className="text-lg">{sport.icon}</span>
          <span>{sport.label}</span>
          {selected === sport.id && (
            <motion.div
              layoutId="sport-selector-indicator"
              className="absolute inset-0 rounded-lg border-2 border-white/30"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}
