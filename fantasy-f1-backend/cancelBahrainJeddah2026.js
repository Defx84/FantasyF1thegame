/**
 * One-off: set RaceCalendar.status = 'cancelled' for 2026 Bahrain and Saudi Arabian GPs.
 * Matches raceName (case-insensitive). Run from backend root: node cancelBahrainJeddah2026.js
 * Dry run (no writes): node cancelBahrainJeddah2026.js --dry-run
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const RaceCalendar = require('./src/models/RaceCalendar');

const SEASON = 2026;
const NAME_SUBSTRINGS = ['bahrain', 'saudi'];

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.\n');

    const candidates = await RaceCalendar.find({ season: SEASON }).lean();
    const toCancel = candidates.filter((r) => {
      const n = (r.raceName || '').toLowerCase();
      return NAME_SUBSTRINGS.some((s) => n.includes(s));
    });

    if (toCancel.length === 0) {
      console.log('No matching races found for season', SEASON, '(substrings:', NAME_SUBSTRINGS.join(', '), ')');
      console.log('Rounds in DB:', candidates.map((r) => `${r.round} ${r.raceName}`).join('\n') || '(none)');
    } else {
      for (const r of toCancel) {
        console.log(`${dryRun ? '[dry-run] ' : ''}Would cancel: round ${r.round} — ${r.raceName} (status was: ${r.status || 'scheduled'})`);
      }
      if (!dryRun) {
        const ids = toCancel.map((r) => r._id);
        const res = await RaceCalendar.updateMany(
          { _id: { $in: ids } },
          { $set: { status: 'cancelled' } }
        );
        console.log('\nModified:', res.modifiedCount);
      }
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

main();
