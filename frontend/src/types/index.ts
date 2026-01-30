// Core data types for the Coaching Trees Visualization Platform

export type Sport = 'NFL' | 'NBA' | 'Soccer';

export interface YearRange {
  start: number;
  end?: number;
}

export interface Team {
  name: string;
  years: YearRange;
  role: string;
  record?: {
    wins: number;
    losses: number;
    ties?: number;
  };
}

export interface CoachRelationship {
  coachId: string;
  coachName: string;
  team: string;
  years: YearRange;
  role: 'head_coach' | 'assistant' | 'coordinator' | 'position_coach' | 'player';
}

export interface Coach {
  id: string;
  name: string;
  sport: Sport;
  currentTeam?: string;
  formerTeams: Team[];
  yearsActive: YearRange;

  // Lineage
  mentors: CoachRelationship[];
  disciples: CoachRelationship[];

  // Achievements for ranking algorithm
  championships: number;
  coachOfYearAwards: number;
  playoffAppearances: number;
  winPercentage: number;
  allStarSelectionsCoached: number;

  // For soccer
  majorTrophies?: number;

  imageUrl?: string;
  bio?: string;
}

// Coaching Influence Score types
export interface CoachingTreeScore {
  coachId: string;
  coachName: string;
  sport: Sport;

  // Component scores (0-100 each)
  directSuccessScore: number;
  discipleSuccessScore: number;
  treeDepthScore: number;
  treeBreadthScore: number;
  longevityScore: number;

  // Final composite
  totalCIS: number;
  rank: number;
}

// Tree visualization types
export interface CoachTreeNode {
  id: string;
  name: string;
  role: string;
  years: string;
  imageUrl?: string;
  cisScore: number;
  isActive: boolean;
  sport: Sport;
  championships: number;
  children: CoachTreeNode[];
  parents: CoachTreeNode[];
}

// API response types
export interface CoachesResponse {
  coaches: Coach[];
  total: number;
  sport: Sport;
}

export interface TreeResponse {
  rootCoach: Coach;
  tree: CoachTreeNode;
  scores: CoachingTreeScore;
}

export interface RankingsResponse {
  rankings: CoachingTreeScore[];
  sport: Sport;
  lastUpdated: string;
}

export interface SearchResult {
  coach: Coach;
  score: CoachingTreeScore | null;
  matchType: 'name' | 'team' | 'era';
  highlights: string[];
}

// UI State types
export interface TreeVisualizationOptions {
  showMentors: boolean;
  maxGenerationsUp: number;
  maxGenerationsDown: number;
  colorScheme: 'default' | 'by-team' | 'by-era' | 'by-success';
}

export interface FilterOptions {
  sport: Sport | 'all';
  era?: string;
  minChampionships?: number;
  activeOnly?: boolean;
}
