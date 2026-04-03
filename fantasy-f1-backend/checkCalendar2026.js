/**
 * One-off script to check if the 2026 calendar exists in MongoDB.
 * Run from backend root: node checkCalendar2026.js
 * Requires .env with MONGODB_URI.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const RaceCalendar = require('./src/models/RaceCalendar');

async function checkCalendar2026() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const season = 2026;
    const races = await RaceCalendar.find({ season })
      .sort({ round: 1 })
      .select('round raceName date raceStart qualifyingStart isSprintWeekend season')
      .lean();

    console.log(`=== RaceCalendar for season ${season} ===`);
    console.log(`Count: ${races.length}\n`);

    if (races.length === 0) {
      console.log('No 2026 calendar entries found.');
      const allSeasons = await RaceCalendar.distinct('season');
      console.log('Seasons present in DB:', allSeasons.sort((a, b) => a - b).join(', ') || '(none)');
    } else {
      races.forEach((r) => {
        console.log(`  R${String(r.round).padStart(2)}  ${r.raceName}  date=${r.date?.toISOString?.()?.slice(0, 10)}  sprint=${!!r.isSprintWeekend}`);
      });
    }

    console.log('\nDone.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkCalendar2026();
