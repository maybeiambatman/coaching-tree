#!/usr/bin/env ts-node
/**
 * Master Data Update Script
 *
 * Orchestrates the full data pipeline:
 * 1. Scrape data from all sources
 * 2. Build coaching tree relationships
 * 3. Calculate CIS scores
 * 4. Validate data integrity
 *
 * Usage: npx ts-node scripts/update-data.ts [--scrape] [--build] [--calculate] [--validate]
 *
 * Flags:
 *   --scrape     Run web scrapers (respects rate limits)
 *   --build      Build tree relationships from raw data
 *   --calculate  Run CIS algorithm
 *   --validate   Validate data integrity
 *   --all        Run all steps (default if no flags)
 */

import * as fs from 'fs';
import * as path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  scrape: args.includes('--scrape'),
  build: args.includes('--build'),
  calculate: args.includes('--calculate'),
  validate: args.includes('--validate'),
  all: args.includes('--all') || args.length === 0,
};

// Configuration
const CONFIG = {
  dataDir: path.join(__dirname, '../src/data'),
  rawDir: path.join(__dirname, '../data/raw'),
  logDir: path.join(__dirname, '../logs'),
};

// Ensure directories exist
function ensureDirectories() {
  fs.mkdirSync(CONFIG.dataDir, { recursive: true });
  fs.mkdirSync(CONFIG.rawDir, { recursive: true });
  fs.mkdirSync(CONFIG.logDir, { recursive: true });
}

// Logging utility
function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '[INFO]',
    warn: '[WARN]',
    error: '[ERROR]',
  }[level];

  console.log(`${timestamp} ${prefix} ${message}`);

  // Also write to log file
  const logFile = path.join(CONFIG.logDir, `update-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, `${timestamp} ${prefix} ${message}\n`);
}

// Step 1: Scrape data
async function runScrapers() {
  log('Starting data scraping...');

  try {
    // Import scrapers dynamically
    const { scrapeNFL } = await import('./scrape-nfl');
    const { scrapeNBA } = await import('./scrape-nba');
    const { scrapeSoccer } = await import('./scrape-soccer');

    log('Scraping NFL data...');
    await scrapeNFL();

    log('Scraping NBA data...');
    await scrapeNBA();

    log('Scraping Soccer data...');
    await scrapeSoccer();

    log('Scraping complete!');
  } catch (error) {
    log(`Scraping failed: ${error}`, 'error');
    throw error;
  }
}

// Step 2: Build trees
async function runBuildTrees() {
  log('Building coaching trees...');

  try {
    const { buildTrees } = await import('./build-trees');
    await buildTrees();
    log('Tree building complete!');
  } catch (error) {
    log(`Tree building failed: ${error}`, 'error');
    throw error;
  }
}

// Step 3: Calculate CIS
async function runCISCalculation() {
  log('Calculating CIS scores...');

  try {
    const { runCISCalculation: calculate } = await import('./calculate-cis');
    await calculate();
    log('CIS calculation complete!');
  } catch (error) {
    log(`CIS calculation failed: ${error}`, 'error');
    throw error;
  }
}

// Step 4: Validate data
async function runValidation() {
  log('Validating data integrity...');

  const issues: string[] = [];

  // Check each sport's data
  const sports = ['nfl', 'nba', 'soccer'];

  for (const sport of sports) {
    const coachesPath = path.join(CONFIG.dataDir, sport, 'coaches.json');

    if (!fs.existsSync(coachesPath)) {
      issues.push(`Missing coaches data for ${sport.toUpperCase()}`);
      continue;
    }

    try {
      const data = JSON.parse(fs.readFileSync(coachesPath, 'utf-8'));

      if (!data.coaches || !Array.isArray(data.coaches)) {
        issues.push(`Invalid data structure for ${sport.toUpperCase()}`);
        continue;
      }

      // Check each coach
      const coachIds = new Set<string>();
      for (const coach of data.coaches) {
        // Check for duplicate IDs
        if (coachIds.has(coach.id)) {
          issues.push(`Duplicate coach ID: ${coach.id} in ${sport.toUpperCase()}`);
        }
        coachIds.add(coach.id);

        // Check required fields
        if (!coach.name) {
          issues.push(`Missing name for coach ${coach.id} in ${sport.toUpperCase()}`);
        }

        // Check for broken mentor/disciple references
        for (const mentor of coach.mentors || []) {
          if (!coachIds.has(mentor.coachId) && !data.coaches.some((c: { id: string }) => c.id === mentor.coachId)) {
            // This might be a reference to a coach not in our dataset - warning not error
            log(`Mentor reference ${mentor.coachId} not found for ${coach.name}`, 'warn');
          }
        }
      }

      log(`${sport.toUpperCase()}: ${data.coaches.length} coaches validated`);
    } catch (error) {
      issues.push(`Failed to parse ${sport.toUpperCase()} data: ${error}`);
    }
  }

  // Report issues
  if (issues.length > 0) {
    log(`Validation found ${issues.length} issues:`, 'warn');
    issues.forEach((issue) => log(`  - ${issue}`, 'warn'));
  } else {
    log('Validation complete - no issues found!');
  }

  return issues;
}

// Update metadata
function updateMetadata() {
  const metadataPath = path.join(CONFIG.dataDir, 'metadata.json');
  const metadata = {
    lastUpdated: new Date().toISOString(),
    version: '1.0.0',
    dataIntegrity: 'validated',
  };
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  log('Metadata updated');
}

// Main orchestration
async function main() {
  console.log('==========================================');
  console.log('   Coaching Trees Data Update Pipeline');
  console.log('==========================================\n');

  const startTime = Date.now();
  ensureDirectories();

  try {
    // Step 1: Scrape (if requested)
    if (flags.scrape || flags.all) {
      await runScrapers();
    }

    // Step 2: Build trees
    if (flags.build || flags.all) {
      await runBuildTrees();
    }

    // Step 3: Calculate CIS
    if (flags.calculate || flags.all) {
      await runCISCalculation();
    }

    // Step 4: Validate
    if (flags.validate || flags.all) {
      const issues = await runValidation();
      if (issues.length > 0) {
        log('Data validation found issues - review above', 'warn');
      }
    }

    // Update metadata
    updateMetadata();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n==========================================');
    log(`Pipeline complete! Duration: ${duration}s`);
    console.log('==========================================');

  } catch (error) {
    log(`Pipeline failed: ${error}`, 'error');
    process.exit(1);
  }
}

// Run
main();
