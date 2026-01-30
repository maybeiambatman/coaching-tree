import { Coach, CoachingTreeScore, Sport } from '@/types';

// Configuration for the CIS algorithm
const CIS_WEIGHTS = {
  directSuccess: 0.20,
  discipleSuccess: 0.35,
  treeDepth: 0.15,
  treeBreadth: 0.20,
  longevity: 0.10,
};

const DECAY_FACTOR = 0.7;

// Helper function to normalize a value to 0-100 using min-max normalization
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

// Calculate Direct Success Score for a coach
export function calculateDirectSuccess(coach: Coach): number {
  const rawScore =
    coach.championships * 25 +
    coach.coachOfYearAwards * 15 +
    coach.playoffAppearances * 5 +
    coach.winPercentage * 30 +
    coach.allStarSelectionsCoached * 2 +
    (coach.majorTrophies || 0) * 3;

  // Normalize to 0-100 (using empirical max values)
  return Math.min(100, rawScore);
}

// Calculate tree depth recursively
export function calculateTreeDepth(
  coachId: string,
  coaches: Map<string, Coach>,
  visited: Set<string> = new Set()
): number {
  if (visited.has(coachId)) return 0;
  visited.add(coachId);

  const coach = coaches.get(coachId);
  if (!coach || coach.disciples.length === 0) return 0;

  let maxDepth = 0;
  for (const disciple of coach.disciples) {
    const depth = calculateTreeDepth(disciple.coachId, coaches, new Set(visited));
    maxDepth = Math.max(maxDepth, depth + 1);
  }

  return maxDepth;
}

// Calculate tree breadth (number of direct disciples who became head coaches)
export function calculateTreeBreadth(
  coach: Coach,
  coaches: Map<string, Coach>
): { directDisciplesAsHeadCoach: number; totalTreeSize: number } {
  let directDisciplesAsHeadCoach = 0;
  let totalTreeSize = 0;

  const countDescendants = (coachId: string, visited: Set<string>): number => {
    if (visited.has(coachId)) return 0;
    visited.add(coachId);

    const c = coaches.get(coachId);
    if (!c) return 0;

    let count = 1;
    for (const disciple of c.disciples) {
      count += countDescendants(disciple.coachId, visited);
    }
    return count;
  };

  for (const disciple of coach.disciples) {
    const discipleCoach = coaches.get(disciple.coachId);
    if (discipleCoach && discipleCoach.formerTeams.length > 0) {
      const hasHeadCoachRole = discipleCoach.formerTeams.some(
        (t) => t.role.toLowerCase().includes('head coach')
      );
      if (hasHeadCoachRole) {
        directDisciplesAsHeadCoach++;
      }
    }
  }

  totalTreeSize = countDescendants(coach.id, new Set()) - 1; // Subtract 1 for the coach themselves

  return { directDisciplesAsHeadCoach, totalTreeSize };
}

// Calculate Disciple Success Score with decay factor
export function calculateDiscipleSuccess(
  coach: Coach,
  coaches: Map<string, Coach>,
  generation: number = 1,
  visited: Set<string> = new Set()
): number {
  if (visited.has(coach.id) || generation > 5) return 0;
  visited.add(coach.id);

  let totalScore = 0;
  const decay = Math.pow(DECAY_FACTOR, generation);

  for (const disciple of coach.disciples) {
    const discipleCoach = coaches.get(disciple.coachId);
    if (discipleCoach) {
      const directSuccess = calculateDirectSuccess(discipleCoach);
      totalScore += directSuccess * decay;

      // Recursively calculate for disciples of disciples
      totalScore += calculateDiscipleSuccess(
        discipleCoach,
        coaches,
        generation + 1,
        new Set(visited)
      );
    }
  }

  return totalScore;
}

// Calculate longevity score
export function calculateLongevity(coach: Coach): number {
  const currentYear = new Date().getFullYear();
  const endYear = coach.yearsActive.end || currentYear;
  const yearsActive = endYear - coach.yearsActive.start;

  // Calculate years as head coach
  let yearsAsHeadCoach = 0;
  for (const team of coach.formerTeams) {
    const teamEndYear = team.years.end || currentYear;
    if (team.role.toLowerCase().includes('head coach')) {
      yearsAsHeadCoach += teamEndYear - team.years.start;
    }
  }

  const rawScore = yearsAsHeadCoach * 3 + yearsActive * 2;
  return Math.min(100, rawScore);
}

// Main function to calculate CIS for all coaches
export function calculateCISScores(coaches: Coach[]): CoachingTreeScore[] {
  const coachMap = new Map<string, Coach>();
  coaches.forEach((c) => coachMap.set(c.id, c));

  // First pass: calculate raw scores
  const rawScores: {
    coach: Coach;
    directSuccess: number;
    discipleSuccess: number;
    treeDepth: number;
    treeBreadth: number;
    longevity: number;
  }[] = [];

  for (const coach of coaches) {
    const directSuccess = calculateDirectSuccess(coach);
    const discipleSuccess = calculateDiscipleSuccess(coach, coachMap);
    const depth = calculateTreeDepth(coach.id, coachMap);
    const breadth = calculateTreeBreadth(coach, coachMap);
    const longevity = calculateLongevity(coach);

    rawScores.push({
      coach,
      directSuccess,
      discipleSuccess,
      treeDepth: Math.min(100, depth * 20), // 5+ generations = 100
      treeBreadth: Math.min(
        100,
        breadth.directDisciplesAsHeadCoach * 10 + breadth.totalTreeSize * 0.5
      ),
      longevity,
    });
  }

  // Find min/max for normalization
  const mins = {
    directSuccess: Math.min(...rawScores.map((s) => s.directSuccess)),
    discipleSuccess: Math.min(...rawScores.map((s) => s.discipleSuccess)),
    treeDepth: Math.min(...rawScores.map((s) => s.treeDepth)),
    treeBreadth: Math.min(...rawScores.map((s) => s.treeBreadth)),
    longevity: Math.min(...rawScores.map((s) => s.longevity)),
  };

  const maxs = {
    directSuccess: Math.max(...rawScores.map((s) => s.directSuccess)),
    discipleSuccess: Math.max(...rawScores.map((s) => s.discipleSuccess)),
    treeDepth: Math.max(...rawScores.map((s) => s.treeDepth)),
    treeBreadth: Math.max(...rawScores.map((s) => s.treeBreadth)),
    longevity: Math.max(...rawScores.map((s) => s.longevity)),
  };

  // Calculate normalized scores and total CIS
  const scores: CoachingTreeScore[] = rawScores.map((raw) => {
    const normalizedDirectSuccess = normalize(
      raw.directSuccess,
      mins.directSuccess,
      maxs.directSuccess
    );
    const normalizedDiscipleSuccess = normalize(
      raw.discipleSuccess,
      mins.discipleSuccess,
      maxs.discipleSuccess
    );
    const normalizedTreeDepth = normalize(
      raw.treeDepth,
      mins.treeDepth,
      maxs.treeDepth
    );
    const normalizedTreeBreadth = normalize(
      raw.treeBreadth,
      mins.treeBreadth,
      maxs.treeBreadth
    );
    const normalizedLongevity = normalize(
      raw.longevity,
      mins.longevity,
      maxs.longevity
    );

    const totalCIS =
      normalizedDirectSuccess * CIS_WEIGHTS.directSuccess +
      normalizedDiscipleSuccess * CIS_WEIGHTS.discipleSuccess +
      normalizedTreeDepth * CIS_WEIGHTS.treeDepth +
      normalizedTreeBreadth * CIS_WEIGHTS.treeBreadth +
      normalizedLongevity * CIS_WEIGHTS.longevity;

    return {
      coachId: raw.coach.id,
      coachName: raw.coach.name,
      sport: raw.coach.sport,
      directSuccessScore: Math.round(normalizedDirectSuccess * 10) / 10,
      discipleSuccessScore: Math.round(normalizedDiscipleSuccess * 10) / 10,
      treeDepthScore: Math.round(normalizedTreeDepth * 10) / 10,
      treeBreadthScore: Math.round(normalizedTreeBreadth * 10) / 10,
      longevityScore: Math.round(normalizedLongevity * 10) / 10,
      totalCIS: Math.round(totalCIS * 10) / 10,
      rank: 0, // Will be set after sorting
    };
  });

  // Sort by total CIS and assign ranks
  scores.sort((a, b) => b.totalCIS - a.totalCIS);
  scores.forEach((score, index) => {
    score.rank = index + 1;
  });

  return scores;
}

// Calculate CIS for a single sport
export function calculateCISForSport(
  coaches: Coach[],
  sport: Sport
): CoachingTreeScore[] {
  const sportCoaches = coaches.filter((c) => c.sport === sport);
  return calculateCISScores(sportCoaches);
}
