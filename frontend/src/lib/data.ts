import { Coach, CoachingTreeScore, CoachTreeNode, Sport } from '@/types';
import { calculateCISScores, calculateDirectSuccess } from './cis-algorithm';

// Import coach data
import nflCoachesData from '@/data/nfl/coaches.json';
import nbaCoachesData from '@/data/nba/coaches.json';
import soccerCoachesData from '@/data/soccer/coaches.json';

// Type assertion for imported data
const nflCoaches = nflCoachesData.coaches as Coach[];
const nbaCoaches = nbaCoachesData.coaches as Coach[];
const soccerCoaches = soccerCoachesData.coaches as Coach[];

// Combine all coaches
const allCoaches: Coach[] = [...nflCoaches, ...nbaCoaches, ...soccerCoaches];

// Create a map for quick lookups
const coachMap = new Map<string, Coach>();
allCoaches.forEach((coach) => coachMap.set(coach.id, coach));

// Pre-calculate CIS scores for all coaches
let cachedCISScores: Map<string, CoachingTreeScore> | null = null;

function getCISScoresMap(): Map<string, CoachingTreeScore> {
  if (!cachedCISScores) {
    const scores = calculateCISScores(allCoaches);
    cachedCISScores = new Map();
    scores.forEach((score) => cachedCISScores!.set(score.coachId, score));
  }
  return cachedCISScores;
}

// Get all coaches
export function getAllCoaches(): Coach[] {
  return allCoaches;
}

// Get coaches by sport
export function getCoachesBySport(sport: Sport): Coach[] {
  return allCoaches.filter((c) => c.sport === sport);
}

// Get a single coach by ID
export function getCoachById(id: string): Coach | undefined {
  return coachMap.get(id);
}

// Get CIS score for a coach
export function getCISScore(coachId: string): CoachingTreeScore | undefined {
  return getCISScoresMap().get(coachId);
}

// Get all CIS scores
export function getAllCISScores(): CoachingTreeScore[] {
  return Array.from(getCISScoresMap().values()).sort((a, b) => a.rank - b.rank);
}

// Get CIS rankings by sport
export function getCISRankingsBySport(sport: Sport): CoachingTreeScore[] {
  const sportScores = calculateCISScores(getCoachesBySport(sport));
  return sportScores;
}

// Build a tree node structure for visualization
export function buildTreeNode(
  coachId: string,
  maxDepthUp: number = 2,
  maxDepthDown: number = 3,
  currentDepthUp: number = 0,
  currentDepthDown: number = 0,
  visited: Set<string> = new Set()
): CoachTreeNode | null {
  if (visited.has(coachId)) return null;
  visited.add(coachId);

  const coach = coachMap.get(coachId);
  if (!coach) return null;

  const cisScore = getCISScore(coachId);
  const currentYear = new Date().getFullYear();
  const isActive = !coach.yearsActive.end || coach.yearsActive.end >= currentYear;

  const yearsRange = coach.yearsActive.end
    ? `${coach.yearsActive.start}-${coach.yearsActive.end}`
    : `${coach.yearsActive.start}-Present`;

  // Build parent nodes (mentors)
  const parents: CoachTreeNode[] = [];
  if (currentDepthUp < maxDepthUp) {
    for (const mentor of coach.mentors) {
      const parentNode = buildTreeNode(
        mentor.coachId,
        maxDepthUp,
        0, // Don't show children of mentors
        currentDepthUp + 1,
        0,
        new Set(visited)
      );
      if (parentNode) {
        parents.push(parentNode);
      }
    }
  }

  // Build child nodes (disciples)
  const children: CoachTreeNode[] = [];
  if (currentDepthDown < maxDepthDown) {
    for (const disciple of coach.disciples) {
      const childNode = buildTreeNode(
        disciple.coachId,
        0, // Don't show parents of disciples
        maxDepthDown,
        0,
        currentDepthDown + 1,
        new Set(visited)
      );
      if (childNode) {
        children.push(childNode);
      }
    }
  }

  // Determine the primary role
  const role =
    coach.currentTeam
      ? `Head Coach, ${coach.currentTeam}`
      : coach.formerTeams.length > 0
      ? coach.formerTeams[0].role
      : 'Coach';

  return {
    id: coach.id,
    name: coach.name,
    role,
    years: yearsRange,
    imageUrl: coach.imageUrl,
    cisScore: cisScore?.totalCIS || 0,
    isActive,
    sport: coach.sport,
    championships: coach.championships,
    children,
    parents,
  };
}

// Get tree data for a specific coach
export function getCoachTree(
  coachId: string,
  maxDepthUp: number = 2,
  maxDepthDown: number = 3
): CoachTreeNode | null {
  return buildTreeNode(coachId, maxDepthUp, maxDepthDown);
}

// Get top coaches by CIS for a sport
export function getTopCoachesBySport(
  sport: Sport,
  limit: number = 10
): { coach: Coach; score: CoachingTreeScore }[] {
  const rankings = getCISRankingsBySport(sport);
  return rankings.slice(0, limit).map((score) => ({
    coach: coachMap.get(score.coachId)!,
    score,
  }));
}

// Get mentors for a coach
export function getMentors(coachId: string): Coach[] {
  const coach = coachMap.get(coachId);
  if (!coach) return [];

  return coach.mentors
    .map((m) => coachMap.get(m.coachId))
    .filter((c): c is Coach => c !== undefined);
}

// Get disciples for a coach
export function getDisciples(coachId: string): Coach[] {
  const coach = coachMap.get(coachId);
  if (!coach) return [];

  return coach.disciples
    .map((d) => coachMap.get(d.coachId))
    .filter((c): c is Coach => c !== undefined);
}

// Get coaching siblings (coaches who share the same mentor)
export function getCoachingSiblings(coachId: string): Coach[] {
  const coach = coachMap.get(coachId);
  if (!coach || coach.mentors.length === 0) return [];

  const siblingIds = new Set<string>();

  for (const mentor of coach.mentors) {
    const mentorCoach = coachMap.get(mentor.coachId);
    if (mentorCoach) {
      for (const disciple of mentorCoach.disciples) {
        if (disciple.coachId !== coachId) {
          siblingIds.add(disciple.coachId);
        }
      }
    }
  }

  return Array.from(siblingIds)
    .map((id) => coachMap.get(id))
    .filter((c): c is Coach => c !== undefined);
}

// Get the last updated timestamp
export function getLastUpdated(): string {
  return new Date().toISOString();
}
