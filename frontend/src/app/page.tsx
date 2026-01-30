'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/ui/Header';
import SportSelector from '@/components/ui/SportSelector';
import RankingCard from '@/components/ui/RankingCard';
import SearchBar from '@/components/search/SearchBar';
import { Sport } from '@/types';
import { getTopCoachesBySport, getAllCISScores, getCoachById } from '@/lib/data';

export default function Home() {
  const [selectedSport, setSelectedSport] = useState<Sport | 'all'>('NFL');

  const topCoaches = useMemo(() => {
    if (selectedSport === 'all') {
      const allScores = getAllCISScores().slice(0, 10);
      return allScores.map((score) => ({
        coach: getCoachById(score.coachId)!,
        score,
      }));
    }
    return getTopCoachesBySport(selectedSport, 10);
  }, [selectedSport]);

  // Featured coaches for hero section
  const featuredCoaches = [
    { name: 'Bill Belichick', sport: 'NFL', id: 'bill-belichick' },
    { name: 'Gregg Popovich', sport: 'NBA', id: 'gregg-popovich' },
    { name: 'Pep Guardiola', sport: 'Soccer', id: 'pep-guardiola' },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-purple-900/30 to-gray-900" />

        {/* Animated tree lines */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 1200 600">
            <motion.path
              d="M600 100 L400 200 L300 350 L200 500"
              stroke="url(#gradient1)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            />
            <motion.path
              d="M600 100 L800 200 L900 350 L1000 500"
              stroke="url(#gradient2)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 0.3, ease: 'easeInOut' }}
            />
            <motion.path
              d="M600 100 L600 250 L500 400"
              stroke="url(#gradient3)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 0.6, ease: 'easeInOut' }}
            />
            <motion.path
              d="M600 100 L600 250 L700 400"
              stroke="url(#gradient3)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 0.6, ease: 'easeInOut' }}
            />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
            {/* Nodes */}
            <motion.circle
              cx="600"
              cy="100"
              r="8"
              fill="#fff"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
            />
            <motion.circle
              cx="400"
              cy="200"
              r="6"
              fill="#3b82f6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1 }}
            />
            <motion.circle
              cx="800"
              cy="200"
              r="6"
              fill="#f97316"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.3 }}
            />
            <motion.circle
              cx="600"
              cy="250"
              r="6"
              fill="#22c55e"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.6 }}
            />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Explore the Roots of
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Coaching Greatness
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Discover the lineages, mentorships, and influence of the greatest coaches
              across NFL, NBA, and Soccer.
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto mb-12">
              <SearchBar
                placeholder="Search coaches, teams, or eras..."
                className="text-lg"
              />
            </div>

            {/* Featured Coaches */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <span className="text-gray-500 text-sm self-center">Featured:</span>
              {featuredCoaches.map((coach) => (
                <Link key={coach.id} href={`/tree/${coach.id}`}>
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className="
                      px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700
                      text-gray-300 text-sm hover:bg-gray-800 hover:text-white
                      cursor-pointer transition-colors
                    "
                  >
                    {coach.name} ({coach.sport})
                  </motion.span>
                </Link>
              ))}
            </div>

            {/* Random Tree Button */}
            <Link href="/tree/bill-belichick">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="
                  px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600
                  text-white font-medium shadow-lg hover:shadow-xl
                  transition-shadow
                "
              >
                Explore Random Tree
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Rankings Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Top Coaching Trees
            </h2>
            <p className="text-gray-400 mt-1">
              Ranked by Coaching Influence Score (CIS)
            </p>
          </div>
          <SportSelector
            selected={selectedSport}
            onChange={setSelectedSport}
            showAll={true}
          />
        </div>

        <div className="space-y-3">
          {topCoaches.map((item, index) => (
            <RankingCard
              key={item.coach.id}
              coach={item.coach}
              score={item.score}
              index={index}
            />
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href={`/rankings/${selectedSport === 'all' ? 'NFL' : selectedSport}`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="
                px-6 py-3 rounded-xl border border-gray-700
                text-gray-300 font-medium hover:bg-gray-800 hover:text-white
                transition-colors
              "
            >
              View Full Rankings
            </motion.button>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-800/30 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Stat value="40+" label="Coaches Tracked" />
            <Stat value="3" label="Sports Covered" />
            <Stat value="100+" label="Championship Wins" />
            <Stat value="5+" label="Generations Deep" />
          </div>
        </div>
      </section>

      {/* About CIS Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">
            About the Coaching Influence Score (CIS)
          </h2>
          <p className="text-gray-400 mb-6">
            The CIS algorithm measures a coach&apos;s overall influence based on five key factors:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <CISFactor
              title="Direct Success"
              weight="20%"
              description="Championships, awards, and win percentage"
            />
            <CISFactor
              title="Disciple Success"
              weight="35%"
              description="How well their coaching tree has performed"
            />
            <CISFactor
              title="Tree Depth"
              weight="15%"
              description="Number of generations in their tree"
            />
            <CISFactor
              title="Tree Breadth"
              weight="20%"
              description="Number of disciples who became head coaches"
            />
            <CISFactor
              title="Longevity"
              weight="10%"
              description="Years of coaching experience"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              Data last updated: {new Date().toLocaleDateString()}
            </p>
            <p className="text-gray-500 text-sm">
              Built with Next.js, React Flow, and Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </motion.div>
  );
}

function CISFactor({
  title,
  weight,
  description,
}: {
  title: string;
  weight: string;
  description: string;
}) {
  return (
    <div className="bg-gray-900/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-white text-sm">{title}</h3>
        <span className="text-blue-400 text-sm font-bold">{weight}</span>
      </div>
      <p className="text-gray-500 text-xs">{description}</p>
    </div>
  );
}
