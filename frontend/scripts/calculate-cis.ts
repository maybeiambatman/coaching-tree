/**
 * Calculate Coaching Influence Scores (CIS)
 *
 * Runs the CIS algorithm on all coaches and outputs rankings.
 *
 * CIS = (DirectSuccess × 0.20) +
 *       (DiscipleSuccess × 0.35) +
 *       (TreeDepth × 0.15) +
 *       (TreeBreadth × 0.20) +
 *       (Longevity × 0.10)
 *
 * Usage: npx ts-node scripts/calculate-cis.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// CIS Algorithm weights
const CIS_WEIGHTS = {
  directSuccess: 0.20,
  discipleSuccess: 0.35,
  treeDepth: 0.15,
  treeBreadth: 0.20,
  longevity: 0.10,
};

const DECAY_FACTOR = 0.7;

// Types (simplified from main types)
interface Coach {
  id: string;
  name: string;
  sport: string;
  formerTeams: {
    name: string;
    years: { start: number; end?: number };
    role: string;
    record?: { wins: number; losses: number };
  }[];
  yearsActive: { start: number; end?: number };
  mentors: { coachId: string; coachName: string }[];
  disciples: { coachId: string; coachName: string }[];
  championships: number;
  coachOfYearAwards: number;
  playoffAppearances: number;
  winPercentage: number;
  allStarSelectionsCoached: number;
  majorTrophies?: number;
}

interface CISScore {
  coachId: string;
  coachName: string;
  sport: string;
  directSuccessScore: number;
  discipleSuccessScore: number;
  treeDepthScore: number;
  treeBreadthScore: number;
  longevityScore: number;
  totalCIS: number;
  rank: number;
}

// Normalize value to 0-100
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

// Calculate direct success score
function calculateDirectSuccess(coach: Coach): number {
  const rawScore =
    coach.championships * 25 +
    coach.coachOfYearAwards * 15 +
    coach.playoffAppearances * 5 +
    coach.winPercentage * 30 +
    coach.allStarSelectionsCoached * 2 +
    (coach.majorTrophies || 0) * 3;

  return Math.min(100, rawScore);
}

// Calculate tree depth
function calculateTreeDepth(
  coachId: string,
  coachMap: Map<string, Coach>,
  visited: Set<string> = new Set()
): number {
  if (visited.has(coachId)) return 0;
  visited.add(coachId);

  const coach = coachMap.get(coachId);
  if (!coach || coach.disciples.length === 0) return 0;

  let maxDepth = 0;
  for (const disciple of coach.disciples) {
    const depth = calculateTreeDepth(disciple.coachId, coachMap, new Set(visited));
    maxDepth = Math.max(maxDepth, depth + 1);
  }

  return maxDepth;
}

// Calculate tree breadth
function calculateTreeBreadth(
  coach: Coach,
  coachMap: Map<string, Coach>
): { directDisciplesAsHeadCoach: number; totalTreeSize: number } {
  let directDisciplesAsHeadCoach = 0;

  for (const disciple of coach.disciples) {
    const discipleCoach = coachMap.get(disciple.coachId);
    if (discipleCoach) {
      const hasHeadCoachRole = discipleCoach.formerTeams.some((t) =>
        t.role.toLowerCase().includes('head coach')
      );
      if (hasHeadCoachRole) {
        directDisciplesAsHeadCoach++;
      }
    }
  }

  // Count total tree size
  const countDescendants = (id: string, seen: Set<string>): number => {
    if (seen.has(id)) return 0;
    seen.add(id);

    const c = coachMap.get(id);
    if (!c) return 0;

    let count = 1;
    for (const d of c.disciples) {
      count += countDescendants(d.coachId, seen);
    }
    return count;
  };

  const totalTreeSize = countDescendants(coach.id, new Set()) - 1;

  return { directDisciplesAsHeadCoach, totalTreeSize };
}

// Calculate disciple success with decay
function calculateDiscipleSuccess(
  coach: Coach,
  coachMap: Map<string, Coach>,
  generation: number = 1,
  visited: Set<string> = new Set()
): number {
  if (visited.has(coach.id) || generation > 5) return 0;
  visited.add(coach.id);

  let totalScore = 0;
  const decay = Math.pow(DECAY_FACTOR, generation);

  for (const disciple of coach.disciples) {
    const discipleCoach = coachMap.get(disciple.coachId);
    if (discipleCoach) {
      const directSuccess = calculateDirectSuccess(discipleCoach);
      totalScore += directSuccess * decay;

      totalScore += calculateDiscipleSuccess(
        discipleCoach,
        coachMap,
        generation + 1,
        new Set(visited)
      );
    }
  }

  return totalScore;
}

// Calculate longevity
function calculateLongevity(coach: Coach): number {
  const currentYear = new Date().getFullYear();
  const endYear = coach.yearsActive.end || currentYear;
  const yearsActive = endYear - coach.yearsActive.start;

  let yearsAsHeadCoach = 0;
  for (const team of coach.formerTeams) {
    if (team.role.toLowerCase().includes('head coach')) {
      const teamEnd = team.years.end || currentYear;
      yearsAsHeadCoach += teamEnd - team.years.start;
    }
  }

  const rawScore = yearsAsHeadCoach * 3 + yearsActive * 2;
  return Math.min(100, rawScore);
}

// Main CIS calculation
function calculateAllCIS(coaches: Coach[]): CISScore[] {
  console.log(`Calculating CIS for ${coaches.length} coaches...`);

  const coachMap = new Map<string, Coach>();
  coaches.forEach((c) => coachMap.set(c.id, c));

  // First pass: raw scores
  const rawScores = coaches.map((coach) => {
    const directSuccess = calculateDirectSuccess(coach);
    const discipleSuccess = calculateDiscipleSuccess(coach, coachMap);
    const depth = calculateTreeDepth(coach.id, coachMap);
    const breadth = calculateTreeBreadth(coach, coachMap);
    const longevity = calculateLongevity(coach);

    return {
      coach,
      directSuccess,
      discipleSuccess,
      treeDepth: Math.min(100, depth * 20),
      treeBreadth: Math.min(
        100,
        breadth.directDisciplesAsHeadCoach * 10 + breadth.totalTreeSize * 0.5
      ),
      longevity,
    };
  });

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

  // Calculate normalized scores
  const scores: CISScore[] = rawScores.map((raw) => {
    const normalizedDirectSuccess = normalize(raw.directSuccess, mins.directSuccess, maxs.directSuccess);
    const normalizedDiscipleSuccess = normalize(raw.discipleSuccess, mins.discipleSuccess, maxs.discipleSuccess);
    const normalizedTreeDepth = normalize(raw.treeDepth, mins.treeDepth, maxs.treeDepth);
    const normalizedTreeBreadth = normalize(raw.treeBreadth, mins.treeBreadth, maxs.treeBreadth);
    const normalizedLongevity = normalize(raw.longevity, mins.longevity, maxs.longevity);

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
      rank: 0,
    };
  });

  // Sort and assign ranks
  scores.sort((a, b) => b.totalCIS - a.totalCIS);
  scores.forEach((score, index) => {
    score.rank = index + 1;
  });

  return scores;
}

// Main function
async function runCISCalculation() {
  console.log('Calculating Coaching Influence Scores...');
  console.log('==========================================\n');

  const dataDir = path.join(__dirname, '../src/data');
  const outputDir = path.join(__dirname, '../src/data');

  const sports = ['nfl', 'nba', 'soccer'];
  const allScores: CISScore[] = [];

  for (const sport of sports) {
    const coachesPath = path.join(dataDir, sport, 'coaches.json');

    if (!fs.existsSync(coachesPath)) {
      console.log(`No data found for ${sport.toUpperCase()}, skipping...`);
      continue;
    }

    console.log(`\nProcessing ${sport.toUpperCase()}...`);

    const data = JSON.parse(fs.readFileSync(coachesPath, 'utf-8'));
    const scores = calculateAllCIS(data.coaches);

    // Save scores
    const scoresPath = path.join(outputDir, sport, 'rankings.json');
    fs.writeFileSync(
      scoresPath,
      JSON.stringify(
        {
          sport: sport.toUpperCase(),
          lastUpdated: new Date().toISOString(),
          rankings: scores,
        },
        null,
        2
      )
    );
    console.log(`Saved rankings to ${scoresPath}`);

    // Print top 5
    console.log(`\nTop 5 ${sport.toUpperCase()} Coaching Trees:`);
    scores.slice(0, 5).forEach((score, i) => {
      console.log(`  ${i + 1}. ${score.coachName}: ${score.totalCIS}`);
    });

    allScores.push(...scores);
  }

  // Create combined rankings
  allScores.sort((a, b) => b.totalCIS - a.totalCIS);
  allScores.forEach((score, index) => {
    score.rank = index + 1;
  });

  const combinedPath = path.join(outputDir, 'all-rankings.json');
  fs.writeFileSync(
    combinedPath,
    JSON.stringify(
      {
        lastUpdated: new Date().toISOString(),
        totalCoaches: allScores.length,
        rankings: allScores,
      },
      null,
      2
    )
  );

  console.log('\n==========================================');
  console.log('CIS calculation complete!');
  console.log(`Total coaches ranked: ${allScores.length}`);
}

// Run if called directly
if (require.main === module) {
  runCISCalculation()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Calculation failed:', error);
      process.exit(1);
    });
}

export { runCISCalculation };
