'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/ui/Header';
import SearchBar from '@/components/search/SearchBar';
import SportSelector from '@/components/ui/SportSelector';
import { searchCoaches } from '@/lib/search';
import { Sport, SearchResult } from '@/types';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [selectedSport, setSelectedSport] = useState<Sport | 'all'>('all');

  const results = useMemo(() => {
    if (!query) return [];
    return searchCoaches(query, { sport: selectedSport, limit: 50 });
  }, [query, selectedSport]);

  const sportCounts = useMemo(() => {
    if (!query) return { NFL: 0, NBA: 0, Soccer: 0, all: 0 };
    const allResults = searchCoaches(query, { limit: 100 });
    return {
      NFL: allResults.filter((r) => r.coach.sport === 'NFL').length,
      NBA: allResults.filter((r) => r.coach.sport === 'NBA').length,
      Soccer: allResults.filter((r) => r.coach.sport === 'Soccer').length,
      all: allResults.length,
    };
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <div className="max-w-2xl mb-6">
            <SearchBar placeholder="Search coaches, teams..." autoFocus />
          </div>

          {query && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Search Results for &quot;{query}&quot;
                </h1>
                <p className="text-gray-400 mt-1">
                  Found {sportCounts.all} results
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FilterButton
                  label="All"
                  count={sportCounts.all}
                  isActive={selectedSport === 'all'}
                  onClick={() => setSelectedSport('all')}
                />
                <FilterButton
                  label="NFL"
                  count={sportCounts.NFL}
                  isActive={selectedSport === 'NFL'}
                  onClick={() => setSelectedSport('NFL')}
                  color="blue"
                />
                <FilterButton
                  label="NBA"
                  count={sportCounts.NBA}
                  isActive={selectedSport === 'NBA'}
                  onClick={() => setSelectedSport('NBA')}
                  color="orange"
                />
                <FilterButton
                  label="Soccer"
                  count={sportCounts.Soccer}
                  isActive={selectedSport === 'Soccer'}
                  onClick={() => setSelectedSport('Soccer')}
                  color="green"
                />
              </div>
            </div>
          )}
        </div>

        {/* No query state */}
        {!query && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-white mb-2">
              Search for Coaches
            </h2>
            <p className="text-gray-400">
              Enter a coach name, team, or era to search
            </p>
          </div>
        )}

        {/* No results state */}
        {query && results.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-xl font-bold text-white mb-2">No Results Found</h2>
            <p className="text-gray-400 mb-4">
              No coaches found matching &quot;{query}&quot;
            </p>
            <p className="text-gray-500 text-sm">
              Try searching for a different name or team
            </p>
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 && (
          <div className="grid gap-4">
            {results.map((result, index) => (
              <SearchResultCard key={result.coach.id} result={result} index={index} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}

function FilterButton({
  label,
  count,
  isActive,
  onClick,
  color,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  color?: 'blue' | 'orange' | 'green';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
        ${
          isActive
            ? color
              ? colorClasses[color]
              : 'bg-white/10 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }
        ${isActive ? 'border' : ''}
      `}
    >
      {label} ({count})
    </button>
  );
}

function SearchResultCard({
  result,
  index,
}: {
  result: SearchResult;
  index: number;
}) {
  const { coach, score, matchType, highlights } = result;

  const sportColors: Record<Sport, string> = {
    NFL: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    NBA: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    Soccer: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link href={`/coach/${coach.id}`}>
        <div className="bg-gray-800 rounded-xl p-5 hover:bg-gray-700/80 transition-colors cursor-pointer border border-gray-700 hover:border-gray-600">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-white">
                {coach.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white truncate">
                  {coach.name}
                </h3>
                <span
                  className={`
                    px-2 py-0.5 text-xs font-medium rounded-full border
                    ${sportColors[coach.sport]}
                  `}
                >
                  {coach.sport}
                </span>
                {coach.championships > 0 && (
                  <span className="text-yellow-500 text-sm">
                    🏆 {coach.championships}
                  </span>
                )}
              </div>

              <p className="text-gray-400 text-sm mb-2">
                {coach.currentTeam || coach.formerTeams[0]?.name || 'Retired'}
                {' • '}
                {coach.yearsActive.start}-{coach.yearsActive.end || 'Present'}
              </p>

              {/* Highlights */}
              <div className="flex flex-wrap gap-2">
                {highlights.slice(0, 3).map((highlight, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded"
                  >
                    {highlight}
                  </span>
                ))}
                <span className="px-2 py-0.5 bg-gray-900 text-gray-500 text-xs rounded">
                  Matched by {matchType}
                </span>
              </div>
            </div>

            {/* Score */}
            <div className="text-right flex-shrink-0">
              {score && (
                <>
                  <div className="text-2xl font-bold text-white">
                    {score.totalCIS.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">CIS Score</div>
                  <div className="text-xs text-gray-500">
                    #{score.rank} in {coach.sport}
                  </div>
                </>
              )}
            </div>

            {/* Arrow */}
            <svg
              className="w-5 h-5 text-gray-500 flex-shrink-0 self-center"
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

          {/* Quick actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
            <Link
              href={`/tree/${coach.id}`}
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-sm rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              View Tree
            </Link>
            <span className="px-3 py-1.5 bg-gray-700 text-gray-400 text-sm rounded-lg">
              {coach.disciples.length} disciples
            </span>
            <span className="px-3 py-1.5 bg-gray-700 text-gray-400 text-sm rounded-lg">
              {coach.mentors.length} mentors
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
