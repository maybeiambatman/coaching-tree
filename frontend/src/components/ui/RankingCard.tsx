'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Coach, CoachingTreeScore, Sport } from '@/types';

interface RankingCardProps {
  coach: Coach;
  score: CoachingTreeScore;
  index: number;
}

const sportBadgeColors: Record<Sport, string> = {
  NFL: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  NBA: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Soccer: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const rankMedals: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export default function RankingCard({ coach, score, index }: RankingCardProps) {
  const medal = rankMedals[score.rank];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      className="group"
    >
      <Link href={`/coach/${coach.id}`}>
        <div
          className={`
            relative p-4 rounded-xl border border-gray-700
            bg-gray-800/50 backdrop-blur-sm
            hover:bg-gray-800 hover:border-gray-600
            transition-all duration-200 cursor-pointer
          `}
        >
          <div className="flex items-center gap-4">
            {/* Rank */}
            <div className="flex-shrink-0 w-12 text-center">
              {medal ? (
                <span className="text-2xl">{medal}</span>
              ) : (
                <span className="text-xl font-bold text-gray-500">
                  #{score.rank}
                </span>
              )}
            </div>

            {/* Coach Avatar */}
            <div
              className={`
                w-14 h-14 rounded-full flex items-center justify-center
                bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-gray-600
                group-hover:border-gray-500 transition-colors
              `}
            >
              <span className="text-lg font-bold text-white">
                {coach.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </span>
            </div>

            {/* Coach Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-white truncate">{coach.name}</h3>
                <span
                  className={`
                    px-2 py-0.5 text-xs font-medium rounded-full border
                    ${sportBadgeColors[coach.sport]}
                  `}
                >
                  {coach.sport}
                </span>
              </div>
              <p className="text-sm text-gray-400 truncate">
                {coach.currentTeam || coach.formerTeams[0]?.name || 'Retired'}
              </p>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-white">
                  {coach.championships}
                </div>
                <div className="text-xs text-gray-500">Titles</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">
                  {coach.disciples.length}
                </div>
                <div className="text-xs text-gray-500">Disciples</div>
              </div>
            </div>

            {/* CIS Score */}
            <div className="flex-shrink-0 text-right">
              <div className="text-2xl font-bold text-white">
                {score.totalCIS.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">CIS Score</div>
            </div>

            {/* Arrow */}
            <svg
              className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>

          {/* Score breakdown on hover */}
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            whileHover={{ height: 'auto', opacity: 1 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-gray-700 grid grid-cols-5 gap-2">
              <ScoreBar label="Direct" value={score.directSuccessScore} />
              <ScoreBar label="Disciples" value={score.discipleSuccessScore} />
              <ScoreBar label="Depth" value={score.treeDepthScore} />
              <ScoreBar label="Breadth" value={score.treeBreadthScore} />
              <ScoreBar label="Longevity" value={score.longevityScore} />
            </div>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="h-1 bg-gray-700 rounded-full overflow-hidden mb-1">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
        />
      </div>
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs text-gray-400 ml-1">{value.toFixed(0)}</span>
    </div>
  );
}
