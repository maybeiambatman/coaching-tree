'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Header from '@/components/ui/Header';
import { getCoachById, getCoachTree, getCISScore, getDisciples, getMentors } from '@/lib/data';
import Link from 'next/link';

// Dynamically import TreeVisualization to avoid SSR issues with React Flow
const TreeVisualization = dynamic(
  () => import('@/components/tree/TreeVisualization'),
  { ssr: false, loading: () => <TreeLoadingState /> }
);

function TreeLoadingState() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading tree visualization...</p>
      </div>
    </div>
  );
}

export default function TreePage() {
  const params = useParams();
  const router = useRouter();
  const coachId = params.coachId as string;

  const [showMentors, setShowMentors] = useState(true);
  const [maxGenerationsUp, setMaxGenerationsUp] = useState(2);
  const [maxGenerationsDown, setMaxGenerationsDown] = useState(3);

  const coach = useMemo(() => getCoachById(coachId), [coachId]);
  const treeData = useMemo(
    () => getCoachTree(coachId, maxGenerationsUp, maxGenerationsDown),
    [coachId, maxGenerationsUp, maxGenerationsDown]
  );
  const cisScore = useMemo(() => getCISScore(coachId), [coachId]);
  const disciples = useMemo(() => getDisciples(coachId), [coachId]);
  const mentors = useMemo(() => getMentors(coachId), [coachId]);

  if (!coach || !treeData) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Coach Not Found</h1>
            <p className="text-gray-400 mb-4">
              The coach you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link href="/">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Go Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleNodeClick = (clickedCoachId: string) => {
    if (clickedCoachId !== coachId) {
      router.push(`/tree/${clickedCoachId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto hidden lg:block"
        >
          <div className="p-6">
            {/* Coach Info */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {coach.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{coach.name}</h1>
                  <p className="text-gray-400 text-sm">{coach.sport}</p>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-4">
                {coach.currentTeam ? `Currently: ${coach.currentTeam}` : 'Retired'}
              </p>

              {cisScore && (
                <div className="bg-gray-900 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400 text-sm">CIS Score</span>
                    <span className="text-2xl font-bold text-white">
                      {cisScore.totalCIS.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Rank #{cisScore.rank} in {coach.sport}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatBox label="Championships" value={coach.championships} />
                <StatBox label="Disciples" value={disciples.length} />
                <StatBox label="Win %" value={`${(coach.winPercentage * 100).toFixed(0)}%`} />
                <StatBox label="Playoffs" value={coach.playoffAppearances} />
              </div>

              <Link href={`/coach/${coach.id}`}>
                <button className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  View Full Profile
                </button>
              </Link>
            </div>

            {/* Visualization Controls */}
            <div className="border-t border-gray-700 pt-6">
              <h3 className="text-sm font-medium text-white mb-4">Display Options</h3>

              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={showMentors}
                    onChange={(e) => setShowMentors(e.target.checked)}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-gray-300 text-sm">Show Mentors</span>
                </label>

                <div>
                  <label className="text-gray-400 text-sm block mb-2">
                    Generations Up: {maxGenerationsUp}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    value={maxGenerationsUp}
                    onChange={(e) => setMaxGenerationsUp(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm block mb-2">
                    Generations Down: {maxGenerationsDown}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={maxGenerationsDown}
                    onChange={(e) => setMaxGenerationsDown(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Quick Links */}
            {mentors.length > 0 && (
              <div className="border-t border-gray-700 pt-6 mt-6">
                <h3 className="text-sm font-medium text-white mb-3">Mentors</h3>
                <div className="space-y-2">
                  {mentors.map((mentor) => (
                    <Link
                      key={mentor.id}
                      href={`/tree/${mentor.id}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium text-white">
                        {mentor.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <span className="text-gray-300 text-sm">{mentor.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {disciples.length > 0 && (
              <div className="border-t border-gray-700 pt-6 mt-6">
                <h3 className="text-sm font-medium text-white mb-3">
                  Top Disciples ({disciples.length})
                </h3>
                <div className="space-y-2">
                  {disciples.slice(0, 5).map((disciple) => (
                    <Link
                      key={disciple.id}
                      href={`/tree/${disciple.id}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium text-white">
                        {disciple.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <span className="text-gray-300 text-sm">{disciple.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.aside>

        {/* Tree Visualization */}
        <main className="flex-1 relative">
          <TreeVisualization
            rootCoachId={coachId}
            data={treeData}
            showMentors={showMentors}
            maxGenerationsUp={maxGenerationsUp}
            maxGenerationsDown={maxGenerationsDown}
            onNodeClick={handleNodeClick}
          />

          {/* Mobile coach info overlay */}
          <div className="lg:hidden absolute bottom-4 left-4 right-4">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-gray-800/95 backdrop-blur-sm rounded-xl p-4 border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-white">{coach.name}</h2>
                  <p className="text-gray-400 text-sm">{coach.sport}</p>
                </div>
                {cisScore && (
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">
                      {cisScore.totalCIS.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">CIS Score</div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-900 rounded-lg p-3 text-center">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
