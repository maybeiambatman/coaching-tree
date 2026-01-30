/**
 * NBA Coaching Data Scraper
 *
 * Sources:
 * - Basketball-Reference.com coaching records
 * - Wikipedia NBA coaching trees
 * - NBA.com historical data
 *
 * Usage: npx ts-node scripts/scrape-nba.ts
 */

import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const CONFIG = {
  baseDelay: 2500, // 2.5 seconds between requests
  maxRetries: 3,
  outputDir: path.join(__dirname, '../src/data/nba'),
  rawDataDir: path.join(__dirname, '../data/raw/nba'),
  userAgent:
    'Mozilla/5.0 (compatible; CoachingTreeBot/1.0; +https://coachingtrees.com)',
};

// Types
interface ScrapedCoach {
  name: string;
  bbr_id?: string;
  teams: {
    name: string;
    years: { start: number; end?: number };
    role: string;
    record?: { wins: number; losses: number };
  }[];
  assistants?: string[];
  mentors?: string[];
  championships?: number;
}

// Utility: Sleep function
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Utility: Fetch with retry
async function fetchWithRetry(url: string, retries = CONFIG.maxRetries): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': CONFIG.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.log(`Attempt ${i + 1} failed for ${url}:`, error);
      if (i < retries - 1) {
        await sleep(CONFIG.baseDelay * (i + 1));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

// Scrape Basketball-Reference coaches index
async function scrapeBBRCoaches(): Promise<ScrapedCoach[]> {
  console.log('Scraping Basketball-Reference coaches...');

  const url = 'https://www.basketball-reference.com/coaches/';
  const html = await fetchWithRetry(url);
  const $ = cheerio.load(html);

  const coaches: ScrapedCoach[] = [];

  // Parse the coaches table
  $('table#coaches tbody tr').each((_, row) => {
    const $row = $(row);
    const name = $row.find('td[data-stat="coach"] a').text().trim();
    const bbr_id = $row.find('td[data-stat="coach"] a').attr('href')?.split('/').pop()?.replace('.html', '');
    const winsStr = $row.find('td[data-stat="g_win"]').text().trim();
    const wins = parseInt(winsStr, 10) || 0;

    if (name) {
      coaches.push({
        name,
        bbr_id,
        teams: [],
        championships: 0,
      });
    }
  });

  console.log(`Found ${coaches.length} coaches from BBR`);
  return coaches;
}

// Scrape individual coach details
async function scrapeCoachDetails(coach: ScrapedCoach): Promise<ScrapedCoach> {
  if (!coach.bbr_id) return coach;

  await sleep(CONFIG.baseDelay);

  const url = `https://www.basketball-reference.com/coaches/${coach.bbr_id}.html`;
  console.log(`Scraping details for ${coach.name}...`);

  try {
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);

    // Parse coaching career table
    $('table#coaching tbody tr').each((_, row) => {
      const $row = $(row);

      // Skip header rows
      if ($row.hasClass('thead')) return;

      const season = $row.find('th[data-stat="season"]').text().trim();
      const team = $row.find('td[data-stat="team_id"] a').text().trim();
      const wins = parseInt($row.find('td[data-stat="wins"]').text(), 10) || 0;
      const losses = parseInt($row.find('td[data-stat="losses"]').text(), 10) || 0;

      // Parse season year
      const yearMatch = season.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : null;

      if (team && year) {
        coach.teams.push({
          name: team,
          years: { start: year, end: year },
          role: 'Head Coach',
          record: { wins, losses },
        });
      }
    });

    // Check for championships
    const champText = $('p:contains("NBA Champion")').text();
    const champMatches = champText.match(/NBA Champion/g);
    coach.championships = champMatches ? champMatches.length : 0;

  } catch (error) {
    console.error(`Error scraping ${coach.name}:`, error);
  }

  return coach;
}

// Consolidate team entries
function consolidateTeams(coach: ScrapedCoach): ScrapedCoach {
  const consolidated: typeof coach.teams = [];

  for (const team of coach.teams) {
    const existing = consolidated.find(
      (t) => t.name === team.name && t.years.end === team.years.start - 1
    );

    if (existing) {
      existing.years.end = team.years.end;
      if (existing.record && team.record) {
        existing.record.wins += team.record.wins;
        existing.record.losses += team.record.losses;
      }
    } else {
      consolidated.push({ ...team });
    }
  }

  coach.teams = consolidated;
  return coach;
}

// Main scraping function
async function scrapeNBA() {
  console.log('Starting NBA coaching data scrape...');
  console.log('==========================================\n');

  // Ensure directories exist
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  fs.mkdirSync(CONFIG.rawDataDir, { recursive: true });

  // Step 1: Get list of all coaches
  const coaches = await scrapeBBRCoaches();

  // Step 2: Scrape details for each coach (limit for testing)
  const detailedCoaches: ScrapedCoach[] = [];
  const limit = process.env.SCRAPE_LIMIT ? parseInt(process.env.SCRAPE_LIMIT, 10) : 10;

  for (let i = 0; i < Math.min(limit, coaches.length); i++) {
    let detailed = await scrapeCoachDetails(coaches[i]);
    detailed = consolidateTeams(detailed);
    detailedCoaches.push(detailed);
  }

  // Step 3: Save raw data
  const rawDataPath = path.join(CONFIG.rawDataDir, 'coaches-raw.json');
  fs.writeFileSync(rawDataPath, JSON.stringify(detailedCoaches, null, 2));
  console.log(`\nRaw data saved to ${rawDataPath}`);

  // Step 4: Log summary
  console.log('\n==========================================');
  console.log('Scrape complete!');
  console.log(`Total coaches scraped: ${detailedCoaches.length}`);
  console.log(`Coaches with championships: ${detailedCoaches.filter((c) => (c.championships || 0) > 0).length}`);

  return detailedCoaches;
}

// Run if called directly
if (require.main === module) {
  scrapeNBA()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Scrape failed:', error);
      process.exit(1);
    });
}

export { scrapeNBA, ScrapedCoach };
