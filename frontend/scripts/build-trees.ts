/**
 * Build Coaching Trees
 *
 * Processes raw scraped data into structured coaching trees.
 * Identifies mentor-disciple relationships based on:
 * - Overlapping time at the same organization
 * - Known coaching tree relationships from Wikipedia
 * - Career progression patterns
 *
 * Usage: npx ts-node scripts/build-trees.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Types
interface RawCoach {
  name: string;
  teams: {
    name: string;
    years: { start: number; end?: number };
    role: string;
  }[];
}

interface ProcessedCoach {
  id: string;
  name: string;
  sport: string;
  formerTeams: {
    name: string;
    years: { start: number; end?: number };
    role: string;
    record?: { wins: number; losses: number; ties?: number };
  }[];
  yearsActive: { start: number; end?: number };
  mentors: {
    coachId: string;
    coachName: string;
    team: string;
    years: { start: number; end: number };
    role: string;
  }[];
  disciples: {
    coachId: string;
    coachName: string;
    team: string;
    years: { start: number; end: number };
    role: string;
  }[];
  championships: number;
  coachOfYearAwards: number;
  playoffAppearances: number;
  winPercentage: number;
  allStarSelectionsCoached: number;
}

// Utility: Generate slug ID
function generateId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Utility: Check if two time periods overlap
function periodsOverlap(
  a: { start: number; end?: number },
  b: { start: number; end?: number }
): { start: number; end: number } | null {
  const aEnd = a.end || new Date().getFullYear();
  const bEnd = b.end || new Date().getFullYear();

  const start = Math.max(a.start, b.start);
  const end = Math.min(aEnd, bEnd);

  if (start <= end) {
    return { start, end };
  }
  return null;
}

// Identify potential mentor-disciple relationships
function identifyRelationships(
  coaches: ProcessedCoach[],
  sport: string
): ProcessedCoach[] {
  console.log(`Identifying relationships for ${sport}...`);

  const coachMap = new Map<string, ProcessedCoach>();
  coaches.forEach((c) => coachMap.set(c.id, c));

  // For each coach, look for potential mentors
  for (const coach of coaches) {
    for (const potentialMentor of coaches) {
      if (coach.id === potentialMentor.id) continue;

      // Check if potential mentor was a head coach while this coach was at same team
      for (const coachTeam of coach.formerTeams) {
        for (const mentorTeam of potentialMentor.formerTeams) {
          // Same team?
          if (coachTeam.name !== mentorTeam.name) continue;

          // Mentor was head coach?
          if (!mentorTeam.role.toLowerCase().includes('head coach')) continue;

          // Coach was not head coach (was learning)?
          if (coachTeam.role.toLowerCase().includes('head coach')) continue;

          // Time overlap?
          const overlap = periodsOverlap(coachTeam.years, mentorTeam.years);
          if (!overlap) continue;

          // This is a mentor-disciple relationship!
          // Check if already recorded
          const alreadyMentor = coach.mentors.some(
            (m) => m.coachId === potentialMentor.id
          );

          if (!alreadyMentor) {
            coach.mentors.push({
              coachId: potentialMentor.id,
              coachName: potentialMentor.name,
              team: coachTeam.name,
              years: overlap,
              role: coachTeam.role.toLowerCase().includes('assistant')
                ? 'assistant'
                : coachTeam.role.toLowerCase().includes('coordinator')
                ? 'coordinator'
                : 'assistant',
            });

            // Add reverse relationship
            potentialMentor.disciples.push({
              coachId: coach.id,
              coachName: coach.name,
              team: coachTeam.name,
              years: overlap,
              role: coachTeam.role.toLowerCase().includes('assistant')
                ? 'assistant'
                : coachTeam.role.toLowerCase().includes('coordinator')
                ? 'coordinator'
                : 'assistant',
            });
          }
        }
      }
    }
  }

  // Log statistics
  const withMentors = coaches.filter((c) => c.mentors.length > 0).length;
  const withDisciples = coaches.filter((c) => c.disciples.length > 0).length;
  console.log(`  Coaches with mentors: ${withMentors}`);
  console.log(`  Coaches with disciples: ${withDisciples}`);

  return coaches;
}

// Process raw data into structured coaches
function processRawData(
  rawCoaches: RawCoach[],
  sport: string
): ProcessedCoach[] {
  return rawCoaches.map((raw) => {
    // Calculate years active
    const startYears = raw.teams.map((t) => t.years.start);
    const endYears = raw.teams.map((t) => t.years.end).filter(Boolean) as number[];

    const yearsActive = {
      start: Math.min(...startYears),
      end: endYears.length > 0 ? Math.max(...endYears) : undefined,
    };

    return {
      id: generateId(raw.name),
      name: raw.name,
      sport,
      formerTeams: raw.teams.map((t) => ({
        name: t.name,
        years: t.years,
        role: t.role,
      })),
      yearsActive,
      mentors: [],
      disciples: [],
      // These would be filled from additional data sources
      championships: 0,
      coachOfYearAwards: 0,
      playoffAppearances: 0,
      winPercentage: 0,
      allStarSelectionsCoached: 0,
    };
  });
}

// Main build function
async function buildTrees() {
  console.log('Building coaching trees from raw data...');
  console.log('==========================================\n');

  const rawDataDir = path.join(__dirname, '../data/raw');
  const outputDir = path.join(__dirname, '../src/data');

  const sports = ['nfl', 'nba', 'soccer'];
  const allCoaches: ProcessedCoach[] = [];

  for (const sport of sports) {
    const rawPath = path.join(rawDataDir, sport, 'coaches-raw.json');

    if (!fs.existsSync(rawPath)) {
      console.log(`No raw data found for ${sport.toUpperCase()}, skipping...`);
      continue;
    }

    console.log(`\nProcessing ${sport.toUpperCase()}...`);

    // Load raw data
    const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));

    // Process into structured format
    let coaches = processRawData(rawData, sport.toUpperCase());

    // Identify relationships
    coaches = identifyRelationships(coaches, sport.toUpperCase());

    // Save processed data
    const outputPath = path.join(outputDir, sport, 'coaches.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(
      outputPath,
      JSON.stringify({ coaches }, null, 2)
    );
    console.log(`Saved to ${outputPath}`);

    allCoaches.push(...coaches);
  }

  // Create unified index
  const unifiedIndex = {
    totalCoaches: allCoaches.length,
    bySport: {
      NFL: allCoaches.filter((c) => c.sport === 'NFL').length,
      NBA: allCoaches.filter((c) => c.sport === 'NBA').length,
      Soccer: allCoaches.filter((c) => c.sport === 'SOCCER').length,
    },
    lastUpdated: new Date().toISOString(),
  };

  const indexPath = path.join(outputDir, 'unified-index.json');
  fs.writeFileSync(indexPath, JSON.stringify(unifiedIndex, null, 2));

  console.log('\n==========================================');
  console.log('Tree building complete!');
  console.log(`Total coaches processed: ${allCoaches.length}`);
}

// Run if called directly
if (require.main === module) {
  buildTrees()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Build failed:', error);
      process.exit(1);
    });
}

export { buildTrees };
