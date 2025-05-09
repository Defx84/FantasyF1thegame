require('dotenv').config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const cron = require("node-cron");
const moment = require("moment");
const axios = require("axios");
const fs = require('fs').promises;
const path = require('path');
const RaceResult = require("../models/RaceResult");
const { processRawResults, calculateTeamPoints, normalizeDriverName, normalizeTeamName } = require("../utils/scoringUtils");
const { ROUND_TO_RACE } = require("../constants/roundMapping");

// Define sprint rounds for 2025 (China, Miami, Belgium, Austin, Brazil, Qatar)
const SPRINT_ROUNDS = [2, 6, 13, 19, 21, 23];

// Add this mapping at the top of the file if not already present
const raceNameToSlugKey = {
  "Australian Grand Prix": "australian",
  "Chinese Grand Prix": "chinese",
  "Japanese Grand Prix": "japanese",
  "Bahrain Grand Prix": "bahrain",
  "Saudi Arabian Grand Prix": "saudi-arabian",
  "Miami Grand Prix": "miami",
  // Add more as needed
};

puppeteer.use(StealthPlugin());

// Slug management
const SLUGS_FILE = path.join(__dirname, '../data/motorsportSlugs.json');
let slugCache = {};

async function loadSlugsFromFile() {
  try {
    const data = await fs.readFile(SLUGS_FILE, 'utf8');
    slugCache = JSON.parse(data);
    console.log('📚 Loaded slugs from file:', Object.keys(slugCache).length);
    return slugCache;
  } catch (error) {
    console.log('⚠️ No existing slugs file, will create new one');
    return {};
  }
}

async function saveSlugsToFile(slugs) {
  try {
    await fs.mkdir(path.dirname(SLUGS_FILE), { recursive: true });
    await fs.writeFile(SLUGS_FILE, JSON.stringify(slugs, null, 2));
    console.log('💾 Saved slugs to file');
  } catch (error) {
    console.error('❌ Error saving slugs:', error);
  }
}

async function discoverMotorsportSlugs(year = new Date().getFullYear()) {
  console.log(`\n🔍 Discovering slugs for year ${year}...`);
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';
  const browser = await puppeteer.launch({ headless: "new", executablePath, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  try {
    await page.goto(`https://www.motorsport.com/f1/results/${year}/`, {
      waitUntil: "networkidle2",
    });

    const newSlugs = await page.evaluate(() => {
      const links = document.querySelectorAll("a[href*='/results/']");
      const slugMap = {};
      links.forEach((link) => {
        const match = link.href.match(/\/results\/\d{4}\/([a-z0-9\-]+)\//i);
        if (match) {
          const slug = match[1];
          const baseName = slug.split("-gp")[0];
          slugMap[baseName] = slug;
        }
      });
      return slugMap;
    });

    await browser.close();

    // Compare with existing slugs and update if new ones found
    let hasNewSlugs = false;
    for (const [name, slug] of Object.entries(newSlugs)) {
      if (!slugCache[name] || slugCache[name] !== slug) {
        hasNewSlugs = true;
        slugCache[name] = slug;
        console.log(`🆕 Found new/updated slug: ${name} -> ${slug}`);
      }
    }

    if (hasNewSlugs) {
      await saveSlugsToFile(slugCache);
    } else {
      console.log('ℹ️ No new slugs found');
    }

    return slugCache;
  } catch (error) {
    console.error('❌ Error discovering slugs:', error);
    await browser.close();
    throw error;
  }
}

async function scrapeMotorsportResultsByType(slug, type) {
    let browser;
    try {
        executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';
        browser = await puppeteer.launch({ executablePath, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        
        // Set a longer timeout for page operations
        page.setDefaultTimeout(60000);
        
        // Use 2025 for all races
        const url = `https://www.motorsport.com/f1/results/2025/${slug}/?st=${type}`;
        
        console.log(`🌐 Scraping URL: ${url}`);
        
        // Use a more lenient wait condition
        await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });
        
        // Wait for the results table with a longer timeout
        try {
            await page.waitForSelector('table.ms-table', { timeout: 60000 });
        } catch (error) {
            console.log('⚠️ Table not found, checking if page loaded correctly...');
            const pageContent = await page.content();
            if (!pageContent.includes('ms-table')) {
                console.log('❌ Page content does not contain expected elements');
                throw new Error('Page structure has changed or content not loaded');
            }
        }
        
        const results = await page.evaluate(() => {
            const table = document.querySelector('table.ms-table');
            if (!table) return [];

            const rows = Array.from(table.querySelectorAll('tbody tr.ms-table_row'));
            return rows.map(row => {
                const cells = Array.from(row.querySelectorAll('td.ms-table_cell'));

                // Extract driver info
                const driverInfo = cells[1]?.querySelector('.info');
                const driverName = driverInfo?.querySelector('.name-short')?.textContent.trim();
                const teamName = driverInfo?.querySelector('.team')?.textContent.trim();

                // Extract position and status
                const positionText = cells[0]?.querySelector('.ms-table_row-value')?.textContent.trim().toLowerCase();
                const status = ['dnf', 'dns', 'dsq', 'dq'].includes(positionText) ? positionText.toUpperCase() : 'Finished';
                const position = ['dnf', 'dns', 'dsq', 'dq'].includes(positionText) ? null : parseInt(positionText, 10);

                // Extract points (from column 10)
                const pointsCell = cells[9]; // Points are in column 10 (0-based index 9)
                const pointsText = pointsCell?.querySelector('.ms-table_row-value')?.textContent.trim();
                const points = pointsText ? parseFloat(pointsText) : null;

                // Extract car number
                const carNumber = cells[2]?.querySelector('.ms-table_row-value')?.textContent.trim();

                // Extract laps and time
                const laps = cells[3]?.querySelector('.ms-table_row-value')?.textContent.trim();
                const time = cells[4]?.querySelector('.ms-table_row-value')?.textContent.trim();

                return {
                    position,
                    driver: driverName,
                    team: teamName,
                    carNumber,
                    laps,
                    time,
                    points,
                    status
                };
            });
        });

        // Calculate team points
        const teamResults = calculateTeamPoints(results);
        
        return {
            results,
            teamResults
        };
    } catch (error) {
        console.error(`❌ Error scraping ${type} results:`, error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function triggerRaceUpdate(round, label) {
    try {
        console.log(`\n🔍 [${label}] Starting update process for round ${round}...`);
        
        const race = await RaceResult.findOne({ round: parseInt(round) });
        if (!race) {
            console.error(`❌ [${label}] Race not found for round ${round}`);
            return;
        }

        // Get race name from race document
        const raceName = race.raceName;
        if (!raceName) {
            console.error(`❌ [${label}] No race name found for round ${round}`);
            return;
        }

        // Use mapping for slug lookup
        const slugKey = raceNameToSlugKey[raceName] || raceName.toLowerCase().replace(' grand prix', '');
        const motorsportSlug = slugCache[slugKey];
        if (!motorsportSlug) {
            console.error(`❌ [${label}] No slug found for ${raceName}`);
            console.log('🧩 raceName:', raceName);
            console.log('🗂 slugCache keys:', Object.keys(slugCache));
            return;
        }

        // Scrape and process main race results
        const { results: raceResults, teamResults } = await scrapeMotorsportResultsByType(motorsportSlug, "RACE");

        // Scrape and process sprint results only for sprint rounds
        let sprintResults = [];
        let sprintTeamResults = [];
        if (SPRINT_ROUNDS.includes(parseInt(round))) {
            try {
                const { results: sprintData, teamResults: sprintTeamData } = await scrapeMotorsportResultsByType(motorsportSlug, "SPR");
                if (sprintData && sprintData.length > 0) {
                    sprintResults = sprintData;
                    sprintTeamResults = sprintTeamData || [];
                    console.log(`✅ [${label}] Sprint results found: ${sprintResults.length} drivers`);
                } else {
                    console.log(`ℹ️ [${label}] No sprint results found`);
                }
            } catch (error) {
                console.log(`ℹ️ [${label}] No sprint race found or error scraping: ${error.message}`);
            }
        } else {
            console.log(`ℹ️ [${label}] Round ${round} is not a sprint round`);
        }

        const updateData = {
            raceResults: raceResults || [],
            teamResults: teamResults || [],
            sprintResults: sprintResults || [],
            sprintTeamResults: sprintTeamResults || []
        };

        if (process.env.NODE_ENV === 'development') {
            console.log("🏁 Race Results:", raceResults);
            console.log("🏎 Team Results:", teamResults);
            if (sprintResults.length > 0) {
                console.log("🏎 Sprint Results:", sprintResults);
                console.log("🏎 Sprint Team Results:", sprintTeamResults);
            }
        }

        const res = await axios.post(
            `http://localhost:5000/api/race/update-race-results/${round}`,
            updateData,
            {
                headers: {
                    'x-server-key': process.env.SERVER_KEY
                }
            }
        );
        
        console.log(`✅ [${label}] Update success for round ${round}:`, res.data);
    } catch (error) {
        console.error(`❌ [${label}] Update failed for round ${round}:`, error.message);
        if (error.response) {
            console.error('🔁 Axios response:', error.response.data);
        }
        throw error;
    }
}

// Check if a race should be processed
async function shouldProcessRace(round, raceName) {
    try {
        const now = new Date();
        const raceDate = ROUND_TO_RACE[round].raceStart;
        
        // Check if race already has data in database
        const existingRace = await RaceResult.findOne({ round });
        if (existingRace && existingRace.results && existingRace.results.length > 0) {
            console.log(`⏭️ Skipping ${raceName} (round ${round}) - Race already has results in database`);
            return false;
        }
        
        // Check if we have a valid slug for this race
        if (!slugCache[raceName]) {
            console.log(`⏭️ Skipping ${raceName} (round ${round}) - No valid slug found`);
            return false;
        }
        
        // For future races, create an empty race result
        if (raceDate > now) {
            console.log(`📅 Creating empty race result for future race: ${raceName} (round ${round})`);
            const raceData = {
                round: parseInt(round),
                raceName,
                circuit: ROUND_TO_RACE[round].circuit,
                raceStart: ROUND_TO_RACE[round].raceStart,
                qualifyingStart: ROUND_TO_RACE[round].qualifyingStart,
                status: 'scheduled',
                isSprintWeekend: ROUND_TO_RACE[round].isSprintWeekend || false,
                results: [],
                teamResults: [],
                sprintResults: null,
                sprintTeamResults: null
            };
            
            await RaceResult.findOneAndUpdate(
                { round: parseInt(round) },
                raceData,
                { upsert: true, new: true }
            );
            return false;
        }
        
        console.log(`✅ Will process ${raceName} (round ${round})`);
        return true;
    } catch (error) {
        console.error(`❌ Error checking if race should be processed:`, error);
        return false;
    }
}

// Process a single race
async function processRace(round, raceName) {
    try {
        console.log(`\n🏎 Processing ${raceName} (round ${round})...`);
        await triggerRaceUpdate(round, 'Manual Update');
    } catch (error) {
        console.error(`❌ Error processing race ${raceName}:`, error);
        throw error;
    }
}

// Schedule race result scraping
function scheduleRaceResultScraping() {
    // Schedule for 20 minutes after race (assuming race end at 16:00 UTC)
    cron.schedule('20 16 * * Sun', async () => {
        console.log('\n⏰ Running immediate race result scraping...');
        try {
            await runScraper();
        } catch (error) {
            console.error('❌ Immediate race result scraping failed:', error);
        }
    });

    // Schedule for 12 hours later (04:20 UTC on Monday)
    cron.schedule('20 4 * * Mon', async () => {
        console.log('\n⏰ Running delayed race result scraping...');
        try {
            await runScraper();
        } catch (error) {
            console.error('❌ Delayed race result scraping failed:', error);
        }
    });
}

// Schedule slug discovery
function scheduleSlugDiscovery() {
    // Run every 24 hours
    cron.schedule('0 0 * * *', async () => {
        console.log('\n🔄 Running scheduled slug discovery...');
        try {
            const currentYear = new Date().getFullYear();
            await discoverMotorsportSlugs(currentYear);
        } catch (error) {
            console.error('❌ Error in scheduled slug discovery:', error);
        }
    });
}

// Main scraper function
async function runScraper() {
    try {
        // Load existing slugs
        await loadSlugsFromFile();
        
        // Process each race
        for (const [round, race] of Object.entries(ROUND_TO_RACE)) {
            const raceName = race.name;
            if (await shouldProcessRace(round, raceName)) {
                await processRace(round, raceName);
            }
        }
    } catch (error) {
        console.error('❌ Error in runScraper:', error);
        throw error;
    }
}

// Initialize scraper system
async function initializeScraperSystem() {
    console.log('\n🚀 Initializing scraper system...');
    
    // Initialize slug system
    await initializeSlugSystem();
    
    // Start race result scheduling
    scheduleRaceResultScraping();
}

// Initialize slug system
async function initializeSlugSystem() {
    console.log('\n🚀 Initializing slug system...');
    
    // Load existing slugs
    await loadSlugsFromFile();
    
    // Initial discovery
    const currentYear = new Date().getFullYear();
    await discoverMotorsportSlugs(currentYear);
    
    // Start scheduled discovery
    scheduleSlugDiscovery();
}

module.exports = {
    discoverMotorsportSlugs,
    scrapeMotorsportResultsByType,
    loadSlugsFromFile,
    saveSlugsToFile,
    triggerRaceUpdate,
    initializeSlugSystem,
    initializeScraperSystem,
    runScraper
};