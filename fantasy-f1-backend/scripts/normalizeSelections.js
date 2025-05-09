// Script to normalize all driver and team names in RaceSelection documents
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('../src/models/League');
require('../src/models/User');
const RaceSelection = require('../src/models/RaceSelection');
const { normalizeDriver, normalizeTeam } = require('../../shared/normalization');

async function normalizeAllSelections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1');
    console.log('Connected to MongoDB');

    const selections = await RaceSelection.find({});
    console.log(`Found ${selections.length} selections to normalize`);

    let updated = 0;
    for (const selection of selections) {
      let changed = false;
      const origMain = selection.mainDriver;
      const origReserve = selection.reserveDriver;
      const origTeam = selection.team;
      const normMain = normalizeDriver(origMain);
      const normReserve = normalizeDriver(origReserve);
      const normTeam = normalizeTeam(origTeam);
      if (origMain !== normMain) {
        selection.mainDriver = normMain;
        changed = true;
      }
      if (origReserve !== normReserve) {
        selection.reserveDriver = normReserve;
        changed = true;
      }
      if (origTeam !== normTeam) {
        selection.team = normTeam;
        changed = true;
      }
      if (changed) {
        await selection.save();
        updated++;
        console.log(`Updated selection ${selection._id}:`, {
          mainDriver: `${origMain} => ${normMain}`,
          reserveDriver: `${origReserve} => ${normReserve}`,
          team: `${origTeam} => ${normTeam}`
        });
      }
    }
    console.log(`Normalization complete. Updated ${updated} selections.`);
    process.exit(0);
  } catch (err) {
    console.error('Error during normalization:', err);
    process.exit(1);
  }
}

normalizeAllSelections(); 