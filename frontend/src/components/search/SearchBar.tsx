'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  searchCoaches,
  getAutocompleteSuggestions,
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
} from '@/lib/search';
import { SearchResult, Sport } from '@/types';

interface SearchBarProps {
  placeholder?: string;
  sport?: Sport | 'all';
  onResultClick?: (result: SearchResult) => void;
  className?: string;
  autoFocus?: boolean;
}

export default function SearchBar({
  placeholder = 'Search coaches, teams...',
  sport = 'all',
  onResultClick,
  className = '',
  autoFocus = false,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<
    { text: string; type: 'coach' | 'team'; id?: string }[]
  >([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Handle search
  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([]);
        setSuggestions([]);
        return;
      }

      const searchResults = searchCoaches(searchQuery, { sport, limit: 8 });
      setResults(searchResults);

      const autoSuggestions = getAutocompleteSuggestions(searchQuery, 5);
      setSuggestions(autoSuggestions);
    },
    [sport]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.length + suggestions.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < totalItems - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : totalItems - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < results.length) {
            handleResultClick(results[selectedIndex]);
          } else {
            const suggestionIndex = selectedIndex - results.length;
            setQuery(suggestions[suggestionIndex].text);
          }
        } else if (query.length >= 2) {
          addRecentSearch(query);
          router.push(`/search?q=${encodeURIComponent(query)}`);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    addRecentSearch(result.coach.name);
    setIsOpen(false);
    setQuery('');

    if (onResultClick) {
      onResultClick(result);
    } else {
      router.push(`/coach/${result.coach.id}`);
    }
  };

  const handleRecentClick = (recent: string) => {
    setQuery(recent);
    handleSearch(recent);
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const sportColors: Record<Sport, string> = {
    NFL: 'text-blue-400',
    NBA: 'text-orange-400',
    Soccer: 'text-green-400',
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="
            w-full px-4 py-3 pl-12 pr-4
            bg-gray-800 border border-gray-700 rounded-xl
            text-white placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-all duration-200
          "
        />
        <svg
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (query.length > 0 || recentSearches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="
              absolute top-full left-0 right-0 mt-2 z-50
              bg-gray-800 border border-gray-700 rounded-xl
              shadow-2xl overflow-hidden max-h-96 overflow-y-auto
            "
          >
            {/* Recent searches (when no query) */}
            {query.length === 0 && recentSearches.length > 0 && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-medium">
                    RECENT SEARCHES
                  </span>
                  <button
                    onClick={handleClearRecent}
                    className="text-xs text-gray-500 hover:text-white"
                  >
                    Clear
                  </button>
                </div>
                {recentSearches.map((recent, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentClick(recent)}
                    className="
                      w-full text-left px-3 py-2 rounded-lg
                      text-gray-300 hover:bg-gray-700
                      flex items-center gap-2
                    "
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {recent}
                  </button>
                ))}
              </div>
            )}

            {/* Search results */}
            {results.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-xs text-gray-500 font-medium">
                  COACHES
                </div>
                {results.map((result, index) => (
                  <button
                    key={result.coach.id}
                    onClick={() => handleResultClick(result)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg
                      flex items-center gap-3
                      ${
                        selectedIndex === index
                          ? 'bg-gray-700'
                          : 'hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        bg-gradient-to-br from-gray-600 to-gray-800
                      `}
                    >
                      <span className="text-sm font-bold text-white">
                        {result.coach.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium truncate">
                          {result.coach.name}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            sportColors[result.coach.sport]
                          }`}
                        >
                          {result.coach.sport}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {result.highlights[0]}
                      </p>
                    </div>
                    {result.score && (
                      <div className="text-sm text-gray-400">
                        CIS: {result.score.totalCIS.toFixed(1)}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2 border-t border-gray-700">
                <div className="px-2 py-1 text-xs text-gray-500 font-medium">
                  SUGGESTIONS
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.text}`}
                    onClick={() => {
                      if (suggestion.id) {
                        router.push(`/coach/${suggestion.id}`);
                      } else {
                        setQuery(suggestion.text);
                      }
                    }}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg
                      flex items-center gap-2 text-gray-300
                      ${
                        selectedIndex === results.length + index
                          ? 'bg-gray-700'
                          : 'hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {suggestion.type === 'coach' ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      )}
                    </svg>
                    <span>{suggestion.text}</span>
                    <span className="text-xs text-gray-500 capitalize">
                      {suggestion.type}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {query.length >= 2 &&
              results.length === 0 &&
              suggestions.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No results found for &quot;{query}&quot;
                </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
