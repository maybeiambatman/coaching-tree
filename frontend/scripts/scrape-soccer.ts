/**
 * Soccer Manager Data Scraper
 *
 * Sources:
 * - Transfermarkt.com manager histories
 * - Wikipedia managerial trees
 * - FBRef.com
 *
 * Focused on:
 * - Premier League
 * - La Liga
 * - Serie A
 * - Bundesliga
 * - Ligue 1
 * - MLS
 *
 * Usage: npx ts-node scripts/scrape-soccer.ts
 */

import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const CONFIG = {
  baseDelay: 3000, // 3 seconds between requests (Transfermarkt is strict)
  maxRetries: 3,
  outputDir: path.join(__dirname, '../src/data/soccer'),
  rawDataDir: path.join(__dirname, '../data/raw/soccer'),
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

// Target leagues
const TARGET_LEAGUES = [
  { id: 'GB1', name: 'Premier League', country: 'England' },
  { id: 'ES1', name: 'La Liga', country: 'Spain' },
  { id: 'IT1', name: 'Serie A', country: 'Italy' },
  { id: 'L1', name: 'Bundesliga', country: 'Germany' },
  { id: 'FR1', name: 'Ligue 1', country: 'France' },
  { id: 'MLS1', name: 'MLS', country: 'USA' },
];

// Types
interface ScrapedManager {
  name: string;
  tm_id?: string;
  nationality?: string;
  teams: {
    name: string;
    country?: string;
    years: { start: number; end?: number };
    role: string;
    trophies?: string[];
  }[];
  majorTrophies?: number;
  playingCareer?: {
    team: string;
    years: { start: number; end: number };
  }[];
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
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
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

// Scrape Transfermarkt manager search
async function scrapeTMManagers(league: typeof TARGET_LEAGUES[0]): Promise<ScrapedManager[]> {
  console.log(`Scraping managers for ${league.name}...`);

  // Note: This is a simplified example. Real implementation would need
  // to navigate Transfermarkt's specific URL structure
  const url = `https://www.transfermarkt.com/wettbewerb/startseite/wettbewerb/${league.id}`;

  const managers: ScrapedManager[] = [];

  try {
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);

    // Parse current managers from league table
    $('table.items tbody tr').each((_, row) => {
      const $row = $(row);
      const managerLink = $row.find('a.trainer-link');
      const managerName = managerLink.text().trim();
      const tm_id = managerLink.attr('href')?.split('/')[1];
      const teamName = $row.find('td.hauptlink a').first().text().trim();

      if (managerName && teamName) {
        managers.push({
          name: managerName,
          tm_id,
          teams: [
            {
              name: teamName,
              country: league.country,
              years: { start: new Date().getFullYear() },
              role: 'Head Coach',
            },
          ],
        });
      }
    });
  } catch (error) {
    console.error(`Error scraping ${league.name}:`, error);
  }

  console.log(`Found ${managers.length} managers in ${league.name}`);
  return managers;
}

// Scrape individual manager career
async function scrapeManagerCareer(manager: ScrapedManager): Promise<ScrapedManager> {
  if (!manager.tm_id) return manager;

  await sleep(CONFIG.baseDelay);

  const url = `https://www.transfermarkt.com/${manager.tm_id}/profil/trainer/${manager.tm_id}`;
  console.log(`Scraping career for ${manager.name}...`);

  try {
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);

    // Parse nationality
    manager.nationality = $('span[itemprop="nationality"]').text().trim();

    // Parse coaching career table
    $('table.items tbody tr').each((_, row) => {
      const $row = $(row);
      const team = $row.find('td.hauptlink a').text().trim();
      const dates = $row.find('td.zentriert').text().trim();

      // Parse date range
      const dateMatch = dates.match(/(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4}|today)?/i);

      if (team && dateMatch) {
        const startDate = new Date(dateMatch[1].split('/').reverse().join('-'));
        const endDate = dateMatch[2] && dateMatch[2].toLowerCase() !== 'today'
          ? new Date(dateMatch[2].split('/').reverse().join('-'))
          : undefined;

        manager.teams.push({
          name: team,
          years: {
            start: startDate.getFullYear(),
            end: endDate?.getFullYear(),
          },
          role: 'Head Coach',
        });
      }
    });

    // Count major trophies
    const trophySection = $('h2:contains("Titles")').next('.container-content');
    manager.majorTrophies = trophySection.find('img.tiny_icon').length;

  } catch (error) {
    console.error(`Error scraping ${manager.name}:`, error);
  }

  return manager;
}

// Main scraping function
async function scrapeSoccer() {
  console.log('Starting Soccer manager data scrape...');
  console.log('==========================================\n');

  // Ensure directories exist
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  fs.mkdirSync(CONFIG.rawDataDir, { recursive: true });

  const allManagers: ScrapedManager[] = [];

  // Step 1: Scrape each target league
  for (const league of TARGET_LEAGUES) {
    const managers = await scrapeTMManagers(league);
    allManagers.push(...managers);
    await sleep(CONFIG.baseDelay);
  }

  // Step 2: Scrape detailed career for each manager (limit for testing)
  const detailedManagers: ScrapedManager[] = [];
  const limit = process.env.SCRAPE_LIMIT ? parseInt(process.env.SCRAPE_LIMIT, 10) : 5;

  for (let i = 0; i < Math.min(limit, allManagers.length); i++) {
    const detailed = await scrapeManagerCareer(allManagers[i]);
    detailedManagers.push(detailed);
  }

  // Step 3: Save raw data
  const rawDataPath = path.join(CONFIG.rawDataDir, 'managers-raw.json');
  fs.writeFileSync(rawDataPath, JSON.stringify(detailedManagers, null, 2));
  console.log(`\nRaw data saved to ${rawDataPath}`);

  // Step 4: Log summary
  console.log('\n==========================================');
  console.log('Scrape complete!');
  console.log(`Total managers scraped: ${detailedManagers.length}`);
  console.log(`Managers with trophies: ${detailedManagers.filter((m) => (m.majorTrophies || 0) > 0).length}`);

  return detailedManagers;
}

// Run if called directly
if (require.main === module) {
  scrapeSoccer()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Scrape failed:', error);
      process.exit(1);
    });
}

export { scrapeSoccer, ScrapedManager };
