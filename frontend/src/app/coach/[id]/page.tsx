'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/ui/Header';
import {
  getCoachById,
  getCISScore,
  getDisciples,
  getMentors,
  getCoachingSiblings,
} from '@/lib/data';
import { Sport } from '@/types';

const sportBadgeColors: Record<Sport, string> = {
  NFL: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  NBA: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Soccer: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export default function CoachProfilePage() {
  const params = useParams();
  const coachId = params.id as string;

  const coach = useMemo(() => getCoachById(coachId), [coachId]);
  const cisScore = useMemo(() => getCISScore(coachId), [coachId]);
  const disciples = useMemo(() => getDisciples(coachId), [coachId]);
  const mentors = useMemo(() => getMentors(coachId), [coachId]);
  const siblings = useMemo(() => getCoachingSiblings(coachId), [coachId]);

  if (!coach) {
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

  const currentYear = new Date().getFullYear();
  const isActive = !coach.yearsActive.end || coach.yearsActive.end >= currentYear;

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-2xl p-6 md:p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center mx-auto md:mx-0">
                <span className="text-4xl font-bold text-white">
                  {coach.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{coach.name}</h1>
                <span
                  className={`
                    px-3 py-1 text-sm font-medium rounded-full border
                    ${sportBadgeColors[coach.sport]}
                  `}
                >
                  {coach.sport}
                </span>
                {isActive && (
                  <span className="flex items-center gap-1 text-green-400 text-sm">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Active
                  </span>
                )}
              </div>

              <p className="text-gray-400 mb-4">
                {coach.currentTeam ? `Currently: ${coach.currentTeam}` : 'Retired'}
                {' • '}
                {coach.yearsActive.start}-{coach.yearsActive.end || 'Present'}
              </p>

              {coach.bio && (
                <p className="text-gray-300 mb-6 max-w-2xl">{coach.bio}</p>
              )}

              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <Link href={`/tree/${coach.id}`}>
                  <button className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    View Coaching Tree
                  </button>
                </Link>
              </div>
            </div>

            {/* CIS Score */}
            {cisScore && (
              <div className="flex-shrink-0 bg-gray-900 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-white mb-1">
                  {cisScore.totalCIS.toFixed(1)}
                </div>
                <div className="text-gray-400 text-sm mb-3">CIS Score</div>
                <div className="text-sm">
                  <span className="text-gray-500">Rank </span>
                  <span className="text-white font-medium">#{cisScore.rank}</span>
                  <span className="text-gray-500"> in {coach.sport}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Stats & Career */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 rounded-2xl p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">Career Stats</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                  label="Championships"
                  value={coach.championships}
                  icon="🏆"
                />
                <StatCard
                  label="Coach of Year"
                  value={coach.coachOfYearAwards}
                  icon="🏅"
                />
                <StatCard
                  label="Playoff Apps"
                  value={coach.playoffAppearances}
                  icon="📈"
                />
                <StatCard
                  label="Win %"
                  value={`${(coach.winPercentage * 100).toFixed(1)}%`}
                  icon="📊"
                />
              </div>
            </motion.div>

            {/* CIS Breakdown */}
            {cisScore && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800 rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">
                  CIS Score Breakdown
                </h2>
                <div className="space-y-4">
                  <ScoreBar
                    label="Direct Success"
                    value={cisScore.directSuccessScore}
                    weight="20%"
                  />
                  <ScoreBar
                    label="Disciple Success"
                    value={cisScore.discipleSuccessScore}
                    weight="35%"
                  />
                  <ScoreBar
                    label="Tree Depth"
                    value={cisScore.treeDepthScore}
                    weight="15%"
                  />
                  <ScoreBar
                    label="Tree Breadth"
                    value={cisScore.treeBreadthScore}
                    weight="20%"
                  />
                  <ScoreBar
                    label="Longevity"
                    value={cisScore.longevityScore}
                    weight="10%"
                  />
                </div>
              </motion.div>
            )}

            {/* Career History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800 rounded-2xl p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">Career History</h2>
              <div className="space-y-4">
                {coach.formerTeams.map((team, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-2xl">
                      {coach.sport === 'NFL'
                        ? '🏈'
                        : coach.sport === 'NBA'
                        ? '🏀'
                        : '⚽'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{team.name}</h3>
                      <p className="text-sm text-gray-400">
                        {team.role} • {team.years.start}-{team.years.end || 'Present'}
                      </p>
                    </div>
                    {team.record && (
                      <div className="text-right">
                        <div className="text-white font-medium">
                          {team.record.wins}-{team.record.losses}
                          {team.record.ties !== undefined && `-${team.record.ties}`}
                        </div>
                        <div className="text-xs text-gray-500">Record</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Lineage */}
          <div className="space-y-8">
            {/* Mentors */}
            {mentors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800 rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">Mentors</h2>
                <div className="space-y-3">
                  {mentors.map((mentor) => (
                    <CoachLink key={mentor.id} coach={mentor} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Disciples */}
            {disciples.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800 rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">
                  Disciples ({disciples.length})
                </h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {disciples.map((disciple) => (
                    <CoachLink key={disciple.id} coach={disciple} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Coaching Siblings */}
            {siblings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-800 rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">
                  Coaching Siblings
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                  Others who trained under the same mentor
                </p>
                <div className="space-y-3">
                  {siblings.slice(0, 5).map((sibling) => (
                    <CoachLink key={sibling.id} coach={sibling} />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  weight,
}: {
  label: string;
  value: number;
  weight: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-300 text-sm">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">{weight}</span>
          <span className="text-white font-medium">{value.toFixed(1)}</span>
        </div>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
        />
      </div>
    </div>
  );
}

function CoachLink({ coach }: { coach: { id: string; name: string; sport: Sport; championships: number } }) {
  const cisScore = getCISScore(coach.id);

  return (
    <Link href={`/coach/${coach.id}`}>
      <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium text-white">
          {coach.name
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium truncate">{coach.name}</span>
            {coach.championships > 0 && (
              <span className="text-yellow-500 text-sm">
                🏆 {coach.championships}
              </span>
            )}
          </div>
          <span className="text-gray-500 text-xs">{coach.sport}</span>
        </div>
        {cisScore && (
          <span className="text-gray-400 text-sm">
            {cisScore.totalCIS.toFixed(1)}
          </span>
        )}
      </div>
    </Link>
  );
}
