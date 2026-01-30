'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/ui/Header';
import SportSelector from '@/components/ui/SportSelector';
import { getCISRankingsBySport, getCoachById } from '@/lib/data';
import { Sport, CoachingTreeScore } from '@/types';

type SortKey = 'rank' | 'totalCIS' | 'directSuccessScore' | 'discipleSuccessScore' | 'treeDepthScore' | 'treeBreadthScore' | 'longevityScore';

export default function RankingsPage() {
  const params = useParams();
  const router = useRouter();
  const sport = (params.sport as string).toUpperCase() as Sport;

  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const rankings = useMemo(() => {
    const scores = getCISRankingsBySport(sport);
    const sorted = [...scores].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const direction = sortDirection === 'asc' ? 1 : -1;
      return (aVal - bVal) * direction;
    });
    return sorted;
  }, [sport, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection(key === 'rank' ? 'asc' : 'desc');
    }
  };

  const handleSportChange = (newSport: Sport | 'all') => {
    if (newSport !== 'all') {
      router.push(`/rankings/${newSport}`);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Rank', 'Name', 'CIS Score', 'Direct Success', 'Disciple Success', 'Tree Depth', 'Tree Breadth', 'Longevity'];
    const rows = rankings.map((r) => [
      r.rank,
      r.coachName,
      r.totalCIS.toFixed(1),
      r.directSuccessScore.toFixed(1),
      r.discipleSuccessScore.toFixed(1),
      r.treeDepthScore.toFixed(1),
      r.treeBreadthScore.toFixed(1),
      r.longevityScore.toFixed(1),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coaching-rankings-${sport}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {sport} Coaching Rankings
            </h1>
            <p className="text-gray-400 mt-1">
              Coaches ranked by Coaching Influence Score (CIS)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <SportSelector
              selected={sport}
              onChange={handleSportChange}
              showAll={false}
            />
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Rankings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900/50">
                  <SortableHeader
                    label="Rank"
                    sortKey="rank"
                    currentSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">
                    Coach
                  </th>
                  <SortableHeader
                    label="CIS Score"
                    sortKey="totalCIS"
                    currentSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Direct"
                    sortKey="directSuccessScore"
                    currentSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="hidden md:table-cell"
                  />
                  <SortableHeader
                    label="Disciples"
                    sortKey="discipleSuccessScore"
                    currentSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="hidden md:table-cell"
                  />
                  <SortableHeader
                    label="Depth"
                    sortKey="treeDepthScore"
                    currentSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="hidden lg:table-cell"
                  />
                  <SortableHeader
                    label="Breadth"
                    sortKey="treeBreadthScore"
                    currentSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="hidden lg:table-cell"
                  />
                  <SortableHeader
                    label="Longevity"
                    sortKey="longevityScore"
                    currentSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="hidden lg:table-cell"
                  />
                  <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((score, index) => (
                  <RankingRow
                    key={score.coachId}
                    score={score}
                    index={index}
                    isExpanded={expandedRow === score.coachId}
                    onToggle={() =>
                      setExpandedRow(
                        expandedRow === score.coachId ? null : score.coachId
                      )
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatSummary
            label="Total Coaches"
            value={rankings.length}
          />
          <StatSummary
            label="Avg CIS Score"
            value={
              rankings.length > 0
                ? (rankings.reduce((acc, r) => acc + r.totalCIS, 0) / rankings.length).toFixed(1)
                : '0'
            }
          />
          <StatSummary
            label="Highest CIS"
            value={rankings.length > 0 ? rankings[0].totalCIS.toFixed(1) : '0'}
          />
          <StatSummary
            label="Top Coach"
            value={rankings.length > 0 ? rankings[0].coachName : '-'}
          />
        </div>
      </main>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  currentSortKey,
  direction,
  onSort,
  className = '',
}: {
  label: string;
  sortKey: SortKey;
  currentSortKey: SortKey;
  direction: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = sortKey === currentSortKey;

  return (
    <th
      className={`px-4 py-3 text-left text-gray-400 text-sm font-medium cursor-pointer hover:text-white transition-colors ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className={isActive ? 'text-blue-400' : 'text-gray-600'}>
          {isActive && direction === 'asc' ? '↑' : '↓'}
        </span>
      </div>
    </th>
  );
}

function RankingRow({
  score,
  index,
  isExpanded,
  onToggle,
}: {
  score: CoachingTreeScore;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const coach = getCoachById(score.coachId);
  const rankMedals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.02 }}
        className="border-t border-gray-700 hover:bg-gray-700/30 cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-4 text-center">
          {rankMedals[score.rank] || (
            <span className="text-gray-400">#{score.rank}</span>
          )}
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium text-white">
              {score.coachName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div>
              <div className="text-white font-medium">{score.coachName}</div>
              {coach && (
                <div className="text-gray-500 text-xs">
                  {coach.currentTeam || coach.formerTeams[0]?.name || 'Retired'}
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-4">
          <span className="text-xl font-bold text-white">
            {score.totalCIS.toFixed(1)}
          </span>
        </td>
        <td className="px-4 py-4 hidden md:table-cell text-gray-300">
          {score.directSuccessScore.toFixed(1)}
        </td>
        <td className="px-4 py-4 hidden md:table-cell text-gray-300">
          {score.discipleSuccessScore.toFixed(1)}
        </td>
        <td className="px-4 py-4 hidden lg:table-cell text-gray-300">
          {score.treeDepthScore.toFixed(1)}
        </td>
        <td className="px-4 py-4 hidden lg:table-cell text-gray-300">
          {score.treeBreadthScore.toFixed(1)}
        </td>
        <td className="px-4 py-4 hidden lg:table-cell text-gray-300">
          {score.longevityScore.toFixed(1)}
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            <Link
              href={`/coach/${score.coachId}`}
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              Profile
            </Link>
            <Link
              href={`/tree/${score.coachId}`}
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
            >
              Tree
            </Link>
          </div>
        </td>
      </motion.tr>

      {/* Expanded details for mobile */}
      {isExpanded && (
        <tr className="md:hidden">
          <td colSpan={9} className="px-4 py-4 bg-gray-900/50">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-500 text-xs">Direct Success</div>
                <div className="text-white">{score.directSuccessScore.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Disciple Success</div>
                <div className="text-white">{score.discipleSuccessScore.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Tree Depth</div>
                <div className="text-white">{score.treeDepthScore.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Tree Breadth</div>
                <div className="text-white">{score.treeBreadthScore.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Longevity</div>
                <div className="text-white">{score.longevityScore.toFixed(1)}</div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function StatSummary({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 text-center">
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-gray-500 text-sm">{label}</div>
    </div>
  );
}
