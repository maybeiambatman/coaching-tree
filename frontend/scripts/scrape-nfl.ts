/**
 * NFL Coaching Data Scraper
 *
 * Sources:
 * - Pro-Football-Reference.com coaching histories
 * - Wikipedia coaching tree articles
 * - NFL.com historical records
 *
 * Usage: npx ts-node scripts/scrape-nfl.ts
 */

import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const CONFIG = {
  baseDelay: 2000, // 2 seconds between requests
  maxRetries: 3,
  outputDir: path.join(__dirname, '../src/data/nfl'),
  rawDataDir: path.join(__dirname, '../data/raw/nfl'),
  userAgent:
    'Mozilla/5.0 (compatible; CoachingTreeBot/1.0; +https://coachingtrees.com)',
};

// Types
interface ScrapedCoach {
  name: string;
  pfr_id?: string;
  teams: {
    name: string;
    years: { start: number; end?: number };
    role: string;
    record?: { wins: number; losses: number; ties?: number };
  }[];
  assistants?: string[];
  mentors?: string[];
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

// Scrape Pro-Football-Reference coaches page
async function scrapePFRCoaches(): Promise<ScrapedCoach[]> {
  console.log('Scraping Pro-Football-Reference coaches...');

  const url = 'https://www.pro-football-reference.com/coaches/';
  const html = await fetchWithRetry(url);
  const $ = cheerio.load(html);

  const coaches: ScrapedCoach[] = [];

  // Parse the coaches table
  $('table#coaches tbody tr').each((_, row) => {
    const $row = $(row);
    const name = $row.find('td[data-stat="coach"] a').text().trim();
    const pfr_id = $row.find('td[data-stat="coach"] a').attr('href')?.split('/').pop()?.replace('.htm', '');

    if (name) {
      coaches.push({
        name,
        pfr_id,
        teams: [],
      });
    }
  });

  console.log(`Found ${coaches.length} coaches from PFR`);
  return coaches;
}

// Scrape individual coach details
async function scrapeCoachDetails(coach: ScrapedCoach): Promise<ScrapedCoach> {
  if (!coach.pfr_id) return coach;

  await sleep(CONFIG.baseDelay);

  const url = `https://www.pro-football-reference.com/coaches/${coach.pfr_id}.htm`;
  console.log(`Scraping details for ${coach.name}...`);

  try {
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);

    // Parse coaching history table
    $('table#coaching_history tbody tr').each((_, row) => {
      const $row = $(row);
      const year = parseInt($row.find('th[data-stat="year_id"]').text(), 10);
      const team = $row.find('td[data-stat="team"]').text().trim();
      const wins = parseInt($row.find('td[data-stat="wins"]').text(), 10) || 0;
      const losses = parseInt($row.find('td[data-stat="losses"]').text(), 10) || 0;
      const ties = parseInt($row.find('td[data-stat="ties"]').text(), 10) || 0;

      if (team && !isNaN(year)) {
        // Find or create team entry
        let teamEntry = coach.teams.find(
          (t) => t.name === team && t.years.end === year - 1
        );

        if (teamEntry) {
          teamEntry.years.end = year;
          if (teamEntry.record) {
            teamEntry.record.wins += wins;
            teamEntry.record.losses += losses;
            if (ties > 0) teamEntry.record.ties = (teamEntry.record.ties || 0) + ties;
          }
        } else {
          coach.teams.push({
            name: team,
            years: { start: year, end: year },
            role: 'Head Coach',
            record: { wins, losses, ties: ties > 0 ? ties : undefined },
          });
        }
      }
    });
  } catch (error) {
    console.error(`Error scraping ${coach.name}:`, error);
  }

  return coach;
}

// Main scraping function
async function scrapeNFL() {
  console.log('Starting NFL coaching data scrape...');
  console.log('==========================================\n');

  // Ensure directories exist
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  fs.mkdirSync(CONFIG.rawDataDir, { recursive: true });

  // Step 1: Get list of all coaches
  const coaches = await scrapePFRCoaches();

  // Step 2: Scrape details for each coach (limit for testing)
  const detailedCoaches: ScrapedCoach[] = [];
  const limit = process.env.SCRAPE_LIMIT ? parseInt(process.env.SCRAPE_LIMIT, 10) : 10;

  for (let i = 0; i < Math.min(limit, coaches.length); i++) {
    const detailed = await scrapeCoachDetails(coaches[i]);
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
  console.log(`Coaches with team history: ${detailedCoaches.filter((c) => c.teams.length > 0).length}`);

  return detailedCoaches;
}

// Run if called directly
if (require.main === module) {
  scrapeNFL()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Scrape failed:', error);
      process.exit(1);
    });
}

export { scrapeNFL, ScrapedCoach };
