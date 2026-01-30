import Fuse, { IFuseOptions } from 'fuse.js';
import { Coach, SearchResult, Sport } from '@/types';
import { getAllCoaches, getCISScore } from './data';

// Fuse.js configuration for fuzzy search
const fuseOptions: IFuseOptions<Coach> = {
  keys: [
    { name: 'name', weight: 2 },
    { name: 'currentTeam', weight: 1.5 },
    { name: 'formerTeams.name', weight: 1 },
    { name: 'sport', weight: 0.5 },
    { name: 'bio', weight: 0.3 },
  ],
  threshold: 0.4, // Allow some fuzziness
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
};

let fuseInstance: Fuse<Coach> | null = null;

function getFuseInstance(): Fuse<Coach> {
  if (!fuseInstance) {
    fuseInstance = new Fuse(getAllCoaches(), fuseOptions);
  }
  return fuseInstance;
}

// Main search function
export function searchCoaches(
  query: string,
  options?: {
    sport?: Sport | 'all';
    limit?: number;
  }
): SearchResult[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const fuse = getFuseInstance();
  const results = fuse.search(query.trim());

  // Filter by sport if specified
  let filteredResults = results;
  if (options?.sport && options.sport !== 'all') {
    filteredResults = results.filter((r) => r.item.sport === options.sport);
  }

  // Limit results
  const limit = options?.limit || 20;
  const limitedResults = filteredResults.slice(0, limit);

  // Transform to SearchResult format
  return limitedResults.map((result) => {
    const coach = result.item;
    const score = getCISScore(coach.id);

    // Determine match type based on what matched
    let matchType: 'name' | 'team' | 'era' = 'name';
    const highlights: string[] = [];

    if (result.matches) {
      for (const match of result.matches) {
        if (match.key === 'name') {
          matchType = 'name';
          highlights.push(`Name: ${coach.name}`);
        } else if (match.key === 'currentTeam' || match.key === 'formerTeams.name') {
          matchType = 'team';
          if (coach.currentTeam) {
            highlights.push(`Current: ${coach.currentTeam}`);
          }
          coach.formerTeams.slice(0, 2).forEach((t) => {
            highlights.push(`${t.name} (${t.years.start}-${t.years.end || 'Present'})`);
          });
        }
      }
    }

    // Check for era-based queries
    const eraMatch = query.match(/(\d{4})s?/);
    if (eraMatch) {
      const decade = parseInt(eraMatch[1]);
      if (
        coach.yearsActive.start <= decade + 9 &&
        (!coach.yearsActive.end || coach.yearsActive.end >= decade)
      ) {
        matchType = 'era';
        highlights.push(`Active: ${coach.yearsActive.start}-${coach.yearsActive.end || 'Present'}`);
      }
    }

    return {
      coach,
      score: score || null,
      matchType,
      highlights: highlights.length > 0 ? highlights : [`${coach.sport} coach`],
    };
  });
}

// Autocomplete suggestions
export function getAutocompleteSuggestions(
  query: string,
  limit: number = 8
): { text: string; type: 'coach' | 'team'; id?: string }[] {
  if (!query || query.trim().length < 1) {
    return [];
  }

  const suggestions: { text: string; type: 'coach' | 'team'; id?: string }[] = [];
  const coaches = getAllCoaches();
  const queryLower = query.toLowerCase();

  // Search coach names
  for (const coach of coaches) {
    if (coach.name.toLowerCase().includes(queryLower)) {
      suggestions.push({
        text: coach.name,
        type: 'coach',
        id: coach.id,
      });
    }

    if (suggestions.length >= limit) break;
  }

  // Search team names if we haven't hit the limit
  if (suggestions.length < limit) {
    const teamSet = new Set<string>();
    for (const coach of coaches) {
      if (coach.currentTeam?.toLowerCase().includes(queryLower)) {
        teamSet.add(coach.currentTeam);
      }
      for (const team of coach.formerTeams) {
        if (team.name.toLowerCase().includes(queryLower)) {
          teamSet.add(team.name);
        }
      }
    }

    for (const team of teamSet) {
      if (suggestions.length >= limit) break;
      suggestions.push({ text: team, type: 'team' });
    }
  }

  return suggestions.slice(0, limit);
}

// Store recent searches in localStorage
const RECENT_SEARCHES_KEY = 'coaching-tree-recent-searches';
const MAX_RECENT_SEARCHES = 10;

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): void {
  if (typeof window === 'undefined' || !query.trim()) return;

  try {
    const recent = getRecentSearches();
    const filtered = recent.filter((s) => s.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore localStorage errors
  }
}
